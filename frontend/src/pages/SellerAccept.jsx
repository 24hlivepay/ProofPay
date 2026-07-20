import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";

import { useEscrow } from "../context/EscrowContext";

export default function SellerAccept() {

  const navigate = useNavigate();

  const { escrowData } = useEscrow();

  const verificationCode = "482731";

  return (

    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">

        <button
          onClick={() => navigate("/seller-landing")}
          className="mb-8 font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-4xl font-bold text-slate-900">
                Review Escrow Request
              </h1>

              <p className="mt-3 text-slate-600">
                Please review the escrow details before accepting this deal.
              </p>

            </div>

            <div className="rounded-full bg-green-100 px-5 py-2 font-semibold text-green-700">
              Wallet Connected
            </div>

          </div>

          {/* Wallet */}

          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">

            <div className="flex justify-between">

              <span className="text-slate-600">
                Connected Wallet
              </span>

              <strong>
                0x91AF...3B12
              </strong>

            </div>

          </div>

          {/* Escrow Summary */}

          <div className="mt-8 rounded-2xl border border-slate-200 p-8">

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

          {/* Verification */}

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-8">

            <h2 className="text-2xl font-bold text-blue-700">
              Verification Code
            </h2>

            <p className="mt-3 text-slate-700">
              Share this verification code with the buyer.
            </p>

            <div className="mt-6 rounded-xl border bg-white p-6 text-center">

              <p className="text-sm text-slate-500">
                Generated Code
              </p>

              <h1 className="mt-2 text-5xl font-bold tracking-widest">
                {verificationCode}
              </h1>

            </div>

          </div>

          {/* Security */}

          <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">

            <h3 className="text-lg font-bold text-yellow-700">
              Before Accepting
            </h3>

            <ul className="mt-4 space-y-2 text-slate-700">

              <li>✓ Verify buyer information.</li>
              <li>✓ Verify product/service.</li>
              <li>✓ Verify amount.</li>
              <li>✓ Share the verification code only with the buyer.</li>

            </ul>

          </div>

          {/* Buttons */}

          <div className="mt-10 grid grid-cols-2 gap-4">

            <button
              onClick={() => navigate("/")}
              className="rounded-xl border border-slate-300 py-4 font-semibold hover:bg-slate-100"
            >
              Reject Deal
            </button>

            <PrimaryButton
              onClick={() => navigate("/deposit")}
            >
              Accept Deal
            </PrimaryButton>

          </div>

        </div>

      </main>

    </div>

  );
}