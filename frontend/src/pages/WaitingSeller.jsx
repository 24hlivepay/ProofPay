import Card from "../components/Card";

export default function WaitingSeller({ setScreen }) {
  return (
    <Card>
      <button
        onClick={() => setScreen("link")}
        className="text-blue-600 font-semibold mb-6"
      >
        ← Back
      </button>

      <h1 className="text-5xl font-bold text-slate-900">
        Waiting For Seller
      </h1>

      <p className="mt-4 text-lg text-slate-600">
        The secure link has been generated successfully.
      </p>

      <div className="mt-10 flex justify-center">
        <div className="h-24 w-24 rounded-full border-8 border-blue-200 border-t-blue-600 animate-spin"></div>
      </div>

      <div className="mt-10 rounded-2xl bg-blue-50 border border-blue-200 p-6 text-left">

        <h3 className="font-semibold text-blue-700">
          Current Status
        </h3>

        <div className="mt-5 space-y-3">

          <div className="flex justify-between">
            <span>Escrow Status</span>
            <span className="font-semibold text-yellow-600">
              Waiting
            </span>
          </div>

          <div className="flex justify-between">
            <span>Network</span>
            <span className="font-semibold">
              ARC Testnet
            </span>
          </div>

          <div className="flex justify-between">
            <span>Currency</span>
            <span className="font-semibold">
              USDC
            </span>
          </div>

        </div>

      </div>

      <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-5">

        <p className="text-yellow-700 font-semibold">
          Waiting for seller to:
        </p>

        <ul className="mt-3 text-sm text-slate-600 space-y-2 text-left">

          <li>✓ Open secure link</li>

          <li>✓ Connect wallet</li>

          <li>✓ Verify secret code</li>

          <li>✓ Accept escrow request</li>

        </ul>

      </div>

      <div className="mt-10 space-y-4">

        <button
          onClick={() => setScreen("seller")}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold"
        >
          Seller Accepted (Demo)
        </button>

        <button
          onClick={() => setScreen("home")}
          className="w-full border border-slate-300 hover:bg-slate-100 py-4 rounded-xl font-semibold"
        >
          Cancel
        </button>

      </div>

    </Card>
  );
}