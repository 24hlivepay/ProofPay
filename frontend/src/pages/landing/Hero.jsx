import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectWalletWithOptions, getWalletErrorMessage } from "../../services/wallet";
import api from "../../services/api";

export default function Hero() {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const [walletStatus, setWalletStatus] = useState("");
  const [walletError, setWalletError] = useState("");
  const [showWalletChoices, setShowWalletChoices] = useState(false);

  async function handleWalletConnection(walletType) {
    try {
      setConnecting(true);
      setWalletError("");
      const walletSession = await connectWalletWithOptions({
        requireSignature: true,
        walletType,
        onStatus: setWalletStatus,
      });

      await api.post("/wallet/connect", walletSession);
      setWalletStatus("Wallet connected to Arc Testnet. Opening your dashboard...");
      setShowWalletChoices(false);
      navigate("/dashboard");
    } catch (error) {
      setWalletStatus("");
      setWalletError(getWalletErrorMessage(error));
    } finally {
      setConnecting(false);
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-6 py-20">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl font-bold text-white shadow-lg shadow-blue-200">
          P
        </div>

        <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          ProofPay
        </p>

        <h1 className="mt-8 max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
          Secure P2P
          <span className="block text-blue-600">Crypto Escrow</span>
        </h1>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-4">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Continue with Email
          </button>

          <button
            type="button"
            onClick={() => setShowWalletChoices((visible) => !visible)}
            disabled={connecting}
            className="w-full rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connecting ? "Connecting..." : "Connect with Wallet"}
          </button>

          {showWalletChoices && !connecting && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
              <button
                type="button"
                onClick={() => handleWalletConnection("metamask")}
                className="rounded-lg border border-slate-200 px-4 py-3 font-semibold text-slate-800 hover:border-blue-500 hover:bg-blue-50"
              >
                MetaMask
              </button>
              <button
                type="button"
                onClick={() => handleWalletConnection("rabby")}
                className="rounded-lg border border-slate-200 px-4 py-3 font-semibold text-slate-800 hover:border-blue-500 hover:bg-blue-50"
              >
                Rabby Wallet
              </button>
            </div>
          )}
        </div>

        {walletStatus && <p className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">{walletStatus}</p>}
        {walletError && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{walletError}</p>}

        <p className="mt-5 text-sm text-slate-400">
          Choose the option that is easiest for you.
        </p>
      </div>
    </section>
  );
}
