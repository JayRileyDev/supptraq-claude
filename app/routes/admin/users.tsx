import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Users, Plus, Edit, Settings } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_URL!.replace(
  /.cloud$/,
  ".site"
);

export default function AdminUsersPage() {
  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    name: "",
    orgId: "",
    franchiseId: "",
    createNewFranchise: false,
    role: "member" as "owner" | "member",
    isStoreOps: false,
    allowedPages: [] as string[],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const users = useQuery(api.admin.getAllUsers);
  const organizations = useQuery(api.admin.getOrganizations);
  const franchises = useQuery(api.admin.getFranchisesByOrg, 
    newUser.orgId ? { orgId: newUser.orgId as any } : "skip"
  );
  
  const createUserProfile = useMutation(api.admin.createUserProfile);
  const createOrganization = useMutation(api.admin.createOrganization);
  const createFranchise = useMutation(api.admin.createFranchise);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateUser = async () => {
    try {
      // Validation
      if (!newUser.email || !newUser.username || !newUser.password || !newUser.name || !newUser.orgId) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate franchise assignment
      if (!newUser.createNewFranchise && !newUser.franchiseId) {
        toast.error("Please select an existing franchise or choose to create a new one");
        return;
      }

      setIsCreating(true);

      // Call the Convex HTTP endpoint to create complete user (Clerk + Convex)
      const response = await fetch(`${CONVEX_SITE_URL}/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          username: newUser.username,
          password: newUser.password,
          name: newUser.name,
          orgId: newUser.orgId,
          franchiseId: newUser.franchiseId,
          createNewFranchise: newUser.createNewFranchise,
          role: newUser.role,
          isStoreOps: newUser.isStoreOps,
          allowedPages: newUser.role === "member" ? newUser.allowedPages : undefined,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("HTTP Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      if (result.success) {
        setCreatedCredentials(result.credentials);
        toast.success("Complete user account created successfully!");
        
        // Reset form
        setNewUser({
          email: "",
          username: "",
          password: "",
          name: "",
          orgId: "",
          franchiseId: "",
          createNewFranchise: false,
          role: "member",
          isStoreOps: false,
          allowedPages: [],
        });
      } else {
        throw new Error(result.error || "Failed to create user");
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const ownerOpsPages = [
    "/dashboard",
    "/upload", 
    "/sales",
    "/inventory",
    "/reports",
    "/budget",
    "/settings",
    "/chat"
  ];

  const storeOpsPages = [
    "/store-ops"
  ];

  const getAvailablePages = () => {
    return newUser.isStoreOps ? storeOpsPages : ownerOpsPages;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Create and manage user profiles</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Complete User Account</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Creates both Clerk authentication and Convex profile with immediate access
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="john.doe"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewUser(prev => ({ ...prev, password: generateRandomPassword() }))}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="org">Organization *</Label>
                <Select 
                  value={newUser.orgId} 
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, orgId: value, franchiseId: "" }))}
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

              {/* Franchise Assignment */}
              <div className="space-y-3">
                <Label>Franchise Assignment *</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="franchiseAssignment"
                      checked={!newUser.createNewFranchise}
                      onChange={() => setNewUser(prev => ({ ...prev, createNewFranchise: false, franchiseId: "" }))}
                    />
                    <span>Assign to existing franchise</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="franchiseAssignment"
                      checked={newUser.createNewFranchise}
                      onChange={() => setNewUser(prev => ({ ...prev, createNewFranchise: true, franchiseId: "" }))}
                    />
                    <span>Create new franchise</span>
                  </label>
                </div>
                
                {!newUser.createNewFranchise && (
                  <Select 
                    value={newUser.franchiseId} 
                    onValueChange={(value) => setNewUser(prev => ({ ...prev, franchiseId: value }))}
                    disabled={!newUser.orgId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing franchise" />
                    </SelectTrigger>
                    <SelectContent>
                      {franchises?.map((franchise) => (
                        <SelectItem key={franchise._id} value={franchise._id}>
                          {franchise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label>Portal Type *</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="portalType"
                      checked={!newUser.isStoreOps}
                      onChange={() => setNewUser(prev => ({ ...prev, isStoreOps: false, allowedPages: [] }))}
                    />
                    <span>Owner Operations Portal</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="portalType"
                      checked={newUser.isStoreOps}
                      onChange={() => setNewUser(prev => ({ 
                        ...prev, 
                        isStoreOps: true, 
                        role: "member", 
                        allowedPages: ["/store-ops"] 
                      }))}
                    />
                    <span>Store Operations Portal</span>
                  </label>
                </div>
              </div>

              {!newUser.isStoreOps && (
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as "owner" | "member" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner (Full Access)</SelectItem>
                      <SelectItem value="member">Member (Limited Access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!newUser.isStoreOps && newUser.role === "member" && (
                <div>
                  <Label>Allowed Pages</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {getAvailablePages().map((page) => (
                      <label key={page} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newUser.allowedPages.includes(page)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser(prev => ({ 
                                ...prev, 
                                allowedPages: [...prev.allowedPages, page] 
                              }));
                            } else {
                              setNewUser(prev => ({ 
                                ...prev, 
                                allowedPages: prev.allowedPages.filter(p => p !== page) 
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span>{page.replace("/", "")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {newUser.isStoreOps && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Store Operations Portal:</strong> Users will have access to all Store Ops modules including:
                  </p>
                  <ul className="text-blue-800 dark:text-blue-200 text-xs mt-2 ml-4 list-disc">
                    <li>Operational Info & Store Profiles</li>
                    <li>Rep Averages Tracking</li>
                    <li>Daily, SL & DL Checklists</li>
                    <li>Returns Tracker & Callback List</li>
                    <li>Close-Dated Products</li>
                    <li>Tablet Counts & Cleaning Schedules</li>
                    <li>Ordering Budget Management</li>
                  </ul>
                </div>
              )}

              <Button 
                onClick={handleCreateUser} 
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? "Creating Account..." : "Create Complete User Account"}
              </Button>
              
              {createdCredentials && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ User Created Successfully!
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                      <strong>Email:</strong> {createdCredentials.email}
                    </div>
                    <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                      <strong>Username:</strong> {createdCredentials.username}
                    </div>
                    <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                      <strong>Password:</strong> {createdCredentials.password}
                    </div>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    Share these credentials with the user. They can sign in immediately!
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setCreatedCredentials(null)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({users?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-medium">{user.name || "No Name"}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={user.role === "owner" ? "default" : "secondary"}>
                        {user.role || "No Role"}
                      </Badge>
                      {user.isStoreOps && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Store Ops
                        </Badge>
                      )}
                      {user.tokenIdentifier?.startsWith("pending_") && (
                        <Badge variant="outline">Pending Sign-in</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {user.orgName && <span>Org: {user.orgName}</span>}
                    {user.orgName && user.franchiseName && <span> • </span>}
                    {user.franchiseName && <span>Franchise: {user.franchiseName}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!users || users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found. Create your first user profile above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>User Account Creation Guide</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Owner Operations Portal</h4>
              <ul className="text-sm space-y-1">
                <li>• Sales analytics & reporting</li>
                <li>• Inventory management</li>
                <li>• Upload tools & data processing</li>
                <li>• Budget tracking & chat AI</li>
                <li>• Full business intelligence</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">Store Operations Portal</h4>
              <ul className="text-sm space-y-1">
                <li>• Daily operational checklists</li>
                <li>• Store cleaning & maintenance</li>
                <li>• Returns & callback tracking</li>
                <li>• Close-dated inventory alerts</li>
                <li>• Rep performance tracking</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border">
            <p className="text-green-800 dark:text-green-200 text-sm">
              <strong>✅ Automated Setup:</strong> This creates complete accounts with both Clerk authentication and Convex profiles. 
              Users can sign in immediately with the credentials provided.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}