import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  DollarSign,
  Package,
  Calendar,
  TrendingUp,
  Clock,
  Users,
  Target,
  ArrowUpRight,
  ArrowRight,
  Star,
  Activity
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { memo, useMemo } from "react";

// Color utility function
const getColorClasses = (color: string) => {
  const colors = {
    emerald: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800"
    },
    amber: {
      bg: "bg-amber-500/10 dark:bg-amber-500/20", 
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800"
    },
    blue: {
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      text: "text-blue-600 dark:text-blue-400", 
      border: "border-blue-200 dark:border-blue-800"
    },
    violet: {
      bg: "bg-violet-500/10 dark:bg-violet-500/20",
      text: "text-violet-600 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-800"
    }
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

// Memoized components for better performance
const StatsCard = memo(({ stat, index }: { stat: any; index: number }) => {
  const colors = getColorClasses(stat.color);
  
  return (
    <motion.div
      key={stat.title}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="relative group hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <span className={cn(
                  "text-xs font-medium flex items-center gap-1",
                  stat.trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.trend}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </div>
            <div className={cn("p-3 rounded-xl", colors.bg, colors.border, "border")}>
              <stat.icon className={cn("w-6 h-6", colors.text)} />
            </div>
          </div>
          <Link 
            to={stat.link}
            className="absolute inset-0 rounded-lg group-hover:ring-2 group-hover:ring-primary/20 transition-all"
            prefetch="intent"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
});
StatsCard.displayName = "StatsCard";

export default function StoreOpsDashboard() {
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Mock data - replace with real queries - memoized for performance
  const stats = useMemo(() => ({
    checklistProgress: 85,
    expiringProducts: 7,
    pendingCallbacks: 3,
    budgetRemaining: 3250,
    dailyRevenue: 2840,
    customerSatisfaction: 94
  }), []);

  const quickStats = [
    {
      title: "Daily Checklist",
      value: `${stats.checklistProgress}%`,
      subtitle: "12 of 14 completed",
      icon: CheckCircle2,
      trend: "+5%",
      trendUp: true,
      color: "emerald",
      link: "/store-ops/daily-checklist"
    },
    {
      title: "Expiring Soon",
      value: stats.expiringProducts,
      subtitle: "Products this week",
      icon: AlertTriangle,
      trend: "-2",
      trendUp: true,
      color: "amber",
      link: "/store-ops/close-dated"
    },
    {
      title: "Callbacks",
      value: stats.pendingCallbacks,
      subtitle: "Pending follow-ups",
      icon: Phone,
      trend: "+1",
      trendUp: false,
      color: "blue",
      link: "/store-ops/callbacks"
    },
    {
      title: "Budget Left",
      value: `$${stats.budgetRemaining.toLocaleString()}`,
      subtitle: "This month",
      icon: DollarSign,
      trend: "78%",
      trendUp: true,
      color: "violet",
      link: "/store-ops/budget"
    }
  ];

  const todaysTasks = [
    {
      id: 1,
      title: "Morning Opening Checklist",
      description: "Complete daily opening procedures",
      priority: "high",
      completed: true,
      time: "9:00 AM",
      category: "Operations"
    },
    {
      id: 2,
      title: "Customer Callback - Sarah M.",
      description: "Follow up on protein powder inquiry",
      priority: "medium",
      completed: false,
      time: "11:30 AM",
      category: "Customer Service"
    },
    {
      id: 3,
      title: "Inventory Count - Supplements",
      description: "Weekly tablet count verification",
      priority: "medium",
      completed: false,
      time: "2:00 PM",
      category: "Inventory"
    },
    {
      id: 4,
      title: "Close-Dated Review",
      description: "Check expiring products",
      priority: "high",
      completed: false,
      time: "4:00 PM",
      category: "Quality Control"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: "success",
      title: "Daily checklist completed",
      description: "All morning tasks finished on time",
      time: "2 hours ago",
      user: "Store Team"
    },
    {
      id: 2,
      type: "warning",
      title: "Product expiry alert",
      description: "3 items expire within 7 days",
      time: "3 hours ago",
      user: "System"
    },
    {
      id: 3,
      type: "info",
      title: "Customer callback added",
      description: "Follow-up scheduled for tomorrow",
      time: "5 hours ago",
      user: "Sarah K."
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store Operations</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your store performance overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Activity className="w-3 h-3 mr-1" />
            Store Active
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <StatsCard key={stat.title} stat={stat} index={index} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Today's Tasks - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Today's Tasks</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {todaysTasks.filter(task => !task.completed).length} pending
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-sm",
                    task.completed ? "bg-muted/50 opacity-75" : "bg-background hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    task.completed 
                      ? "bg-emerald-500 border-emerald-500" 
                      : "border-muted-foreground/30"
                  )}>
                    {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        "font-medium text-sm",
                        task.completed ? "line-through text-muted-foreground" : "text-foreground"
                      )}>
                        {task.title}
                      </h4>
                      <Badge 
                        size="sm" 
                        className={cn("text-xs", getPriorityColor(task.priority))}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.time}
                      </span>
                      <span>{task.category}</span>
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Takes 1 column */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mt-0.5",
                    activity.type === "success" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                    activity.type === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                    activity.type === "info" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  )}>
                    {activity.user[0]}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                      <span className="text-xs text-muted-foreground">{activity.user}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Process Return", icon: Package, link: "/store-ops/returns", color: "blue" },
              { title: "Add Callback", icon: Phone, link: "/store-ops/callbacks", color: "emerald" },
              { title: "Update Expiries", icon: AlertTriangle, link: "/store-ops/close-dated", color: "amber" },
              { title: "Count Inventory", icon: TrendingUp, link: "/store-ops/tablet-counts", color: "violet" }
            ].map((action) => {
              const colors = getColorClasses(action.color);
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto flex flex-col gap-3 p-6 hover:shadow-md transition-all group"
                  asChild
                >
                  <Link to={action.link}>
                    <div className={cn("p-3 rounded-lg group-hover:scale-110 transition-transform", colors.bg)}>
                      <action.icon className={cn("w-6 h-6", colors.text)} />
                    </div>
                    <span className="font-medium">{action.title}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}