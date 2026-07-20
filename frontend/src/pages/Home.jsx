export default function Home({ setScreen }) {
  return (
    <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">

      <div className="mb-8">
        <h1 className="text-5xl font-bold text-slate-900">
          ProofPay
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          Secure P2P Crypto Escrow
        </p>

        <p className="mt-2 text-slate-500">
          Trade safely using blockchain-powered escrow.
          Fast, transparent and secure.
        </p>
      </div>

      <div className="space-y-4">

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition"
        >
          Connect Wallet
        </button>

        <button
          onClick={() => setScreen("create")}
          className="w-full border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold py-4 rounded-xl transition"
        >
          Create Escrow
        </button>

        <button
          onClick={() => setScreen("seller")}
          className="w-full border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold py-4 rounded-xl transition"
        >
          Open Escrow Link
        </button>

      </div>

    </div>
  )
}