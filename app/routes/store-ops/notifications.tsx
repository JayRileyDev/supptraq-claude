import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Bell, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function StoreOpsNotifications() {
  // Mock notifications data - replace with real data from Convex
  const notifications = [
    {
      id: 1,
      type: "success",
      title: "Daily Checklist Completed",
      message: "All daily checklist items have been completed successfully.",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      type: "warning",
      title: "Close-Dated Items Found",
      message: "5 products are approaching expiration date. Review required.",
      time: "4 hours ago",
      read: false
    },
    {
      id: 3,
      type: "info",
      title: "Callback Reminder",
      message: "3 customer callbacks are scheduled for today.",
      time: "1 day ago",
      read: true
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with store operations alerts and reminders</p>
          </div>
        </div>
        <Button variant="outline">
          Mark All Read
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`${getBgColor(notification.type)} ${!notification.read ? 'border-l-4' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{notification.title}</h3>
                    <span className="text-sm text-muted-foreground">{notification.time}</span>
                  </div>
                  <p className="text-foreground mt-1">{notification.message}</p>
                  {!notification.read && (
                    <Button variant="ghost" size="sm" className="mt-2">
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
            <p className="text-muted-foreground">You're all caught up! New notifications will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}