import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Link } from "react-router";

interface PageAccessGuardProps {
  pagePath: string;
  children: React.ReactNode;
}

export function PageAccessGuard({ pagePath, children }: PageAccessGuardProps) {
  const currentUser = useQuery(api.users.getCurrentUser);

  // Show loading state while checking user
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // User not found or not set up
  if (!currentUser || !currentUser.role || !currentUser.orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Account Setup Required</h3>
            <p className="text-muted-foreground mb-4">
              Your account is being prepared by our team.
            </p>
            <Button asChild>
              <Link to="/user-not-found">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check access permissions
  const hasAccess = currentUser.role === "owner" || 
    (currentUser.allowedPages && currentUser.allowedPages.includes(pagePath));

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account does not currently have permission to view this page. 
              Please contact your team owner for access.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button asChild>
                <Link to="/settings/team">Contact Owner</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render the page
  return <>{children}</>;
}