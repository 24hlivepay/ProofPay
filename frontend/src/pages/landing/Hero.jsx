export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">

      <div className="grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Side */}

        <div>

          <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            🚀 Powered by ARC Blockchain
          </span>

          <h1 className="mt-8 text-5xl md:text-6xl font-extrabold leading-tight text-slate-900">
            Secure P2P
            <br />
            Crypto Escrow
          </h1>

          <p className="mt-8 text-xl leading-9 text-slate-600">
            Trade with confidence using blockchain-powered escrow.
            Funds remain protected inside smart contracts until
            both buyer and seller complete the transaction.
          </p>

        </div>

        {/* Right Side */}

        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">

          <h2 className="text-2xl font-bold text-slate-900">
            Escrow Preview
          </h2>

          <div className="mt-8 space-y-5">

            <div className="flex justify-between">
              <span className="text-slate-500">Network</span>
              <span className="font-semibold">ARC</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Currency</span>
              <span className="font-semibold">USDC</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Security</span>
              <span className="font-semibold text-green-600">
                Smart Contract
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-semibold text-blue-600">
                Ready
              </span>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}