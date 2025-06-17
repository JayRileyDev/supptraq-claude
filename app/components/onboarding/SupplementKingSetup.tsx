import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/react-router";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { motion } from "framer-motion";
import { Loader2, Building2, Crown, CheckCircle, Sparkles, Zap, ArrowRight, CalendarDays, Clock, Activity, BarChart3 } from "lucide-react";

interface SupplementKingSetupProps {
  onComplete: () => void;
}

export function SupplementKingSetup({ onComplete }: SupplementKingSetupProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);

  const setupUser = useMutation(api.users.setupSupplementKingUser);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      console.log("🚀 Starting user setup...");
      console.log("📊 User details:", { 
        userName: user?.fullName, 
        userEmail: user?.emailAddresses?.[0]?.emailAddress,
        userId: user?.id 
      });
      
      const result = await setupUser({});
      console.log("✅ User setup completed successfully, result:", result);
      
      // Mark as completed
      setSetupCompleted(true);
      console.log("🎯 Setup marked as completed, calling onComplete...");
      
      // Call completion callback
      onComplete();
      
      // Additional fallback - direct navigation after short delay
      setTimeout(() => {
        console.log("⏰ Fallback navigation from setup component");
        console.log("🔄 Current location:", window.location.pathname);
        window.location.href = "/dashboard";
      }, 2000);
      
    } catch (error) {
      console.error("❌ Failed to setup user:", error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      // More user-friendly error handling
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("Not authenticated")) {
        alert("Please sign in again and try again.");
        window.location.href = "/sign-in";
      } else {
        alert(`Setup failed: ${errorMessage}. Please try again or contact support.`);
        console.error("🔍 Full error object:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Main Header - matching dashboard style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 p-6 border border-border/50"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 shadow-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                Welcome to Supptraq!
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>Franchise Setup</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Ready to Launch</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>Early Access Included</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 px-4 py-2">
            <Zap className="h-4 w-4 mr-2" />
            All Systems Ready
          </Badge>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm h-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 shadow-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Hey {user?.firstName}!
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    Ready to revolutionize your Supplement King franchise?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What You Get */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground mb-4">What You'll Get Instantly:</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20"
                  >
                    <div className="p-2 bg-emerald-500 rounded-lg">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-emerald-900 dark:text-emerald-100">Your Supplement King Franchise</div>
                      <div className="text-sm text-emerald-700 dark:text-emerald-300">Fully configured and ready to track</div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20"
                  >
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-blue-900 dark:text-blue-100">30-Day Early Access</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Full access to all premium features</div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
                  >
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-purple-900 dark:text-purple-100">Real-Time Analytics</div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">Inventory tracking, sales insights & more</div>
                    </div>
                  </motion.div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-center p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border"
                >
                  <p className="text-sm text-foreground font-medium">
                    <strong>{user?.fullName || `${user?.firstName} ${user?.lastName}`}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                </motion.div>
              </div>

            </CardContent>
          </Card>
        </motion.div>

        {/* Setup Action Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm h-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Ready to Launch
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">
                    Your franchise setup is one click away
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Organization Display */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-foreground">Your Organization</h3>
                
                <div className="relative">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl">
                    <div className="p-2 bg-primary rounded-lg">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">Supplement King</div>
                      <div className="text-sm text-muted-foreground">Premium Supplement Retailer</div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Pre-configured
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Your franchise will be automatically created within the Supplement King organization
                </p>
              </motion.div>

              {/* Trial Information */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-900 dark:text-green-100">30-Day Early Access Included</div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Full access to all premium features
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Setup Button */}
              {!isLoading ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="space-y-6"
                >
                  <Button 
                    onClick={handleSetup}
                    className="w-full h-16 text-lg font-bold bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 rounded-xl"
                    size="lg"
                    disabled={!user || !user.firstName}
                  >
                    {!user ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Loading your account...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-3 h-6 w-6" />
                        Launch My Supptraq Dashboard
                        <Sparkles className="ml-3 h-6 w-6" />
                      </>
                    )}
                  </Button>
                  
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed text-center">
                    Click to set up your franchise and activate your 30-day early access. 
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">No payment required!</span>
                  </p>
                </motion.div>
              ) : setupCompleted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-lg">
                      <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">Welcome to Supptraq!</h3>
                      <p className="text-emerald-700 dark:text-emerald-300 font-medium">Your franchise is ready to go</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl p-4 space-y-2 border border-emerald-500/20">
                    <div className="flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-200">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Supplement King franchise activated</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-200">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">30-day early access unlocked</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-200">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Dashboard ready for action</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.location.href = "/dashboard"}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl rounded-xl"
                  >
                    <Zap className="mr-3 h-6 w-6" />
                    Enter Your Dashboard
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-full">
                      <Loader2 className="h-12 w-12 animate-spin text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-foreground mb-2">Setting up your franchise...</h3>
                      <p className="text-muted-foreground">This will just take a moment</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 space-y-3 border border-primary/20">
                    <div className="flex items-center gap-3 text-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="font-medium">Creating your Supplement King franchise</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                      <span className="font-medium">Activating your 30-day early access</span>
                    </div>
                    <div className="flex items-center gap-3 text-foreground">
                      <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                      <span className="font-medium">Preparing your personalized dashboard</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="text-center pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to start tracking your franchise performance with Supptraq
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}