

import api from "../services/api";
import { circleSdk } from "../circle/circleConfig";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";
import { useState } from "react";

export default function OtpVerification() {

  const navigate = useNavigate();

  const [otp, setOtp] = useState("");

  const email = localStorage.getItem("proofpay-email");

  const otpResponse = JSON.parse(
    localStorage.getItem("proofpay-otp-response")
  );

  const [loading, setLoading] = useState(false);

  async function handleVerify() {

    setLoading(true);

    if (!otpResponse?.data) {
      alert("OTP session expired.");
      setLoading(false);
      return;
    }

    circleSdk.updateConfigs({
      appSettings: {
        appId: import.meta.env.VITE_CIRCLE_APP_ID,
        clientKey: import.meta.env.VITE_CIRCLE_CLIENT_KEY,
      },
      loginConfigs: {
        deviceToken: otpResponse.data.deviceToken,
        deviceEncryptionKey: otpResponse.data.deviceEncryptionKey,
        otpToken: otpResponse.data.otpToken,
      },
    });

    circleSdk.verifyOtp();

  }

  return (

    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="max-w-xl mx-auto py-20 px-6">

        <div className="rounded-3xl bg-white p-10 shadow">

          <h1 className="text-3xl font-bold">
            Verify Email
          </h1>

          <p className="mt-3 text-slate-600">
            Enter the 6-digit OTP sent to your email.
          </p>

          <p className="mt-2 text-blue-600 font-medium">
            {email}
          </p>



          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="mt-8 w-full rounded-xl border border-slate-300 p-4"
          />

          <div className="mt-8">

            <PrimaryButton
              onClick={handleVerify}
              disabled={loading}
            >

              {loading ? "Verifying..." : "Verify OTP"}

            </PrimaryButton>

          </div>

        </div>

      </main>

    </div>

  );

}