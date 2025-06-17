import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
import { redirect } from "react-router";
import { useUser } from "@clerk/react-router";
import { EnhancedSidebar } from "~/components/dashboard/enhanced-sidebar";
import { EnhancedTopbar } from "~/components/dashboard/enhanced-topbar";
import { UnifiedSalesProvider } from "~/components/sales/UnifiedSalesProvider";
import { api } from "../../../convex/_generated/api";
import { Outlet } from "react-router";

export async function loader(args: any) {
  const { userId } = await getAuth(args);

  // Redirect to sign-in if not authenticated
  if (!userId) {
    throw redirect("/sign-in");
  }

  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

  // Only check subscription status - skip expensive Clerk user fetch
  // User data is already available client-side via useUser()
  const subscriptionStatus = await convex.query(api.subscriptions.checkUserSubscriptionStatus, { userId });

  // Redirect to subscription-required if no active subscription
  if (!subscriptionStatus?.hasActiveSubscription) {
    throw redirect("/subscription-required");
  }

  // Return minimal data - user info available client-side
  return { hasSubscription: true };
}

export default function DashboardLayout() {
  const { user } = useUser();

  return (
    <UnifiedSalesProvider>
      <div className="flex h-screen bg-background dark:bg-background">
        <EnhancedSidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <EnhancedTopbar />
          <main className="flex-1 overflow-y-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </UnifiedSalesProvider>
  );
}
