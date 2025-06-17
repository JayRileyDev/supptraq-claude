import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Input } from "~/components/ui/input";
import { Loader2, Building2, UserPlus, Crown } from "lucide-react";

interface OrganizationSetupProps {
  onComplete: () => void;
}

export function OrganizationSetup({ onComplete }: OrganizationSetupProps) {
  const [step, setStep] = useState<"select" | "join" | "create">("select");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [newOrgName, setNewOrgName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const organizations = useQuery(api.users.getOrganizations);
  const setupUser = useMutation(api.users.setupUserWithOrganization);
  const createOrganization = useMutation(api.users.createOrganization);

  const handleJoinOrganization = async () => {
    if (!selectedOrgId) return;
    
    setIsLoading(true);
    try {
      await setupUser({
        orgId: selectedOrgId as any,
        role: "owner", // New users joining existing orgs become owners
        allowedPages: [],
      });
      onComplete();
    } catch (error) {
      console.error("Failed to join organization:", error);
      alert("Failed to join organization. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return;

    setIsLoading(true);
    try {
      const org = await createOrganization({
        name: newOrgName.trim(),
      });

      if (org) {
        await setupUser({
          orgId: org._id,
          role: "owner",
          allowedPages: [],
        });
        onComplete();
      }
    } catch (error) {
      console.error("Failed to create organization:", error);
      alert("Failed to create organization. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  if (step === "select") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Welcome to Supptraq
          </CardTitle>
          <CardDescription>
            Let's get you set up with an organization to start tracking your retail analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizations && organizations.length > 0 ? (
            <>
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => setStep("join")}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 font-medium">
                    <UserPlus className="h-4 w-4" />
                    Join an existing organization
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Join {organizations[0]?.name} or another organization
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => setStep("create")}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 font-medium">
                    <Crown className="h-4 w-4" />
                    Create a new organization
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Start fresh with your own organization
                  </div>
                </div>
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
              onClick={() => setStep("create")}
            >
              <Crown className="h-4 w-4 mr-2" />
              Create Your Organization
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "join") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Join an Organization</CardTitle>
          <CardDescription>
            Select an organization to join as an owner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={selectedOrgId} onValueChange={setSelectedOrgId}>
            {organizations?.map((org) => (
              <div key={org._id} className="flex items-center space-x-2">
                <RadioGroupItem value={org._id} id={org._id} />
                <Label htmlFor={org._id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{org.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Organization
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep("select")}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              onClick={handleJoinOrganization}
              disabled={!selectedOrgId || isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Join Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "create") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create Your Organization</CardTitle>
          <CardDescription>
            Set up a new organization for your retail business.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              placeholder="e.g., Supplement King"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A franchise will be automatically created for you within this organization.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep("select")}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              onClick={handleCreateOrganization}
              disabled={!newOrgName.trim() || isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}