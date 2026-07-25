import { BrowserProvider } from "ethers";

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  const address = await signer.getAddress();

  localStorage.setItem("proofpay-wallet", address);

  return {
    provider,
    signer,
    address,
  };
}

export function getConnectedWallet() {
  return localStorage.getItem("proofpay-wallet");
}

export function disconnectWallet() {
  localStorage.removeItem("proofpay-wallet");
}