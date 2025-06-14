import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import { SignIn } from "@clerk/react-router";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export async function loader(args: any) {
  const { userId } = await getAuth(args);
  
  // If user is already authenticated, redirect to dashboard
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
              Sign in to your SuppTraq account
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <SignIn />
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
