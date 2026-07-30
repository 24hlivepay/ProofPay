import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";
import { sendCircleToken } from "../services/circleTransactions";
import { getWalletSession } from "../services/wallet";
import api from "../services/api";

const ARC_EXPLORER_TX_URL = "https://testnet.arcscan.app/tx/";
const CIRCLE_FAUCET_URL = "https://faucet.circle.com/?allow=true";

export default function CircleWallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getWalletSession();
  const address = session?.walletType === "circle" ? session.address : "";
  const [view, setView] = useState(location.state?.view || "overview");
  const [assets, setAssets] = useState([]);
  const [activity, setActivity] = useState([]);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [copied, setCopied] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!address || !session?.walletId) return;

    try {
      setBalanceLoading(true);
      const auth = JSON.parse(
        sessionStorage.getItem("proofpay-circle-auth") || "null"
      );
      if (!auth?.userToken) {
        throw new Error("Circle session expired.");
      }
      const headers = { "X-User-Token": auth.userToken };
      const [balancesResult, activityResult] = await Promise.allSettled([
        api.get(`/circle/wallets/${session.walletId}/balances`, { headers }),
        api.get("/circle/transactions", {
          headers,
          params: { walletId: session.walletId },
        }),
      ]);
      if (balancesResult.status === "rejected") {
        throw balancesResult.reason;
      }
      const balancesResponse = balancesResult.value;
      const rawAssets =
        balancesResponse.data.data?.tokenBalances
          ?.filter((item) => item?.token?.id)
          .sort((left, right) => {
            if (left.token.symbol === "USDC") return -1;
            if (right.token.symbol === "USDC") return 1;
            return Number(right.amount || 0) - Number(left.amount || 0);
          }) || [];
      const assetMap = new Map();

      for (const asset of rawAssets) {
        // Arc exposes native USDC and its system-contract representation as
        // separate Circle token records backed by the same balance. Present
        // them as one asset and prefer the native record for transfers.
        const key =
          asset.token.symbol === "USDC"
            ? "arc-native-usdc"
            : asset.token.tokenAddress?.toLowerCase() || asset.token.id;
        const existing = assetMap.get(key);

        if (!existing || (!existing.token.isNative && asset.token.isNative)) {
          assetMap.set(key, asset);
        }
      }

      const nextAssets = [...assetMap.values()];
      setAssets(nextAssets);
      setActivity(
        activityResult.status === "fulfilled"
          ? activityResult.value.data.data?.transactions || []
          : []
      );
      const firstSendableAsset = nextAssets.find(
        (asset) =>
          !["ERC721", "ERC1155"].includes(asset.token.standard) &&
          Number(asset.amount || 0) > 0
      );
      setSelectedTokenId(
        (current) =>
          nextAssets.some((asset) => asset.token.id === current)
            ? current
            : firstSendableAsset?.token?.id || ""
      );
      setError("");
    } catch {
      setError("The Arc Testnet wallet data is temporarily unavailable.");
    } finally {
      setBalanceLoading(false);
    }
  }, [address, session?.walletId]);

  useEffect(() => {
    const timeout = window.setTimeout(loadBalance, 0);
    return () => window.clearTimeout(timeout);
  }, [loadBalance]);

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function openView(nextView) {
    setView(nextView);
    setError("");
    setStatus("");
    setTransactionHash("");
  }

  async function handleSend(event) {
    event.preventDefault();
    const normalizedRecipient = recipient.trim();
    const normalizedAmount = amount.trim();
    const selectedAsset = assets.find(
      (asset) => asset.token.id === selectedTokenId
    );

    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedRecipient)) {
      setError("Enter a valid Arc wallet address.");
      return;
    }
    const decimalPlaces = Math.max(
      1,
      Math.min(Number(selectedAsset?.token?.decimals || 18), 18)
    );
    const amountPattern = new RegExp(`^\\d+(\\.\\d{1,${decimalPlaces}})?$`);
    if (
      !selectedAsset ||
      !amountPattern.test(normalizedAmount) ||
      Number(normalizedAmount) <= 0
    ) {
      setError(`Enter a valid ${selectedAsset?.token?.symbol || "token"} amount.`);
      return;
    }
    if (Number(normalizedAmount) > Number(selectedAsset.amount || 0)) {
      setError(`Your ${selectedAsset.token.symbol} balance is too low.`);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setTransactionHash("");
      setStatus("Approve this transfer in Circle’s secure window.");
      const transaction = await sendCircleToken({
        destinationAddress: normalizedRecipient,
        amount: normalizedAmount,
        tokenId: selectedAsset.token.id,
        onSubmitted: () => {
          setStatus("Transfer approved. Waiting for Arc confirmation...");
        },
      });
      setTransactionHash(transaction.hash);
      setStatus(
        `${normalizedAmount} ${selectedAsset.token.symbol} sent successfully.`
      );
      setAmount("");
      setRecipient("");
      await loadBalance();
    } catch (sendError) {
      setStatus("");
      setError(
        sendError.response?.data?.message ||
          sendError.message ||
          "The USDC transfer could not be completed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAsset = assets.find(
    (asset) => asset.token.id === selectedTokenId
  );
  const sendableAssets = assets.filter(
    (asset) =>
      !["ERC721", "ERC1155"].includes(asset.token.standard) &&
      Number(asset.amount || 0) > 0
  );
  if (!address) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="mx-auto max-w-xl px-5 py-12 text-center">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold">Circle wallet required</h1>
            <p className="mt-3 text-slate-600">
              Sign in with email to open your user-controlled wallet.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              Sign in with Circle
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to dashboard
        </button>

        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-4 text-white shadow-md sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 break-all rounded-lg bg-black/10 px-3 py-2 font-mono text-xs text-blue-50">
              {address}
            </p>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
              Arc Testnet
            </span>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <button
              onClick={() => openView("overview")}
              className="rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 font-bold text-white hover:bg-white/20"
            >
              ◫ Assets
            </button>
            <button
              onClick={() => openView("receive")}
              className="rounded-xl bg-white px-4 py-2.5 font-bold text-blue-700 hover:bg-blue-50"
            >
              ↓ Deposit / Receive
            </button>
            <button
              onClick={() => openView("send")}
              className="rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 font-bold text-white hover:bg-white/20"
            >
              ↑ Send Token
            </button>
          </div>
        </section>

        {status && (
          <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
            {status}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {transactionHash && (
          <a
            href={`${ARC_EXPLORER_TX_URL}${transactionHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block font-semibold text-blue-600 hover:text-blue-700"
          >
            View confirmed transaction ↗
          </a>
        )}

        {view === "receive" && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Deposit / Receive Tokens
            </h2>
            <p className="mt-2 leading-6 text-slate-600">
              Send only Arc Testnet assets to this address. Tokens from another
              network can be permanently lost. Test tokens have no financial value.
            </p>
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Your deposit address
              </p>
              <p className="mt-3 break-all font-mono text-sm text-slate-900">
                {address}
              </p>
              <button
                onClick={copyAddress}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {copied ? "Address copied" : "Copy address"}
              </button>
            </div>
            <a
              href={CIRCLE_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-xl border border-blue-200 px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50"
            >
              Get 20 test USDC from Circle Faucet ↗
            </a>
          </section>
        )}

        {view === "overview" && (
          <>
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Assets</h2>
                <button
                  onClick={loadBalance}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Refresh
                </button>
              </div>
              <div className="mt-5 divide-y divide-slate-100">
                {!balanceLoading && assets.length === 0 && (
                  <p className="py-6 text-center text-slate-500">
                    No Arc Testnet assets detected yet.
                  </p>
                )}
                {assets.map((asset) => (
                  <div key={asset.token.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                        {(asset.token.symbol || "?").slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">
                          {asset.token.symbol || "Unknown token"}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {asset.token.name || asset.token.tokenAddress || "Arc asset"}
                        </p>
                      </div>
                    </div>
                    <p className="text-right font-bold text-slate-900">
                      {Number(asset.amount || 0).toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900">Recent activity</h2>
              <div className="mt-5 divide-y divide-slate-100">
                {activity.length === 0 && (
                  <p className="py-6 text-center text-slate-500">
                    No wallet transactions yet.
                  </p>
                )}
                {activity.slice(0, 10).map((transaction) => (
                  (() => {
                    const activityAsset = assets.find(
                      (asset) => asset.token.id === transaction.tokenId
                    );
                    return (
                  <a
                    key={transaction.id}
                    href={transaction.txHash ? `${ARC_EXPLORER_TX_URL}${transaction.txHash}` : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-4 py-4 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {transaction.transactionType === "INBOUND"
                          ? "Received"
                          : transaction.operation === "CONTRACT_EXECUTION"
                            ? "Contract interaction"
                            : "Sent"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.createDate
                          ? new Date(transaction.createDate).toLocaleString()
                          : "Arc Testnet"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {transaction.amounts?.[0] || "—"} {transaction.token?.symbol || activityAsset?.token?.symbol || ""}
                      </p>
                      <p className="mt-1 text-xs font-bold text-blue-600">
                        {transaction.state}
                      </p>
                    </div>
                  </a>
                    );
                  })()
                ))}
              </div>
            </section>
          </>
        )}

        {view === "send" && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">Send Token</h2>
            <p className="mt-2 text-slate-600">
              The transfer will execute only after your Circle approval.
            </p>
            <form onSubmit={handleSend} className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Asset
                </span>
                <select
                  value={selectedTokenId}
                  onChange={(event) => setSelectedTokenId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  {sendableAssets.map((asset) => (
                    <option key={asset.token.id} value={asset.token.id}>
                      {asset.token.symbol || asset.token.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Recipient address
                </span>
                <input
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder="0x..."
                  autoComplete="off"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Amount
                </span>
                <div className="relative mt-2">
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-4 top-3 font-semibold text-slate-500">
                    {selectedAsset?.token?.symbol || "TOKEN"}
                  </span>
                </div>
              </label>
              <PrimaryButton
                type="submit"
                disabled={submitting || balanceLoading}
              >
                {submitting ? "Processing transfer…" : "Review & Send"}
              </PrimaryButton>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
