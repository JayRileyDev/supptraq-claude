import { useAuth, useUser } from "@clerk/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useNavigate } from "react-router";

export default function AuthDebugPage() {
  const { userId, isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const subscriptionStatus = useQuery(
    api.subscriptions.checkUserSubscriptionStatus,
    userId ? { userId } : "skip"
  );

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleClearStorageAndSignOut = () => {
    // Clear all local storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force sign out and redirect
    window.location.href = "/sign-in";
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clerk Auth Status */}
          <Card>
            <CardHeader>
              <CardTitle>Clerk Auth Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>Auth Loaded: <span className="font-mono">{String(authLoaded)}</span></div>
              <div>Is Signed In: <span className="font-mono">{String(isSignedIn)}</span></div>
              <div>User ID: <span className="font-mono">{userId || "null"}</span></div>
              <div>User Email: <span className="font-mono">{user?.emailAddresses?.[0]?.emailAddress || "null"}</span></div>
              <div>User Name: <span className="font-mono">{user?.fullName || "null"}</span></div>
            </CardContent>
          </Card>

          {/* Convex User Status */}
          <Card>
            <CardHeader>
              <CardTitle>Convex User Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>Current User: <span className="font-mono">{currentUser ? "exists" : currentUser === null ? "null" : "loading"}</span></div>
              {currentUser && (
                <>
                  <div>Org ID: <span className="font-mono">{currentUser.orgId || "null"}</span></div>
                  <div>Franchise ID: <span className="font-mono">{currentUser.franchiseId || "null"}</span></div>
                  <div>Role: <span className="font-mono">{currentUser.role || "null"}</span></div>
                  <div>Name: <span className="font-mono">{currentUser.name || "null"}</span></div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>Status Loaded: <span className="font-mono">{subscriptionStatus !== undefined ? "true" : "false"}</span></div>
              <div>Has Active Subscription: <span className="font-mono">{String(subscriptionStatus?.hasActiveSubscription || false)}</span></div>
              {subscriptionStatus && (
                <div className="mt-2">
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(subscriptionStatus, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>Current URL: <span className="font-mono text-xs">{window.location.href}</span></div>
              <div>User Agent: <span className="font-mono text-xs">{navigator.userAgent.substring(0, 50)}...</span></div>
              <div>Local Storage Keys: <span className="font-mono text-xs">{Object.keys(localStorage).join(", ")}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleNavigate("/sign-in")}>Go to Sign In</Button>
              <Button onClick={() => handleNavigate("/account-pending")}>Go to Account Pending</Button>
              <Button onClick={() => handleNavigate("/dashboard")}>Go to Dashboard</Button>
              <Button variant="destructive" onClick={handleClearStorageAndSignOut}>
                Clear Storage & Sign Out
              </Button>
            </div>
            
            <div className="mt-4">
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Raw Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Data (for debugging)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Current User (Convex):</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(currentUser, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Clerk User:</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify({
                    id: user?.id,
                    emailAddresses: user?.emailAddresses,
                    fullName: user?.fullName,
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    createdAt: user?.createdAt,
                    updatedAt: user?.updatedAt
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}