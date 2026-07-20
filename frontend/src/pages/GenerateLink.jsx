import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";

import { useEscrow } from "../context/EscrowContext";

export default function GenerateLink() {

  const navigate = useNavigate();

  const { escrowData } = useEscrow();

  const secureLink =
    `https://proofpay.app/escrow/${escrowData.escrowId}`;

  return (

    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">

        <button
          onClick={() => navigate("/create")}
          className="mb-8 font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back
        </button>

        <div className="rounded-3xl bg-white border border-slate-200 p-10 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-4xl font-bold text-slate-900">
                Secure Link Generated
              </h1>

              <p className="mt-3 text-slate-600">
                Share this secure link with the seller.
              </p>

            </div>

            <div className="rounded-full bg-yellow-100 px-5 py-2 font-semibold text-yellow-700">
              Waiting for Seller
            </div>

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

            </div>

          </div>

          {/* Escrow ID */}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">

            <p className="text-sm text-slate-500">
              Escrow ID
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {escrowData.escrowId}
            </h2>

          </div>

          {/* Secure Link */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">

            <p className="text-sm text-slate-500">
              Secure Link
            </p>

            <p className="mt-2 break-all text-blue-600">
              {secureLink}
            </p>

          </div>

          {/* QR */}

          <div className="mt-8 rounded-2xl border-2 border-dashed h-56 flex items-center justify-center">

            <div className="text-center">

              <div className="text-6xl">
                📱
              </div>

              <p className="mt-4 text-slate-500">
                QR Code
              </p>

            </div>

          </div>

          {/* Buttons */}

          <div className="mt-8 grid grid-cols-2 gap-4">

            <button className="rounded-xl border py-4 font-semibold hover:bg-slate-100">
              Copy Link
            </button>

            <button className="rounded-xl border py-4 font-semibold hover:bg-slate-100">
              Share
            </button>

          </div>

          {/* Next Steps */}

          <div className="mt-8 rounded-2xl bg-blue-50 border border-blue-200 p-6">

            <h3 className="text-xl font-bold text-blue-700">
              Next Steps
            </h3>

            <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">

              <li>Share this secure link with the seller.</li>

              <li>Seller connects their wallet.</li>

              <li>Seller reviews the escrow details.</li>

              <li>Seller generates a verification code.</li>

              <li>Buyer verifies the code.</li>

              <li>Buyer deposits USDC into escrow.</li>

            </ol>

          </div>

          <div className="mt-10">

            <PrimaryButton
              onClick={() => navigate("/waiting")}
            >
              I've Shared the Link
            </PrimaryButton>

          </div>

        </div>

      </main>

    </div>

  );
}