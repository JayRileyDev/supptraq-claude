import { useQuery } from "convex/react";
import { useUser } from "@clerk/react-router";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Package, Store, AlertTriangle, ArrowUpRight, ArrowDownRight, Users, Upload } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  description,
  delay = 0 
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  description?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group"
    >
      <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
            <Icon className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors duration-300" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mb-2 glow-text">
            {value}
          </div>
          {change && (
            <div className="flex items-center text-sm">
              <div className={cn(
                "flex items-center px-2 py-1 rounded-full text-xs font-medium",
                changeType === "positive" && "bg-green-500/10 text-green-400 border border-green-500/20",
                changeType === "negative" && "bg-red-500/10 text-red-400 border border-red-500/20",
                changeType === "neutral" && "bg-muted/50 text-muted-foreground border border-border"
              )}>
                {changeType === "positive" && (
                  <TrendingUp className="mr-1 h-3 w-3" />
                )}
                {changeType === "negative" && (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                <span>{change}</span>
              </div>
              {description && (
                <span className="text-muted-foreground ml-2 text-xs">
                  {description}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SalesChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Forecast</CardTitle>
            <CardDescription className="text-muted-foreground">Daily sales performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sales data available</p>
                <p className="text-sm">Upload sales data to see trends</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const maxSales = Math.max(...data.map(d => d.sales));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="group"
    >
      <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Forecast
              </CardTitle>
              <CardDescription className="text-muted-foreground">Daily revenue total across all stores</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              7 Days
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between space-x-3 h-48 px-2">
            {data.map((day, index) => (
              <motion.div 
                key={day.date} 
                className="flex-1 flex flex-col items-center group/bar"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
              >
                <div className="relative w-full flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-primary to-accent rounded-t-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 hover:scale-110 relative overflow-hidden"
                    style={{
                      height: `${(day.sales / maxSales) * 160}px`,
                      minHeight: day.sales > 0 ? "8px" : "4px"
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 font-medium">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                  </div>
                  <div className="text-xs font-bold text-foreground mt-1">
                    ${Math.round(day.sales).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent"></div>
              <span className="text-muted-foreground">Revenue Growth</span>
            </div>
            <div className="text-foreground font-medium">
              +{Math.round(((data[data.length - 1]?.sales || 0) / (data[0]?.sales || 1) - 1) * 100)}% vs last period
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ActionItem({ title, count, type, delay = 0 }: {
  title: string;
  count: number;
  type: "warning" | "info" | "success";
  delay?: number;
}) {
  const icons = {
    warning: AlertTriangle,
    info: Package,
    success: TrendingUp
  };
  
  const colors = {
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    info: "text-primary bg-primary/10 border-primary/20", 
    success: "text-green-400 bg-green-500/10 border-green-500/20"
  };
  
  const Icon = icons[type];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-card to-card/50 backdrop-blur-sm"
    >
      <div className="flex items-center space-x-4">
        <div className={cn("p-3 rounded-xl border transition-all duration-300 group-hover:scale-110", colors[type])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">
            {title === "Underperforming Stores" ? `${count} stores need attention` :
             title === "Underperforming Sales Reps" ? `${count} reps below benchmark` :
             `${count} items need attention`}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-all duration-200">
        View
        <ArrowUpRight className="ml-1 h-3 w-3" />
      </Button>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const userId = user?.id;

  const dashboardData = useQuery(
    api.dashboardQueries.getDashboardOverview,
    userId ? { userId } : "skip"
  );

  const topPerformers = useQuery(
    api.dashboardQueries.getTopPerformers,
    userId ? { userId } : "skip"
  );

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen page-background">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Average Ticket Size"
          value={`$${(dashboardData.metrics.totalSales / 100).toFixed(2)}`}
          change="+5.2%"
          changeType="positive"
          icon={DollarSign}
          description="vs last period"
          delay={0.1}
        />
        <MetricCard
          title="Total Sales Reps"
          value="24"
          change="2 new"
          changeType="positive"
          icon={Users}
          description="active reps"
          delay={0.2}
        />
        <MetricCard
          title="Total Stores"
          value={dashboardData.metrics.activeStores.toString()}
          change="1 new"
          changeType="positive"
          icon={Store}
          description="franchise locations"
          delay={0.3}
        />
        <MetricCard
          title="Gross Profit %"
          value="41.7%"
          change="+2.3%"
          changeType="positive"
          icon={TrendingUp}
          description="vs last period"
          delay={0.4}
        />
      </div>

      {/* Charts and Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Revenue Chart - 3/5 width */}
        <div className="lg:col-span-3">
          <SalesChart data={dashboardData.salesTrend} />
        </div>

        {/* Recent Activities - 2/5 width */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Recent Uploads
                  </CardTitle>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    Live
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground">Latest data uploads and imports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-60 sm:max-h-80 overflow-y-auto">
                {!topPerformers || topPerformers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent uploads</p>
                    <p className="text-sm">Upload data to see activity</p>
                  </div>
                ) : (
                  // Mock recent uploads
                  [
                    { type: "Tickets", filename: "June Ticket Upload", store: "Store #3", user: "Sarah Johnson", time: "12 mins ago", avatar: "SJ" },
                    { type: "Merch", filename: "Q2 Inventory Import", store: "Corporate", user: "Mike Chen", time: "2 hours ago", avatar: "MC" },
                    { type: "Budget", filename: "Monthly Budget Data", store: "Store #1", user: "Lisa Brown", time: "4 hours ago", avatar: "LB" },
                    { type: "Tickets", filename: "Weekend Sales Import", store: "Store #2", user: "Alex Rodriguez", time: "1 day ago", avatar: "AR" },
                    { type: "Merch", filename: "New Product Catalog", store: "Corporate", user: "Emma Wilson", time: "2 days ago", avatar: "EW" },
                  ].map((upload, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-start space-x-3 p-3 rounded-xl hover:bg-muted/30 transition-all duration-200 group"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-medium shadow-lg">
                          {upload.avatar}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                            {upload.type}
                          </Badge>
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {upload.filename}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {upload.store} • Uploaded by {upload.user}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {upload.time}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Task List Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Action Items
                </CardTitle>
                <CardDescription className="text-muted-foreground">Tasks requiring your attention</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/10 text-xs sm:text-sm">
                  All Tasks
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs sm:text-sm">
                  Done
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs sm:text-sm">
                  Due Tasks
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ActionItem
              title="Underperforming Stores"
              count={3}
              type="warning"
              delay={1.0}
            />
            <ActionItem
              title="Underperforming Sales Reps"
              count={7}
              type="warning"
              delay={1.1}
            />
            {false && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All stores and reps performing well</p>
                <p className="text-sm">Everyone is meeting benchmarks!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
