import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";
import { useEscrow } from "../context/EscrowContext";
import api from "../services/api";
import { connectWallet } from "../services/wallet";

export default function SellerAccept() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { escrowData, setEscrowData } = useEscrow();
  const [sellerWallet, setSellerWallet] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEscrow() {
      try {
        const response = await api.get(`/escrow/${id}`);
        setEscrowData(response.data.escrow);

        if (
          response.data.escrow.status === "Seller Accepted" ||
          response.data.escrow.status === "Funds Locked" ||
          response.data.escrow.status === "Delivered"
        ) {
          navigate(`/seller-verification/${id}`, { replace: true });
        }
      } catch {
        setError("Escrow could not be found.");
      } finally {
        setLoading(false);
      }
    }

    loadEscrow();
  }, [id, navigate, setEscrowData]);

  async function handleConnectWallet() {
    try {
      setConnecting(true);
      setError("");
      const { address } = await connectWallet();
      setSellerWallet(address);
    } catch (connectError) {
      setError(connectError.message || "Unable to connect wallet.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleAcceptDeal() {
    try {
      setAccepting(true);
      setError("");
      const response = await api.post(`/escrow/${id}/accept`, { sellerWallet });
      setEscrowData(response.data.escrow);
      navigate(`/seller-verification/${id}`);
    } catch (acceptError) {
      setError(acceptError.message || "Unable to accept the escrow.");
    } finally {
      setAccepting(false);
    }
  }

  async function handleRejectDeal() {
    if (!window.confirm("Reject this escrow request?")) return;

    try {
      setAccepting(true);
      setError("");
      await api.post(`/escrow/${id}/reject`, { sellerWallet });
      navigate("/cancelled-orders", {
        replace: true,
        state: { role: "seller" },
      });
    } catch (rejectError) {
      setError(rejectError.response?.data?.message || "Unable to reject the escrow.");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-100" />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <button onClick={() => navigate("/dashboard/selling")} className="mb-8 font-semibold text-blue-600 hover:text-blue-700">← Back to Selling Escrows</button>

        {!sellerWallet ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-6xl">🔐</div>
            <h1 className="mt-6 text-4xl font-bold text-slate-900">Connect Seller Wallet</h1>
            <p className="mt-4 text-slate-600">
              Connect your wallet first, then review the deal and choose whether to accept or reject it.
            </p>
            {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-left text-red-700">{error}</p>}
            <div className="mt-10">
              <PrimaryButton onClick={handleConnectWallet} disabled={connecting}>
                {connecting ? "Connecting Wallet..." : "Connect with Wallet"}
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h1 className="text-4xl font-bold text-slate-900">Review Escrow Request</h1>
            <p className="mt-3 text-slate-600">Your seller wallet is connected. Review the terms before accepting.</p>

            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <span className="text-slate-600">Connected seller wallet: </span>
              <strong className="break-all text-green-700">{sellerWallet}</strong>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 p-8">
              <div className="space-y-4">
                <SummaryRow label="Buyer" value={escrowData.buyerName} />
                <SummaryRow label="Seller" value={escrowData.sellerName} />
                <SummaryRow label="Product / Service" value={escrowData.productName} />
                <SummaryRow label="Amount" value={escrowData.amount ? `${escrowData.amount} USDC` : ""} />
                <SummaryRow label="Escrow ID" value={escrowData.escrowId} />
              </div>
            </div>

            {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

            <div className="mt-10 grid grid-cols-2 gap-4">
              <button onClick={handleRejectDeal} disabled={accepting} className="rounded-xl border border-slate-300 py-4 font-semibold hover:bg-slate-100 disabled:opacity-50">Reject Deal</button>
              <PrimaryButton onClick={handleAcceptDeal} disabled={accepting}>{accepting ? "Accepting Deal..." : "Accept Deal"}</PrimaryButton>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return <div className="flex gap-6 justify-between"><span className="text-slate-500">{label}</span><strong className="break-all text-right">{value || "—"}</strong></div>;
}
