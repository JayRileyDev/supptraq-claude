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
  console.log("🏁 Dashboard loader starting...");
  const { userId, getToken } = await getAuth(args);
  console.log("🔑 UserId from auth:", userId);

  // Redirect to sign-in if not authenticated
  if (!userId) {
    console.log("❌ No userId, redirecting to sign-in");
    throw redirect("/sign-in");
  }

  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
  
  // Set auth token for server-side queries
  const token = await getToken({ template: "convex" });
  if (token) {
    convex.setAuth(token);
  }

  try {
    console.log("🔍 Checking if user exists in database...");
    // Check if user exists in our database - use getCurrentUser like onboarding does
    const user = await convex.query(api.users.getCurrentUser);
    console.log("👤 User from database:", user);

    // If user doesn't exist, redirect to onboarding to create user
    if (!user) {
      console.log("❌ User doesn't exist, redirecting to onboarding");
      throw redirect("/onboarding");
    }

    // Check if user setup is complete (has org, franchise, role)
    console.log("🔍 Checking user setup completeness:", {
      orgId: !!user.orgId,
      franchiseId: !!user.franchiseId,
      role: !!user.role
    });
    
    if (!user.orgId || !user.franchiseId || !user.role) {
      console.log("❌ User setup incomplete, redirecting to onboarding");
      throw redirect("/onboarding");
    }

    console.log("🔍 Checking subscription status...");
    // Check subscription status
    const subscriptionStatus = await convex.query(api.subscriptions.checkUserSubscriptionStatus, { userId });
    console.log("💳 Subscription status:", subscriptionStatus);

    // Redirect to subscription-required if no active subscription
    if (!subscriptionStatus?.hasActiveSubscription) {
      console.log("❌ No active subscription, redirecting to subscription-required");
      throw redirect("/subscription-required");
    }

    console.log("✅ All checks passed, allowing dashboard access");
    // Return minimal data - user info available client-side
    return { hasSubscription: true };
  } catch (error) {
    // Check if this is a Response object (redirect)
    if (error instanceof Response) {
      console.log("🔄 Redirect response detected, passing through");
      // This is a redirect response, let it pass through
      throw error;
    }
    
    // Only catch actual errors, not redirects
    console.error("❌ Dashboard loader error:", error);
    throw redirect("/onboarding");
  }
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
