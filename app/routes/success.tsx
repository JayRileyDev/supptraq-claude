"use client";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/react-router";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CheckCircle, ArrowRight, Loader2, Calendar, CreditCard, Clock } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { formatCurrency } from "../../convex/subscriptionHelpers";

export default function Success() {
  const { isSignedIn } = useAuth();
  const subscription = useQuery(api.subscriptions.fetchUserSubscription);
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isSignedIn) {
      upsertUser();
    }
  }, [isSignedIn, upsertUser]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent" />
        
        <div className="relative flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" />
              
              <CardHeader className="relative">
                <CardTitle className="text-2xl font-bold text-center">Access Denied</CardTitle>
                <CardDescription className="text-center">
                  Please sign in to view your subscription details.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative">
                <Button asChild className="w-full h-12 text-base" size="lg">
                  <Link to="/sign-in">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent" />
        
        <div className="relative flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 text-gray-600"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading your subscription details...</span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent" />
      
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" />
            
            <CardHeader className="relative pb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mx-auto mb-4"
              >
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </motion.div>
              
              <CardTitle className="text-3xl font-bold text-center">
                Welcome to Supptraq!
              </CardTitle>
              <CardDescription className="text-lg text-center">
                Your subscription is now active and ready to use.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6"
              >
                <h3 className="font-semibold text-lg mb-4">Subscription Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Amount</div>
                      <div className="font-medium">
                        {subscription.amount ? formatCurrency(subscription.amount, subscription.currency || 'USD') : '$0.00'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Billing Cycle</div>
                      <div className="font-medium capitalize">{subscription.interval}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Next Billing</div>
                      <div className="font-medium">
                        {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-4"
              >
                <h3 className="font-semibold text-lg text-center">What's Next?</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button asChild className="w-full h-12 text-base" size="lg">
                    <Link to={subscription?.status === 'active' ? "/dashboard" : "/pricing"}>
                      {subscription?.status === 'active' ? (
                        <>
                          Go to Dashboard
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      ) : (
                        "View Pricing"
                      )}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 text-base">
                    <Link to="/">Back to Home</Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="pt-6 border-t"
              >
                <p className="text-sm text-gray-600 text-center">
                  {subscription?.status === 'active' ? (
                    "You'll receive a confirmation email shortly. If you have any questions, feel free to contact our support team."
                  ) : (
                    "Your payment is processing. It may take a few minutes for your subscription to activate. Please refresh the page or try again shortly."
                  )}
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}