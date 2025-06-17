import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import { SignUp } from "@clerk/react-router";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useState, useEffect } from "react";
import { Crown, Sparkles, CheckCircle, Loader2 } from "lucide-react";

export async function loader(args: any) {
  const { userId } = await getAuth(args);
  
  // If user is already authenticated, redirect to onboarding (which will redirect to dashboard if already set up)
  if (userId) {
    throw redirect("/onboarding");
  }
  
  return {};
}

function ElegantLoadingOverlay() {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    "Creating your account...",
    "Setting up your Supplement King franchise...", 
    "Activating your 30-day early access...",
    "Preparing your personalized dashboard..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center space-y-6">
          {/* Animated Supptraq Logo */}
          <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-2xl w-fit shadow-lg">
            <Crown className="h-12 w-12 text-white animate-pulse" />
          </div>
          
          {/* Main Title */}
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome to Supptraq!
            </h2>
            <p className="text-gray-600">
              We're setting up your franchise...
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: index <= currentStep ? 1 : 0.3,
                  x: 0 
                }}
                transition={{ delay: index * 0.2 }}
                className="flex items-center gap-3"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  index < currentStep 
                    ? 'bg-emerald-500 text-white' 
                    : index === currentStep 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : index === currentStep ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <p className={`text-sm ${
                  index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>
                  {step}
                </p>
              </motion.div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Sparkles Animation */}
          <div className="flex justify-center">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            >
              <Sparkles className="h-6 w-6 text-purple-500" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SignUpPage() {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Monitor URL hash changes to detect when Clerk is processing
  useEffect(() => {
    const checkClerkStatus = () => {
      const hash = window.location.hash;
      
      // Check for common Clerk verification/processing states
      if (hash.includes('verify') || hash.includes('oauth') || hash.includes('callback')) {
        setIsCreatingAccount(true);
      } else {
        setIsCreatingAccount(false);
      }
    };

    // Check initial state
    checkClerkStatus();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkClerkStatus);
    
    // Also listen for navigation events
    window.addEventListener('popstate', checkClerkStatus);
    
    return () => {
      window.removeEventListener('hashchange', checkClerkStatus);
      window.removeEventListener('popstate', checkClerkStatus);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent" />
      
      {/* Elegant Loading Overlay */}
      {isCreatingAccount && <ElegantLoadingOverlay />}
      
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
            <p className="mt-2 text-gray-600">
              Join Supptraq and transform your retail operations
            </p>
          </div>

          <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-8 shadow-xl border border-gray-100">
            <SignUp 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-none shadow-none",
                  header: "hidden",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 transition-colors mb-4",
                  socialButtonsBlockButtonText: "text-gray-700 font-medium",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500 text-sm mb-4",
                  formFieldLabel: "text-gray-700 font-medium text-sm mb-2",
                  formFieldInput: "border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg mb-4",
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm mt-6",
                  footerActionText: "text-sm text-gray-600",
                  footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                  identityPreviewText: "text-gray-700",
                  identityPreviewEditButton: "text-blue-600 hover:text-blue-700",
                  formFieldSuccessText: "text-green-600 text-sm",
                  formFieldErrorText: "text-red-600 text-sm",
                  otpCodeFieldInput: "border-gray-200 focus:border-blue-500",
                  formResendCodeLink: "text-blue-600 hover:text-blue-700 text-sm font-medium",
                  backLink: "text-gray-600 hover:text-gray-800",
                  backArrow: "text-gray-600"
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton"
                },
                variables: {
                  colorPrimary: "#2563eb",
                  colorText: "#111827",
                  colorTextSecondary: "#6b7280",
                  colorBackground: "transparent",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#111827",
                  borderRadius: "0.5rem"
                }
              }}
              routing="hash"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/onboarding"
            />
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Button variant="link" className="text-blue-600 hover:text-blue-700" asChild>
                <Link to="/sign-in">Sign in</Link>
              </Button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
