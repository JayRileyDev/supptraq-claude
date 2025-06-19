import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Settings, Building, ArrowRight } from "lucide-react";

export default function AdminQuickAccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Admin Quick Access
          </h1>
          <p className="text-muted-foreground">
            No authentication required - direct access to admin tools
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-6 max-w-2xl mx-auto">
          <Card className="glow-card border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-6 w-6 text-blue-500" />
                Initial Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Create organizations and franchises for your system. Start here if this is your first time.
              </p>
              <div className="space-y-2">
                <div className="text-sm">✅ Create "Supplement King" organization</div>
                <div className="text-sm">✅ Create sample franchises</div>
                <div className="text-sm">✅ Set up basic structure</div>
              </div>
              <Button asChild className="w-full">
                <Link to="/admin/setup">
                  Go to Setup
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Settings className="h-5 w-5" />
              Quick Start Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">1. Setup</h3>
                <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                  <li>• Click "Go to Setup"</li>
                  <li>• Click "Quick Setup Supplement King"</li>
                  <li>• Creates basic org structure</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">2. Create Users</h3>
                <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                  <li>• Click "Manage Users"</li>
                  <li>• Click "Create User"</li>
                  <li>• Fill in email, name, org, role</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">3. Test</h3>
                <ul className="space-y-1 text-amber-800 dark:text-amber-200">
                  <li>• User signs up with that email</li>
                  <li>• Instant dashboard access</li>
                  <li>• No onboarding needed!</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="outline" asChild>
            <Link to="/sign-in">
              Back to Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}