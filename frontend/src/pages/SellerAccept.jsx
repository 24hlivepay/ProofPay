import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";
import { useEscrow } from "../context/EscrowContext";
import api from "../services/api";
import { PROOFPAY_ESCROW_ADDRESS } from "../services/proofpayContract";
import { connectWalletWithOptions } from "../services/wallet";

const ARC_SCAN_CONTRACT_URL = `https://testnet.arcscan.app/address/${PROOFPAY_ESCROW_ADDRESS}`;

export default function SellerAccept() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { escrowData, setEscrowData } = useEscrow();
  const [sellerWallet, setSellerWallet] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEscrow() {
      try {
        const response = await api.get(`/escrow/${id}`);
        const escrow = response.data.escrow;
        setEscrowData(escrow);

        if (["Seller Accepted", "Funds Locked", "Delivered"].includes(escrow.status)) {
          navigate(`/seller-verification/${id}`, { replace: true });
        }
      } catch {
        setError("This escrow invitation could not be found or may have expired.");
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
      const { address } = await connectWalletWithOptions({
        requireSignature: true,
      });
      setSellerWallet(address);
    } catch (connectError) {
      if (connectError?.code !== 4001) {
        setError(connectError.message || "Unable to connect wallet.");
      }
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
      setError(acceptError.response?.data?.message || "Unable to accept the escrow.");
    } finally {
      setAccepting(false);
    }
  }

  async function handleRejectDeal() {
    if (!window.confirm("Reject this escrow request? The buyer will be notified.")) return;

    try {
      setAccepting(true);
      setError("");
      await api.post(`/escrow/${id}/reject`, { sellerWallet });
      navigate("/cancelled-orders", { replace: true, state: { role: "seller" } });
    } catch (rejectError) {
      setError(rejectError.response?.data?.message || "Unable to reject the escrow.");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-100" />;

  if (error && !escrowData?.escrowId) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="mx-auto max-w-xl px-6 py-16 text-center">
          <div className="rounded-3xl border border-red-200 bg-white p-10 shadow-sm">
            <div className="text-5xl">⚠️</div>
            <h1 className="mt-5 text-3xl font-bold text-slate-900">Invitation unavailable</h1>
            <p className="mt-3 text-slate-600">{error}</p>
            <button onClick={() => navigate("/")} className="mt-8 font-semibold text-blue-600 hover:text-blue-700">Go to ProofPay</button>
          </div>
        </main>
      </div>
    );
  }

  const escrow = escrowData || {};

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <button
          onClick={() => (reviewing ? setReviewing(false) : navigate("/dashboard/selling"))}
          className="mb-8 font-semibold text-blue-600 hover:text-blue-700"
        >
          ← {reviewing ? "Back to Invitation" : "Back to Selling Escrows"}
        </button>

        {!reviewing ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl text-white shadow-lg">P</div>
              <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">ProofPay escrow invitation</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">You have been invited to an escrow</h1>
              <p className="mt-4 text-slate-600">Review the deal first. You only connect your wallet if you choose to continue.</p>
            </div>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="space-y-5">
                <SummaryRow label="Buyer" value={escrow.buyerName} />
                <SummaryRow label="Product / Service" value={escrow.productName} />
                {escrow.productId && <SummaryRow label="Product ID" value={escrow.productId} />}
                {escrow.description && <SummaryRow label="Order details" value={escrow.description} />}
                <SummaryRow label="Amount" value={escrow.amount ? `${escrow.amount} test USDC` : "—"} />
                <SummaryRow label="Status" value="Awaiting your review" valueClassName="text-amber-700" />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-slate-700">
              <strong className="text-slate-900">Safety note:</strong> ProofPay never asks for your seed phrase or private key. This is a testnet deal using test USDC only.
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <a href={ARC_SCAN_CONTRACT_URL} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 px-5 py-4 text-center font-semibold text-slate-700 transition hover:bg-slate-50">
                View contract on Arcscan ↗
              </a>
              <PrimaryButton onClick={() => setReviewing(true)}>Review Deal</PrimaryButton>
            </div>
          </section>
        ) : !sellerWallet ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="text-6xl">🔐</div>
            <h1 className="mt-6 text-4xl font-bold text-slate-900">Connect seller wallet</h1>
            <p className="mx-auto mt-4 max-w-lg text-slate-600">Connect and sign a ProofPay message to confirm this wallet belongs to the seller. No funds will move.</p>
            {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-left text-red-700">{error}</p>}
            <div className="mx-auto mt-10 max-w-md">
              <PrimaryButton onClick={handleConnectWallet} disabled={connecting}>
                {connecting ? "Connecting Wallet..." : "Connect with Wallet"}
              </PrimaryButton>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <h1 className="text-4xl font-bold text-slate-900">Review Escrow Request</h1>
            <p className="mt-3 text-slate-600">Your seller wallet is connected. Confirm the deal details before accepting.</p>

            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <span className="text-slate-600">Connected seller wallet: </span>
              <strong className="break-all text-green-700">{sellerWallet}</strong>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 p-6 sm:p-8">
              <div className="space-y-4">
                <SummaryRow label="Buyer" value={escrow.buyerName} />
                <SummaryRow
                  label="Buyer Wallet"
                  value={escrow.buyerWallet}
                  valueClassName="font-mono text-blue-700"
                />
                <SummaryRow label="Seller" value={escrow.sellerName} />
                <SummaryRow label="Product / Service" value={escrow.productName} />
                <SummaryRow label="Amount" value={escrow.amount ? `${escrow.amount} USDC` : "—"} />
                <SummaryRow label="Network" value="Arc Testnet" />
                <SummaryRow label="Escrow ID" value={escrow.escrowId} />
              </div>
            </div>

            {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button onClick={handleRejectDeal} disabled={accepting} className="rounded-xl border border-slate-300 py-4 font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50">Reject Deal</button>
              <PrimaryButton onClick={handleAcceptDeal} disabled={accepting}>{accepting ? "Accepting Deal..." : "Accept Deal"}</PrimaryButton>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SummaryRow({ label, value, valueClassName = "" }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="text-slate-500">{label}</span>
      <strong className={`break-all text-right text-slate-900 ${valueClassName}`}>{value || "—"}</strong>
    </div>
  );
}
