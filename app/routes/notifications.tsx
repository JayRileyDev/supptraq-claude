import { motion } from "framer-motion";
import { Bell, Check, X, AlertTriangle, Info } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { PageAccessGuard } from "~/components/access/PageAccessGuard";

const notifications = [
  {
    id: 1,
    type: "info",
    title: "Low Stock Alert",
    message: "Nike Air Force 1 inventory is running low (5 items remaining)",
    time: "2 minutes ago",
    read: false
  },
  {
    id: 2,
    type: "success",
    title: "Sale Completed",
    message: "New sale recorded: $249.99 - Jordan Retro 4",
    time: "15 minutes ago",
    read: false
  },
  {
    id: 3,
    type: "warning",
    title: "Transfer Pending",
    message: "Inter-store transfer from Store A to Store B requires approval",
    time: "1 hour ago",
    read: true
  }
];

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return <Check className="h-4 w-4 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "error":
      return <X className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

export default function NotificationsPage() {
  return (
    <PageAccessGuard pagePath="/notifications">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen page-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2 glow-text">
          Notifications
        </h1>
        <p className="text-muted-foreground">
          Stay updated with your latest alerts and messages
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-4">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className={`glow-card card-shadow hover:shadow-lg transition-all duration-300 ${
              !notification.read ? "border-primary/20 bg-primary/5" : ""
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getIcon(notification.type)}
                    <div>
                      <CardTitle className="text-base">{notification.title}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {notification.time}
                      </CardDescription>
                    </div>
                  </div>
                  {!notification.read && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground">{notification.message}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline">
                    Mark as Read
                  </Button>
                  <Button size="sm" variant="ghost">
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
            <p className="text-muted-foreground">You're all caught up!</p>
          </motion.div>
        )}
      </div>
    </div>
    </PageAccessGuard>
  );
}