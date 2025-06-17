import { Navbar } from "~/components/homepage/navbar";
import Hero from "~/components/homepage/hero";
import ProblemSection from "~/components/homepage/problem-section";
import SolutionOverview from "~/components/homepage/solution-overview";
import FeaturesDeepDive from "~/components/homepage/features-deep-dive";
import AIIntelligence from "~/components/homepage/ai-intelligence";
import ResultsSection from "~/components/homepage/results-section";
import WorkflowSection from "~/components/homepage/workflow-section";
import TrustSecurity from "~/components/homepage/trust-security";
import PricingCTA from "~/components/homepage/pricing-cta";
import Footer from "~/components/homepage/footer";
// Homepage is public - no auth needed

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <ProblemSection />
      <SolutionOverview />
      <FeaturesDeepDive />
      <AIIntelligence />
      <ResultsSection />
      <WorkflowSection />
      <TrustSecurity />
      <PricingCTA />
      <Footer />
    </main>
  );
}