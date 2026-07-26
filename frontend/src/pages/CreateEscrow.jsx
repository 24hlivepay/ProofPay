import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { useEscrow } from "../context/EscrowContext";
import api from "../services/api";
import { connectWallet } from "../services/wallet";

export default function CreateEscrow() {
  const navigate = useNavigate();
  const { setEscrowData } = useEscrow();
  const [buyerName, setBuyerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateEscrow() {
    if (!buyerName || !sellerName || !productName || !amount) {
      setError("Please complete all required fields.");
      return;
    }

    const isValidUsdcAmount = /^\d+(\.\d{1,6})?$/.test(amount.trim());

    if (!isValidUsdcAmount || Number(amount) <= 0) {
      setError("Enter a valid USDC amount, for example 25 or 25.50.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const { address: buyerWallet } = await connectWallet();
      const response = await api.post("/escrow", {
        buyerName,
        buyerWallet,
        sellerName,
        productName,
        productId,
        amount,
        description,
      });

      setEscrowData(response.data.escrow);
      navigate("/waiting");
    } catch (requestError) {
      setError(requestError.message || "Unable to create escrow.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-7 sm:px-6">
        <button onClick={() => navigate("/dashboard/buying")} className="mb-5 text-sm font-semibold text-blue-600">
          ← Back to Buying Escrows
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-2xl font-bold text-slate-900">Create New Escrow</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create the deal and send its secure link to the seller. Their wallet will bind automatically when they accept.
          </p>

          <div className="mt-5 rounded-xl border p-4 sm:p-5">
            <h2 className="mb-4 text-lg font-bold">Buyer Information</h2>
            <div className="space-y-3">
              <InputField placeholder="Buyer Name" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} />
              <InputField placeholder="Product / Service Name" value={productName} onChange={(event) => setProductName(event.target.value)} />
              <InputField placeholder="Product ID (Optional)" value={productId} onChange={(event) => setProductId(event.target.value)} />
              <InputField placeholder="Amount (USDC) — e.g. 25" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <textarea rows={3} placeholder="Deal Description (Optional)" value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <strong>12-hour secure link</strong>
                <p className="mt-1 text-amber-800">This escrow request expires automatically in 12 hours if funds are not locked.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border p-4 sm:p-5">
            <h2 className="mb-4 text-lg font-bold">Seller Information</h2>
            <InputField placeholder="Business / Seller Name" value={sellerName} onChange={(event) => setSellerName(event.target.value)} />
          </div>

          {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

          <div className="mt-6">
            <PrimaryButton onClick={handleCreateEscrow} disabled={submitting}>
              {submitting ? "Creating Escrow..." : "Generate Secure Escrow Link"}
            </PrimaryButton>
          </div>
        </div>
      </main>
    </div>
  );
}
