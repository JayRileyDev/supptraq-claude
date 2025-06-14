import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
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
import { api } from "../../convex/_generated/api";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  const title = "SuppTraq - Inventory & Sales Insights for Franchise Operators";
  const description =
    "SuppTraq helps franchise operators make smarter decisions about inventory, transfers, and sales performance without real-time connections.";
  const keywords = "Franchise, Inventory Management, Sales Analytics, Supplement King, Retail Operations";
  const siteUrl = "https://www.reactstarter.xyz/";
  const imageUrl =
    "https://jdj14ctwppwprnqu.public.blob.vercel-storage.com/rsk-image-FcUcfBMBgsjNLo99j3NhKV64GT2bQl.png";

  return [
    { title },
    {
      name: "description",
      content: description,
    },

    // Open Graph / Facebook
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:url", content: siteUrl },
    { property: "og:site_name", content: "React Starter Kit" },
    { property: "og:image", content: imageUrl },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    {
      name: "twitter:description",
      content: description,
    },
    { name: "twitter:image", content: imageUrl },
    {
      name: "keywords",
      content: keywords,
    },
    { name: "author", content: "Ras Mic" },
    { name: "favicon", content: imageUrl },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

  // Parallel data fetching to reduce waterfall
  const [subscriptionData, plans] = await Promise.all([
    userId
      ? convex.query(api.subscriptions.checkUserSubscriptionStatus, {
          userId,
        }).catch((error) => {
          console.error("Failed to fetch subscription data:", error);
          return null;
        })
      : Promise.resolve(null),
    convex.action(api.subscriptions.getAvailablePlans),
  ]);

  return {
    isSignedIn: !!userId,
    hasActiveSubscription: subscriptionData?.hasActiveSubscription || false,
    plans,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
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
