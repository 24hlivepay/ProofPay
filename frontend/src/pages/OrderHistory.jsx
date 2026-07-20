export default function OrderHistory({ setScreen }) {
  return (
    <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl p-10">

      <div className="flex justify-between items-center">

        <h1 className="text-4xl font-bold">
          Order History
        </h1>

        <button
          onClick={() => setScreen("home")}
          className="text-blue-600 font-semibold"
        >
          Home
        </button>

      </div>

      <div className="mt-10 space-y-4">

        <div className="border rounded-xl p-5 flex justify-between">

          <div>

            <h2 className="font-bold">
              Order #1001
            </h2>

            <p className="text-slate-500">
              100 USDC
            </p>

          </div>

          <span className="text-green-600 font-bold">
            Completed
          </span>

        </div>

        <div className="border rounded-xl p-5 flex justify-between">

          <div>

            <h2 className="font-bold">
              Order #1002
            </h2>

            <p className="text-slate-500">
              250 USDC
            </p>

          </div>

          <span className="text-yellow-600 font-bold">
            Pending
          </span>

        </div>

      </div>

    </div>
  )
}