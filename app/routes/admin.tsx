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
    orgId: "",
    franchiseId: "",
    createNewFranchise: false,
    role: "member" as "owner" | "member",
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
      if (!newUser.email || !newUser.username || !newUser.password || !newUser.name) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate franchise assignment
      if (!newUser.createNewFranchise && !newUser.franchiseId) {
        toast.error("Please select an existing franchise or choose to create a new one");
        return;
      }

      // If creating new franchise, orgId is required
      if (newUser.createNewFranchise && !newUser.orgId) {
        toast.error("Please select an organization when creating a new franchise");
        return;
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
          orgId: newUser.createNewFranchise ? newUser.orgId : undefined,
          franchiseId: newUser.createNewFranchise ? undefined : newUser.franchiseId,
          createNewFranchise: newUser.createNewFranchise,
          role: newUser.role,
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

  const allPages = [
    "/dashboard",
    "/upload", 
    "/sales",
    "/inventory",
    "/reports",
    "/budget",
    "/settings",
    "/chat"
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create User Profile</DialogTitle>
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

                  {/* Franchise Assignment Options */}
                  <div className="space-y-6">
                    <Label>Franchise Assignment *</Label>
                    
                    <div className="space-y-4">
                      {/* Create New Franchise Option */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="createNew"
                          name="franchiseOption"
                          checked={newUser.createNewFranchise}
                          onChange={() => setNewUser(prev => ({ 
                            ...prev, 
                            createNewFranchise: true, 
                            franchiseId: "",
                            role: "owner"
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="createNew" className="font-normal">
                          Create New Franchise (Owner)
                        </Label>
                      </div>

                      {newUser.createNewFranchise && (
                        <div className="ml-7 mt-3">
                          <div className="space-y-2">
                            <Label htmlFor="org">Organization *</Label>
                            <Select 
                              value={newUser.orgId} 
                              onValueChange={(value) => setNewUser(prev => ({ ...prev, orgId: value }))}
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
                        </div>
                      )}

                      {/* Join Existing Franchise Option */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="joinExisting"
                          name="franchiseOption"
                          checked={!newUser.createNewFranchise}
                          onChange={() => setNewUser(prev => ({ 
                            ...prev, 
                            createNewFranchise: false, 
                            orgId: "",
                            role: "member"
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="joinExisting" className="font-normal">
                          Add to Existing Franchise (Member)
                        </Label>
                      </div>

                      {!newUser.createNewFranchise && (
                        <div className="ml-7 mt-3 space-y-2">
                          <Label htmlFor="franchise">Select Franchise *</Label>
                          <Select 
                            value={newUser.franchiseId} 
                            onValueChange={(value) => setNewUser(prev => ({ ...prev, franchiseId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select existing franchise" />
                            </SelectTrigger>
                            <SelectContent>
                              {franchises?.map((franchise) => (
                                <SelectItem key={franchise._id} value={franchise._id}>
                                  {franchise.name} ({franchise.orgName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role is automatically determined by franchise choice */}
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <Label className="text-sm font-medium">Assigned Role</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {newUser.createNewFranchise 
                        ? "👑 Owner - Full access to new franchise" 
                        : "👤 Member - Limited access to selected franchise"
                      }
                    </p>
                  </div>

                  {!newUser.createNewFranchise && (
                    <div>
                      <Label>Allowed Pages</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {allPages.map((page) => (
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

                  <Button 
                    onClick={handleCreateUser} 
                    className="w-full"
                    disabled={isCreatingUser}
                  >
                    {isCreatingUser ? "Creating Account..." : "Create Complete User Account"}
                  </Button>
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
                    {allPages.map((page) => (
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
              <DialogTitle>✅ User Created Successfully!</DialogTitle>
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
              </div>
              <p className="text-sm text-muted-foreground">
                Share these credentials with the user. They can sign in immediately!
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