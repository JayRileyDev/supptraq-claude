import { useState } from "react";
import { Form, redirect, useActionData } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/dev-login";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  // Check dev credentials against environment variables
  const devUsername = process.env.DEV_USERNAME || "admin";
  const devPassword = process.env.DEV_PASSWORD || "dev123";

  if (username === devUsername && password === devPassword) {
    // Set a session cookie for dev authentication
    const response = redirect("/admin");
    
    // Create a simple session token
    const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    response.headers.set(
      "Set-Cookie", 
      `dev_session=${sessionToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Strict`
    );
    
    return response;
  }

  return {
    error: "Invalid credentials. Access denied.",
  };
}

export default function DevLogin() {
  const actionData = useActionData<typeof action>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Developer Access</CardTitle>
          <p className="text-muted-foreground">
            Enter developer credentials to access admin dashboard
          </p>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            {actionData?.error && (
              <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                {actionData.error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Authenticating..." : "Access Admin Dashboard"}
            </Button>
          </Form>

          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = "/"}
              className="text-sm"
            >
              ← Back to Main Site
            </Button>
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground text-center">
            This is a secure developer login. Only authorized personnel have access.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}