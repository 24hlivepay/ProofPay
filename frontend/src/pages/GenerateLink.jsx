import Card from "../components/Card";

export default function GenerateLink({ setScreen }) {
  const escrowId = "PP-82F7A91";

  const secureLink =
    "https://proofpay.app/escrow/PP-82F7A91";

  return (
    <Card>

      <button
        onClick={() => setScreen("create")}
        className="text-blue-600 font-semibold mb-6"
      >
        ← Back
      </button>

      <h1 className="text-5xl font-bold text-slate-900">
        Secure Link Ready
      </h1>

      <p className="mt-4 text-lg text-slate-600">
        Share this link with your seller.
      </p>

      <div className="mt-10 space-y-6">

        <div className="text-left">

          <p className="text-sm text-slate-500 mb-2">
            Escrow ID
          </p>

          <div className="border rounded-xl bg-slate-50 p-4 font-semibold">
            {escrowId}
          </div>

        </div>

        <div className="text-left">

          <p className="text-sm text-slate-500 mb-2">
            Secure Link
          </p>

          <div className="border rounded-xl bg-slate-50 p-4 break-all">
            {secureLink}
          </div>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold"
          >
            Copy Link
          </button>

          <button
            className="border border-slate-300 hover:bg-slate-100 py-4 rounded-xl font-semibold"
          >
            Share
          </button>

        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-2xl h-56 flex items-center justify-center">

          <div className="text-center">

            <div className="text-6xl">
              📱
            </div>

            <p className="mt-4 text-slate-500">
              QR Code Placeholder
            </p>

          </div>

        </div>

        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-5 text-left">

          <h3 className="font-semibold text-yellow-700">
            Important
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Buyer CANNOT deposit funds until the seller opens
            this link and accepts the escrow request.
          </p>

        </div>

        <button
          onClick={() => setScreen("waiting")}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold"
        >
          Continue
        </button>

      </div>

    </Card>
  );
}