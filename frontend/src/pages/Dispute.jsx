import Navbar from "../components/Navbar";

export default function Dispute() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-lg px-5 py-8 sm:px-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

      <h1 className="text-3xl font-bold">
        Open Dispute
      </h1>

      <textarea
        rows="6"
        placeholder="Describe your issue..."
        className="mt-8 w-full border rounded-xl p-4"
      />

      <button
        className="mt-6 w-full rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700"
      >
        Submit Dispute
      </button>

      </div>
      </main>
    </div>
  )
}
