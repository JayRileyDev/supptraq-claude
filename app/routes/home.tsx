import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
import { redirect } from "react-router";
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
  const title = "Supptraq - Inventory & Sales Insights for Franchise Operators";
  const description =
    "Supptraq helps franchise operators make smarter decisions about inventory, transfers, and sales performance without real-time connections.";
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
  const { userId, getToken } = await getAuth(args);

  // If user is signed in, check if they are store ops user and redirect appropriately
  if (userId) {
    const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
    
    // Set auth token for server-side queries
    const token = await getToken({ template: "convex" });
    if (token) {
      convex.setAuth(token);
    }

    try {
      // Get user to check if they are store ops
      const user = await convex.query(api.users.getCurrentUser);
      
      if (user?.isStoreOps) {
        throw redirect("/store-ops");
      } else {
        throw redirect("/dashboard");
      }
    } catch (error) {
      // If there's an error getting user info, default to dashboard
      throw redirect("/dashboard");
    }
  }

  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

  // Only fetch plans for non-signed-in users (for pricing display)
  const plans = await convex.action(api.subscriptions.getAvailablePlans);

  return {
    isSignedIn: false,
    hasActiveSubscription: false,
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
