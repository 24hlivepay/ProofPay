import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";

import api from "../services/api";
import { useEscrow } from "../context/EscrowContext";

export default function WaitingSeller() {

  const navigate = useNavigate();

  const { escrowData, setEscrowData } = useEscrow();

  const [copied, setCopied] = useState(false);

  const sellerRejected =
    escrowData.status === "Cancelled" &&
    escrowData.cancellationReason === "Rejected by Seller";

  const secureLink =
    `${window.location.origin}/escrow/${escrowData.escrowId}`;

  /*
  |--------------------------------------------------------------------------
  | Copy Secure Link
  |--------------------------------------------------------------------------
  */

  async function copyLink() {

    try {

      await navigator.clipboard.writeText(secureLink);

      setCopied(true);

      setTimeout(() => {

        setCopied(false);

      }, 2000);

    } catch {

      alert("Unable to copy link.");

    }

  }

  /*
  |--------------------------------------------------------------------------
  | Share Secure Link
  |--------------------------------------------------------------------------
  */

  async function shareLink() {

    try {

      if (navigator.share) {

        await navigator.share({

          title: "ProofPay Escrow",

          text: "Open this secure escrow.",

          url: secureLink,

        });

      } else {

        await navigator.clipboard.writeText(secureLink);

        alert(
          "Sharing is not supported.\n\nSecure link copied to clipboard."
        );

      }

    } catch (error) {

      console.log(error);

    }

  }

  /*
  |--------------------------------------------------------------------------
  | Poll Seller Status
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!escrowData.escrowId) return;

    const interval = setInterval(async () => {

      try {

        const response = await api.get(
          `/escrow/${escrowData.escrowId}/status`
        );

        console.log("Buyer Polling:", response.data);

        setEscrowData(response.data.escrow);

        if (response.data.escrow.status === "Seller Accepted") {

          clearInterval(interval);

          navigate("/deposit", { state: { backTo: "/pending-orders" } });

        }

        if (response.data.escrow.status === "Cancelled") {

          clearInterval(interval);

        }

      } catch (error) {

        console.log(error);

      }

    }, 2000);

    return () => clearInterval(interval);

  }, [escrowData.escrowId, navigate, setEscrowData]);

  return (

    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">

        <button
          onClick={() => navigate("/dashboard/buying")}
          className="mb-8 font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Buying Escrows
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-4xl font-bold text-slate-900">
                {sellerRejected ? "Deal Rejected" : "Waiting for Seller"}
              </h1>

              <p className="mt-3 text-slate-600">
                {sellerRejected
                  ? "The seller has rejected this escrow request."
                  : "Your escrow request has been created successfully."}
              </p>

            </div>

            <div className={`rounded-full px-5 py-2 font-semibold ${
              sellerRejected
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {sellerRejected ? "Cancelled" : "Waiting"}
            </div>

          </div>          {/* Secure Link */}

          <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-8">

            <h2 className="text-2xl font-bold text-blue-700">
              Secure Link
            </h2>

            <div className="mt-8 space-y-6">

              <div>

                <p className="text-slate-500">
                  Escrow ID
                </p>

                <h3 className="mt-2 text-3xl font-bold">
                  {escrowData.escrowId}
                </h3>

              </div>

              <div>

                <p className="text-slate-500">
                  Secure Link
                </p>

                <div className="mt-3 rounded-xl border bg-white p-4">

                  <p className="break-all text-blue-600">

                    {secureLink}

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Actions */}

          <div className="mt-8 grid grid-cols-2 gap-4">

            <button
              onClick={copyLink}
              className="rounded-xl border py-4 font-semibold hover:bg-slate-100 transition"
            >

              {copied ? "✅ Link Copied" : "📋 Copy Link"}

            </button>

            <button
              onClick={shareLink}
              className="rounded-xl border py-4 font-semibold hover:bg-slate-100 transition"
            >

              📤 Share Link

            </button>

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

          {/* Live Status */}

<div className={`mt-8 rounded-3xl border p-10 text-center shadow-sm ${
  sellerRejected
    ? "border-red-200 bg-gradient-to-br from-red-50 to-white"
    : "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
}`}>

  <div className="text-7xl">
    {sellerRejected ? "✖️" : "⏳"}
  </div>

  <h2 className={`mt-6 text-4xl font-bold ${
    sellerRejected ? "text-red-700" : "text-blue-700"
  }`}>
    {sellerRejected ? "Deal Rejected by Seller" : "Waiting for Seller"}
  </h2>

  <p className="mt-5 text-xl text-slate-700">
    {sellerRejected
      ? "This escrow has been cancelled. No funds were deposited."
      : "Your secure ProofPay escrow has been created successfully."}
  </p>

  <p className="mt-3 text-lg leading-8 text-slate-600">
    {sellerRejected ? (
      "You can find this deal in Cancelled Purchases."
    ) : (
      <>
        The seller has not opened your secure link yet.
        <br />
        Once the seller connects the wallet and accepts the escrow,
        this page will automatically continue to the deposit page.
      </>
    )}
  </p>

</div>

{/* Auto Status */}

{!sellerRejected && <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5 text-center">

  <p className="font-semibold text-green-700">
    ✅ ProofPay automatically checks the seller status every 2 seconds.
  </p>

</div>}

{/* Continue */}

<div className="mt-10">

  <PrimaryButton
    onClick={() => sellerRejected
      ? navigate("/cancelled-orders", { state: { role: "buyer" } })
      : navigate("/dashboard/buying")
    }
  >
    {sellerRejected ? "View Cancelled Purchases" : "Back to Buying Escrows"}
  </PrimaryButton>

</div>

</div>

</main>

</div>

);

}
