import { Routes, Route } from "react-router-dom";

import Landing from "../pages/landing/Landing";
import Home from "../pages/Home";

import CreateEscrow from "../pages/CreateEscrow";
import GenerateLink from "../pages/GenerateLink";
import WaitingSeller from "../pages/WaitingSeller";

import SellerLanding from "../pages/SellerLanding";
import SellerAccept from "../pages/SellerAccept";

import BuyerDeposit from "../pages/BuyerDeposit";
import EscrowActive from "../pages/EscrowActive";
import ReleaseFunds from "../pages/ReleaseFunds";
import Refund from "../pages/Refund";
import Dispute from "../pages/Dispute";
import OrderHistory from "../pages/OrderHistory";
import Profile from "../pages/Profile";

export default function AppRoutes() {
  return (
    <Routes>

      {/* Landing */}
      <Route path="/" element={<Landing />} />

      {/* Buyer */}
      <Route path="/dashboard" element={<Home />} />
      <Route path="/create" element={<CreateEscrow />} />
      <Route path="/generate-link" element={<GenerateLink />} />
      <Route path="/waiting" element={<WaitingSeller />} />
      <Route path="/deposit" element={<BuyerDeposit />} />
      <Route path="/active" element={<EscrowActive />} />
      <Route path="/release" element={<ReleaseFunds />} />
      <Route path="/refund" element={<Refund />} />
      <Route path="/dispute" element={<Dispute />} />

      {/* Seller */}
      <Route path="/seller-landing" element={<SellerLanding />} />
      <Route path="/seller" element={<SellerAccept />} />

      {/* Others */}
      <Route path="/history" element={<OrderHistory />} />
      <Route path="/profile" element={<Profile />} />

    </Routes>
  );
}