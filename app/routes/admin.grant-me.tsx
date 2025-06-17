import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { CheckCircle, Loader2, ArrowRight, Users } from "lucide-react";
import { Link } from "react-router";

export default function GrantMePage() {
  const { userId: authUserId, isSignedIn } = useAuth();
  const [manualUserId, setManualUserId] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);
  
  const grantSubscription = useMutation(api.subscriptions.grantFreeSubscription);
  const allUsers = useQuery(api.subscriptions.getAllUsers);
  
  // Use manual user ID if provided, otherwise fall back to auth user ID
  const targetUserId = manualUserId.trim() || authUserId;
  
  const userTest = useQuery(
    api.subscriptions.testUserExists,
    targetUserId ? { userId: targetUserId } : "skip"
  );

  // Auto-fill with auth user ID if signed in
  useEffect(() => {
    if (authUserId && !manualUserId) {
      setManualUserId(authUserId);
    }
  }, [authUserId, manualUserId]);

  const handleGrantSubscription = async () => {
    const userId = targetUserId;
    console.log("Grant button clicked", { userId, isSignedIn });
    
    if (!userId) {
      const msg = "Please enter a user ID";
      console.error(msg);
      setResult({success: false, message: msg});
      return;
    }

    setIsGranting(true);
    setResult(null);

    try {
      console.log("Calling grantSubscription with:", {
        userId: userId,
        planType: "pro",
        durationMonths: 12,
      });
      
      const response = await grantSubscription({
        userId: userId,
        planType: "pro",
        durationMonths: 12,
      });

      console.log("Grant response:", response);
      setResult({success: true, message: response.message});
    } catch (error) {
      console.error("Failed to grant subscription:", error);
      setResult({
        success: false, 
        message: error instanceof Error ? error.message : "Failed to grant subscription"
      });
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Grant Subscription
          </CardTitle>
          <CardDescription>
            Development tool - Grant subscription to any user (no auth required)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="Enter user ID (e.g., user_2abc123...)"
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    {isSignedIn ? "Auto-filled with your ID, or enter another user's ID" : "Enter any user ID to grant them a subscription"}
                  </p>
                </div>

                {userTest && targetUserId && (
                  <div className="text-xs bg-gray-50 p-3 rounded border">
                    <strong>User Status:</strong><br/>
                    Target ID: <code>{targetUserId}</code><br/>
                    Exists: {userTest.exists ? '✅ Yes' : '❌ No'}<br/>
                    {userTest.user && (
                      <>
                        Name: {userTest.user.name || 'N/A'}<br/>
                        Email: {userTest.user.email || 'N/A'}<br/>
                        Has Org: {userTest.user.orgId ? 'Yes' : 'No'}<br/>
                        Role: {userTest.user.role || 'N/A'}
                      </>
                    )}
                  </div>
                )}

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    This will grant a <strong>Pro subscription</strong> for <strong>12 months</strong>
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleGrantSubscription}
                disabled={!targetUserId || isGranting}
                className="w-full"
                size="lg"
              >
                {isGranting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Granting Subscription...
                  </>
                ) : (
                  "Grant Pro Subscription"
                )}
              </Button>

              {allUsers && allUsers.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Available Users (click to select)
                  </Label>
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                    {allUsers.slice(0, 5).map((user) => (
                      <button
                        key={user.tokenIdentifier}
                        onClick={() => setManualUserId(user.tokenIdentifier)}
                        className="w-full text-left p-2 text-xs border rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium">
                          {user.email || user.name || "Unnamed User"}
                        </div>
                        <div className="text-gray-500 truncate">
                          {user.tokenIdentifier}
                        </div>
                      </button>
                    ))}
                    {allUsers.length > 5 && (
                      <p className="text-xs text-gray-500 text-center pt-1">
                        ... and {allUsers.length - 5} more users
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className={`p-4 rounded-lg ${
                result.success 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                <div className="font-medium">
                  {result.success ? "✅ Success!" : "❌ Error"}
                </div>
                <div className="text-sm mt-1">
                  {result.message}
                </div>
              </div>

              {result.success && (
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link to="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/admin">
                      Admin Panel
                    </Link>
                  </Button>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => {setResult(null); setIsGranting(false);}}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Development tool - bypasses payment processing
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}