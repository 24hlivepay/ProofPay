import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PrimaryButton from "../components/PrimaryButton";
import api from "../services/api";

export default function Login() {

  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  async function handleContinue() {
    try {

      localStorage.setItem("proofpay-email", email);
      const response = await api.post("/circle/request-email-otp", {
        email,
      });

      console.log(response.data);

      localStorage.setItem(
        "proofpay-otp-response",
        JSON.stringify(response.data)
      );

      navigate("/otp");

      alert("OTP sent successfully.");
    } catch (error) {
      console.log(error);
      alert("Failed to send OTP.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">

      <Navbar />

      <main className="mx-auto max-w-md px-5 py-12 sm:px-6">

        <div className="rounded-2xl bg-white p-6 shadow sm:p-8">

          <h1 className="text-3xl font-bold">
            Continue with Email
          </h1>

          <p className="mt-3 text-slate-600">
            Enter your email to receive a one-time verification code.
          </p>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-8 w-full rounded-xl border border-slate-300 p-4"
          />

          <div className="mt-8">
            <PrimaryButton onClick={handleContinue}>
              Send OTP
            </PrimaryButton>
          </div>

        </div>

      </main>

    </div>
  );
}
