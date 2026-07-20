import Card from "../components/Card";

export default function SellerAccept({ setScreen }) {
  return (
    <Card>

      <h1 className="text-5xl font-bold text-slate-900">
        Seller Review
      </h1>

      <p className="mt-4 text-lg text-slate-600">
        Buyer has invited you to join this escrow transaction.
      </p>

      <div className="mt-10 rounded-2xl border border-slate-200 p-6">

        <div className="flex justify-between py-3 border-b">
          <span className="text-slate-500">Escrow ID</span>
          <span className="font-semibold">PP-82F7A91</span>
        </div>

        <div className="flex justify-between py-3 border-b">
          <span className="text-slate-500">Network</span>
          <span className="font-semibold">ARC Testnet</span>
        </div>

        <div className="flex justify-between py-3 border-b">
          <span className="text-slate-500">Currency</span>
          <span className="font-semibold">USDC</span>
        </div>

        <div className="flex justify-between py-3 border-b">
          <span className="text-slate-500">Amount</span>
          <span className="font-semibold">100 USDC</span>
        </div>

        <div className="flex justify-between py-3">
          <span className="text-slate-500">Buyer Wallet</span>
          <span className="font-semibold">
            0x91AF...3B12
          </span>
        </div>

      </div>

      <div className="mt-8">

        <label className="block text-left mb-2 font-semibold">
          Verification Code
        </label>

        <input
          type="text"
          placeholder="Enter verification code"
          className="w-full border border-slate-300 rounded-xl p-4"
        />

      </div>

      <div className="mt-8 rounded-xl bg-blue-50 border border-blue-200 p-5">

        <p className="font-semibold text-blue-700">
          Before accepting
        </p>

        <ul className="mt-3 text-left text-sm text-slate-600 space-y-2">

          <li>✓ Verify buyer information</li>

          <li>✓ Verify amount</li>

          <li>✓ Verify secret code</li>

          <li>✓ Accept only if everything is correct</li>

        </ul>

      </div>

      <div className="mt-10 grid grid-cols-2 gap-4">

        <button
          onClick={() => setScreen("home")}
          className="border border-slate-300 py-4 rounded-xl font-semibold hover:bg-slate-100"
        >
          Reject
        </button>

        <button
          onClick={() => setScreen("deposit")}
          className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold"
        >
          Accept Deal
        </button>

      </div>

    </Card>
  );
}