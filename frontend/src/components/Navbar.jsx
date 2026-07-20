export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b">

      <div className="max-w-7xl mx-auto flex justify-between items-center p-6">

        <h1 className="text-2xl font-bold text-blue-600">
          ProofPay
        </h1>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl">
          Connect Wallet
        </button>

      </div>

    </nav>
  )
}