import { ArrowRight, CreditCard, Lock, RefreshCw, Sparkles, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Link } from "react-router";
import { useAuth, useUser, useClerk } from "@clerk/react-router";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { centsToDollars } from "../../convex/subscriptionHelpers";

export default function SubscriptionRequired() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<any>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const getPlans = useAction(api.subscriptions.getAvailablePlans);
  const createCheckout = useAction(api.subscriptions.createCheckoutSession);

  // Load plans on component mount
  React.useEffect(() => {
    const loadPlans = async () => {
      try {
        const result = await getPlans();
        setPlans(result);
      } catch (error) {
        console.error("Failed to load plans:", error);
        setError("Failed to load pricing plans. Please try again.");
      }
    };
    loadPlans();
  }, [getPlans]);

  const handleQuickSubscribe = async (priceId: string) => {
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }

    setLoadingPriceId(priceId);
    setError(null);

    try {
      const checkoutUrl = await createCheckout({ priceId });
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Failed to create checkout:", error);
      setError("Failed to start checkout. Please try again.");
      setLoadingPriceId(null);
    }
  };

  const handleSignOutAndGoHome = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  const recommendedPlan = plans?.items?.sort((a: any, b: any) => {
    return a.prices[0].amount - b.prices[0].amount;
  })[1] || plans?.items?.[0]; // Get second cheapest or first available

  // Show loading state while plans are loading
  if (!plans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading subscription plans...</p>
          {error && (
            <p className="text-red-600 mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      </div>
      
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-6 shadow-lg"
            >
              <Sparkles className="h-10 w-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Welcome{user?.firstName ? `, ${user.firstName}` : ''}! 🎉
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              You're one step away from transforming your retail operations with Supptraq's powerful features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Quick Subscribe Card */}
            {recommendedPlan && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="h-full relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                    Recommended
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Zap className="h-6 w-6 text-blue-600" />
                      Get Started Instantly
                    </CardTitle>
                    <CardDescription className="text-base">
                      Start with our most popular plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          ${centsToDollars(recommendedPlan.prices[0].amount).toFixed(0)}
                        </span>
                        <span className="text-gray-600">/{recommendedPlan.prices[0].interval}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{recommendedPlan.name}</p>
                    </div>
                    
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm">Full dashboard access</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm">Real-time inventory tracking</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm">AI-powered insights</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm">Priority support</span>
                      </li>
                    </ul>
                    
                    <Button 
                      className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700" 
                      size="lg"
                      onClick={() => handleQuickSubscribe(recommendedPlan.prices[0].id)}
                      disabled={loadingPriceId === recommendedPlan.prices[0].id}
                    >
                      {loadingPriceId === recommendedPlan.prices[0].id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up checkout...
                        </>
                      ) : (
                        <>
                          Subscribe Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Compare Plans Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Shield className="h-6 w-6 text-gray-600" />
                    Compare All Plans
                  </CardTitle>
                  <CardDescription className="text-base">
                    Find the perfect plan for your business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Flexible pricing</p>
                        <p className="text-sm text-gray-600">Monthly or annual billing options</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <RefreshCw className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Change anytime</p>
                        <p className="text-sm text-gray-600">Upgrade, downgrade, or cancel</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Secure checkout</p>
                        <p className="text-sm text-gray-600">Powered by Polar.sh</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button asChild variant="outline" className="w-full h-12 text-base">
                      <Link to="/pricing">
                        View All Plans
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
            >
              <p className="text-red-800 text-center">{error}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center space-y-3"
          >
            <p className="text-sm text-gray-600">
              Already subscribed? <button 
                onClick={() => window.location.reload()} 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Refresh the page
              </button>
            </p>
            
            <div className="pt-2 border-t border-gray-200">
              <Button 
                variant="ghost" 
                onClick={handleSignOutAndGoHome}
                disabled={isSigningOut}
                className="text-gray-600 hover:text-gray-800"
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  "Sign out and go home"
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}