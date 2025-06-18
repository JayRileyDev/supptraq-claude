import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import { SignIn } from "@clerk/react-router";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export async function loader(args: any) {
  const { userId } = await getAuth(args);
  
  // If user is already authenticated, redirect directly to dashboard
  if (userId) {
    throw redirect("/dashboard");
  }
  
  return {};
}

export default function SignInPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-gray-600">
              Sign in to your Supptraq account
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
              redirectUrl="/dashboard"
              afterSignInUrl="/dashboard"
              initialValues={{
                emailAddress: "",
                username: ""
              }}
            />
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Button variant="link" className="text-blue-600 hover:text-blue-700" asChild>
                <Link to="/sign-up">Sign up</Link>
              </Button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
