import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { redirect, useLoaderData, Form } from "react-router";
import type { Route } from "./+types/admin";
import { requireDevAuth } from "~/lib/dev-auth";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Users, Plus, Edit, Settings, Building, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_URL!.replace(
  /.cloud$/,
  ".site"
);

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

// Server-side dev authentication
export async function loader({ request }: Route.LoaderArgs) {
  console.log("🔐 Admin page loader - checking dev authentication");
  
  try {
    const { username } = requireDevAuth(request);
    console.log(`✅ Dev authenticated as: ${username}`);
    return { devUser: username };
  } catch (error) {
    console.log("❌ Dev authentication failed - redirecting to dev login");
    throw redirect("/dev-login");
  }
}

// Dev logout action
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "logout") {
    const response = redirect("/dev-login");
    response.headers.set(
      "Set-Cookie",
      "dev_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict"
    );
    return response;
  }
  
  return null;
}

export default function AdminPage() {
  const { devUser } = useLoaderData<typeof loader>();
  // User creation state
  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    password: "",
    name: "",
    // Organization/Franchise/Store
    orgId: "",
    franchiseId: "",
    storeId: "",
    createNewFranchise: false,
    role: "member" as "owner" | "member",
    isStoreOps: false,
    allowedPages: [] as string[],
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);

  // Organization creation state
  const [newOrg, setNewOrg] = useState({ name: "" });
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false);

  // Edit user state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);

  // Data queries (dev authenticated via loader)
  const users = useQuery(api.admin.getAllUsers);
  const organizations = useQuery(api.admin.getOrganizations);
  const franchises = useQuery(api.admin.getAllFranchises);
  const storeIds = useQuery(api.admin.getStoreIdsByFranchise, 
    newUser.franchiseId ? { franchiseId: newUser.franchiseId as any } : "skip"
  );
  
  const createOrganization = useMutation(api.admin.createOrganization);
  const editUser = useMutation(api.admin.editUser);
  const deleteUser = useMutation(api.admin.deleteUser);

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
      // Validate required fields
      if (!newUser.email || !newUser.username || !newUser.password || !newUser.name) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate organization and franchise for Store Ops
      if (newUser.isStoreOps) {
        if (!newUser.orgId || !newUser.franchiseId) {
          toast.error("Organization and franchise are required for Store Operations Portal users");
          return;
        }
        if (!newUser.storeId) {
          toast.error("Store location is required for Store Operations Portal users");
          return;
        }
      } else {
        // Validate organization for Owner Ops
        if (!newUser.orgId) {
          toast.error("Organization is required");
          return;
        }
        
        // Validate franchise assignment for Owner Ops
        if (!newUser.createNewFranchise && !newUser.franchiseId) {
          toast.error("Please select an existing franchise or choose to create a new one");
          return;
        }
      }

      setIsCreatingUser(true);

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
          // Store ID for Store Ops
          storeId: newUser.isStoreOps ? newUser.storeId : undefined,
          // Organization/Franchise - always send both for proper validation
          orgId: newUser.orgId,
          franchiseId: newUser.franchiseId,
          createNewFranchise: newUser.createNewFranchise && !newUser.isStoreOps,
          role: newUser.role,
          isStoreOps: newUser.isStoreOps,
          allowedPages: newUser.role === "member" ? newUser.allowedPages : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const result = await response.json();

      if (result.success) {
        setCreatedCredentials(result.credentials);
        const portalType = newUser.isStoreOps ? "Store Operations" : "Owner Operations";
        toast.success(`${portalType} Portal user created successfully!`);
        
        // Reset form
        setNewUser({
          email: "",
          username: "",
          password: "",
          name: "",
          orgId: "",
          franchiseId: "",
          storeId: "",
          createNewFranchise: false,
          role: "member",
          isStoreOps: false,
          allowedPages: [],
        });
        setShowCreateUserDialog(false);
      } else {
        throw new Error(result.error || "Failed to create user");
      }
    } catch (error: any) {
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      if (!newOrg.name) {
        toast.error("Please enter an organization name");
        return;
      }

      setIsCreatingOrg(true);
      
      await createOrganization({ name: newOrg.name });
      
      toast.success("Organization created successfully!");
      setNewOrg({ name: "" });
      setShowCreateOrgDialog(false);
    } catch (error: any) {
      toast.error(`Failed to create organization: ${error.message}`);
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser({
      userId: user._id,
      name: user.name || "",
      email: user.email || "",
      role: user.role || "member",
      allowedPages: user.allowedPages || [],
    });
    setShowEditUserDialog(true);
  };

  const handleSaveEditUser = async () => {
    try {
      if (!editingUser.name || !editingUser.email) {
        toast.error("Name and email are required");
        return;
      }

      setIsEditingUser(true);

      await editUser({
        userId: editingUser.userId,
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        allowedPages: editingUser.role === "member" ? editingUser.allowedPages : undefined,
      });

      toast.success("User updated successfully!");
      setShowEditUserDialog(false);
      setEditingUser(null);
    } catch (error: any) {
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsEditingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteUser({ userId: userId as Id<"users"> });
      toast.success(`User ${userName || "User"} deleted successfully!`);
    } catch (error: any) {
      toast.error(`Failed to delete user: ${error.message}`);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, organizations, and franchises</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">Developer Access</p>
            <p className="text-xs text-muted-foreground">Logged in as: {devUser}</p>
          </div>
          <Form method="post">
            <input type="hidden" name="intent" value="logout" />
            <Button variant="outline" size="sm" type="submit">
              Logout
            </Button>
          </Form>
        </div>
      </div>


      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="franchises">Franchises</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">User Management</h2>
            
            <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Complete User Account</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Creates both Clerk authentication and Convex profile with immediate access
                  </p>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Portal Type Selection */}
                  <div className="space-y-3">
                    <Label>Portal Type *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        !newUser.isStoreOps 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }`}>
                        <input
                          type="radio"
                          name="portalType"
                          checked={!newUser.isStoreOps}
                          onChange={() => setNewUser(prev => ({ 
                            ...prev, 
                            isStoreOps: false, 
                            allowedPages: []
                          }))}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          !newUser.isStoreOps ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                          {!newUser.isStoreOps && (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Owner Operations Portal</div>
                          <div className="text-xs text-muted-foreground mt-1">Full business analytics & management</div>
                        </div>
                      </label>
                      <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        newUser.isStoreOps 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }`}>
                        <input
                          type="radio"
                          name="portalType"
                          checked={newUser.isStoreOps}
                          onChange={() => setNewUser(prev => ({ 
                            ...prev, 
                            isStoreOps: true, 
                            role: "member", 
                            allowedPages: ["/store-ops"],
                            createNewFranchise: false
                          }))}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          newUser.isStoreOps ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                          {newUser.isStoreOps && (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Store Operations Portal</div>
                          <div className="text-xs text-muted-foreground mt-1">Daily operations & checklists</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Basic User Information */}
                  {newUser.isStoreOps ? (
                    // Store Operations Fields
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Store Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="sherwood@supplementking.com"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Email address for store operations access
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="username">Store Username *</Label>
                          <Input
                            id="username"
                            value={newUser.username}
                            onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="sherwood.store"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Username for store operations login
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Store Name *</Label>
                          <Input
                            id="name"
                            value={newUser.name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Sherwood Park Store"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Display name for the store location
                          </p>
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
                      </div>
                    </>
                  ) : (
                    // Owner Operations Fields
                    <>
                      <div className="grid grid-cols-2 gap-4">
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
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
                      </div>
                    </>
                  )}

                  {/* Organization Selection */}
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
                    
                    {newUser.isStoreOps ? (
                      // Store Ops users must be assigned to existing franchise
                      <Select 
                        value={newUser.franchiseId} 
                        onValueChange={(value) => setNewUser(prev => ({ ...prev, franchiseId: value }))}
                        disabled={!newUser.orgId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select franchise" />
                        </SelectTrigger>
                        <SelectContent>
                          {franchises?.map((franchise) => (
                            <SelectItem key={franchise._id} value={franchise._id}>
                              {franchise.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      // Owner Ops users can create new or join existing
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <label className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            !newUser.createNewFranchise 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }`}>
                            <input
                              type="radio"
                              name="franchiseAssignment"
                              checked={!newUser.createNewFranchise}
                              onChange={() => setNewUser(prev => ({ ...prev, createNewFranchise: false, franchiseId: "" }))}
                              className="hidden"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              !newUser.createNewFranchise ? 'border-primary' : 'border-muted-foreground'
                            }`}>
                              {!newUser.createNewFranchise && (
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                              )}
                            </div>
                            <span className="text-sm">Assign to existing franchise</span>
                          </label>
                          <label className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            newUser.createNewFranchise 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }`}>
                            <input
                              type="radio"
                              name="franchiseAssignment"
                              checked={newUser.createNewFranchise}
                              onChange={() => setNewUser(prev => ({ ...prev, createNewFranchise: true, franchiseId: "" }))}
                              className="hidden"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              newUser.createNewFranchise ? 'border-primary' : 'border-muted-foreground'
                            }`}>
                              {newUser.createNewFranchise && (
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                              )}
                            </div>
                            <span className="text-sm">Create new franchise</span>
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
                      </>
                    )}
                  </div>

                  {/* Role Selection for Owner Operations */}
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

                  {/* Page Permissions for Owner Operations Members */}
                  {!newUser.isStoreOps && newUser.role === "member" && (
                    <div>
                      <Label>Allowed Pages</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {ownerOpsPages.map((page) => (
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

                  {/* Store ID Selection for Store Operations */}
                  {newUser.isStoreOps && newUser.franchiseId && (
                    <div>
                      <Label htmlFor="storeId">Store Location *</Label>
                      <Select 
                        value={newUser.storeId} 
                        onValueChange={(value) => setNewUser(prev => ({ ...prev, storeId: value }))}
                        disabled={!newUser.franchiseId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select store location" />
                        </SelectTrigger>
                        <SelectContent>
                          {storeIds?.map((store) => (
                            <SelectItem key={store.store_id} value={store.store_id}>
                              {store.display_name} ({store.store_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Store location this user will manage operations for
                      </p>
                    </div>
                  )}

                  {/* Store Operations Info */}
                  {newUser.isStoreOps && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border">
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

                  {/* Create User Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={handleCreateUser} 
                      className="w-full"
                      disabled={isCreatingUser}
                    >
                      {isCreatingUser ? "Creating Account..." : "Create Complete User Account"}
                    </Button>
                  </div>

                  {/* Success Credentials Display */}
                  {createdCredentials && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        ✅ User Created Successfully!
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                          <strong>{newUser.isStoreOps ? 'Store Email:' : 'Email:'}</strong> {createdCredentials.email}
                        </div>
                        <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                          <strong>{newUser.isStoreOps ? 'Store Username:' : 'Username:'}</strong> {createdCredentials.username}
                        </div>
                        <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                          <strong>Password:</strong> {createdCredentials.password}
                        </div>
                        <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                          <strong>{newUser.isStoreOps ? 'Store Name:' : 'Name:'}</strong> {createdCredentials.name}
                        </div>
                        <div className="font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                          <strong>Portal:</strong> {createdCredentials.portalType}
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{user.name || user.email}</strong>? 
                              This will permanently delete the user from both Clerk and Convex, 
                              including all their data, franchise, and subscriptions. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user._id, user.name || user.email || "Unknown")}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Organization Management</h2>
            
            <Dialog open={showCreateOrgDialog} onOpenChange={setShowCreateOrgDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Organization</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ name: e.target.value })}
                      placeholder="Supplement King"
                    />
                  </div>

                  <Button 
                    onClick={handleCreateOrganization} 
                    className="w-full"
                    disabled={isCreatingOrg}
                  >
                    {isCreatingOrg ? "Creating..." : "Create Organization"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Organizations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                All Organizations ({organizations?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations?.map((org) => (
                  <div key={org._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{org.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(org.createdAt).toLocaleDateString()}
                      </p>
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
                {!organizations || organizations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No organizations found. Create your first organization above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Franchises Tab */}
        <TabsContent value="franchises" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Franchise Management</h2>
          </div>

          {/* All Franchises List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                All Franchises ({franchises?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {franchises?.map((franchise) => (
                  <div key={franchise._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium">{franchise.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {franchise.franchiseId}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {franchise.orgName || "No Organization"}
                          </Badge>
                          {franchise.ownerName && (
                            <Badge variant="secondary">
                              Owner: {franchise.ownerName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span>Created: {new Date(franchise.createdAt).toLocaleDateString()}</span>
                        {franchise.ownerEmail && (
                          <>
                            <span> • </span>
                            <span>Contact: {franchise.ownerEmail}</span>
                          </>
                        )}
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
                {!franchises || franchises.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No franchises found. Franchises are created automatically when you create users.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Franchises by Organization */}
          <Card>
            <CardHeader>
              <CardTitle>Franchises by Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {organizations?.map((org) => {
                  const orgFranchises = franchises?.filter(f => f.orgId === org._id) || [];
                  return (
                    <div key={org._id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-lg">{org.name}</h4>
                        <Badge variant="outline">
                          {orgFranchises.length} franchise{orgFranchises.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="pl-4 border-l-2 border-muted space-y-2">
                        {orgFranchises.length > 0 ? (
                          orgFranchises.map((franchise) => (
                            <div key={franchise._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{franchise.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {franchise.ownerName ? `Owner: ${franchise.ownerName}` : "No owner assigned"}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {franchise.franchiseId}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No franchises in this organization yet.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!organizations || organizations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No organizations found. Create an organization first to see franchises grouped by organization.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Full Name *</Label>
                <Input
                  id="editName"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser((prev: any) => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="editEmail">Email Address *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser((prev: any) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <Label htmlFor="editRole">Role *</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser((prev: any) => ({ ...prev, role: value as "owner" | "member" }))}
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

              {editingUser.role === "member" && (
                <div>
                  <Label>Allowed Pages</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {ownerOpsPages.map((page) => (
                      <label key={page} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editingUser.allowedPages.includes(page)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingUser((prev: any) => ({ 
                                ...prev, 
                                allowedPages: [...prev.allowedPages, page] 
                              }));
                            } else {
                              setEditingUser((prev: any) => ({ 
                                ...prev, 
                                allowedPages: prev.allowedPages.filter((p: string) => p !== page) 
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

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowEditUserDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEditUser} 
                  disabled={isEditingUser}
                  className="flex-1"
                >
                  {isEditingUser ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Success Dialog for Created Credentials */}
      {createdCredentials && (
        <Dialog open={!!createdCredentials} onOpenChange={() => setCreatedCredentials(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>✅ {createdCredentials.portalType || "User"} Account Created!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="font-mono bg-muted p-3 rounded border">
                  <strong>Email:</strong> {createdCredentials.email}
                </div>
                <div className="font-mono bg-muted p-3 rounded border">
                  <strong>Username:</strong> {createdCredentials.username}
                </div>
                <div className="font-mono bg-muted p-3 rounded border">
                  <strong>Password:</strong> {createdCredentials.password}
                </div>
                {createdCredentials.name && (
                  <div className="font-mono bg-muted p-3 rounded border">
                    <strong>{createdCredentials.storeId ? "Store Name" : "Full Name"}:</strong> {createdCredentials.name}
                  </div>
                )}
                {createdCredentials.storeId && (
                  <div className="font-mono bg-muted p-3 rounded border">
                    <strong>Store ID:</strong> {createdCredentials.storeId}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Share these credentials with the {createdCredentials.storeId ? "store manager" : "user"}. They can sign in immediately and access their {createdCredentials.portalType}!
              </p>
              <Button onClick={() => setCreatedCredentials(null)} className="w-full">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}