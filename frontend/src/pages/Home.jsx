import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Heading */}

        <div className="mb-10">

          <h1 className="text-4xl font-bold text-slate-900">
            Buyer Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Create and manage your escrow transactions securely.
          </p>

        </div>

        {/* Quick Actions */}

        <div className="grid gap-6 lg:grid-cols-3">

          <button
            onClick={() => navigate("/create")}
            className="rounded-3xl bg-blue-600 p-8 text-left text-white shadow-lg transition hover:bg-blue-700"
          >
            <h2 className="text-3xl font-bold">
              Create Escrow
            </h2>

            <p className="mt-4 text-blue-100">
              Start a secure escrow transaction.
            </p>
          </button>

          <button
            onClick={() => navigate("/history")}
            className="rounded-3xl bg-white border border-slate-200 p-8 text-left shadow-sm transition hover:shadow-lg"
          >
            <h2 className="text-2xl font-bold text-slate-900">
              Order History
            </h2>

            <p className="mt-4 text-slate-600">
              View completed and active escrows.
            </p>
          </button>

          <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">

            <h2 className="text-2xl font-bold text-slate-900">
              Statistics
            </h2>

            <div className="mt-6 space-y-3">

              <div className="flex justify-between">
                <span>Total Escrows</span>
                <strong>0</strong>
              </div>

              <div className="flex justify-between">
                <span>Active</span>
                <strong>0</strong>
              </div>

              <div className="flex justify-between">
                <span>Completed</span>
                <strong>0</strong>
              </div>

            </div>

          </div>

        </div>

        {/* Recent Escrows */}

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-8 py-6">

            <h2 className="text-2xl font-bold">
              Recent Escrows
            </h2>

          </div>

          <table className="w-full">

            <thead>

              <tr className="border-b border-slate-200 text-left">

                <th className="px-8 py-4">Escrow ID</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              <tr>

                <td className="px-8 py-6">—</td>

                <td>—</td>

                <td>—</td>

                <td className="text-slate-500">
                  Empty
                </td>

                <td>
                  —
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </main>

    </div>
  );
}