import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  // Demo Mode
  // Baad mein ye wallet se automatically aayega.
  const walletConnected = false;

  const walletAddress = "0x91AF...3B12";

  return (
    <nav className="w-full bg-white border-b border-slate-200">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">

        {/* Logo */}

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
            P
          </div>

          <div>

            <h1 className="text-3xl font-bold text-slate-900">
              ProofPay
            </h1>

            <p className="text-sm text-slate-500">
              Secure Crypto Escrow
            </p>

          </div>

        </div>

        {/* Wallet */}

        {walletConnected ? (

          <button
            className="rounded-xl border border-slate-300 bg-slate-100 px-6 py-3 font-semibold text-slate-800 hover:bg-slate-200 transition"
          >
            {walletAddress}
          </button>

        ) : (

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
          >
            Connect Wallet
          </button>

        )}

      </div>

    </nav>
  );
}