import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";

import { useEscrow } from "../context/EscrowContext";

export default function WaitingSeller() {

  const navigate = useNavigate();

  const { escrowData } = useEscrow();

  return (
    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">

        <button
          onClick={() => navigate("/generate-link")}
          className="mb-8 font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-4xl font-bold text-slate-900">
                Waiting for Seller
              </h1>

              <p className="mt-3 text-slate-600">
                Your escrow request has been created successfully.
              </p>

            </div>

            <div className="rounded-full bg-yellow-100 px-5 py-2 font-semibold text-yellow-700">
              Waiting
            </div>

          </div>

          {/* Loading */}

          <div className="mt-10 flex justify-center">

            <div className="h-24 w-24 animate-spin rounded-full border-8 border-blue-200 border-t-blue-600"></div>

          </div>

          {/* Escrow Summary */}

          <div className="mt-10 rounded-2xl border border-slate-200 p-8">

            <h2 className="mb-6 text-2xl font-bold">
              Escrow Summary
            </h2>

            <div className="space-y-4">

              <div className="flex justify-between">
                <span className="text-slate-500">Buyer Name</span>
                <strong>{escrowData.buyerName}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Seller Name</span>
                <strong>{escrowData.sellerName}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Product / Service</span>
                <strong>{escrowData.productName}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <strong>{escrowData.amount} USDC</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Escrow ID</span>
                <strong>{escrowData.escrowId}</strong>
              </div>

            </div>

          </div>

          {/* Progress */}

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-8">

            <h2 className="mb-6 text-2xl font-bold text-blue-700">
              Escrow Progress
            </h2>

            <div className="space-y-4">

              <div>✅ Escrow Created</div>

              <div>✅ Secure Link Generated</div>

              <div>✅ Link Shared</div>

              <div>🟡 Seller Opening Link...</div>

              <div>⚪ Seller Connected Wallet</div>

              <div>⚪ Seller Accepted Deal</div>

              <div>⚪ Verification Code Ready</div>

              <div>⚪ Buyer Deposit Pending</div>

            </div>

          </div>

          {/* Info */}

          <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">

            <h3 className="text-lg font-bold text-yellow-700">
              Waiting for Seller
            </h3>

            <p className="mt-3 text-slate-700">
              Once the seller opens your secure link, connects their wallet,
              and accepts the deal, you will receive a verification code before
              depositing your USDC.
            </p>

          </div>

          {/* Buttons */}

          <div className="mt-10 grid grid-cols-2 gap-4">

            <button className="rounded-xl border py-4 font-semibold hover:bg-slate-100">
              Refresh Status
            </button>

            <PrimaryButton
              onClick={() => navigate("/seller-landing")}
            >
              Seller Accepted (Demo)
            </PrimaryButton>

          </div>

        </div>

      </main>

    </div>
  );
}