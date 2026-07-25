import { BrowserProvider } from "ethers";

export const ARC_TESTNET_CHAIN_ID = 5042002;
const ARC_TESTNET_CHAIN_HEX = "0x4cef52";
const ARC_TESTNET_NETWORK = {
  chainId: ARC_TESTNET_CHAIN_HEX,
  chainName: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.testnet.arc.network"],
};

export async function ensureArcTestnet(onStatus) {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const currentChainId = await window.ethereum.request({
    method: "eth_chainId",
  });

  if (currentChainId.toLowerCase() === ARC_TESTNET_CHAIN_HEX) {
    return "already-connected";
  }

  try {
    onStatus?.("Switching MetaMask to Arc Testnet...");
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET_CHAIN_HEX }],
    });
    return "switched";
  } catch (error) {
    if (error.code === 4902) {
      try {
        onStatus?.("Arc Testnet is not in MetaMask. Adding it now...");
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ARC_TESTNET_NETWORK],
        });
        onStatus?.("Arc Testnet added. Switching your wallet...");
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ARC_TESTNET_CHAIN_HEX }],
        });
        return "added-and-switched";
      } catch (addError) {
        throw new Error(getWalletErrorMessage(addError));
      }
    }

    throw new Error(getWalletErrorMessage(error));
  }
}

export async function connectWallet() {
  return connectWalletWithOptions();
}

export async function connectWalletWithOptions({
  requireSignature = false,
  requestAccountSelection = false,
  onStatus,
} = {}) {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  onStatus?.(requestAccountSelection ? "Choose the wallet you want to use..." : "Connecting your wallet...");

  if (requestAccountSelection) {
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });
  const networkStatus = await ensureArcTestnet(onStatus);

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  localStorage.setItem("proofpay-wallet", address);

  if (!requireSignature) {
    return { provider, signer, address, networkStatus };
  }

  const signedAt = new Date().toISOString();
  const message = [
    "Sign in to ProofPay.",
    "",
    `Wallet: ${address}`,
    `Issued at: ${signedAt}`,
    "",
    "This signature proves you control this wallet. It does not create a transaction or charge gas.",
  ].join("\n");
  const signature = await signer.signMessage(message);
  const session = { address, message, signature, signedAt };

  localStorage.setItem("proofpay-wallet-session", JSON.stringify(session));

  return { provider, signer, ...session, networkStatus };
}

export function getWalletErrorMessage(error) {
  const message = error?.message || "";

  if (error?.code === 4001 || /user rejected|user denied/i.test(message)) {
    return "You cancelled the MetaMask request. You can connect whenever you are ready.";
  }

  if (/not installed/i.test(message)) {
    return "MetaMask is not installed. Install it first, then connect your wallet.";
  }

  return "We could not connect your wallet. Please unlock MetaMask and try again.";
}

export function getConnectedWallet() {
  return localStorage.getItem("proofpay-wallet");
}

export function getWalletSession() {
  try {
    return JSON.parse(localStorage.getItem("proofpay-wallet-session"));
  } catch {
    return null;
  }
}

export async function disconnectWallet() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch {
      // Some injected wallets do not support permission revocation. The local
      // ProofPay session is still cleared below.
    }
  }

  localStorage.removeItem("proofpay-wallet");
  localStorage.removeItem("proofpay-wallet-session");
}
