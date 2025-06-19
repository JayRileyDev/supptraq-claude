import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
import { redirect } from "react-router";
import { useUser } from "@clerk/react-router";
import { EnhancedSidebar } from "~/components/dashboard/enhanced-sidebar";
import { EnhancedTopbar } from "~/components/dashboard/enhanced-topbar";
import { UnifiedSalesProvider } from "~/components/sales/UnifiedSalesProvider";
import { DashboardLoading } from "~/components/ui/loading";
import { api } from "../../../convex/_generated/api";
import { Outlet } from "react-router";
import { Suspense } from "react";

import { logger } from "~/lib/logger";

export async function loader(args: any) {
  logger.debug("Dashboard loader starting");
  const { userId, getToken } = await getAuth(args);
  logger.debug("UserId from auth", { hasUserId: !!userId });

  // Redirect to sign-in if not authenticated
  if (!userId) {
    logger.info("No userId, redirecting to sign-in");
    throw redirect("/sign-in");
  }

  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
  
  // Set auth token for server-side queries
  const token = await getToken({ template: "convex" });
  if (token) {
    convex.setAuth(token);
  }

  try {
    logger.debug("Checking if user exists in database");
    // Check if user exists in our database - use getCurrentUser like onboarding does
    const user = await convex.query(api.users.getCurrentUser);
    logger.debug("User from database", { hasUser: !!user, userId: user?._id });

    // If user doesn't exist in database, redirect to user not found page
    if (!user) {
      logger.warn("User doesn't exist in database, redirecting to user not found");
      throw redirect("/user-not-found");
    }

    // If this is a store ops user, redirect them to store ops portal
    if (user.isStoreOps) {
      logger.info("Store ops user detected, redirecting to store ops portal");
      throw redirect("/store-ops");
    }

    // Check if user account is properly set up by dev team (has org, franchise, role)
    logger.debug("Checking user account setup by dev team", {
      orgId: !!user.orgId,
      franchiseId: !!user.franchiseId,
      role: !!user.role
    });
    
    if (!user.orgId || !user.franchiseId || !user.role) {
      logger.warn("User account not fully configured by dev team, redirecting to user not found");
      throw redirect("/user-not-found");
    }

    logger.info("All checks passed, allowing dashboard access");
    // Return minimal data - user info available client-side
    return { success: true };
  } catch (error) {
    // Check if this is a Response object (redirect)
    if (error instanceof Response) {
      logger.debug("Redirect response detected, passing through");
      // This is a redirect response, let it pass through
      throw error;
    }
    
    // Handle auth token expiration or invalid state
    if (error instanceof Error && (
      error.message.includes('token') || 
      error.message.includes('auth') || 
      error.message.includes('Unauthorized')
    )) {
      logger.error("Authentication error, redirecting to sign-in", error);
      throw redirect("/sign-in");
    }
    
    // Only catch actual errors, not redirects
    logger.error("Dashboard loader error", error);
    throw redirect("/user-not-found");
  }
}

export default function DashboardLayout() {
  const { user, isLoaded } = useUser();

  // Show custom loading while user data loads
  if (!isLoaded) {
    return <DashboardLoading />;
  }

  return (
    <UnifiedSalesProvider>
      <div className="flex h-screen bg-background dark:bg-background">
        <EnhancedSidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <EnhancedTopbar />
          <main className="flex-1 overflow-y-auto bg-background">
            <Suspense fallback={<DashboardLoading />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </UnifiedSalesProvider>
  );
}
