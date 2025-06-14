import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
import { redirect, useLoaderData } from "react-router";
import { EnhancedSidebar } from "~/components/dashboard/enhanced-sidebar";
import { EnhancedTopbar } from "~/components/dashboard/enhanced-topbar";
import { api } from "../../../convex/_generated/api";
import { createClerkClient } from "@clerk/react-router/api.server";
import { Outlet } from "react-router";

export async function loader(args: any) {
  const { userId } = await getAuth(args);

  // Redirect to sign-in if not authenticated
  if (!userId) {
    throw redirect("/sign-in");
  }

  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

  // Parallel data fetching to reduce waterfall
  const [subscriptionStatus, user] = await Promise.all([
    convex.query(api.subscriptions.checkUserSubscriptionStatus, { userId }),
    createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    }).users.getUser(userId)
  ]);

  // Redirect to subscription-required if no active subscription
  if (!subscriptionStatus?.hasActiveSubscription) {
    throw redirect("/subscription-required");
  }

  return { user };
}

export default function DashboardLayout() {
  const { user } = useLoaderData();

  return (
    <div className="flex h-screen bg-background dark:bg-background">
      <EnhancedSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <EnhancedTopbar />
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
