import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";

import { useEscrow } from "../context/EscrowContext";

export default function GenerateLink() {

  const navigate = useNavigate();

  const { escrowData, saveEscrow } = useEscrow();

  const [copied, setCopied] = useState(false);

  const secureLink =
    `${window.location.origin}/#/escrow/${escrowData.escrowId}`;

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

    } catch (error) {

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

          text: "Open this secure ProofPay escrow.",

          url: secureLink,

        });

      } else {

        await navigator.clipboard.writeText(secureLink);

        alert(
          "Sharing is not supported on this browser.\n\nThe secure link has been copied to your clipboard."
        );

      }

    } catch (error) {

      console.log(error);

    }

  }
  useEffect(() => {

    if (!escrowData.escrowId) return;

    const alreadyExists =
      JSON.parse(localStorage.getItem("proofpay-escrows")) || [];

    const exists = alreadyExists.find(
      (item) => item.escrowId === escrowData.escrowId
    );

    if (!exists) {

      saveEscrow({
        ...escrowData,
        status: "Pending",
      });

    }

  }, []);

  return (


    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6">



        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold text-slate-900">
                Secure Link Generated
              </h1>

              <p className="mt-3 text-slate-600">
                Share this secure link with the seller.
              </p>

            </div>

            <div className="rounded-full bg-yellow-100 px-5 py-2 font-semibold text-yellow-700">
              Waiting for Seller
            </div>

          </div>          {/* Escrow Summary */}

          <div className="mt-7 rounded-xl border border-slate-200 p-5 sm:p-6">

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

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">

            <div className="flex items-center gap-2">

              <span className="text-xl">
                🔗
              </span>

              <p className="font-semibold text-blue-700">
                Secure Link
              </p>

            </div>

            <p className="mt-4 break-all rounded-xl bg-white p-4 text-blue-600">

              {secureLink}

            </p>

          </div>

          {/* QR Placeholder */}

          <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">

            <div className="text-center">

              <div className="text-4xl">
                📱
              </div>

              <h3 className="mt-4 text-2xl font-bold">

                QR Code

              </h3>

              <p className="mt-3 text-slate-500">

                Coming Soon

              </p>

            </div>

          </div>          {/* Buttons */}

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
              📤 Share
            </button>

          </div>

          {/* Next Steps */}

          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">

            <h3 className="text-xl font-bold text-blue-700">
              Next Steps
            </h3>

            <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">

              <li>Copy or share the secure link with the seller.</li>

              <li>Seller opens the secure ProofPay link.</li>

              <li>Seller connects their wallet.</li>

              <li>Seller reviews the escrow details.</li>

              <li>Seller generates a verification code.</li>

              <li>Buyer verifies the code.</li>

              <li>Buyer deposits USDC into escrow.</li>

            </ol>

          </div>

          {/* Actions */}

          <div className="mt-10 grid gap-4">

            <PrimaryButton
              onClick={() => navigate("/waiting")}
            >
              I've Shared the Link
            </PrimaryButton>

            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel this escrow?")) {
                  navigate("/dashboard/buying");
                }
              }}
              className="rounded-xl bg-red-600 py-4 font-semibold text-white hover:bg-red-700 transition"
            >
              Cancel Escrow
            </button>

          </div>

        </div>

      </main>

    </div>

  );

}
