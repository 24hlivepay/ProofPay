import Card from "../components/Card";

export default function BuyerDeposit({ setScreen }) {
  return (
    <Card>

      <button
        onClick={() => setScreen("seller")}
        className="text-blue-600 font-semibold mb-6"
      >
        ← Back
      </button>

      <h1 className="text-5xl font-bold text-slate-900">
        Deposit USDC
      </h1>

      <p className="mt-4 text-lg text-slate-600">
        Seller accepted your escrow request.
      </p>

      <div className="mt-10 rounded-2xl border border-slate-200 p-6">

        <div className="flex justify-between py-3 border-b">
          <span className="text-slate-500">Escrow ID</span>
          <span className="font-semibold">PP-82F7A91</span>
        </div>

        <div className="flex justify-between py-3 border-b">
          <span className="text-slate-500">Seller Wallet</span>
          <span className="font-semibold">
            0x7A42...91CD
          </span>
        </div>

        <div className="flex justify-between py-3 border-b">
          <span className="text-slate-500">Network</span>
          <span className="font-semibold">
            ARC Testnet
          </span>
        </div>

        <div className="flex justify-between py-3 border-b">
          <span className="text-slate-500">Currency</span>
          <span className="font-semibold">
            USDC
          </span>
        </div>

        <div className="flex justify-between py-3">
          <span className="text-slate-500">Deposit Amount</span>
          <span className="text-2xl font-bold text-blue-600">
            100 USDC
          </span>
        </div>

      </div>

      <div className="mt-8 rounded-xl bg-green-50 border border-green-200 p-5">

        <h3 className="font-semibold text-green-700">
          Seller Verified
        </h3>

        <p className="mt-3 text-sm text-slate-600">
          The seller has successfully accepted your escrow request.
          Once you deposit USDC, the funds will be locked inside the
          ProofPay Smart Contract until you release, refund or dispute.
        </p>

      </div>

      <div className="mt-8 rounded-xl bg-yellow-50 border border-yellow-200 p-5">

        <h3 className="font-semibold text-yellow-700">
          Important
        </h3>

        <p className="mt-3 text-sm text-slate-600">
          After depositing, the payment cannot be cancelled directly.
          The funds remain locked inside the escrow smart contract until
          one of the available actions is executed.
        </p>

      </div>

      <button
        onClick={() => setScreen("active")}
        className="mt-10 w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-xl text-lg font-semibold"
      >
        Deposit 100 USDC
      </button>

    </Card>
  );
}