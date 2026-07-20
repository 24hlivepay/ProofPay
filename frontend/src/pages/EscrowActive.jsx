import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";

import { useEscrow } from "../context/EscrowContext";

export default function EscrowActive() {

  const navigate = useNavigate();

  const { escrowData } = useEscrow();

  return (

    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">

        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-4xl font-bold">
                Escrow Active
              </h1>

              <p className="mt-3 text-slate-600">
                Funds are safely locked inside the ProofPay smart contract.
              </p>

            </div>

            <div className="rounded-full bg-green-100 px-5 py-2 font-semibold text-green-700">
              ACTIVE
            </div>

          </div>

          {/* Summary */}

          <div className="mt-10 rounded-2xl border p-8">

            <h2 className="mb-6 text-2xl font-bold">
              Escrow Summary
            </h2>

            <div className="space-y-4">

              <div className="flex justify-between">
                <span>Buyer</span>
                <strong>{escrowData.buyerName}</strong>
              </div>

              <div className="flex justify-between">
                <span>Seller</span>
                <strong>{escrowData.sellerName}</strong>
              </div>

              <div className="flex justify-between">
                <span>Product</span>
                <strong>{escrowData.productName}</strong>
              </div>

              <div className="flex justify-between">
                <span>Amount</span>
                <strong>{escrowData.amount} USDC</strong>
              </div>

              <div className="flex justify-between">
                <span>Escrow ID</span>
                <strong>{escrowData.escrowId}</strong>
              </div>

            </div>

          </div>

          {/* Status */}

          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">

            <h2 className="text-2xl font-bold text-green-700">
              Funds Locked
            </h2>

            <p className="mt-3 text-slate-700">
              Buyer funds are locked inside the smart contract.
              Buyer can now release funds, request a refund,
              or open a dispute.
            </p>

          </div>

          {/* Actions */}

          <div className="mt-10 grid gap-4">

            <PrimaryButton
              onClick={() => navigate("/release")}
            >
              Release Funds
            </PrimaryButton>

            <button
              onClick={() => navigate("/refund")}
              className="rounded-xl bg-yellow-500 py-4 font-semibold text-white hover:bg-yellow-600"
            >
              Request Refund
            </button>

            <button
              onClick={() => navigate("/dispute")}
              className="rounded-xl bg-red-600 py-4 font-semibold text-white hover:bg-red-700"
            >
              Open Dispute
            </button>

          </div>

        </div>

      </main>

    </div>

  );

}