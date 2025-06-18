import { motion } from "framer-motion";
import { useAuth, useClerk } from "@clerk/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Clock, Mail, Shield } from "lucide-react";

export default function AccountPendingPage() {
  const { user } = useAuth();
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
              className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center"
            >
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </motion.div>
            
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Account Setup Pending
              </CardTitle>
              <CardDescription className="mt-2">
                Your account is being prepared by our team
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">Account Verified</p>
                  <p className="text-xs text-muted-foreground">
                    Your email ({user?.emailAddresses?.[0]?.emailAddress}) has been verified
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                <Mail className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-foreground">Team Notified</p>
                  <p className="text-xs text-muted-foreground">
                    Our team has been notified and will set up your workspace
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Our team will configure your organization settings</li>
                <li>• You'll receive an email when your account is ready</li>
                <li>• Full access to all features will be available shortly</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Need help? Contact{" "}
                <a 
                  href="mailto:support@supptraq.com" 
                  className="text-primary hover:underline"
                >
                  support@supptraq.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}