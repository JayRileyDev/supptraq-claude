import { ArrowRight, CreditCard, Lock, RefreshCw } from "lucide-react";
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

export default function SubscriptionRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent" />
      
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
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
                <div className="rounded-full bg-orange-100 p-4">
                  <Lock className="h-12 w-12 text-orange-500" />
                </div>
              </motion.div>
              
              <CardTitle className="text-3xl font-bold text-center">
                Subscription Required
              </CardTitle>
              <CardDescription className="text-lg text-center">
                Unlock full access to your dashboard and premium features
              </CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <span className="font-semibold text-gray-900">Choose Your Plan</span>
                </div>
                <p className="text-gray-600 text-center">
                  Select a subscription plan to access advanced analytics, 
                  automated inventory management, and all premium features.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-3"
              >
                <Button asChild className="w-full h-12 text-base" size="lg">
                  <Link to="/pricing">
                    View Pricing Plans
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full h-12 text-base">
                  <Link to="/">Back to Home</Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="pt-4 border-t"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <RefreshCw className="h-4 w-4" />
                  <p>
                    Already subscribed? It may take a few moments for your
                    subscription to activate. Try refreshing the page.
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}