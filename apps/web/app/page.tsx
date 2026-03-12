import { TopBar } from "@/components/home/top-bar";
import { HeroSection } from "@/components/home/hero-section";
import { ProtocolStats } from "@/components/home/protocol-stats";
import { LiquidityWave } from "@/components/home/liquidity-wave";
import { FeaturesSection } from "@/components/home/features-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { SecuritySection } from "@/components/home/security-section";
import { CTASection } from "@/components/home/cta-section";
import { Footer } from "@/components/home/footer";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main>
        <HeroSection />
        <ProtocolStats />
        <LiquidityWave />
        <FeaturesSection />
        <HowItWorks />
        <SecuritySection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
