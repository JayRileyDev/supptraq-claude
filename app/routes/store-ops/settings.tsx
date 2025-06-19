import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Settings } from "lucide-react";

export default function StoreOpsSettings() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store Operations Settings</h1>
          <p className="text-muted-foreground">Manage your store operations preferences and configuration</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Store settings and configuration options will be available here.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Configure how you receive notifications for store operations.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">General system settings for the store operations portal.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}