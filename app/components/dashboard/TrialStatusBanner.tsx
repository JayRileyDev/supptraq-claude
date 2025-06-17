import { useQuery } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Sparkles, Clock, Crown } from "lucide-react";
import { Link } from "react-router";

export function TrialStatusBanner() {
  const { userId } = useAuth();
  const subscription = useQuery(
    api.subscriptions.getSubscriptionByUserId,
    userId ? { userId } : "skip"
  );

  // Only show for early-access users
  if (!subscription || (!subscription.metadata?.isTrialPeriod && !subscription.metadata?.isEarlyAccess)) {
    return null;
  }

  const endDate = new Date(subscription.currentPeriodEnd || 0);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-blue-900">Welcome to Supptraq Pro!</h3>
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Clock className="h-4 w-4" />
                <span>
                  You have <strong>{daysLeft} days</strong> left of early access
                  {daysLeft <= 7 && " - early access ending soon!"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {daysLeft <= 7 && (
              <Button asChild size="sm">
                <Link to="/pricing">
                  Upgrade Now
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link to="/pricing">
                View Plans
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}