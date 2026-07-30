import OtpVerification from "../pages/OtpVerification";
import Login from "../pages/Login";
import ActiveOrders from "../pages/ActiveOrders";
import { Routes, Route } from "react-router-dom";
import Landing from "../pages/landing/Landing";
import Home from "../pages/Home";

import CreateEscrow from "../pages/CreateEscrow";
import GenerateLink from "../pages/GenerateLink";
import WaitingSeller from "../pages/WaitingSeller";

import SellerLanding from "../pages/SellerLanding";
import SellerAccept from "../pages/SellerAccept";
import SellerVerification from "../pages/SellerVerification";

import BuyerDeposit from "../pages/BuyerDeposit";
import EscrowActive from "../pages/EscrowActive";
import ReleaseFunds from "../pages/ReleaseFunds";
import Refund from "../pages/Refund";
import Dispute from "../pages/Dispute";
import OrderHistory from "../pages/OrderHistory";
import Profile from "../pages/Profile";
import PendingOrders from "../pages/PendingOrders";
import CompletedOrders from "../pages/CompletedOrders";
import CancelledOrders from "../pages/CancelledOrders";
import CircleWallet from "../pages/CircleWallet";

export default function AppRoutes() {
  return (
    <Routes>

      {/* Landing */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/otp" element={<OtpVerification />} />

      {/* Buyer */}
      <Route path="/dashboard" element={<Home />} />
      <Route path="/dashboard/buying" element={<Home />} />
      <Route path="/dashboard/selling" element={<Home />} />
      <Route path="/wallet" element={<CircleWallet />} />
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
      <Route path="/escrow/:id" element={<SellerAccept />} />
      <Route
        path="/seller-verification/:id"
        element={<SellerVerification />} />

      <Route path="/active-orders" element={<ActiveOrders />} />
      <Route path="/pending-orders" element={<PendingOrders />} />
      <Route path="/completed-orders" element={<CompletedOrders />} />
      <Route path="/cancelled-orders" element={<CancelledOrders />} />

      {/* Others */}
      <Route path="/history" element={<OrderHistory />} />
      <Route path="/profile" element={<Profile />} />

    </Routes>
  );
}
