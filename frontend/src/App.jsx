import { useState } from "react";

import Home from "./pages/Home";
import CreateEscrow from "./pages/CreateEscrow";
import GenerateLink from "./pages/GenerateLink";
import WaitingSeller from "./pages/WaitingSeller";
import SellerAccept from "./pages/SellerAccept";
import BuyerDeposit from "./pages/BuyerDeposit";
import EscrowActive from "./pages/EscrowActive";
import ReleaseFunds from "./pages/ReleaseFunds";
import Refund from "./pages/Refund";
import Dispute from "./pages/Dispute";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";

function App() {
  const [screen, setScreen] = useState("home");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white flex items-center justify-center px-6">

      {screen === "home" && (
        <Home setScreen={setScreen} />
      )}

      {screen === "create" && (
        <CreateEscrow setScreen={setScreen} />
      )}

      {screen === "link" && (
        <GenerateLink setScreen={setScreen} />
      )}

      {screen === "waiting" && (
        <WaitingSeller setScreen={setScreen} />
      )}

      {screen === "seller" && (
        <SellerAccept setScreen={setScreen} />
      )}

      {screen === "deposit" && (
        <BuyerDeposit setScreen={setScreen} />
      )}

      {screen === "active" && (
        <EscrowActive setScreen={setScreen} />
      )}

      {screen === "release" && (
        <ReleaseFunds setScreen={setScreen} />
      )}

      {screen === "refund" && (
        <Refund setScreen={setScreen} />
      )}

      {screen === "dispute" && (
        <Dispute setScreen={setScreen} />
      )}

      {screen === "history" && (
        <OrderHistory setScreen={setScreen} />
      )}

      {screen === "profile" && (
        <Profile setScreen={setScreen} />
      )}

    </main>
  );
}

export default App;