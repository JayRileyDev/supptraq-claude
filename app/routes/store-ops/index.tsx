import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { 
  CheckCircle, 
  AlertTriangle, 
  Phone, 
  DollarSign,
  Package,
  Calendar,
  TrendingUp,
  Clock
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { motion } from "framer-motion";

export default function StoreOpsDashboard() {
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // TODO: Replace with real queries once we have data
  const pendingCallbacks = 5;
  const expiringProducts = 12;
  const budgetRemaining = 2500;
  const checklistProgress = 75;

  const quickStats = [
    {
      title: "Checklist Progress",
      value: `${checklistProgress}%`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/store-ops/daily-checklist"
    },
    {
      title: "Expiring Products",
      value: expiringProducts,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      link: "/store-ops/close-dated"
    },
    {
      title: "Pending Callbacks",
      value: pendingCallbacks,
      icon: Phone,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/store-ops/callbacks"
    },
    {
      title: "Budget Remaining",
      value: `$${budgetRemaining}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/store-ops/budget"
    }
  ];

  const recentActivity = [
    { icon: CheckCircle, text: "Daily checklist completed by JR", time: "2 hours ago" },
    { icon: Package, text: "Return processed for Protein Powder", time: "3 hours ago" },
    { icon: Phone, text: "Customer callback completed", time: "5 hours ago" },
    { icon: AlertTriangle, text: "3 products expiring this week", time: "Today" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Store Operations Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening in your store today.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to={stat.link}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Complete Daily Checklist</p>
                    <p className="text-sm text-gray-500">Morning tasks pending</p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link to="/store-ops/daily-checklist">View</Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Update Tablet Counts</p>
                    <p className="text-sm text-gray-500">5 brands due for counting</p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link to="/store-ops/tablet-counts">View</Link>
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Follow up on Callbacks</p>
                    <p className="text-sm text-gray-500">{pendingCallbacks} customers waiting</p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link to="/store-ops/callbacks">View</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="rounded-full bg-gray-100 p-2">
                    <activity.icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
              <Link to="/store-ops/returns">
                <Package className="h-8 w-8" />
                <span>Process Return</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
              <Link to="/store-ops/callbacks">
                <Phone className="h-8 w-8" />
                <span>Add Callback</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
              <Link to="/store-ops/close-dated">
                <AlertTriangle className="h-8 w-8" />
                <span>Update Expiries</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}