import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api, { API_BASE_URL } from "../services/api";
import { getConnectedWallet } from "../services/wallet";
import { resolveDisputeOnChain } from "../services/proofpayContract";

export default function AdminDisputes() {
  const [cases, setCases] = useState([]); const [error, setError] = useState(""); const [busy, setBusy] = useState("");
  const wallet = getConnectedWallet();
  const load = () => api.get("/admin/disputes", { params: { wallet } }).then((r) => setCases(r.data.disputes)).catch((e) => setError(e.response?.data?.message || "Unable to load cases."));
  useEffect(() => { load(); }, []);
  async function resolve(escrow, buyerAmount, note) {
    if (!note.trim()) return setError("Write a resolution note before deciding — both sides will see it.");
    try { setBusy(escrow.escrowId); setError("");
      const transactionHash = await resolveDisputeOnChain(escrow.escrowId, buyerAmount, escrow.assetSymbol);
      await api.post(`/admin/disputes/${escrow.escrowId}/resolved`, { wallet, buyerAmount, transactionHash, note });
      load();
    } catch (e) { setError(e.response?.data?.message || e.message || "Resolution failed."); } finally { setBusy(""); }
  }
  return <div className="min-h-screen bg-slate-100"><Navbar /><main className="mx-auto max-w-5xl px-5 py-8"><h1 className="text-3xl font-bold text-slate-900">ProofPay dispute administration</h1><p className="mt-2 text-slate-600">Funds are held by the contract. Your resolution transaction sends them directly to the buyer and/or seller.</p>{error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}<div className="mt-8 space-y-6">{cases.length === 0 && <p className="rounded-2xl bg-white p-8 text-slate-600">No active disputes.</p>}{cases.map((escrow) => <Case key={escrow.escrowId} escrow={escrow} wallet={wallet} busy={busy === escrow.escrowId} resolve={resolve} />)}</div></main></div>;
}

function Case({ escrow, wallet, busy, resolve }) {
  const dispute = escrow.dispute; const evidence = [...(dispute.evidence || []), ...(dispute.responses || []).flatMap((response) => response.evidence || [])];
  const [amount, setAmount] = useState(String(escrow.amount));
  const [note, setNote] = useState("");
  return <article className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-2xl font-bold">{escrow.escrowId}</h2><p className="text-slate-600">{escrow.amount} {escrow.assetSymbol} · {dispute.status}</p></div><span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">{dispute.reason}</span></div><div className="mt-5 grid gap-4 md:grid-cols-2"><section><h3 className="font-bold">{dispute.openedBySide} claim</h3><p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">{dispute.statement}</p></section>{(dispute.responses || []).map((response, index) => <section key={index}><h3 className="font-bold">{response.side} response</h3><p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">{response.statement}</p></section>)}</div><h3 className="mt-5 font-bold">Private evidence</h3><ul className="mt-2 text-sm">{evidence.map((file) => <li key={file.id}><a className="text-blue-700 underline" target="_blank" rel="noreferrer" href={`${API_BASE_URL}/escrow/${escrow.escrowId}/dispute/evidence/${file.id}?wallet=${encodeURIComponent(wallet)}`}>{file.side}: {file.name}</a></li>)}</ul><div className="mt-6 rounded-xl border border-slate-200 p-4"><label className="block text-sm font-bold">Resolution note <span className="font-normal text-slate-500">(buyer and seller will both see this)</span><textarea required value={note} onChange={(e) => setNote(e.target.value)} rows="3" className="mt-2 w-full rounded-lg border p-2 font-normal" placeholder="Explain the decision and what happens next." /></label><label className="mt-4 block text-sm font-bold">Buyer refund amount ({escrow.assetSymbol})<input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" max={escrow.amount} step="any" className="mt-2 w-full rounded-lg border p-2" /></label><div className="mt-3 grid gap-3 sm:grid-cols-3"><button disabled={busy} onClick={() => resolve(escrow, escrow.amount, note)} className="rounded-lg bg-blue-600 p-3 font-semibold text-white disabled:opacity-50">Refund buyer</button><button disabled={busy} onClick={() => resolve(escrow, 0, note)} className="rounded-lg bg-green-600 p-3 font-semibold text-white disabled:opacity-50">Pay seller</button><button disabled={busy} onClick={() => resolve(escrow, amount, note)} className="rounded-lg bg-amber-500 p-3 font-semibold text-white disabled:opacity-50">{busy ? "Resolving..." : "Split funds"}</button></div></div></article>;
}
