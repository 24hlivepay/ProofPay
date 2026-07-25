import { useNavigate } from "react-router-dom";

export default function ReleaseFunds() {

  const navigate = useNavigate();

  return (

    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">

      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">

        <div className="text-6xl mb-6">
          ✅
        </div>

        <h1 className="text-4xl font-bold">
          Funds Released Successfully
        </h1>

        <p className="mt-4 text-slate-500">
          Escrow completed successfully.
        </p>

        <p className="mt-2 text-slate-500">
          Payment has been securely transferred to the seller.
        </p>

        <button
          onClick={() => navigate("/dashboard/buying")}
          className="mt-10 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl"
        >
          ← Back to Buying Escrows
        </button>

      </div>

    </div>

  );

}
