import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { UserPlus, Settings, Trash2, Crown, User, Shield } from "lucide-react";
import { AVAILABLE_PAGES, PAGE_DISPLAY_NAMES } from "../../convex/accessControl";
import { PageAccessGuard } from "~/components/access/PageAccessGuard";

export async function loader({ request }: LoaderFunctionArgs) {
  const { userId } = await getAuth({ request });
  
  if (!userId) {
    throw redirect("/sign-in");
  }
  
  return {};
}

export default function TeamManagementPage() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  const currentUser = useQuery(api.users.getCurrentUser);
  const teamMembers = useQuery(api.users.getTeamMembers);
  const updatePermissions = useMutation(api.users.updateMemberPermissions);
  const removeMember = useMutation(api.users.removeMember);

  const handleInviteMember = async () => {
    // For now, this is a placeholder since we'd need email invitation system
    // In a real implementation, this would send an invitation email
    alert(`Invitation would be sent to ${inviteEmail} for ${inviteName}`);
    setIsInviteDialogOpen(false);
    setInviteEmail("");
    setInviteName("");
    setSelectedPages([]);
  };

  const handleUpdatePermissions = async () => {
    if (!selectedMember) return;

    try {
      await updatePermissions({
        userId: selectedMember._id,
        allowedPages: selectedPages,
      });
      setIsManageDialogOpen(false);
      setSelectedMember(null);
      setSelectedPages([]);
    } catch (error) {
      console.error("Failed to update permissions:", error);
      alert("Failed to update permissions. Please try again.");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member? They will lose access to all data.")) {
      try {
        await removeMember({ userId: memberId });
      } catch (error) {
        console.error("Failed to remove member:", error);
        alert("Failed to remove member. Please try again.");
      }
    }
  };

  const openManageDialog = (member: any) => {
    setSelectedMember(member);
    setSelectedPages(member.allowedPages || []);
    setIsManageDialogOpen(true);
  };

  // Only owners can access team management
  if (currentUser?.role !== "owner") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Access Denied</h3>
            <p className="text-muted-foreground">
              Only organization owners can manage team members.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageAccessGuard pagePath="/settings">
      <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your organization's team members and their permissions.
            </p>
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Invite a new member to your organization with specific page permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Page Access Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_PAGES.map((page) => (
                      <div key={page} className="flex items-center space-x-2">
                        <Checkbox
                          id={page}
                          checked={selectedPages.includes(page)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPages([...selectedPages, page]);
                            } else {
                              setSelectedPages(selectedPages.filter(p => p !== page));
                            }
                          }}
                        />
                        <Label htmlFor={page} className="text-sm">
                          {PAGE_DISPLAY_NAMES[page]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim() || !inviteName.trim()}
                  className="w-full"
                >
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {teamMembers?.length || 0} member(s) in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers?.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {member.role === "owner" ? (
                        <Crown className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <User className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{member.name || "Unknown"}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                          {member.role === "owner" ? "Owner" : "Member"}
                        </Badge>
                        {member.role === "member" && (
                          <Badge variant="outline">
                            {member.allowedPages?.length || 0} page(s) access
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member._id !== currentUser?._id && member.role === "member" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openManageDialog(member)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </>
                    )}
                    {member._id === currentUser?._id && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Member Permissions</DialogTitle>
              <DialogDescription>
                Update page access permissions for {selectedMember?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Page Access Permissions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PAGES.map((page) => (
                    <div key={page} className="flex items-center space-x-2">
                      <Checkbox
                        id={`manage-${page}`}
                        checked={selectedPages.includes(page)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPages([...selectedPages, page]);
                          } else {
                            setSelectedPages(selectedPages.filter(p => p !== page));
                          }
                        }}
                      />
                      <Label htmlFor={`manage-${page}`} className="text-sm">
                        {PAGE_DISPLAY_NAMES[page]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsManageDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdatePermissions} className="flex-1">
                  Update Permissions
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </PageAccessGuard>
  );
}