import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";

import { useEscrow } from "../context/EscrowContext";

export default function CreateEscrow() {

  const navigate = useNavigate();

  const { setEscrowData } = useEscrow();

  const [buyerName, setBuyerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expiry, setExpiry] = useState("");

  function handleCreateEscrow() {

    const escrowId =
      "PP-" + Math.random().toString(36).substring(2, 9).toUpperCase();

    setEscrowData({

      buyerName,

      sellerName,

      productName,

      productId,

      amount,

      description,

      expiry,

      escrowId,

      verificationCode: ""

    });

    navigate("/generate-link");
  }

  return (

    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">

        <button
          onClick={() => navigate("/dashboard")}
          className="mb-8 font-semibold text-blue-600"
        >
          ← Back to Dashboard
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">

          <h1 className="text-4xl font-bold">
            Create New Escrow
          </h1>

          <p className="mt-3 text-slate-600">
            Fill in the deal information below.
          </p>

          {/* Buyer */}

          <div className="mt-10 rounded-2xl border p-8">

            <h2 className="mb-6 text-2xl font-bold">
              Buyer Information
            </h2>

            <div className="space-y-5">

              <InputField
                placeholder="Buyer Name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />

              <InputField
                placeholder="Product / Service Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />

              <InputField
                placeholder="Product ID (Optional)"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />

              <InputField
                placeholder="Amount (USDC)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <textarea
                rows={5}
                placeholder="Deal Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500"
              />

              <InputField
                placeholder="Expiry Time (Optional)"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />

            </div>

          </div>

          {/* Seller */}

          <div className="mt-8 rounded-2xl border p-8">

            <h2 className="mb-6 text-2xl font-bold">
              Seller Information
            </h2>

            <InputField
              placeholder="Business / Seller Name"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
            />

          </div>

          <div className="mt-10">

            <PrimaryButton
              onClick={handleCreateEscrow}
            >
              Generate Secure Escrow Link
            </PrimaryButton>

          </div>

        </div>

      </main>

    </div>

  );
}