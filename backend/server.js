import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import pg from "pg";
import { validateCircleConfig } from "./services/circleService.js";

dotenv.config();

validateCircleConfig();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://proofpay.online",
  "https://www.proofpay.online",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin || "");

    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS"));
  },
}));
app.use(express.json());

const CIRCLE_API_URL = "https://api.circle.com";

const circleHeaders = {
  Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
  "Content-Type": "application/json",
};

const escrows = {};
const PENDING_ESCROW_EXPIRY_MS = 12 * 60 * 60 * 1000;
const dataDirectory = process.env.DATA_DIR ||
  (process.env.VERCEL
    ? path.join("/tmp", "proofpay-data")
    : path.join(process.cwd(), "data"));
fs.mkdirSync(dataDirectory, { recursive: true });
const dataFile = path.join(dataDirectory, "escrows.json");
const walletConnectionsFile = path.join(dataDirectory, "wallet-connections.json");
const databasePool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
    })
  : null;
let databaseReady;

async function ensureDatabase() {
  if (!databasePool) return;

  if (!databaseReady) {
    databaseReady = databasePool.query(`
      CREATE TABLE IF NOT EXISTS proofpay_records (
        record_type TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (record_type, record_id)
      )
    `);
  }

  await databaseReady;
}

async function loadEscrows() {
  try {
    let records;

    if (databasePool) {
      await ensureDatabase();
      const result = await databasePool.query(
        "SELECT data FROM proofpay_records WHERE record_type = $1 ORDER BY updated_at ASC",
        ["escrow"]
      );
      records = result.rows.map((row) => row.data);
    } else {
      if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, "[]");
      }
      records = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    }

    if (expirePendingEscrows(records)) {
      await saveEscrows(records);
    }

    return records;

  } catch (error) {

    console.log("Load Error:", error);

    return [];

  }

}

function expirePendingEscrows(records) {
  const now = Date.now();
  let changed = false;

  for (const escrow of records) {
    const isPending =
      escrow.status === "Waiting Seller" ||
      escrow.status === "Seller Accepted";
    const createdAt = Number(escrow.createdAt);

    if (!isPending || !createdAt || now < createdAt + PENDING_ESCROW_EXPIRY_MS) {
      continue;
    }

    escrow.status = "Cancelled";
    escrow.cancellationReason = "Expired after 12 hours";
    escrow.cancelledAt = now;
    escrow.expiresAt = createdAt + PENDING_ESCROW_EXPIRY_MS;
    escrows[escrow.escrowId] = escrow;
    changed = true;
  }

  return changed;
}

async function saveEscrows(data) {
  try {
    if (databasePool) {
      await ensureDatabase();
      const client = await databasePool.connect();

      try {
        await client.query("BEGIN");
        for (const escrow of data) {
          await client.query(
            `INSERT INTO proofpay_records (record_type, record_id, data, updated_at)
             VALUES ($1, $2, $3::jsonb, NOW())
             ON CONFLICT (record_type, record_id)
             DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
            ["escrow", escrow.escrowId, JSON.stringify(escrow)]
          );
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } else {
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log("❌ SAVE ERROR:", error);
    throw error;
  }
}

async function loadWalletConnections() {
  try {
    if (databasePool) {
      await ensureDatabase();
      const result = await databasePool.query(
        "SELECT data FROM proofpay_records WHERE record_type = $1 ORDER BY updated_at ASC",
        ["wallet_connection"]
      );
      return result.rows.map((row) => row.data);
    }

    if (!fs.existsSync(walletConnectionsFile)) {
      fs.writeFileSync(walletConnectionsFile, "[]");
    }

    return JSON.parse(fs.readFileSync(walletConnectionsFile, "utf8"));
  } catch (error) {
    console.log("Wallet connection load error:", error);
    return [];
  }
}

async function saveWalletConnections(connections) {
  if (databasePool) {
    await ensureDatabase();
    for (const connection of connections) {
      await databasePool.query(
        `INSERT INTO proofpay_records (record_type, record_id, data, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (record_type, record_id)
         DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        ["wallet_connection", connection.address.toLowerCase(), JSON.stringify(connection)]
      );
    }
    return;
  }

  fs.writeFileSync(walletConnectionsFile, JSON.stringify(connections, null, 2));
}

app.post("/api/wallet/connect", async (req, res) => {
  const { address, message, signature, signedAt } = req.body;

  if (!address || !message || !signature || !signedAt) {
    return res.status(400).json({
      success: false,
      message: "Wallet address and signature are required.",
    });
  }

  const connections = await loadWalletConnections();
  const normalizedAddress = address.toLowerCase();
  const connection = {
    address,
    message,
    signature,
    signedAt,
    recordedAt: new Date().toISOString(),
  };
  const existingIndex = connections.findIndex(
    (item) => item.address?.toLowerCase() === normalizedAddress
  );

  if (existingIndex >= 0) {
    connections[existingIndex] = connection;
  } else {
    connections.push(connection);
  }

  await saveWalletConnections(connections);

  return res.json({ success: true, address });
});


app.post("/api/circle/request-email-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const deviceId = String(req.body.deviceId || "").trim();

    if (!email || !deviceId) {
      return res.status(400).json({
        success: false,
        message: "Email and Circle device ID are required.",
      });
    }

    const response = await axios.post(
      `${CIRCLE_API_URL}/v1/w3s/users/email/token`,
      {
        idempotencyKey: crypto.randomUUID(),
        deviceId,
        email,
      },
      {
        headers: circleHeaders,
      }
    );

    return res.json(response.data);

  } catch (error) {
    console.error("Circle email OTP error:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Circle could not send the verification code.",
      error: error.response?.data || error.message,
    });
  }
});

app.post("/api/circle/initialize-user", async (req, res) => {

  try {

    const userToken = req.get("X-User-Token");

    if (!userToken) {
      return res.status(400).json({
        success: false,
        message: "User token is required",
      });
    }

    const response = await axios.post(
      `${CIRCLE_API_URL}/v1/w3s/user/initialize`,
      {
        idempotencyKey: crypto.randomUUID(),
        accountType: "EOA",
        blockchains: ["ARC-TESTNET"],
      },
      {
        headers: {
          ...circleHeaders,
          "X-User-Token": userToken,
        },
      }
    );

    return res.json(response.data);

  } catch (error) {

    console.log(error.response?.data || error);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });

  }

});

app.get("/api/circle/wallets", async (req, res) => {
  const userToken = req.get("X-User-Token");

  if (!userToken) {
    return res.status(400).json({
      success: false,
      message: "User token is required.",
    });
  }

  try {
    const response = await axios.get(
      `${CIRCLE_API_URL}/v1/w3s/wallets`,
      {
        headers: {
          ...circleHeaders,
          "X-User-Token": userToken,
        },
        params: {
          blockchain: "ARC-TESTNET",
        },
      }
    );

    return res.json(response.data);
  } catch (error) {
    console.error("Circle wallet lookup error:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Circle could not load the wallet.",
      error: error.response?.data || error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    status: "ProofPay Backend Running 🚀",
  });
});

/*
|--------------------------------------------------------------------------
| Create Escrow
|--------------------------------------------------------------------------
*/

app.post("/api/escrow", async (req, res) => {
  const escrowId =
    "PP-" +
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const escrow = {
    ...req.body,
    escrowId,
    status: "Waiting Seller",
    verificationCode: "",

    isPermanent: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + PENDING_ESCROW_EXPIRY_MS,
  };

  const allEscrows = await loadEscrows();

  allEscrows.push(escrow);

  await saveEscrows(allEscrows);

  escrows[escrowId] = escrow;
  res.json({
    success: true,
    escrow,
  });

});

/*
|--------------------------------------------------------------------------
| Get Escrow
|--------------------------------------------------------------------------
*/

app.get("/api/escrow/:id", async (req, res) => {

  const allEscrows = await loadEscrows();

  const escrow = allEscrows.find(
    (e) => e.escrowId === req.params.id
  );

  if (escrow) {
    escrows[req.params.id] = escrow;
  }

  if (!escrow) {

    return res.status(404).json({
      success: false,
      message: "Escrow Not Found",
    });

  }

  res.json({
    success: true,
    escrow,
  });

});

/*
|--------------------------------------------------------------------------
| Escrow Status
|--------------------------------------------------------------------------
*/

app.get("/api/escrow/:id/status", async (req, res) => {

  const allEscrows = await loadEscrows();

  const escrow = allEscrows.find(
    (e) => e.escrowId === req.params.id
  );

  if (!escrow) {

    return res.status(404).json({
      success: false,
      message: "Escrow Not Found",
    });

  }

  res.json({
    success: true,
    status: escrow.status,
    escrow,
  });

});

/*
|--------------------------------------------------------------------------
| Seller Accept
|--------------------------------------------------------------------------
*/

app.post("/api/escrow/:id/accept", async (req, res) => {

  const { sellerWallet } = req.body;

  const allEscrows = await loadEscrows();

  const escrow = allEscrows.find(
    (e) => e.escrowId === req.params.id
  );

  if (!escrow) {
    return res.status(404).json({
      success: false,
      message: "Escrow Not Found",
    });
  }

  if (!sellerWallet) {
    return res.status(400).json({
      success: false,
      message: "Seller wallet is required",
    });
  }

  if (escrow.status !== "Waiting Seller") {
    return res.status(400).json({
      success: false,
      message: escrow.status === "Cancelled"
        ? "This escrow request expired after 12 hours."
        : "This escrow request is no longer waiting for seller acceptance.",
    });
  }

  escrow.status = "Seller Accepted";
  escrow.sellerWallet = sellerWallet;
  escrow.verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // Keep the in-memory copy in sync with the saved record. The seller
  // verification page reads this copy immediately after acceptance.
  escrows[req.params.id] = escrow;

  await saveEscrows(allEscrows);

  res.json({
    success: true,
    escrow,
  });

});

/*
|--------------------------------------------------------------------------
| Buyer Deposit
|--------------------------------------------------------------------------
*/


app.post("/api/escrow/:id/deposit", async (req, res) => {

  const { transactionHash } = req.body || {};

  const allEscrows = await loadEscrows();
  const escrow = allEscrows.find((item) => item.escrowId === req.params.id);

  if (!escrow) {

    return res.status(404).json({
      success: false,
      message: "Escrow Not Found",
    });

  }

  if (escrow.status === "Cancelled") {
    return res.status(400).json({
      success: false,
      message: "This escrow request expired after 12 hours. Create a new escrow to continue.",
    });
  }

  if (escrow.status !== "Seller Accepted") {
    return res.status(400).json({
      success: false,
      message: "The seller must accept the deal before you can deposit USDC.",
    });
  }

  escrow.status = "Funds Locked";
  escrow.isPermanent = true;
  escrow.depositedAt = Date.now();

  if (/^0x[a-fA-F0-9]{64}$/.test(transactionHash || "")) {
    escrow.depositTransactionHash = transactionHash;
  }

  const index = allEscrows.findIndex(
    (e) => e.escrowId === escrow.escrowId
  );

  if (index !== -1) {

    allEscrows[index] = escrow;

    await saveEscrows(allEscrows);

  }

  escrows[req.params.id] = escrow;

  res.json({
    success: true,
    escrow,
  });

});

/*
|--------------------------------------------------------------------------
| Seller Delivery Complete
|--------------------------------------------------------------------------
*/

app.post("/api/escrow/:id/delivered", async (req, res) => {
  const allEscrows = await loadEscrows();
  const escrow = allEscrows.find((item) => item.escrowId === req.params.id);

  if (!escrow) {
    return res.status(404).json({
      success: false,
      message: "Escrow Not Found",
    });
  }

  escrow.status = "Delivered";
  escrow.deliveredAt = Date.now();

  const index = allEscrows.findIndex(
    (e) => e.escrowId === escrow.escrowId
  );

  if (index !== -1) {

    allEscrows[index] = escrow;

    await saveEscrows(allEscrows);

  }

  res.json({
    success: true,
    escrow,
  });

});

/*
|--------------------------------------------------------------------------
| Buyer Release Funds
|--------------------------------------------------------------------------
*/

app.post("/api/escrow/:id/release", async (req, res) => {

  const { transactionHash } = req.body || {};

  const allEscrows = await loadEscrows();
  const escrow = allEscrows.find((item) => item.escrowId === req.params.id);

  if (!escrow) {

    return res.status(404).json({

      success: false,
      message: "Escrow Not Found",

    });

  }


  if (escrow.status !== "Delivered") {

    return res.status(400).json({
      success: false,
      message: "Seller has not marked the order as Delivered.",
    });

  }

  escrow.status = "Released";
  escrow.releasedAt = Date.now();

  if (/^0x[a-fA-F0-9]{64}$/.test(transactionHash || "")) {
    escrow.releaseTransactionHash = transactionHash;
  }

  const index = allEscrows.findIndex(
    (e) => e.escrowId === escrow.escrowId
  );

  if (index !== -1) {

    allEscrows[index] = escrow;

    await saveEscrows(allEscrows);

  }

  res.json({

    success: true,
    escrow,

  });

});

/*
|--------------------------------------------------------------------------
| Cancel Pending Escrow
|--------------------------------------------------------------------------
*/

app.post("/api/escrow/:id/cancel", async (req, res) => {
  const { buyerWallet } = req.body;
  const allEscrows = await loadEscrows();
  const escrow = allEscrows.find((item) => item.escrowId === req.params.id);

  if (!escrow) {
    return res.status(404).json({
      success: false,
      message: "Escrow Not Found",
    });
  }

  if (
    escrow.status !== "Waiting Seller" &&
    escrow.status !== "Seller Accepted"
  ) {
    return res.status(400).json({
      success: false,
      message: "Only an escrow that has not been funded can be cancelled.",
    });
  }

  if (
    buyerWallet &&
    escrow.buyerWallet &&
    buyerWallet.toLowerCase() !== escrow.buyerWallet.toLowerCase()
  ) {
    return res.status(403).json({
      success: false,
      message: "Only the buyer wallet can cancel this escrow.",
    });
  }

  escrow.status = "Cancelled";
  escrow.cancellationReason = "Cancelled by Buyer";
  escrow.cancelledAt = Date.now();
  escrows[req.params.id] = escrow;
  await saveEscrows(allEscrows);

  return res.json({ success: true, escrow });
});

/*
|--------------------------------------------------------------------------
| Seller Reject Escrow
|--------------------------------------------------------------------------
*/

app.post("/api/escrow/:id/reject", async (req, res) => {
  const { sellerWallet } = req.body;
  const allEscrows = await loadEscrows();
  const escrow = allEscrows.find((item) => item.escrowId === req.params.id);

  if (!escrow) {
    return res.status(404).json({ success: false, message: "Escrow Not Found" });
  }

  if (escrow.status !== "Waiting Seller" && escrow.status !== "Seller Accepted") {
    return res.status(400).json({
      success: false,
      message: "This escrow can no longer be rejected.",
    });
  }

  escrow.status = "Cancelled";
  escrow.cancellationReason = "Rejected by Seller";
  escrow.sellerWallet = sellerWallet || escrow.sellerWallet || "";
  escrow.cancelledAt = Date.now();
  escrows[req.params.id] = escrow;
  await saveEscrows(allEscrows);

  return res.json({ success: true, escrow });
});

/*
|--------------------------------------------------------------------------
| Get Active Escrows
|--------------------------------------------------------------------------
*/

app.get("/api/escrows", async (req, res) => {

  const allEscrows = await loadEscrows();

  const { category, buyerWallet, wallet, role } = req.query;
  const categories = {
    pending: ["Waiting Seller", "Seller Accepted"],
    active: ["Funds Locked", "Delivered"],
    completed: ["Released"],
    cancelled: ["Cancelled"],
  };

  const allowedStatuses = categories[category] || categories.active;
  const connectedWallet = (wallet || buyerWallet || "").toLowerCase();
  const recordRole = role === "seller" ? "seller" : "buyer";

  const activeEscrows = allEscrows.filter((escrow) => {
    const belongsToConnectedWallet = !connectedWallet || (
      recordRole === "seller"
        ? escrow.sellerWallet?.toLowerCase() === connectedWallet
        : escrow.buyerWallet?.toLowerCase() === connectedWallet
    );

    return belongsToConnectedWallet && allowedStatuses.includes(escrow.status);
  });

  res.json({
    success: true,
    escrows: activeEscrows,
  });

});

/*
|--------------------------------------------------------------------------
| ProofPay Live Escrow Overview
|--------------------------------------------------------------------------
*/

app.get("/api/escrow-stats", async (req, res) => {
  const allEscrows = await loadEscrows();
  const lockedEscrows = allEscrows.filter(
    (escrow) => escrow.status === "Funds Locked" || escrow.status === "Delivered"
  );

  const lockedUsdc = lockedEscrows.reduce(
    (total, escrow) => total + (Number(escrow.amount) || 0),
    0
  );
  const activeBuyers = new Set(
    allEscrows.map((escrow) => escrow.buyerWallet?.toLowerCase()).filter(Boolean)
  ).size;
  const activeSellers = new Set(
    allEscrows.map((escrow) => escrow.sellerWallet?.toLowerCase()).filter(Boolean)
  ).size;

  return res.json({
    success: true,
    lockedUsdc,
    liveEscrows: allEscrows.length,
    activeBuyers,
    activeSellers,
  });
});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const PORT = Number(process.env.PORT) || 5001;

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {

    console.log(
      `✅ ProofPay Backend Running on http://localhost:${PORT}`
    );

  });
}

export default app;
