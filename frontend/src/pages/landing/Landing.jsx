import Navbar from "../../components/Navbar";

import Hero from "./Hero";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import FAQ from "./FAQ";
import Footer from "./Footer";

export default function Landing() {
  return (
    <main className="min-h-screen bg-white">

      <Navbar />

      <Hero />

      <Features />

      <HowItWorks />

      <FAQ />

      <Footer />

    </main>
  );
}