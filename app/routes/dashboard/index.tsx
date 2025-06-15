import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/react-router";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Package, Store, AlertTriangle, ArrowUpRight, ArrowDownRight, Users, Upload, Calendar, ChevronLeft, ChevronRight, RefreshCw, CalendarDays, Clock, Zap } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { useState } from "react";
import * as React from "react";

function WeeklyChange({ data, previousWeekData }: { data: any[], previousWeekData: any }) {
  const currentWeekTotal = data?.reduce((sum, day) => sum + (day.sales || 0), 0) || 0;
  const previousWeekTotal = previousWeekData?.totalRevenue || 0; // Default to 0 instead of null
  
  // If current week has revenue but no previous week data, show it as positive from $0
  const difference = currentWeekTotal - previousWeekTotal;
  const isPositive = difference >= 0;
  
  // If there's no current week revenue, show neutral state
  if (currentWeekTotal === 0) {
    return (
      <div className="text-muted-foreground font-medium">
        No revenue this period
      </div>
    );
  }
  
  return (
    <div className={`font-medium flex items-center gap-1 ${
      isPositive ? 'text-green-600' : 'text-red-600'
    }`}>
      {isPositive ? '+' : ''}${Math.abs(difference).toLocaleString()} vs previous week
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
    </div>
  );
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

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

function SalesChart({ data, weekOffset, onWeekChange, isLoading, previousWeekData }: { data: any[], weekOffset: number, onWeekChange: (offset: number) => void, isLoading?: boolean, previousWeekData?: any }) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Revenue Forecast
                </CardTitle>
                <CardDescription className="text-muted-foreground">Loading week data...</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
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
              <CardDescription className="text-muted-foreground">
                {weekOffset === 0 ? 'This week\'s daily revenue' : weekOffset === 1 ? 'Last week\'s daily revenue' : `Revenue from ${weekOffset} weeks ago`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWeekChange(weekOffset + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3">
                {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Last Week' : `${weekOffset} weeks ago`}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWeekChange(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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
                    {day.dayOfWeek || new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
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
              <span className="text-muted-foreground">Weekly Change</span>
            </div>
            <WeeklyChange data={data} previousWeekData={previousWeekData} />
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
  const [actionItemsDateRange, setActionItemsDateRange] = useState(30); // Only for action items
  const [revenueWeekOffset, setRevenueWeekOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Always use 30 days for main metrics (best balance of recency and data)
  const dashboardData = useQuery(
    api.dashboardCache.getCachedDashboardMetrics,
    userId ? { userId, dateRange: 30 } : "skip"
  );

  // Only fetch action items data if date range is different from main data
  const actionItemsData = useQuery(
    api.dashboardCache.getCachedDashboardMetrics,
    userId && actionItemsDateRange !== 30 ? { userId, dateRange: actionItemsDateRange } : "skip"
  );

  // Get revenue data for the selected week (only if not current week, otherwise use cached data)
  const revenueWeekData = useQuery(
    api.dashboardQueries.getRevenueByWeek,
    userId && revenueWeekOffset > 0 ? { userId, weekOffset: revenueWeekOffset } : "skip"
  );
  
  // Only get previous week data if we're viewing a specific week
  const previousWeekData = useQuery(
    api.dashboardQueries.getRevenueByWeek,
    userId && revenueWeekOffset >= 0 ? { userId, weekOffset: revenueWeekOffset + 1 } : "skip"
  );

  const triggerMetricsUpdate = useMutation(api.dashboardCache.triggerMetricsUpdate);
  const initializeCache = useMutation(api.dashboardCache.initializeCacheIfNeeded);

  const handleRefreshMetrics = async () => {
    if (userId) {
      setIsRefreshing(true);
      try {
        await triggerMetricsUpdate({ userId });
        // Give a moment for the cache to update
        setTimeout(() => setIsRefreshing(false), 2000);
      } catch (error) {
        setIsRefreshing(false);
      }
    }
  };

  // Initialize cache if it doesn't exist
  React.useEffect(() => {
    if (userId && !dashboardData?.cached) {
      initializeCache({ userId, dateRange: 30 });
    }
  }, [userId, dashboardData?.cached, initializeCache]);

  // Initialize action items cache only if different from main cache
  React.useEffect(() => {
    if (userId && actionItemsDateRange !== 30 && !actionItemsData?.cached) {
      initializeCache({ userId, dateRange: actionItemsDateRange });
    }
  }, [userId, actionItemsDateRange, actionItemsData?.cached, initializeCache]);

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
      {/* Premium Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>Last 30 days</span>
            </div>
            {dashboardData?.cached && dashboardData?.lastUpdated && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Updated {new Date(dashboardData.lastUpdated).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {dashboardData?.cached && (
            <Badge 
              variant="outline" 
              className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
            >
              <Zap className="h-3 w-3 mr-1" />
              Cached Data
            </Badge>
          )}
          
          <Button
            onClick={handleRefreshMetrics}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Average Ticket Size"
          value={`$${dashboardData.metrics.avgTicketSize.toFixed(2)}`}
          change={dashboardData.metrics.totalTickets > 0 ? `${dashboardData.metrics.totalTickets} tickets` : "No data"}
          changeType="neutral"
          icon={DollarSign}
          description="across all stores"
          delay={0.1}
        />
        <MetricCard
          title="Total Sales Reps"
          value={dashboardData.metrics.totalSalesReps.toString()}
          change={`${dashboardData.repPerformance?.underperforming.length || 0} underperforming`}
          changeType={dashboardData.repPerformance?.underperforming.length ? "negative" : "positive"}
          icon={Users}
          description="unique active reps"
          delay={0.2}
        />
        <MetricCard
          title="Total Stores"
          value={dashboardData.metrics.totalStores.toString()}
          change={`${dashboardData.storePerformance?.underperforming.length || 0} underperforming`}
          changeType={dashboardData.storePerformance?.underperforming.length ? "negative" : "positive"}
          icon={Store}
          description="active locations"
          delay={0.3}
        />
        <MetricCard
          title="Gross Profit %"
          value={`${dashboardData.metrics.grossProfitPercent.toFixed(1)}%`}
          change={`$${(dashboardData.metrics.totalSales).toLocaleString()} revenue`}
          changeType="neutral"
          icon={TrendingUp}
          description="average margin"
          delay={0.4}
        />
      </div>

      {/* Charts and Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Revenue Chart - 3/5 width */}
        <div className="lg:col-span-3">
          <SalesChart 
            data={revenueWeekData?.dailyRevenue || dashboardData.salesTrend} 
            weekOffset={revenueWeekOffset}
            onWeekChange={setRevenueWeekOffset}
            isLoading={!revenueWeekData && revenueWeekOffset > 0}
            previousWeekData={previousWeekData}
          />
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
                {!dashboardData?.recentUploads || (dashboardData.recentUploads.inventory.length === 0 && dashboardData.recentUploads.tickets.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent uploads</p>
                    <p className="text-sm">Upload data to see activity</p>
                  </div>
                ) : (
                  // Combine and format uploads
                  [
                    ...dashboardData.recentUploads.tickets.map(t => ({
                      type: "Tickets",
                      filename: t.upload_name || `${t.total_tickets} tickets uploaded`,
                      store: t.stores_affected?.join(", ") || "Multiple Stores",
                      time: new Date(t.upload_date).toLocaleString(),
                      avatar: "T",
                      status: t.status
                    })),
                    ...dashboardData.recentUploads.inventory.map(i => ({
                      type: "Merch",
                      filename: `${i.primary_vendor} inventory`,
                      store: "All Stores",
                      time: new Date(i.window_start).toLocaleDateString(),
                      avatar: "M",
                      status: "success"
                    }))
                  ].slice(0, 5).map((upload, index) => (
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
                          {upload.store}
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
                  Low Performers
                </CardTitle>
                <CardDescription className="text-muted-foreground">Stores and reps below $70 average</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/10 text-xs sm:text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      {actionItemsDateRange === 7 ? "Last 7 Days" : actionItemsDateRange === 30 ? "Last 30 Days" : actionItemsDateRange === 60 ? "Last 60 Days" : "Last 90 Days"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setActionItemsDateRange(7)}>Last 7 Days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActionItemsDateRange(30)}>Last 30 Days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActionItemsDateRange(60)}>Last 60 Days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActionItemsDateRange(90)}>Last 90 Days</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ActionItem
              title="Underperforming Stores"
              count={(actionItemsData || dashboardData)?.metrics.underperformingStores || 0}
              type="warning"
              delay={1.0}
            />
            <ActionItem
              title="Underperforming Sales Reps"
              count={(actionItemsData || dashboardData)?.metrics.underperformingReps || 0}
              type="warning"
              delay={1.1}
            />
            {(actionItemsData || dashboardData) && (actionItemsData || dashboardData).metrics.underperformingStores === 0 && (actionItemsData || dashboardData).metrics.underperformingReps === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No low performers found</p>
                <p className="text-sm">All stores and reps are meeting the $70 benchmark!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
