export default function ReleaseFunds({ setScreen }) {
  return (
    <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">

      <div className="text-6xl mb-6">
        ✅
      </div>

      <h1 className="text-4xl font-bold">
        Funds Released
      </h1>

      <p className="mt-4 text-slate-500">
        Payment has been transferred to the seller.
      </p>

      <button
        onClick={() => setScreen("home")}
        className="mt-10 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl"
      >
        Back Home
      </button>

    </div>
  )
}