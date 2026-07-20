import Card from "../components/Card";

export default function CreateEscrow({ setScreen }) {
  return (
    <Card>
      <button
        onClick={() => setScreen("home")}
        className="text-blue-600 font-semibold mb-6"
      >
        ← Back
      </button>

      <h1 className="text-5xl font-bold text-slate-900">
        Create Escrow
      </h1>

      <p className="mt-4 text-slate-600 text-lg">
        Buyer creates a secure escrow request.
      </p>

      <div className="mt-10 space-y-5">

        <div>
          <label className="block text-left text-sm font-semibold text-slate-700 mb-2">
            Seller Wallet Address
          </label>

          <input
            type="text"
            placeholder="0x..."
            className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-left text-sm font-semibold text-slate-700 mb-2">
            Amount (USDC)
          </label>

          <input
            type="number"
            placeholder="100"
            className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-left text-sm font-semibold text-slate-700 mb-2">
            Verification Code
          </label>

          <input
            type="text"
            placeholder="Enter Secret Code"
            className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 p-5 text-left">

          <h3 className="font-semibold text-blue-700">
            Buyer Flow
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Generate a unique secure link and send it to the seller.
            Funds will NOT be deposited until the seller accepts the request.
          </p>

        </div>

        <button
          onClick={() => setScreen("link")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition"
        >
          Generate Secure Link
        </button>

      </div>
    </Card>
  );
}