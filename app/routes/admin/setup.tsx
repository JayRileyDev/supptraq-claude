import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Building, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

export default function AdminSetupPage() {
  const [newOrg, setNewOrg] = useState({ name: "" });
  const [newFranchise, setNewFranchise] = useState({ 
    name: "", 
    franchiseId: "", 
    orgId: "" 
  });

  const organizations = useQuery(api.admin.getOrganizations);
  const franchises = useQuery(
    api.admin.getFranchisesByOrg,
    newFranchise.orgId ? { orgId: newFranchise.orgId as Id<"organizations"> } : "skip"
  );
  
  const createOrganization = useMutation(api.admin.createOrganization);
  const createFranchise = useMutation(api.admin.createFranchise);

  const handleCreateOrg = async () => {
    try {
      if (!newOrg.name.trim()) {
        toast.error("Organization name is required");
        return;
      }

      await createOrganization({ name: newOrg.name.trim() });
      toast.success("Organization created successfully!");
      setNewOrg({ name: "" });
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to create organization");
    }
  };

  const handleCreateFranchise = async () => {
    try {
      if (!newFranchise.name.trim() || !newFranchise.franchiseId.trim() || !newFranchise.orgId) {
        toast.error("All franchise fields are required");
        return;
      }

      await createFranchise({
        name: newFranchise.name.trim(),
        franchiseId: newFranchise.franchiseId.trim(),
        orgId: newFranchise.orgId as Id<"organizations">,
      });
      
      toast.success("Franchise created successfully!");
      setNewFranchise({ name: "", franchiseId: "", orgId: "" });
    } catch (error) {
      console.error("Error creating franchise:", error);
      toast.error("Failed to create franchise");
    }
  };

  const quickSetupSuppKing = async () => {
    try {
      // Create Supplement King organization
      const orgResult = await createOrganization({ name: "Supplement King" });
      
      // Create a sample franchise
      await createFranchise({
        name: "Main Location",
        franchiseId: "main-location",
        orgId: orgResult.orgId,
      });
      
      toast.success("Supplement King setup completed!");
    } catch (error) {
      console.error("Error in quick setup:", error);
      toast.error("Quick setup failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Initial Setup</h1>
        <p className="text-muted-foreground">Set up organizations and franchises before creating users</p>
      </div>

      {/* Quick Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Quick Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Create a basic Supplement King setup with one organization and franchise:</p>
            <Button onClick={quickSetupSuppKing}>
              Quick Setup Supplement King
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Organization Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Create Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={newOrg.name}
                onChange={(e) => setNewOrg({ name: e.target.value })}
                placeholder="e.g., Supplement King"
              />
            </div>
            <Button onClick={handleCreateOrg}>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Franchise Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Create Franchise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="franchise-org">Parent Organization</Label>
              <Select 
                value={newFranchise.orgId} 
                onValueChange={(value) => setNewFranchise(prev => ({ ...prev, orgId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org._id} value={org._id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="franchise-name">Franchise Name</Label>
              <Input
                id="franchise-name"
                value={newFranchise.name}
                onChange={(e) => setNewFranchise(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Trevor Murphy Group"
              />
            </div>

            <div>
              <Label htmlFor="franchise-id">Franchise ID</Label>
              <Input
                id="franchise-id"
                value={newFranchise.franchiseId}
                onChange={(e) => setNewFranchise(prev => ({ ...prev, franchiseId: e.target.value }))}
                placeholder="e.g., trevor-murphy-sk"
              />
            </div>

            <Button onClick={handleCreateFranchise} disabled={!newFranchise.orgId}>
              <Plus className="h-4 w-4 mr-2" />
              Create Franchise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Setup Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organizations ({organizations?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {organizations?.map((org) => (
                <div key={org._id} className="p-2 border rounded">
                  <h4 className="font-medium">{org.name}</h4>
                  <p className="text-xs text-muted-foreground">ID: {org._id}</p>
                </div>
              ))}
              {!organizations || organizations.length === 0 && (
                <p className="text-muted-foreground">No organizations created yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Franchises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {organizations?.map((org) => (
                <div key={org._id}>
                  <h4 className="font-medium text-sm">{org.name}:</h4>
                  {/* This would need a separate query to show all franchises */}
                  <p className="text-xs text-muted-foreground mb-2">Select org above to see franchises</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Create organizations (usually just "Supplement King")</li>
            <li>Create franchises under each organization</li>
            <li>Go to <a href="/admin/users" className="text-blue-600 hover:underline">User Management</a> to create user profiles</li>
            <li>Share email addresses with users for sign-up</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}