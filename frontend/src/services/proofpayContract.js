import { Contract, formatUnits, Interface, JsonRpcProvider, parseUnits } from "ethers";
import { connectWallet } from "./wallet";
import { executeCircleContract } from "./circleTransactions";

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
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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
    provider: wallet.provider,
    escrow: new Contract(PROOFPAY_ESCROW_ADDRESS, ESCROW_ABI, wallet.signer),
    usdc: new Contract(ARC_TESTNET_USDC_ADDRESS, USDC_ABI, wallet.signer),
  };
}

function getUsdcAmount(amount) {
  return parseUnits(String(amount), USDC_DECIMALS);
}

function isCircleWallet() {
  return localStorage.getItem("proofpay-wallet-type") === "circle";
}

async function recoverExistingEscrow({
  escrowId,
  buyerAddress,
  sellerAddress,
  amountUnits,
  provider: connectedProvider,
}) {
  const provider =
    connectedProvider || new JsonRpcProvider(ARC_TESTNET_RPC_URL);
  const escrow = new Contract(PROOFPAY_ESCROW_ADDRESS, ESCROW_ABI, provider);
  const existing = await escrow.getEscrow(escrowId);

  if (existing.buyer.toLowerCase() === ZERO_ADDRESS) {
    return null;
  }

  const matchesRequest =
    existing.buyer.toLowerCase() === buyerAddress.toLowerCase() &&
    existing.seller.toLowerCase() === sellerAddress.toLowerCase() &&
    existing.amount === amountUnits;

  if (!matchesRequest) {
    throw new Error(
      "This escrow ID already exists on-chain with different payment details. Please create a new escrow."
    );
  }

  const latestBlock = await provider.getBlockNumber();
  const topics = escrowInterface.encodeFilterTopics("EscrowCreated", [
    escrowId,
    buyerAddress,
    sellerAddress,
  ]);

  for (
    let toBlock = latestBlock;
    toBlock >= PROOFPAY_DEPLOYMENT_BLOCK;
    toBlock -= ARC_LOG_BLOCK_WINDOW
  ) {
    const fromBlock = Math.max(
      PROOFPAY_DEPLOYMENT_BLOCK,
      toBlock - ARC_LOG_BLOCK_WINDOW + 1
    );
    const logs = await provider.getLogs({
      address: PROOFPAY_ESCROW_ADDRESS,
      topics,
      fromBlock,
      toBlock,
    });

    if (logs[0]?.transactionHash) {
      return { hash: logs[0].transactionHash, recovered: true };
    }
  }

  throw new Error(
    "The USDC is already locked on-chain, but ProofPay could not locate its deposit transaction. Please contact support with the escrow ID."
  );
}

async function executeCircleProofPay({
  contractAddress,
  abiFunctionSignature,
  abiParameters,
  onSubmitted,
  display,
}) {
  try {
    return await executeCircleContract({
      contractAddress,
      abiFunctionSignature,
      abiParameters,
      onSubmitted,
      display,
    });
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      error.message;
    throw new Error(
      message || "Circle could not complete the transaction.",
      { cause: error }
    );
  }
}

export async function fundEscrow({ escrowId, sellerAddress, amount }) {
  if (isCircleWallet()) {
    const walletAddress = localStorage.getItem("proofpay-wallet");
    const amountUnits = getUsdcAmount(amount);
    const recovered = await recoverExistingEscrow({
      escrowId,
      buyerAddress: walletAddress,
      sellerAddress,
      amountUnits,
    });
    if (recovered) return recovered;

    const provider = new JsonRpcProvider(ARC_TESTNET_RPC_URL);
    const usdc = new Contract(ARC_TESTNET_USDC_ADDRESS, USDC_ABI, provider);
    const balance = await usdc.balanceOf(walletAddress);

    if (balance < amountUnits + NETWORK_FEE_RESERVE) {
      throw new Error(
        `Buyer wallet has ${formatUnits(balance, USDC_DECIMALS)} USDC. This escrow needs ${amount} USDC plus a small Arc network fee.`
      );
    }

    await executeCircleProofPay({
      contractAddress: ARC_TESTNET_USDC_ADDRESS,
      abiFunctionSignature: "approve(address,uint256)",
      abiParameters: [PROOFPAY_ESCROW_ADDRESS, amountUnits.toString()],
      display: {
        title: "Approve USDC",
        subtitle:
          "Step 1 of 2 • Authorize the exact escrow amount. No USDC moves in this step.",
        amount: String(amount),
        symbol: "USDC",
        fromLabel: "Authorizing wallet",
        from: walletAddress,
        contractLabel: "Permission for",
        contractName: "Verified ProofPay Escrow",
        totalLabel: "Approval limit",
        confirmLabel: "Authorize USDC",
        action: "Authorize exact USDC allowance",
        details: [
          `Escrow ID: ${escrowId}`,
          `Seller: ${sellerAddress}`,
          "Network: Arc Testnet",
          "Access: Exact amount only",
          "Funds movement: None in this step",
        ],
      },
    });
    const transaction = await executeCircleProofPay({
      contractAddress: PROOFPAY_ESCROW_ADDRESS,
      abiFunctionSignature: "createEscrow(string,address,uint256)",
      abiParameters: [escrowId, sellerAddress, amountUnits.toString()],
      display: {
        title: "Lock Escrow Funds",
        subtitle:
          "Step 2 of 2 • Transfer USDC from your wallet into the escrow contract.",
        amount: String(amount),
        symbol: "USDC",
        fromLabel: "Funding wallet",
        from: walletAddress,
        contractLabel: "Funds destination",
        contractName: "Verified ProofPay Escrow",
        totalLabel: "Amount to lock",
        confirmLabel: `Lock ${amount} USDC`,
        action: "Lock funds in escrow",
        details: [
          `Escrow ID: ${escrowId}`,
          `Seller: ${sellerAddress}`,
          "Network: Arc Testnet",
          "Funds destination: ProofPay Escrow contract",
          "Protection: Release after delivery",
        ],
      },
    });

    return { hash: transaction.hash };
  }

  try {
    const { address, provider, escrow, usdc } = await getContracts();
    const amountUnits = getUsdcAmount(amount);
    const recovered = await recoverExistingEscrow({
      escrowId,
      buyerAddress: address,
      sellerAddress,
      amountUnits,
      provider,
    });
    if (recovered) return recovered;

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
  if (isCircleWallet()) {
    const transaction = await executeCircleProofPay({
      contractAddress: PROOFPAY_ESCROW_ADDRESS,
      abiFunctionSignature: "confirmDelivery(string)",
      abiParameters: [escrowId],
    });
    return transaction.hash;
  }

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
  if (isCircleWallet()) {
    const provider = new JsonRpcProvider(ARC_TESTNET_RPC_URL);
    const readOnlyEscrow = new Contract(
      PROOFPAY_ESCROW_ADDRESS,
      ESCROW_ABI,
      provider
    );
    const onChainEscrow = await readOnlyEscrow.getEscrow(escrowId);
    const releaseAmount = formatUnits(onChainEscrow.amount, USDC_DECIMALS);
    const sellerAddress = onChainEscrow.seller;
    const walletAddress = localStorage.getItem("proofpay-wallet");
    const transaction = await executeCircleProofPay({
      contractAddress: PROOFPAY_ESCROW_ADDRESS,
      abiFunctionSignature: "releaseFunds(string)",
      abiParameters: [escrowId],
      onSubmitted,
      display: {
        title: "Release Payment",
        subtitle:
          "Authorize the escrow contract to release its locked funds to the seller.",
        amount: releaseAmount,
        symbol: "USDC",
        fromLabel: "Authorizing wallet",
        from: walletAddress,
        contractLabel: "Verified contract",
        contractName: "ProofPay Escrow",
        totalLabel: "Locked funds to release",
        confirmLabel: "Authorize Release",
        action: "Authorize contract release",
        details: [
          `Escrow ID: ${escrowId}`,
          `Recipient: ${sellerAddress}`,
          "Network: Arc Testnet",
          "Status: Delivery confirmed",
          "Funds source: ProofPay Escrow contract",
          "Warning: This action cannot be reversed",
        ],
      },
    });
    return transaction.hash;
  }

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
  if (isCircleWallet()) {
    const transaction = await executeCircleProofPay({
      contractAddress: PROOFPAY_ESCROW_ADDRESS,
      abiFunctionSignature: "refund(string)",
      abiParameters: [escrowId],
    });
    return transaction.hash;
  }

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
