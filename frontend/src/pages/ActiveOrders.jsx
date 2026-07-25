import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useEscrow } from "../context/EscrowContext";
import api from "../services/api";
import { getConnectedWallet } from "../services/wallet";

export default function ActiveOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setEscrowData } = useEscrow();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const role = location.state?.role === "seller" ? "seller" : "buyer";
  const isSellerRole = role === "seller";

  const loadOrders = useCallback(async () => {
    try {
      setError("");
      const response = await api.get("/escrows", {
        params: { category: "active", wallet: getConnectedWallet(), role },
      });
      setOrders(response.data.escrows || []);
    } catch {
      setError("Unable to load active orders.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function openOrder(order) {
    setEscrowData(order);

    if (isSellerRole) {
      navigate(`/seller-verification/${order.escrowId}`);
      return;
    }

    navigate("/active", { state: { backTo: "/active-orders" } });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">{isSellerRole ? "Active Sales" : "Active Purchases"}</h1>
            <p className="mt-2 text-slate-600">{isSellerRole ? "Confirm delivery after the buyer has locked USDC." : "Track locked funds and release payment after delivery."}</p>
          </div>
          <button onClick={() => navigate(isSellerRole ? "/dashboard/selling" : "/dashboard/buying")} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">← {isSellerRole ? "Selling Escrows" : "Buying Escrows"}</button>
        </div>

        {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}

        <div className="mt-8 space-y-5">
          {!loading && orders.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="text-5xl">📦</div>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">No active {isSellerRole ? "sales" : "purchases"}</h2>
              <p className="mt-2 text-slate-600">Live escrow records will appear here after USDC is locked.</p>
            </div>
          )}

          {orders.map((order) => (
            <article key={order.escrowId} className="rounded-3xl border border-yellow-200 bg-white p-7 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{order.escrowId}</h2>
                  <p className="mt-2 text-slate-600">{order.productName || "Escrow transaction"}</p>
                </div>
                <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-700">{order.status}</span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Detail label={isSellerRole ? "Buyer" : "Seller"} value={isSellerRole ? order.buyerName : order.sellerName} />
                <Detail label="Amount" value={`${order.amount} USDC`} />
                <Detail label="Next step" value={isSellerRole ? "Confirm delivery" : order.status === "Delivered" ? "Release funds" : "Wait for delivery"} />
              </div>
              {order.depositTransactionHash && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div>
                    <p className="font-bold text-green-800">✓ USDC deposit successful</p>
                    <p className="mt-1 text-sm text-green-700">Funds are locked in the Arc Testnet escrow contract.</p>
                  </div>
                  <a href={`https://testnet.arcscan.app/tx/${order.depositTransactionHash}`} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50">
                    View on Arcscan ↗
                  </a>
                </div>
              )}
              <button onClick={() => openOrder(order)} className="mt-7 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
                {isSellerRole ? "Manage Sale" : "Open Escrow"}
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 break-all font-semibold text-slate-900">{value || "—"}</p></div>;
}
