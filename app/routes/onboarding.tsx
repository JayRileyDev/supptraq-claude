import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SupplementKingSetup } from "~/components/onboarding/SupplementKingSetup";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react-router";

export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);
  
  // Redirect to sign-in if not authenticated
  if (!userId) {
    throw redirect("/sign-in");
  }
  
  return {};
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const subscriptionStatus = useQuery(
    api.subscriptions.checkUserSubscriptionStatus,
    userId ? { userId } : "skip"
  );
  const [setupComplete, setSetupComplete] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const upsertUser = useMutation(api.users.upsertUser);
  
  // Auto-create user if they don't exist
  useEffect(() => {
    if (userId && currentUser === null && !userCreated) {
      console.log("User doesn't exist in database, creating...");
      upsertUser()
        .then(() => {
          console.log("User created successfully");
          setUserCreated(true);
        })
        .catch((error) => {
          console.error("Failed to create user:", error);
        });
    }
  }, [userId, currentUser, userCreated, upsertUser]);
  
  // Handle navigation based on user setup and subscription status
  useEffect(() => {
    console.log("🔍 Navigation useEffect triggered:", {
      hasCurrentUser: !!currentUser,
      subscriptionStatusDefined: subscriptionStatus !== undefined,
      setupComplete
    });
    
    if (currentUser && subscriptionStatus !== undefined) {
      console.log("📋 User and subscription data available:", {
        user: {
          orgId: currentUser.orgId,
          franchiseId: currentUser.franchiseId,
          role: currentUser.role,
          name: currentUser.name
        },
        subscription: {
          hasActive: subscriptionStatus?.hasActiveSubscription,
          status: subscriptionStatus
        }
      });
      
      // User is properly set up (has org, franchise, role)
      if (currentUser.orgId && currentUser.franchiseId && currentUser.role) {
        console.log("✅ User setup complete, navigating to dashboard!");
        console.log("🚀 Navigation details:", {
          orgId: currentUser.orgId,
          franchiseId: currentUser.franchiseId,
          role: currentUser.role,
          hasSubscription: subscriptionStatus?.hasActiveSubscription
        });
        // Since all new users get a 30-day trial, they should have a subscription
        // Navigate directly to dashboard
        navigate("/dashboard");
      } else {
        console.log("⏳ User setup incomplete, staying on onboarding:", {
          orgId: currentUser?.orgId,
          franchiseId: currentUser?.franchiseId,
          role: currentUser?.role,
          setupComplete: setupComplete
        });
      }
      // If user doesn't have org/franchise/role setup, continue with onboarding
    } else {
      console.log("⏰ Waiting for user data:", {
        currentUser: !!currentUser,
        subscriptionStatus: subscriptionStatus,
        userCreated
      });
    }
  }, [currentUser, subscriptionStatus, navigate, setupComplete]);

  const handleOnboardingComplete = () => {
    console.log("🎉 Supplement King setup completed, marking setup as complete...");
    setSetupComplete(true);
    
    // Immediately try to navigate to dashboard
    console.log("🔄 Attempting immediate navigation to dashboard...");
    console.log("📍 Current location before navigation:", window.location.pathname);
    navigate("/dashboard");
    
    // Add a fallback timeout in case navigation doesn't work
    setTimeout(() => {
      console.log("⏰ Checking location after 2 seconds...");
      console.log("📍 Current location:", window.location.pathname);
      if (window.location.pathname === '/onboarding') {
        console.log("⚠️ Still on onboarding page, forcing navigation...");
        window.location.href = "/dashboard";
      } else {
        console.log("✅ Successfully navigated away from onboarding");
      }
    }, 2000); // 2 second fallback with forced navigation
  };

  // Show loading state while checking user status and subscription
  if (currentUser === undefined || subscriptionStatus === undefined || (currentUser === null && !userCreated)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {currentUser === null && !userCreated 
              ? "Creating your account..." 
              : "Setting up your account..."
            }
          </p>
        </div>
      </div>
    );
  }

  // Show loading state if setup is complete but waiting for data refresh
  if (setupComplete && (!currentUser?.orgId || !currentUser?.franchiseId || !currentUser?.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Finalizing your setup...</p>
          <p className="mt-1 text-sm text-gray-500">Redirecting to dashboard...</p>
          <button 
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    );
  }

  // Show onboarding if user needs setup
  if (!currentUser?.orgId || !currentUser?.franchiseId || !currentUser?.role) {
    return (
      <div className="min-h-screen page-background">
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen">
          <SupplementKingSetup onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  // User is already set up, redirect will happen via useEffect
  return null;
}