import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import { SignIn } from "@clerk/react-router";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Store, Briefcase } from "lucide-react";
import { useState } from "react";

export async function loader(args: any) {
  const { userId } = await getAuth(args);
  
  // Don't auto-redirect if user is authenticated - let them choose their portal
  return {};
}

export default function SignInPage() {
  const [loginType, setLoginType] = useState<"store" | "owner" | null>(null);

  if (loginType === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent" />
        
        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl"
          >
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-gray-900">Welcome to Supptraq</h1>
              <p className="mt-4 text-lg text-gray-600">
                Choose your login type to continue
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer p-8 text-center hover:shadow-xl transition-shadow h-full flex flex-col justify-between"
                  onClick={() => setLoginType("store")}
                >
                  <div>
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                      <Store className="h-10 w-10 text-blue-600" />
                    </div>
                    <h2 className="mb-4 text-2xl font-semibold">Store Ops Login</h2>
                    <p className="text-gray-600">
                      For daily in-store operations, checklists, tracking, and team management
                    </p>
                  </div>
                  <Button className="mt-6 w-full" size="lg">
                    Store Operations Portal
                  </Button>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer p-8 text-center hover:shadow-xl transition-shadow h-full flex flex-col justify-between"
                  onClick={() => setLoginType("owner")}
                >
                  <div>
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                      <Briefcase className="h-10 w-10 text-purple-600" />
                    </div>
                    <h2 className="mb-4 text-2xl font-semibold">Owner Ops Login</h2>
                    <p className="text-gray-600">
                      Full admin experience with analytics, inventory management, and reporting
                    </p>
                  </div>
                  <Button className="mt-6 w-full" size="lg" variant="secondary">
                    Owner Administration
                  </Button>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const redirectUrl = loginType === "store" ? "/store-ops" : "/dashboard";
  const afterSignInUrl = loginType === "store" ? "/store-ops" : "/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent" />
      
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLoginType(null)}
              className="mb-4"
            >
              ← Back to login options
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {loginType === "store" ? "Store Operations Login" : "Owner Login"}
            </h1>
            <p className="mt-2 text-gray-600">
              Sign in to your {loginType === "store" ? "store operations" : "owner"} account
            </p>
          </div>

          <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-8 shadow-xl border border-gray-100">
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-none shadow-none",
                  header: "hidden",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  loadingPane: "hidden",
                  loadingText: "hidden",
                  spinner: "hidden",
                  modalCloseButton: "hidden",
                  modalBackdrop: "hidden",
                  welcomeScreen: "hidden",
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
                  formResendCodeLink: "text-blue-600 hover:text-blue-700 text-sm font-medium"
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                  showOptionalFields: false
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
              routing="path"
              signUpUrl="/sign-up"
              redirectUrl={redirectUrl}
              afterSignInUrl={afterSignInUrl}
              initialValues={{
                emailAddress: "",
                username: ""
              }}
            />
          </div>

          {loginType === "owner" && (
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Button variant="link" className="text-blue-600 hover:text-blue-700" asChild>
                  <Link to="/sign-up">Sign up</Link>
                </Button>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}