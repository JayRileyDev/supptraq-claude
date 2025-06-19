import { getAuth } from "@clerk/react-router/ssr.server";
import { ConvexHttpClient } from "convex/browser";
import { redirect } from "react-router";
import { useUser } from "@clerk/react-router";
import { StoreOpsEnhancedSidebar } from "~/components/store-ops/enhanced-sidebar";
import { StoreOpsEnhancedTopbar } from "~/components/store-ops/enhanced-topbar";
import { DashboardLoading } from "~/components/ui/loading";
import { api } from "../../../convex/_generated/api";
import { Outlet } from "react-router";
import { Suspense } from "react";
import { Store } from "lucide-react";

export async function loader(args: any) {
  const { userId, getToken } = await getAuth(args);

  // Redirect to sign-in if not authenticated
  if (!userId) {
    throw redirect("/sign-in");
  }

  const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
  
  // Set auth token for server-side queries
  const token = await getToken({ template: "convex" });
  if (token) {
    convex.setAuth(token);
  }

  try {
    // Check if user exists in our database
    const user = await convex.query(api.users.getCurrentUser);

    // If user doesn't exist in database, redirect to user not found page
    if (!user) {
      throw redirect("/user-not-found");
    }

    // Mark this user as store ops if not already marked
    if (!user.isStoreOps) {
      await convex.mutation(api.users.upsertUser, { isStoreOps: true });
    }

    return { success: true };
  } catch (error) {
    // Check if this is a Response object (redirect)
    if (error instanceof Response) {
      throw error;
    }
    
    // Handle auth token expiration or invalid state
    if (error instanceof Error && (
      error.message.includes('token') || 
      error.message.includes('auth') || 
      error.message.includes('Unauthorized')
    )) {
      throw redirect("/sign-in");
    }
    throw redirect("/user-not-found");
  }
}

export default function StoreOpsLayout() {
  const { user, isLoaded } = useUser();

  // Show loading while user data loads
  if (!isLoaded) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex h-screen bg-background dark:bg-background">
      <StoreOpsEnhancedSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StoreOpsEnhancedTopbar />
        <main className="flex-1 overflow-y-auto bg-background">
          <Suspense fallback={<DashboardLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}