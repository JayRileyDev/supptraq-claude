import { motion } from "framer-motion";
import { useClerk } from "@clerk/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertCircle, Mail, ArrowLeft } from "lucide-react";

export default function UserNotFoundPage() {
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut({ redirectUrl: "/sign-in" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glow-card border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center"
            >
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </motion.div>
            
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                User Not Found
              </CardTitle>
              <CardDescription className="mt-2">
                Your account hasn't been set up yet
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">Account Not Created</p>
                  <p className="text-xs text-muted-foreground">
                    Your user account needs to be created by our team before you can access the system
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">Contact Required</p>
                  <p className="text-xs text-muted-foreground">
                    Please reach out to our team to get your account set up
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                What to do next:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Contact our support team using the information below</li>
                <li>• Provide your email address and organization details</li>
                <li>• We'll set up your account and provide login credentials</li>
                <li>• You'll receive an email when your account is ready</li>
              </ul>
            </div>

            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Contact Information</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    <strong>Email:</strong>{" "}
                    <a 
                      href="mailto:support@supptraq.com" 
                      className="text-primary hover:underline"
                    >
                      support@supptraq.com
                    </a>
                  </div>
                  <div>
                    <strong>Response Time:</strong> Within 24 hours
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
                
                <Button 
                  asChild
                  className="w-full"
                >
                  <a href="mailto:support@supptraq.com?subject=Account Setup Request">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Setup Request
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}