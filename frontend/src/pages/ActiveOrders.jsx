import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useEscrow } from "../context/EscrowContext";
import api from "../services/api";
import { getConnectedWallet } from "../services/wallet";
import { releaseFundsOnChain } from "../services/proofpayContract";

export default function ActiveOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setEscrowData } = useEscrow();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [releasingId, setReleasingId] = useState("");
  const [releaseMessage, setReleaseMessage] = useState("");
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

  async function releaseOrderFunds(order) {
    try {
      setReleasingId(order.escrowId);
      setError("");
      setReleaseMessage("Confirm the release transaction in your wallet.");

      const transactionHash = await releaseFundsOnChain(order.escrowId, () => {
        setReleaseMessage("Transaction submitted. Waiting for confirmation...");
      });

      await api.post(`/escrow/${order.escrowId}/release`, {
        transactionHash,
      });

      setReleaseMessage(
        `${order.escrowId}: funds released successfully. The order is now completed.`
      );
      await loadOrders();
    } catch (releaseError) {
      setReleaseMessage("");
      setError(releaseError.message || "Unable to release USDC.");
    } finally {
      setReleasingId("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{isSellerRole ? "Active Sales" : "Active Purchases"}</h1>
            <p className="mt-2 text-slate-600">{isSellerRole ? "Confirm delivery after the buyer has locked USDC." : "Track locked funds and release payment after delivery."}</p>
          </div>
          <button onClick={() => navigate(isSellerRole ? "/dashboard/selling" : "/dashboard/buying")} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">← {isSellerRole ? "Selling Escrows" : "Buying Escrows"}</button>
        </div>

        {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {releaseMessage && (
          <p className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-800">
            {releaseMessage}
          </p>
        )}

        <div className="mt-8 space-y-5">
          {!loading && orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="text-4xl">📦</div>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">No active {isSellerRole ? "sales" : "purchases"}</h2>
              <p className="mt-2 text-slate-600">Live escrow records will appear here after USDC is locked.</p>
            </div>
          )}

          {orders.map((order) => {
            const deliveryConfirmed = order.status === "Delivered";
            const buyerMustRelease = deliveryConfirmed && !isSellerRole;

            return (
            <article
              key={order.escrowId}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                deliveryConfirmed ? "border-green-300" : "border-yellow-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{order.escrowId}</h2>
                  <p className="mt-2 text-slate-600">{order.productName || "Escrow transaction"}</p>
                </div>
                <span className={`rounded-full px-4 py-2 text-sm font-bold ${
                  deliveryConfirmed
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {deliveryConfirmed ? "✓ Delivery Confirmed" : order.status}
                </span>
              </div>

              {deliveryConfirmed && (
                <div className={`mt-6 rounded-2xl border p-5 ${
                  buyerMustRelease
                    ? "border-green-300 bg-green-50"
                    : "border-blue-200 bg-blue-50"
                }`}>
                  <p className={`text-lg font-bold ${
                    buyerMustRelease ? "text-green-800" : "text-blue-800"
                  }`}>
                    {buyerMustRelease
                      ? "📦 Seller confirmed delivery — release funds now"
                      : "📦 Delivery confirmed — waiting for buyer to release funds"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {buyerMustRelease
                      ? "Open this escrow, review the delivery, and release the USDC payment to the seller."
                      : "The buyer has been notified that the delivery is complete."}
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail label={isSellerRole ? "Buyer" : "Seller"} value={isSellerRole ? order.buyerName : order.sellerName} />
                <Detail label="Amount" value={`${order.amount} USDC`} />
                <Detail label="Created" value={formatDate(order.createdAt)} />
                <Detail
                  label="Next step"
                  value={
                    isSellerRole
                      ? deliveryConfirmed
                        ? "Wait for buyer to release funds"
                        : "Confirm delivery"
                      : deliveryConfirmed
                        ? "Release funds now"
                        : "Wait for delivery"
                  }
                />
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
              <button
                onClick={() => buyerMustRelease
                  ? releaseOrderFunds(order)
                  : openOrder(order)
                }
                disabled={releasingId === order.escrowId}
                className={`mt-7 w-full rounded-xl py-3 font-semibold text-white ${
                  buyerMustRelease
                    ? "bg-green-600 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {releasingId === order.escrowId
                  ? "Releasing Funds..."
                  : buyerMustRelease
                  ? "Release Funds Now"
                  : isSellerRole
                    ? "Manage Sale"
                    : "Open Escrow"}
              </button>
            </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 break-all font-semibold text-slate-900">{value || "—"}</p></div>;
}

function formatDate(timestamp) {
  if (!timestamp) return "—";

  return new Date(timestamp).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
