import Card from "../components/Card";

export default function EscrowActive({ setScreen }) {
  return (
    <Card>

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-5xl font-bold text-slate-900">
            Escrow Active
          </h1>

          <p className="mt-3 text-slate-600">
            Funds are safely locked inside the smart contract.
          </p>

        </div>

        <div className="bg-green-100 text-green-700 px-5 py-2 rounded-full font-semibold">
          ACTIVE
        </div>

      </div>

      <div className="mt-10 grid grid-cols-2 gap-5">

        <div className="border rounded-2xl p-5">
          <p className="text-slate-500 text-sm">
            Escrow ID
          </p>

          <h3 className="mt-2 text-xl font-bold">
            PP-82F7A91
          </h3>
        </div>

        <div className="border rounded-2xl p-5">
          <p className="text-slate-500 text-sm">
            Locked Amount
          </p>

          <h3 className="mt-2 text-xl font-bold text-blue-600">
            100 USDC
          </h3>
        </div>

        <div className="border rounded-2xl p-5">
          <p className="text-slate-500 text-sm">
            Buyer Wallet
          </p>

          <h3 className="mt-2 font-semibold">
            0x91AF...3B12
          </h3>
        </div>

        <div className="border rounded-2xl p-5">
          <p className="text-slate-500 text-sm">
            Seller Wallet
          </p>

          <h3 className="mt-2 font-semibold">
            0x7A42...91CD
          </h3>
        </div>

      </div>

      <div className="mt-8 border rounded-2xl p-6 bg-blue-50">

        <div className="flex justify-between">

          <span className="font-semibold">
            Current Status
          </span>

          <span className="text-green-700 font-bold">
            Waiting For Buyer Decision
          </span>

        </div>

        <div className="mt-5">

          <div className="w-full bg-blue-100 rounded-full h-3">

            <div className="bg-blue-600 h-3 rounded-full w-3/4"></div>

          </div>

        </div>

        <p className="mt-4 text-sm text-slate-600">
          Seller has accepted and funds are locked securely.
          Buyer can now release payment, request refund or open dispute.
        </p>

      </div>

      <div className="mt-10 grid gap-4">

        <button
          onClick={() => setScreen("release")}
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-5 text-lg font-semibold"
        >
          Release Funds
        </button>

        <button
          onClick={() => setScreen("refund")}
          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl py-5 text-lg font-semibold"
        >
          Request Refund
        </button>

        <button
          onClick={() => setScreen("dispute")}
          className="bg-red-600 hover:bg-red-700 text-white rounded-xl py-5 text-lg font-semibold"
        >
          Open Dispute
        </button>

      </div>

    </Card>
  );
}