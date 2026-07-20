export default function Profile({ setScreen }) {
  return (
    <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">

      <div className="w-24 h-24 rounded-full bg-blue-600 mx-auto"></div>

      <h1 className="mt-6 text-4xl font-bold">
        Wallet Profile
      </h1>

      <p className="mt-4 text-slate-500">
        Connected Wallet
      </p>

      <div className="mt-4 border rounded-xl p-4">

        0x91AF...3B12

      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">

        <div className="border rounded-xl p-6">

          <h2 className="text-3xl font-bold">
            12
          </h2>

          <p>
            Orders
          </p>

        </div>

        <div className="border rounded-xl p-6">

          <h2 className="text-3xl font-bold">
            100%
          </h2>

          <p>
            Success
          </p>

        </div>

      </div>

      <button
        onClick={() => setScreen("home")}
        className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl"
      >
        Back Home
      </button>

    </div>
  )
}