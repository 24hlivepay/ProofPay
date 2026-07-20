export default function Dispute({ setScreen }) {
  return (
    <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-10">

      <h1 className="text-4xl font-bold">
        Open Dispute
      </h1>

      <textarea
        rows="6"
        placeholder="Describe your issue..."
        className="mt-8 w-full border rounded-xl p-4"
      />

      <button
        className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl"
      >
        Submit Dispute
      </button>

    </div>
  )
}