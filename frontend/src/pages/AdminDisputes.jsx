import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api, { API_BASE_URL } from "../services/api";
import { getConnectedWallet } from "../services/wallet";
import { resolveDisputeOnChain } from "../services/proofpayContract";

export default function AdminDisputes() {
  const [cases, setCases] = useState([]); const [resolved, setResolved] = useState([]); const [error, setError] = useState(""); const [busy, setBusy] = useState("");
  const wallet = getConnectedWallet();
  const load = () => api.get("/admin/disputes", { params: { wallet } })
    .then((r) => { setCases(r.data.disputes); setResolved(r.data.resolved || []); })
    .catch((e) => setError(e.response?.data?.message || "Unable to load cases."));
  useEffect(() => { load(); }, []);
  async function resolve(escrow, buyerAmount, note) {
    if (!note.trim()) return setError("Write a resolution note before deciding — both sides will see it.");
    try { setBusy(escrow.escrowId); setError("");
      const transactionHash = await resolveDisputeOnChain(escrow.escrowId, buyerAmount, escrow.assetSymbol);
      await api.post(`/admin/disputes/${escrow.escrowId}/resolved`, { wallet, buyerAmount, transactionHash, note });
      load();
    } catch (e) { setError(e.response?.data?.message || e.message || "Resolution failed."); } finally { setBusy(""); }
  }
  return <div className="min-h-screen bg-slate-100"><Navbar /><main className="mx-auto max-w-5xl px-5 py-8"><h1 className="text-3xl font-bold text-slate-900">ProofPay dispute administration</h1><p className="mt-2 text-slate-600">Funds are held by the contract. Your resolution transaction sends them directly to the buyer and/or seller.</p>{error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}<div className="mt-8 space-y-6">{cases.length === 0 && <p className="rounded-2xl bg-white p-8 text-slate-600">No active disputes.</p>}{cases.map((escrow) => <Case key={escrow.escrowId} escrow={escrow} wallet={wallet} busy={busy === escrow.escrowId} resolve={resolve} />)}</div>{resolved.length > 0 && <div className="mt-12"><h2 className="text-2xl font-bold text-slate-900">Resolved disputes</h2><p className="mt-1 text-slate-600">Your own record of past decisions.</p><div className="mt-4 space-y-4">{resolved.map((escrow) => <ResolvedCase key={escrow.escrowId} escrow={escrow} />)}</div></div>}</main></div>;
}

function ResolvedCase({ escrow }) {
  const dispute = escrow.dispute; const resolution = dispute.resolution;
  return <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">{escrow.escrowId}</h2><p className="text-slate-600">{escrow.amount} {escrow.assetSymbol} · {dispute.reason}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">Resolved {formatDate(resolution.resolvedAt)}</span></div><p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">{resolution.note}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><p className="font-semibold text-slate-800">{resolution.buyerAmount} to buyer · {resolution.sellerAmount} to seller</p><a className="text-blue-700 underline" target="_blank" rel="noreferrer" href={`https://testnet.arcscan.app/tx/${resolution.transactionHash}`}>View settlement ↗</a></div></article>;
}

function formatDate(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function Case({ escrow, wallet, busy, resolve }) {
  const dispute = escrow.dispute; const evidence = [...(dispute.evidence || []), ...(dispute.responses || []).flatMap((response) => response.evidence || [])];
  const [amount, setAmount] = useState(String(escrow.amount));
  const [note, setNote] = useState("");
  const buyerAmount = Math.min(Math.max(Number(amount) || 0, 0), Number(escrow.amount));
  const sellerAmount = Number(escrow.amount) - buyerAmount;
  return <article className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-2xl font-bold">{escrow.escrowId}</h2><p className="text-slate-600">{escrow.amount} {escrow.assetSymbol} · {dispute.status}</p></div><span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">{dispute.reason}</span></div><div className="mt-5 grid gap-4 md:grid-cols-2"><section><h3 className="font-bold">{dispute.openedBySide} claim</h3><p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">{dispute.statement}</p></section>{(dispute.responses || []).map((response, index) => <section key={index}><h3 className="font-bold">{response.side} response</h3><p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">{response.statement}</p></section>)}</div><h3 className="mt-5 font-bold">Private evidence</h3><ul className="mt-2 text-sm">{evidence.map((file) => <li key={file.id}><a className="text-blue-700 underline" target="_blank" rel="noreferrer" href={`${API_BASE_URL}/escrow/${escrow.escrowId}/dispute/evidence/${file.id}?wallet=${encodeURIComponent(wallet)}`}>{file.side}: {file.name}</a></li>)}</ul><div className="mt-6 rounded-xl border border-slate-200 p-4"><label className="block text-sm font-bold">Resolution note <span className="font-normal text-slate-500">(buyer and seller will both see this)</span><textarea required value={note} onChange={(e) => setNote(e.target.value)} rows="3" className="mt-2 w-full rounded-lg border p-2 font-normal" placeholder="Explain the decision and what happens next." /></label><label className="mt-4 block text-sm font-bold">Buyer refund amount ({escrow.assetSymbol})<input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" max={escrow.amount} step="any" className="mt-2 w-full rounded-lg border p-2" /></label><div className="mt-3 grid gap-3 sm:grid-cols-2"><button type="button" disabled={busy} onClick={() => setAmount(String(escrow.amount))} className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">Set: full refund to buyer</button><button type="button" disabled={busy} onClick={() => setAmount("0")} className="rounded-lg border border-green-200 bg-green-50 p-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50">Set: full payment to seller</button></div><p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-800">This sends {buyerAmount} {escrow.assetSymbol} to buyer and {sellerAmount} {escrow.assetSymbol} to seller.</p><button disabled={busy} onClick={() => resolve(escrow, amount, note)} className="mt-3 w-full rounded-lg bg-red-600 p-3 font-semibold text-white disabled:opacity-50">{busy ? "Resolving..." : `Confirm — send ${buyerAmount} to buyer, ${sellerAmount} to seller`}</button></div></article>;
}
