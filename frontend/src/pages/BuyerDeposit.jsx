import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";

import { useEscrow } from "../context/EscrowContext";

export default function BuyerDeposit() {

  const navigate = useNavigate();

  const { escrowData } = useEscrow();

  return (

    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">

        <button
          onClick={() => navigate("/seller")}
          className="mb-8 font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">

          <h1 className="text-4xl font-bold text-slate-900">
            Verify & Deposit
          </h1>

          <p className="mt-3 text-slate-600">
            Enter the verification code received from the seller before depositing your USDC.
          </p>

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

          {/* Verification */}

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-8">

            <h2 className="text-2xl font-bold text-blue-700">
              Seller Verification
            </h2>

            <p className="mt-3 text-slate-700">
              Enter the verification code shared by the seller.
            </p>

            <div className="mt-6">

              <InputField
                placeholder="Enter 6-digit Verification Code"
              />

            </div>

            <button className="mt-6 w-full rounded-xl border border-blue-600 py-4 font-semibold text-blue-600 hover:bg-blue-600 hover:text-white transition">
              Verify Code
            </button>

          </div>

          {/* Deposit */}

          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">

            <h3 className="text-xl font-bold text-green-700">
              Deposit Funds
            </h3>

            <p className="mt-3 text-slate-700">
              Once verified, your funds will be locked inside the ProofPay smart contract until the transaction is completed.
            </p>

          </div>

          {/* Warning */}

          <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">

            <h3 className="text-xl font-bold text-yellow-700">
              Important Notice
            </h3>

            <p className="mt-3 text-slate-700">
              After depositing, funds can only be released, refunded, or resolved through a dispute.
            </p>

          </div>

          <div className="mt-10">

            <PrimaryButton
              onClick={() => navigate("/active")}
            >
              Deposit {escrowData.amount} USDC
            </PrimaryButton>

          </div>

        </div>

      </main>

    </div>

  );
}