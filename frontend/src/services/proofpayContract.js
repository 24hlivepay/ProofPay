import { Contract, formatUnits, Interface, JsonRpcProvider, parseUnits } from "ethers";
import { connectWallet } from "./wallet";

export const PROOFPAY_ESCROW_ADDRESS =
  "0xCd0f43E573899809ff96C560439570A760698C9a";

export const ARC_TESTNET_USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

// Arc's RPC can fail during gas estimation for the native-USDC ERC-20
// precompile even though the signed transaction itself is valid. Supplying
// conservative limits lets MetaMask submit the transaction normally; unused
// gas is not charged.
const ARC_APPROVAL_GAS_LIMIT = 250_000n;
const ARC_ESCROW_GAS_LIMIT = 500_000n;
const ARC_STATUS_UPDATE_GAS_LIMIT = 250_000n;
const USDC_DECIMALS = 6;
const NETWORK_FEE_RESERVE = parseUnits("0.01", USDC_DECIMALS);
const ARC_TESTNET_RPC_URL = "https://rpc.testnet.arc.network";
const PROOFPAY_DEPLOYMENT_BLOCK = 53_590_676;
const ARC_LOG_BLOCK_WINDOW = 9_000;

const ESCROW_ABI = [
  "function createEscrow(string escrowId, address seller, uint256 amount)",
  "function confirmDelivery(string escrowId)",
  "function releaseFunds(string escrowId)",
  "function refund(string escrowId)",
  "function openDispute(string escrowId)",
  "function getEscrow(string escrowId) view returns (address buyer, address seller, uint256 amount, uint8 status)",
  "event EscrowCreated(string indexed escrowId, address indexed buyer, address indexed seller, uint256 amount)",
  "event DeliveryConfirmed(string indexed escrowId, address indexed seller)",
  "event FundsReleased(string indexed escrowId, address indexed seller, uint256 amount)",
  "event FundsRefunded(string indexed escrowId, address indexed buyer, uint256 amount)",
  "event DisputeOpened(string indexed escrowId, address indexed openedBy)",
  "event DisputeResolved(string indexed escrowId, uint256 buyerAmount, uint256 sellerAmount)",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];

const escrowInterface = new Interface(ESCROW_ABI);

function technicalError(error) {
  return (
    error?.reason ||
    error?.shortMessage ||
    error?.info?.error?.message ||
    error?.data?.message ||
    error?.message ||
    "Transaction failed."
  );
}

function readableError(error) {
  const message = technicalError(error);
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("user rejected") ||
    normalizedMessage.includes("user denied") ||
    error?.code === 4001
  ) {
    return "You cancelled the MetaMask request. No funds were moved. Tap Deposit again whenever you are ready.";
  }

  if (
    normalizedMessage.includes("insufficient funds") ||
    normalizedMessage.includes("insufficient balance")
  ) {
    return "Your wallet does not have enough USDC. Add USDC for both the payment and the small Arc network fee, then try again.";
  }

  if (
    normalizedMessage.includes("wrong network") ||
    normalizedMessage.includes("chain")
  ) {
    return "Your wallet is on the wrong network. Open MetaMask, switch to Arc Testnet, then try again.";
  }

  if (
    normalizedMessage.includes("could not coalesce") ||
    normalizedMessage.includes("missing revert data") ||
    normalizedMessage.includes("call exception")
  ) {
    return "MetaMask could not prepare this payment. Check that the buyer wallet is selected, it is on Arc Testnet, and it has a small extra USDC balance for the network fee. No funds were moved.";
  }

  if (
    message.startsWith("Buyer wallet") ||
    message.startsWith("Buyer wallet has") ||
    message.startsWith("Switch MetaMask") ||
    message.startsWith("Wallet connection") ||
    message.startsWith("MetaMask is not installed")
  ) {
    return message;
  }

  console.error("ProofPay transaction error:", error);
  return "We could not complete this payment. No funds were moved. Please reopen MetaMask, confirm the buyer wallet and Arc Testnet, then try again.";
}

async function getContracts() {
  let wallet;

  try {
    wallet = await connectWallet();
  } catch (error) {
    throw new Error(`Wallet connection failed: ${readableError(error)}`);
  }

  return {
    address: wallet.address,
    escrow: new Contract(PROOFPAY_ESCROW_ADDRESS, ESCROW_ABI, wallet.signer),
    usdc: new Contract(ARC_TESTNET_USDC_ADDRESS, USDC_ABI, wallet.signer),
  };
}

function getUsdcAmount(amount) {
  return parseUnits(String(amount), USDC_DECIMALS);
}

export async function fundEscrow({ escrowId, sellerAddress, amount }) {
  try {
    const { address, escrow, usdc } = await getContracts();
    const amountUnits = getUsdcAmount(amount);
    let balance;

    try {
      balance = await usdc.balanceOf(address);
    } catch (error) {
      throw new Error(`Unable to read buyer USDC balance: ${readableError(error)}`);
    }

    const minimumRequired = amountUnits + NETWORK_FEE_RESERVE;

    if (balance < minimumRequired) {
      throw new Error(
        `Buyer wallet has ${formatUnits(balance, USDC_DECIMALS)} USDC. This escrow needs ${amount} USDC plus a small Arc network fee. Add a little more USDC, then try again.`
      );
    }

    // Arc's native-USDC precompile can intermittently reject an allowance
    // read through browser RPC. A fresh, exact approval is safe and avoids
    // that unreliable read before every escrow deposit.
    let approval;

    try {
      approval = await usdc.approve(
        PROOFPAY_ESCROW_ADDRESS,
        amountUnits,
        {
          gasLimit: ARC_APPROVAL_GAS_LIMIT,
        }
      );
      await approval.wait();
    } catch (error) {
      throw new Error(`USDC approval failed: ${readableError(error)}`);
    }

    let transaction;
    let receipt;

    try {
      transaction = await escrow.createEscrow(
        escrowId,
        sellerAddress,
        amountUnits,
        {
          gasLimit: ARC_ESCROW_GAS_LIMIT,
        }
      );
      receipt = await transaction.wait();
    } catch (error) {
      throw new Error(`USDC lock transaction failed: ${readableError(error)}`);
    }

    return { hash: transaction.hash, receipt };
  } catch (error) {
    throw new Error(readableError(error));
  }
}

export async function confirmDeliveryOnChain(escrowId) {
  try {
    const { escrow } = await getContracts();
    const transaction = await escrow.confirmDelivery(escrowId, {
      gasLimit: ARC_STATUS_UPDATE_GAS_LIMIT,
    });
    await transaction.wait();
    return transaction.hash;
  } catch (error) {
    throw new Error(readableError(error));
  }
}

export async function releaseFundsOnChain(escrowId, onSubmitted) {
  try {
    const { escrow } = await getContracts();
    const transaction = await escrow.releaseFunds(escrowId, {
      gasLimit: ARC_STATUS_UPDATE_GAS_LIMIT,
    });
    onSubmitted?.(transaction.hash);
    await transaction.wait();
    return transaction.hash;
  } catch (error) {
    throw new Error(readableError(error));
  }
}

export async function refundOnChain(escrowId) {
  try {
    const { escrow } = await getContracts();
    const transaction = await escrow.refund(escrowId);
    await transaction.wait();
    return transaction.hash;
  } catch (error) {
    throw new Error(readableError(error));
  }
}

export async function getEscrowOnChain(escrowId) {
  try {
    const { escrow } = await getContracts();
    const result = await escrow.getEscrow(escrowId);

    return {
      buyer: result.buyer,
      seller: result.seller,
      amount: formatUnits(result.amount, USDC_DECIMALS),
      status: Number(result.status),
    };
  } catch (error) {
    throw new Error(readableError(error));
  }
}

// These figures are read directly from Arc Testnet. They do not use the
// temporary JSON backend, so the dashboard reflects the deployed contract.
export async function getLiveContractStats() {
  const provider = new JsonRpcProvider(ARC_TESTNET_RPC_URL);
  const usdc = new Contract(ARC_TESTNET_USDC_ADDRESS, USDC_ABI, provider);

  const [balance, latestBlock] = await Promise.all([
    usdc.balanceOf(PROOFPAY_ESCROW_ADDRESS),
    provider.getBlockNumber(),
  ]);

  // Arc Testnet limits a single eth_getLogs request to 10,000 blocks.
  // Read the deployed contract history in small sequential ranges so a busy
  // explorer/RPC cannot make the dashboard incorrectly fall back to zero.
  const logs = [];

  try {
    for (
      let fromBlock = PROOFPAY_DEPLOYMENT_BLOCK;
      fromBlock <= latestBlock;
      fromBlock += ARC_LOG_BLOCK_WINDOW
    ) {
      const toBlock = Math.min(fromBlock + ARC_LOG_BLOCK_WINDOW - 1, latestBlock);
      const rangeLogs = await provider.getLogs({
        address: PROOFPAY_ESCROW_ADDRESS,
        fromBlock,
        toBlock,
      });

      logs.push(...rangeLogs);
    }
  } catch (error) {
    // The live USDC balance is still authoritative even if Arc's public RPC
    // is momentarily rate-limiting the historical event scan.
    console.warn("ProofPay event scan is temporarily unavailable:", error);
    return {
      lockedUsdc: formatUnits(balance, USDC_DECIMALS),
      liveEscrows: null,
      activeBuyers: null,
      activeSellers: null,
    };
  }

  const escrows = new Map();

  for (const log of logs) {
    let parsed;

    try {
      parsed = escrowInterface.parseLog(log);
    } catch {
      continue;
    }

    const escrowKey = log.topics[1];
    if (!escrowKey) continue;

    if (parsed.name === "EscrowCreated") {
      escrows.set(escrowKey, {
        status: "Funded",
        buyer: parsed.args.buyer.toLowerCase(),
        seller: parsed.args.seller.toLowerCase(),
      });
      continue;
    }

    const escrow = escrows.get(escrowKey);
    if (!escrow) continue;

    if (parsed.name === "DeliveryConfirmed") escrow.status = "Delivered";
    if (parsed.name === "DisputeOpened") escrow.status = "Disputed";
    if (parsed.name === "FundsReleased") escrow.status = "Released";
    if (parsed.name === "FundsRefunded") escrow.status = "Refunded";
    if (parsed.name === "DisputeResolved") escrow.status = "Resolved";
  }

  const liveEscrows = [...escrows.values()].filter((escrow) =>
    ["Funded", "Delivered", "Disputed"].includes(escrow.status)
  );

  return {
    lockedUsdc: formatUnits(balance, USDC_DECIMALS),
    liveEscrows: liveEscrows.length,
    activeBuyers: new Set(liveEscrows.map((escrow) => escrow.buyer)).size,
    activeSellers: new Set(liveEscrows.map((escrow) => escrow.seller)).size,
  };
}
