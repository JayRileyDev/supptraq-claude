import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Loader2, Crown, Users, CheckCircle } from "lucide-react";

export default function AdminPage() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [planType, setPlanType] = useState("basic");
  const [durationMonths, setDurationMonths] = useState(12);
  const [isGranting, setIsGranting] = useState(false);
  const [message, setMessage] = useState("");

  const users = useQuery(api.subscriptions.getAllUsers);
  const grantSubscription = useMutation(api.subscriptions.grantFreeSubscription);

  const handleGrantSubscription = async () => {
    if (!selectedUserId) {
      setMessage("Please select a user");
      return;
    }

    setIsGranting(true);
    setMessage("");

    try {
      const result = await grantSubscription({
        userId: selectedUserId,
        planType,
        durationMonths,
      });

      setMessage(`✅ ${result.message}`);
      setSelectedUserId("");
    } catch (error) {
      console.error("Failed to grant subscription:", error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : "Failed to grant subscription"}`);
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Admin Panel
          </h1>
          <p className="text-gray-600">Manage user subscriptions and access</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Grant Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Grant Free Subscription
              </CardTitle>
              <CardDescription>
                Manually grant a subscription to any user (bypasses payment)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.tokenIdentifier} value={user.tokenIdentifier}>
                        {user.email || user.name || user.tokenIdentifier}
                        {user.role && ` (${user.role})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-type">Plan Type</Label>
                <Select value={planType} onValueChange={setPlanType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Plan</SelectItem>
                    <SelectItem value="pro">Pro Plan</SelectItem>
                    <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Months)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="60"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value) || 12)}
                />
              </div>

              <Button 
                onClick={handleGrantSubscription}
                disabled={!selectedUserId || isGranting}
                className="w-full"
              >
                {isGranting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Granting Subscription...
                  </>
                ) : (
                  "Grant Free Subscription"
                )}
              </Button>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.startsWith("✅") 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                All Users
              </CardTitle>
              <CardDescription>
                View all registered users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users?.map((user) => (
                  <div 
                    key={user.tokenIdentifier}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUserId(user.tokenIdentifier)}
                  >
                    <div className="font-medium text-sm">
                      {user.email || user.name || "Unnamed User"}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {user.tokenIdentifier}
                    </div>
                    {user.role && (
                      <div className="text-xs text-blue-600 mt-1">
                        Role: {user.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-orange-600">⚠️ Admin Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p><strong>To grant a subscription:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Select a user from the dropdown or click on a user in the list</li>
              <li>Choose the plan type and duration</li>
              <li>Click "Grant Free Subscription"</li>
              <li>The user will immediately have access to the dashboard</li>
            </ol>
            <p className="mt-4"><strong>Note:</strong> This bypasses all payment processing and creates a manual subscription record in the database.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}