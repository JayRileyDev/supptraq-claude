import { useQuery } from "convex/react";
// Removed unused imports - handled by dashboard layout
import { useUser } from "@clerk/react-router";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, TrendingUp, ShoppingCart, Users, Award, AlertTriangle,
  Calendar, Filter, Download, Search, ChevronDown, ChevronUp, 
  BarChart3, Target, Clock, Package, CreditCard,
  ArrowUpRight, ArrowDownRight, Loader2, X, ChevronRight,
  Star, TrendingDown, Info, RotateCcw, Trophy
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
// Removed AuthenticatedLayout import as it's now handled by the dashboard layout
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ModernSalesFilter } from "~/components/sales/modern-sales-filter";
import { SalesLeaderboards } from "~/components/sales/sales-leaderboards";
import { PerformanceAlerts } from "~/components/sales/performance-alerts";
import { PerformanceTables } from "~/components/sales/performance-tables";
import { generateRepPerformancePDF } from "~/utils/pdf-export";

// Loader removed - authentication and subscription checks handled by dashboard layout

// Date range presets
const dateRangePresets = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
  { label: "Year to date", value: "ytd" },
];

// Performance metric card with advanced styling
function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  description,
  trend,
  delay = 0,
  onClick
}: {
  title: string;
  value: string | number;
  change?: string | null;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  description?: string;
  trend?: number[];
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(onClick && "cursor-pointer", "group")}
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
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-foreground mb-2 glow-text">
              {value}
            </div>
            {change && (
              <div className={cn(
                "flex items-center px-2 py-1 rounded-full text-xs font-medium",
                changeType === "positive" && "bg-green-500/10 text-green-400 border border-green-500/20",
                changeType === "negative" && "bg-red-500/10 text-red-400 border border-red-500/20",
                changeType === "neutral" && "bg-muted/50 text-muted-foreground border border-border"
              )}>
                {changeType === "positive" && <ArrowUpRight className="mr-1 h-3 w-3" />}
                {changeType === "negative" && <ArrowDownRight className="mr-1 h-3 w-3" />}
                <span>{change}</span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
          {trend && trend.length > 0 && (
            <div className="mt-3 h-8 flex items-end gap-0.5">
              {trend.map((value, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-primary/20 to-accent/20 rounded-t hover:from-primary/30 hover:to-accent/30 transition-all duration-300"
                  style={{ height: `${(value / Math.max(...trend)) * 100}%` }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Rep performance row with expandable details
function RepPerformanceRow({ 
  rep, 
  rank, 
  companyAvg,
  onSelect,
  delay = 0 
}: { 
  rep: any; 
  rank: number;
  companyAvg: any;
  onSelect: (rep: any) => void;
  delay?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  
  const performanceScore = useMemo(() => {
    // Calculate performance score based on multiple factors
    const revenueScore = (rep.revenue / companyAvg.avgRevenue) * 25;
    const ticketScore = (rep.ticketCount / companyAvg.avgTickets) * 25;
    const gpScore = (rep.grossProfitMargin / companyAvg.avgGPMargin) * 25;
    const returnScore = (1 - (rep.returnRate / 100)) * 25;
    return Math.min(100, revenueScore + ticketScore + gpScore + returnScore);
  }, [rep, companyAvg]);

  const getRankBadge = () => {
    if (rank === 1) return { color: "bg-yellow-500", icon: "🏆" };
    if (rank === 2) return { color: "bg-gray-400", icon: "🥈" };
    if (rank === 3) return { color: "bg-orange-600", icon: "🥉" };
    return null;
  };

  const rankBadge = getRankBadge();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group"
    >
      <div className={cn(
        "relative rounded-lg border transition-all duration-300",
        expanded ? "border-blue-500 dark:border-blue-400 shadow-lg" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
        "bg-white dark:bg-gray-900"
      )}>
        {/* Main row */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex-shrink-0">
                {rankBadge ? (
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                    rankBadge.color
                  )}>
                    <span className="text-lg">{rankBadge.icon}</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-sm font-bold text-muted-foreground">
                      {rank}
                    </span>
                  </div>
                )}
              </div>

              {/* Rep info */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {rep.repName}
                  </h3>
                  {rep.daysSinceLastSale && rep.daysSinceLastSale > 7 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>No sales in {rep.daysSinceLastSale} days</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Store {rep.metadata?.storeId || "Unknown"} • {rep.ticketCount} tickets
                </p>
              </div>
            </div>

            {/* Key metrics */}
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  ${Math.round(rep.revenue).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Revenue
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">
                  ${Math.round(rep.avgTicketSize)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg ticket
                </p>
              </div>

              <div className="text-right">
                <p className={cn(
                  "text-lg font-semibold",
                  rep.grossProfitMargin > companyAvg.avgGPMargin 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-foreground"
                )}>
                  {(rep.grossProfitMargin || 0).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  GP margin
                </p>
              </div>

              {/* Performance indicator */}
              <div className="flex items-center gap-2">
                <div className="relative w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${performanceScore}%` }}
                    transition={{ duration: 1, delay: delay + 0.3 }}
                    className={cn(
                      "absolute left-0 top-0 h-full rounded-full",
                      performanceScore >= 80 ? "bg-green-500" :
                      performanceScore >= 60 ? "bg-yellow-500" :
                      "bg-red-500"
                    )}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(performanceScore)}%
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(rep)}
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="grid grid-cols-4 gap-6">
                  {/* Activity heatmap */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hourly Activity
                    </h4>
                    <div className="grid grid-cols-12 gap-1">
                      {(rep.hourlyDistribution || []).slice(8, 20).map((count: number, hour: number) => (
                        <TooltipProvider key={hour}>
                          <Tooltip>
                            <TooltipTrigger>
                              <div
                                className={cn(
                                  "h-6 w-full rounded",
                                  count === 0 ? "bg-gray-200 dark:bg-gray-700" :
                                  count <= 2 ? "bg-blue-300 dark:bg-blue-700" :
                                  count <= 5 ? "bg-blue-500 dark:bg-blue-600" :
                                  "bg-blue-700 dark:bg-blue-500"
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{count} sales at {hour + 8}:00</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>8am</span>
                      <span>8pm</span>
                    </div>
                  </div>

                  {/* Top products */}
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Top Products
                    </h4>
                    <div className="space-y-1">
                      {(rep.topProducts || []).slice(0, 3).map((product: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {product.productName}
                          </span>
                          <span className="font-medium text-foreground">
                            ${Math.round(product.revenue).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items sold</span>
                      <span className="font-medium text-foreground">
                        {rep.itemsSold}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Return rate</span>
                      <span className={cn(
                        "font-medium",
                        rep.returnRate < 5 ? "text-green-600 dark:text-green-400" : "text-foreground"
                      )}>
                        {(rep.returnRate || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini trend chart */}
                {rep.dailyTrend && rep.dailyTrend.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Daily Revenue Trend
                    </h4>
                    <div className="h-16 flex items-end gap-1">
                      {(rep.dailyTrend || []).slice(-14).map((day: any, i: number) => {
                        const maxRevenue = Math.max(...(rep.dailyTrend || []).map((d: any) => d.revenue));
                        return (
                          <TooltipProvider key={i}>
                            <Tooltip>
                              <TooltipTrigger className="flex-1">
                                <div
                                  className="w-full bg-blue-500 dark:bg-blue-400 rounded-t hover:bg-blue-600 dark:hover:bg-blue-300 transition-colors"
                                  style={{ 
                                    height: `${maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0}%`,
                                    minHeight: day.revenue > 0 ? "2px" : "1px"
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{new Date(day.date).toLocaleDateString()}</p>
                                <p className="font-semibold">${Math.round(day.revenue)}</p>
                                <p className="text-xs">{day.tickets} tickets</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Individual rep detail panel
function RepDetailPanel({ 
  rep, 
  onClose 
}: { 
  rep: any; 
  onClose: () => void;
}) {
  const { user } = useUser();
  const userId = user?.id;

  const repDetails = useQuery(
    api.salesRepQueries.getRepDetails,
    rep && userId && rep.repName ? { userId, repName: rep.repName } : "skip"
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed right-0 top-0 h-full w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-hidden"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              {rep.repName}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Store {rep.metadata?.storeId || "Unknown"}</span>
            <span>•</span>
            <span>{rep.metadata?.role || "Sales Associate"}</span>
            {rep.daysSinceLastSale !== null && (
              <>
                <span>•</span>
                <span>Last sale {rep.daysSinceLastSale} days ago</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Performance summary */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Performance Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${Math.round(rep.revenue).toLocaleString()}
                      </p>
                      {rep.revenueChange && (
                        <p className={cn(
                          "text-sm mt-1",
                          parseFloat(rep.revenueChange) >= 0 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {rep.revenueChange}% vs last period
                        </p>
                      )}
                    </div>
                    <DollarSign className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tickets</p>
                      <p className="text-2xl font-bold text-foreground">
                        {rep.ticketCount}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ${Math.round(rep.avgTicketSize)} avg
                      </p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">GP Margin</p>
                      <p className="text-2xl font-bold text-foreground">
                        {(rep.grossProfitMargin || 0).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ${Math.round(rep.grossProfit)} total
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Top products */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Top Products
            </h3>
            <div className="space-y-2">
              {(rep.topProducts || []).map((product: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {product.productName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.quantity} units • {product.transactions} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      ${Math.round(product.revenue).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          {repDetails && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recent Transactions
              </h3>
              <div className="space-y-2">
                {(repDetails.recentTransactions || []).slice(0, 10).map((transaction: any) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">
                        #{transaction.ticket_number}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.sale_date).toLocaleDateString()} • {transaction.product_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ${(transaction.transaction_total || 0).toFixed(2)}
                      </p>
                      {transaction.gross_profit && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          GP: {transaction.gross_profit}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function SalesPage() {
  const { user } = useUser();
  const userId = user?.id;

  // Store-level filters for top 8 metric cards
  const [storeFilters, setStoreFilters] = useState<{
    dateRange: { from: Date | undefined; to?: Date | undefined } | undefined;
    storeId: string;
    includeReturns: boolean;
  }>({
    dateRange: undefined,
    storeId: "all",
    includeReturns: true
  });

  // Rep-level filters for performance data below (separate from store filters)
  const [repFilters, setRepFilters] = useState<{
    dateRange: { from: Date | undefined; to?: Date | undefined } | undefined;
    storeId: string;
    salesRepId?: string; 
    searchQuery?: string;
    includeReturns: boolean;
  }>({
    dateRange: undefined,
    storeId: "all",
    salesRepId: "all", 
    searchQuery: "",
    includeReturns: true
  });

  // Keep sorting separate as it's for the rep list display, not the metrics
  const [sortBy, setSortBy] = useState<"revenue" | "tickets" | "gp">("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // UI states
  const [selectedRepForDetail, setSelectedRepForDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Queries - use cached filter options
  const filterData = useQuery(
    api.salesCache.getSalesFilterOptions,
    userId ? { userId } : "skip"
  );

  // Filter data is already in the correct format from the backend
  const transformedFilterData = filterData || null;

  // Convert store filters to query format for metrics
  const storeQueryFilters = useMemo(() => {
    return {
      dateRange: (storeFilters.dateRange && storeFilters.dateRange.from && storeFilters.dateRange.to) ? {
        start: storeFilters.dateRange.from.toISOString(),
        end: storeFilters.dateRange.to.toISOString()
      } : undefined,
      storeId: storeFilters.storeId,
      includeReturns: storeFilters.includeReturns,
      // Store-level only - no rep filtering
      salesRep: "all",
      performanceFilter: "all",
      minTickets: undefined,
      includeGiftCards: true
    };
  }, [storeFilters]);

  // Convert rep filters to query format for rep performance data
  const repQueryFilters = useMemo(() => {
    return {
      dateRange: (repFilters.dateRange && repFilters.dateRange.from && repFilters.dateRange.to) ? {
        start: repFilters.dateRange.from.toISOString(),
        end: repFilters.dateRange.to.toISOString()
      } : undefined,
      storeId: repFilters.storeId,
      salesRep: repFilters.searchQuery || 
                (repFilters.salesRepId && repFilters.salesRepId !== "all" ? repFilters.salesRepId : "all"),
      includeReturns: repFilters.includeReturns,
      performanceFilter: "all",
      minTickets: undefined,
      includeGiftCards: true
    };
  }, [repFilters]);

  // Get fresh sales data - use a fixed large range and filter in React
  const rawSalesData = useQuery(
    api.salesCache.getSalesData,
    userId ? { userId, dateRange: 365 } : "skip" // Always get 1 year of data
  );

  // Process store-level data for the top 8 metric cards
  const storeMetrics = useMemo(() => {
    if (!rawSalesData || !rawSalesData.tickets) {
      return {
        summary: { totalRevenue: 0, totalTickets: 0, totalReturns: 0, avgTicketSize: 0, avgGrossProfitPercent: 0, totalGrossProfitDollars: 0, returnRate: 0, activeReps: 0 }
      };
    }

    // Apply date range filter if specified
    let filteredTickets = rawSalesData.tickets;
    let filteredReturns = rawSalesData.returns || [];
    let filteredGiftCards = rawSalesData.giftCards || [];

    // Only apply date filter if BOTH dates are provided, otherwise use all data
    if (storeFilters.dateRange?.from && storeFilters.dateRange?.to) {
      const startDate = storeFilters.dateRange.from.toISOString();
      const endDate = storeFilters.dateRange.to.toISOString();
      
      filteredTickets = filteredTickets.filter((ticket: any) => 
        ticket.sale_date >= startDate && ticket.sale_date <= endDate
      );
      filteredReturns = filteredReturns.filter((ret: any) => 
        ret.sale_date >= startDate && ret.sale_date <= endDate
      );
      filteredGiftCards = filteredGiftCards.filter((gc: any) => 
        gc.sale_date >= startDate && gc.sale_date <= endDate
      );
    }

    // Apply store filter
    if (storeFilters.storeId !== "all") {
      filteredTickets = filteredTickets.filter((ticket: any) => ticket.store_id === storeFilters.storeId);
      filteredReturns = filteredReturns.filter((ret: any) => ret.store_id === storeFilters.storeId);
      filteredGiftCards = filteredGiftCards.filter((gc: any) => gc.store_id === storeFilters.storeId);
    }

    // Apply returns filter
    if (!storeFilters.includeReturns) {
      filteredReturns = [];
    }

    // Calculate unique tickets and totals using same methodology as dashboard
    const uniqueTickets = new Set<string>();
    const uniqueReturnTickets = new Set<string>();
    const ticketTotals = new Map<string, number>();
    const ticketGrossProfitMap = new Map<string, number>();
    const uniqueSalesReps = new Set<string>();

    // Process regular sales tickets
    const salesTicketSet = new Set<string>();
    filteredTickets.forEach((ticket: any) => {
      const ticketNum = ticket.ticket_number;
      
      if (ticketNum) {
        uniqueTickets.add(ticketNum);
        salesTicketSet.add(ticketNum);
        
        if (!ticketTotals.has(ticketNum)) {
          const total = ticket.transaction_total || 0;
          ticketTotals.set(ticketNum, total);
        }
        
        if (ticket.gross_profit && !ticketGrossProfitMap.has(ticketNum)) {
          const gp = parseFloat(ticket.gross_profit.toString().replace('%', ''));
          if (!isNaN(gp)) {
            ticketGrossProfitMap.set(ticketNum, gp);
          }
        }
      }
      
      if (ticket.sales_rep) uniqueSalesReps.add(ticket.sales_rep);
    });

    // Process return tickets
    filteredReturns.forEach((ret: any) => {
      const ticketNum = ret.ticket_number;
      
      if (ticketNum) {
        uniqueTickets.add(ticketNum);
        uniqueReturnTickets.add(ticketNum);
        
        if (!salesTicketSet.has(ticketNum) && !ticketTotals.has(ticketNum)) {
          const total = ret.transaction_total || 0;
          ticketTotals.set(ticketNum, total);
        }
        
        if (ret.gross_profit && !ticketGrossProfitMap.has(ticketNum)) {
          const gp = parseFloat(ret.gross_profit.toString().replace('%', ''));
          if (!isNaN(gp)) {
            ticketGrossProfitMap.set(ticketNum, gp);
          }
        }
      }
      
      if (ret.sales_rep) uniqueSalesReps.add(ret.sales_rep);
    });

    // Process gift cards
    const giftCardsByTicket = new Map<string, number>();
    filteredGiftCards.forEach((gc: any) => {
      const ticketNum = gc.ticket_number;
      
      if (ticketNum) {
        const giftAmount = gc.giftcard_amount || 0;
        const current = giftCardsByTicket.get(ticketNum) || 0;
        giftCardsByTicket.set(ticketNum, current + giftAmount);
      }
      
      if (gc.sales_rep) uniqueSalesReps.add(gc.sales_rep);
    });

    giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
      uniqueTickets.add(ticketNum);
      
      if (!salesTicketSet.has(ticketNum) && !uniqueReturnTickets.has(ticketNum)) {
        ticketTotals.set(ticketNum, totalGiftAmount);
      }
    });

    // Calculate totals
    let totalRevenue = 0;
    ticketTotals.forEach(total => {
      totalRevenue += total;
    });

    let totalGrossProfitPercent = 0;
    ticketGrossProfitMap.forEach(gpPercent => {
      totalGrossProfitPercent += gpPercent;
    });

    const avgGrossProfitPercent = uniqueTickets.size > 0 
      ? totalGrossProfitPercent / uniqueTickets.size 
      : 0;

    let totalGrossProfitDollars = 0;
    ticketGrossProfitMap.forEach((gpPercent, ticketNum) => {
      const ticketTotal = ticketTotals.get(ticketNum) || 0;
      totalGrossProfitDollars += ticketTotal * (gpPercent / 100);
    });

    const avgTicketSize = uniqueTickets.size > 0 ? totalRevenue / uniqueTickets.size : 0;
    const returnRate = uniqueTickets.size > 0 ? (uniqueReturnTickets.size / uniqueTickets.size) * 100 : 0;
    const totalReturns = filteredReturns.reduce((sum: number, r: any) => sum + Math.abs(r.transaction_total || 0), 0);
    const totalGiftCards = Array.from(giftCardsByTicket.values()).reduce((sum, amount) => sum + amount, 0);

    return {
      summary: {
        totalRevenue,
        totalTickets: uniqueTickets.size,
        totalReturns,
        avgTicketSize,
        avgGrossProfitPercent,
        totalGrossProfitDollars,
        returnRate,
        activeReps: uniqueSalesReps.size,
        totalGiftCards
      }
    };
  }, [rawSalesData, storeFilters]);

  // Process rep performance data (separate from store metrics)
  const salesMetrics = useMemo(() => {
    if (!rawSalesData || !rawSalesData.tickets) {
      return {
        reps: [],
        summary: { totalRevenue: 0, totalTickets: 0, totalReturns: 0, avgTicketSize: 0 },
        stores: [],
        dailyData: []
      };
    }

    // Apply date range filter if specified
    let filteredTickets = rawSalesData.tickets;
    let filteredReturns = rawSalesData.returns || [];
    let filteredGiftCards = rawSalesData.giftCards || [];

    // Only apply date filter if BOTH dates are provided, otherwise use all data
    if (repFilters.dateRange?.from && repFilters.dateRange?.to) {
      const startDate = repFilters.dateRange.from.toISOString();
      const endDate = repFilters.dateRange.to.toISOString();
      
      filteredTickets = filteredTickets.filter((ticket: any) => 
        ticket.sale_date >= startDate && ticket.sale_date <= endDate
      );
      filteredReturns = filteredReturns.filter((ret: any) => 
        ret.sale_date >= startDate && ret.sale_date <= endDate
      );
      filteredGiftCards = filteredGiftCards.filter((gc: any) => 
        gc.sale_date >= startDate && gc.sale_date <= endDate
      );
    }

    // Apply store filter
    if (repFilters.storeId !== "all") {
      filteredTickets = filteredTickets.filter((ticket: any) => ticket.store_id === repFilters.storeId);
      filteredReturns = filteredReturns.filter((ret: any) => ret.store_id === repFilters.storeId);
      filteredGiftCards = filteredGiftCards.filter((gc: any) => gc.store_id === repFilters.storeId);
    }

    // Apply returns filter
    if (!repFilters.includeReturns) {
      filteredReturns = [];
    }

    // Calculate unique tickets and totals using same methodology as dashboard
    const uniqueTickets = new Set<string>();
    const uniqueSalesTickets = new Set<string>();
    const uniqueReturnTickets = new Set<string>();
    const ticketTotals = new Map<string, number>();
    const ticketGrossProfitMap = new Map<string, number>();
    const repMetrics = new Map();

    // Process regular sales tickets - group by ticket number like dashboard
    const salesTicketSet = new Set<string>();
    filteredTickets.forEach((ticket: any) => {
      const ticketNum = ticket.ticket_number;
      const repName = ticket.sales_rep || "Unknown";
      const qtySold = ticket.qty_sold || 0;
      const transactionTotal = ticket.transaction_total || 0;
      
      // Skip tickets with 0 quantity OR 0 transaction total - these are invalid sales
      if (qtySold <= 0 || transactionTotal <= 0) {
        return;
      }
      
      if (ticketNum) {
        uniqueTickets.add(ticketNum);
        uniqueSalesTickets.add(ticketNum);
        salesTicketSet.add(ticketNum);
        
        // Only set total once per ticket (like dashboard)
        if (!ticketTotals.has(ticketNum)) {
          ticketTotals.set(ticketNum, transactionTotal);
        }
        
        // Only set gross profit once per ticket (like dashboard)
        if (ticket.gross_profit && !ticketGrossProfitMap.has(ticketNum)) {
          const gp = parseFloat(ticket.gross_profit.toString().replace('%', ''));
          if (!isNaN(gp)) {
            ticketGrossProfitMap.set(ticketNum, gp);
          }
        }
      }

      // Track rep metrics only for valid sales (qty > 0 OR transaction total > 0)
      if (!repMetrics.has(repName)) {
        repMetrics.set(repName, {
          repName,
          revenue: 0,
          ticketCount: 0,
          itemsSold: 0,
          grossProfit: 0,
          stores: new Set(),
          topProducts: new Map(),
          lastSaleDate: null,
          firstSaleDate: null,
          uniqueTickets: new Set()
        });
      }
      
      const rep = repMetrics.get(repName);
      if (ticketNum) {
        rep.uniqueTickets.add(ticketNum);
      }
      rep.itemsSold += qtySold;
      rep.stores.add(ticket.store_id);
      
      // Track dates
      const saleDate = ticket.sale_date;
      if (!rep.lastSaleDate || saleDate > rep.lastSaleDate) {
        rep.lastSaleDate = saleDate;
      }
      if (!rep.firstSaleDate || saleDate < rep.firstSaleDate) {
        rep.firstSaleDate = saleDate;
      }
      
      // Track top products
      if (ticket.product_name && ticket.item_number) {
        const productKey = `${ticket.item_number}-${ticket.product_name}`;
        if (!rep.topProducts.has(productKey)) {
          rep.topProducts.set(productKey, {
            itemNumber: ticket.item_number,
            productName: ticket.product_name,
            revenue: 0,
            quantity: 0,
            transactions: 0
          });
        }
        const product = rep.topProducts.get(productKey);
        product.revenue += ticket.transaction_total || 0;
        product.quantity += ticket.qty_sold || 0;
        product.transactions += 1;
      }
    });

    // Process return tickets
    filteredReturns.forEach((ret: any) => {
      const ticketNum = ret.ticket_number;
      const repName = ret.sales_rep || "Unknown";
      
      if (ticketNum) {
        uniqueTickets.add(ticketNum);
        uniqueReturnTickets.add(ticketNum);
        
        // Only set total if not already set by sales ticket
        if (!salesTicketSet.has(ticketNum) && !ticketTotals.has(ticketNum)) {
          const total = ret.transaction_total || 0;
          ticketTotals.set(ticketNum, total);
        }
        
        if (ret.gross_profit && !ticketGrossProfitMap.has(ticketNum)) {
          const gp = parseFloat(ret.gross_profit.toString().replace('%', ''));
          if (!isNaN(gp)) {
            ticketGrossProfitMap.set(ticketNum, gp);
          }
        }
      }

      // Track rep return metrics
      if (repMetrics.has(repName)) {
        const rep = repMetrics.get(repName);
        rep.returnAmount = (rep.returnAmount || 0) + Math.abs(ret.transaction_total || 0);
        rep.returnCount = (rep.returnCount || 0) + 1;
      }
    });

    // Process gift cards
    const giftCardsByTicket = new Map<string, number>();
    filteredGiftCards.forEach((gc: any) => {
      const ticketNum = gc.ticket_number;
      const repName = gc.sales_rep || "Unknown";
      
      if (ticketNum) {
        const giftAmount = gc.giftcard_amount || 0;
        const current = giftCardsByTicket.get(ticketNum) || 0;
        giftCardsByTicket.set(ticketNum, current + giftAmount);
        
        if (repMetrics.has(repName)) {
          const rep = repMetrics.get(repName);
          rep.giftCardRevenue = (rep.giftCardRevenue || 0) + giftAmount;
          rep.giftCardCount = (rep.giftCardCount || 0) + 1;
        }
      }
    });

    // Add gift card tickets to unique tickets (like dashboard)
    giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
      uniqueTickets.add(ticketNum);
      
      if (!salesTicketSet.has(ticketNum) && !uniqueReturnTickets.has(ticketNum)) {
        ticketTotals.set(ticketNum, totalGiftAmount);
      }
    });

    // Calculate total revenue from unique tickets (like dashboard)
    let totalRevenue = 0;
    ticketTotals.forEach(total => {
      totalRevenue += total;
    });

    // Calculate total gross profit PERCENTAGES (like dashboard)
    let totalGrossProfitPercent = 0;
    ticketGrossProfitMap.forEach(gpPercent => {
      totalGrossProfitPercent += gpPercent;
    });

    // Calculate average gross profit percentage (like dashboard)
    const avgGrossProfitPercent = uniqueTickets.size > 0 
      ? totalGrossProfitPercent / uniqueTickets.size 
      : 0;

    // Calculate total gross profit in dollars for display
    let totalGrossProfitDollars = 0;
    ticketGrossProfitMap.forEach((gpPercent, ticketNum) => {
      const ticketTotal = ticketTotals.get(ticketNum) || 0;
      totalGrossProfitDollars += ticketTotal * (gpPercent / 100);
    });

    // Calculate average ticket size based on unique tickets
    const avgTicketSize = uniqueTickets.size > 0 ? totalRevenue / uniqueTickets.size : 0;

    // Calculate return rate: unique return tickets / unique tickets
    const returnRate = uniqueTickets.size > 0 ? (uniqueReturnTickets.size / uniqueTickets.size) * 100 : 0;

    // Update rep metrics with revenue and ticket counts - EXCLUDE RETURNS from average ticket calculations
    repMetrics.forEach((rep: any) => {
      // Separate sales tickets from return tickets for this rep
      const repSalesTickets = new Set();
      const repReturnTickets = new Set();
      
      // Filter rep's tickets into sales and returns
      // Only include tickets that are purely sales (not returns)
      rep.uniqueTickets.forEach((ticketNum: string) => {
        if (uniqueReturnTickets.has(ticketNum)) {
          repReturnTickets.add(ticketNum);
        } else if (uniqueSalesTickets.has(ticketNum)) {
          repSalesTickets.add(ticketNum);
        }
      });
      
      // Calculate rep revenue from SALES tickets (include all non-negative tickets)
      rep.revenue = 0;
      rep.grossProfit = 0;
      let validTicketCount = 0;
      
      repSalesTickets.forEach((ticketNum: string) => {
        const ticketTotal = ticketTotals.get(ticketNum) || 0;
        
        // Only include tickets with positive transaction totals for meaningful averages
        if (ticketTotal > 0) {
          rep.revenue += ticketTotal;
          validTicketCount++;
          
          const gpPercent = ticketGrossProfitMap.get(ticketNum) || 0;
          rep.grossProfit += ticketTotal * (gpPercent / 100);
        }
      });
      
      // Calculate derived metrics based on all valid sales tickets
      rep.ticketCount = validTicketCount; // Count all non-negative sales tickets
      rep.avgTicketSize = rep.ticketCount > 0 ? rep.revenue / rep.ticketCount : 0;
      rep.grossProfitMargin = rep.revenue > 0 ? (rep.grossProfit / rep.revenue) * 100 : 0;
      rep.returnAmount = rep.returnAmount || 0;
      rep.returnCount = repReturnTickets.size; // Count of actual return tickets
      
      // Return rate: return tickets vs all tickets (sales + returns)
      const allRepTickets = repSalesTickets.size + repReturnTickets.size;
      rep.returnRate = allRepTickets > 0 ? (repReturnTickets.size / allRepTickets) * 100 : 0;
      rep.giftCardRevenue = rep.giftCardRevenue || 0;
      rep.giftCardCount = rep.giftCardCount || 0;
      
      // Days since last sale
      rep.daysSinceLastSale = rep.lastSaleDate 
        ? Math.floor((Date.now() - new Date(rep.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Convert stores set to count
      rep.stores = rep.stores.size;
      
      // Convert top products to array
      rep.topProducts = Array.from(rep.topProducts.values())
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);
      
      // Add metadata
      rep.metadata = { storeId: "Multiple" };
      
      // Remove the Set from the final object
      delete rep.uniqueTickets;
    });

    // Convert to array and filter out reps with no valid sales
    const reps = Array.from(repMetrics.values()).filter((rep: any) => {
      // Only include reps who have actual sales (positive ticket count and revenue OR items sold)
      return rep.ticketCount > 0 || rep.itemsSold > 0 || rep.revenue > 0;
    });

    // Apply search/rep filtering
    let filteredReps = reps;
    if (repFilters.searchQuery && repFilters.searchQuery.trim()) {
      const searchLower = repFilters.searchQuery.toLowerCase();
      filteredReps = reps.filter((rep: any) => 
        rep.repName?.toLowerCase().includes(searchLower)
      );
    } else if (repFilters.salesRepId && repFilters.salesRepId !== "all") {
      filteredReps = reps.filter((rep: any) => 
        rep.repName === repFilters.salesRepId
      );
    }

    // Calculate total returns amount
    const totalReturns = filteredReturns.reduce((sum: number, r: any) => sum + Math.abs(r.transaction_total || 0), 0);
    
    // Count active reps (reps with tickets in filtered data)
    const activeReps = filteredReps.filter((rep: any) => rep.ticketCount > 0).length;

    return {
      reps: filteredReps,
      allReps: reps, // Keep unfiltered for company metrics
      summary: {
        totalRevenue,
        totalTickets: uniqueTickets.size,
        totalReturns,
        avgTicketSize,
        avgGrossProfitPercent, // This matches dashboard's grossProfitPercent
        totalGrossProfitDollars,
        returnRate,
        activeReps,
        uniqueReps: filteredReps.length,
        uniqueReturnTickets: uniqueReturnTickets.size,
        dateRange: rawSalesData.summary?.dateRange || "No data"
      }
    };
  }, [rawSalesData, repFilters]);

  // Create repData in expected format
  const repData = useMemo(() => {
    if (!salesMetrics) return null;
    
    return {
      reps: salesMetrics.reps,
      companyMetrics: {
        avgRevenue: (salesMetrics.allReps && salesMetrics.allReps.length > 0) ? salesMetrics.allReps.reduce((sum: number, rep: any) => sum + rep.revenue, 0) / salesMetrics.allReps.length : 0,
        avgTickets: (salesMetrics.allReps && salesMetrics.allReps.length > 0) ? salesMetrics.allReps.reduce((sum: number, rep: any) => sum + rep.ticketCount, 0) / salesMetrics.allReps.length : 0,
        avgTicketSize: (salesMetrics.allReps && salesMetrics.allReps.length > 0) ? salesMetrics.allReps.reduce((sum: number, rep: any) => sum + rep.avgTicketSize, 0) / salesMetrics.allReps.length : 0,
        avgGPMargin: (salesMetrics.allReps && salesMetrics.allReps.length > 0) ? salesMetrics.allReps.reduce((sum: number, rep: any) => sum + rep.grossProfitMargin, 0) / salesMetrics.allReps.length : 0,
        avgReturnRate: (salesMetrics.allReps && salesMetrics.allReps.length > 0) ? salesMetrics.allReps.reduce((sum: number, rep: any) => sum + rep.returnRate, 0) / salesMetrics.allReps.length : 0
      },
      dateRange: salesMetrics.summary?.dateRange ? {
        start: salesMetrics.summary.dateRange.split(' - ')[0],
        end: salesMetrics.summary.dateRange.split(' - ')[1]
      } : undefined,
      totalReps: salesMetrics.allReps?.length || 0,
      filteredCount: salesMetrics.reps.length
    };
  }, [salesMetrics]);

  // Process and filter reps for the display table
  const processedReps = useMemo(() => {
    if (!repData?.reps) return [];

    let reps = [...repData.reps];

    // Apply sorting
    reps.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "revenue":
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        case "tickets":
          aValue = a.ticketCount;
          bValue = b.ticketCount;
          break;
        case "gp":
          aValue = a.grossProfitMargin;
          bValue = b.grossProfitMargin;
          break;
        default:
          aValue = a.revenue;
          bValue = b.revenue;
      }
      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    return reps;
  }, [repData, sortBy, sortOrder]);

  // Calculate overall metrics from store-level data (for top 8 cards)
  const overallMetrics = useMemo(() => {
    if (!storeMetrics?.summary) {
      return {
        totalRevenue: 0,
        totalTickets: 0,
        avgTicketSize: 0,
        totalGrossProfit: 0,
        avgGPMargin: 0,
        totalReturns: 0,
        returnRate: 0,
        totalGiftCards: 0,
        activeReps: 0
      };
    }

    const summary = storeMetrics.summary;

    return {
      totalRevenue: summary.totalRevenue || 0,
      totalTickets: summary.totalTickets || 0,
      avgTicketSize: summary.avgTicketSize || 0,
      totalGrossProfit: summary.totalGrossProfitDollars || 0,
      avgGPMargin: summary.avgGrossProfitPercent || 0,
      totalReturns: summary.totalReturns || 0,
      returnRate: summary.returnRate || 0,
      totalGiftCards: summary.totalGiftCards || 0,
      activeReps: summary.activeReps || 0
    };
  }, [storeMetrics]);

  // Date range handling moved to ModernSalesFilter component

  const handleExport = () => {
    if (!repData?.reps || repData.reps.length === 0) {
      alert("No data available to export. Please ensure data has loaded and filters are properly applied.");
      return;
    }

    // Prepare CSV headers
    const headers = [
      "Rank",
      "Rep Name",
      "Store ID",
      "Total Revenue",
      "Ticket Count",
      "Avg Ticket Size",
      "Items Sold",
      "Gross Profit",
      "GP Margin %",
      "Return Count",
      "Return Rate %",
      "Gift Card Revenue",
      "Gift Card Count",
      "Days Since Last Sale",
      "Revenue Change %",
      "Ticket Change %",
      "Top Product",
      "Top Product Revenue"
    ];

    // Prepare CSV data
    const csvData = processedReps.map((rep, index) => {
      const topProduct = rep.topProducts && rep.topProducts.length > 0 ? rep.topProducts[0] : null;
      
      return [
        index + 1, // Rank
        rep.repName,
        rep.metadata?.storeId || "Unknown",
        Math.round(rep.revenue),
        rep.ticketCount,
        Math.round(rep.avgTicketSize),
        rep.itemsSold,
        Math.round(rep.grossProfit),
        (rep.grossProfitMargin || 0).toFixed(2),
        rep.returnCount,
        (rep.returnRate || 0).toFixed(2),
        Math.round(rep.giftCardRevenue),
        rep.giftCardCount,
        rep.daysSinceLastSale || "N/A",
        rep.revenueChange || "N/A",
        rep.ticketChange || "N/A",
        topProduct?.productName || "N/A",
        topProduct ? Math.round(topProduct.revenue) : 0
      ];
    });

    // Convert to CSV format
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => 
        row.map(cell => 
          typeof cell === "string" && cell.includes(",") 
            ? `"${cell}"` 
            : cell
        ).join(",")
      )
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      
      // Generate filename with current date and filters
      const dateStr = new Date().toISOString().split('T')[0];
      const storeFilter = repFilters.storeId !== "all" ? `_store-${repFilters.storeId}` : "";
      const repFilter = (repFilters.salesRepId && repFilters.salesRepId !== "all") || repFilters.searchQuery ? 
        `_rep-${(repFilters.searchQuery || repFilters.salesRepId || "").replace(/\s+/g, "-")}` : "";
      
      link.setAttribute("download", `sales-rep-performance_${dateStr}${storeFilter}${repFilter}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Compute store performance data for leaderboards and tables - MUST be before early return
  const storePerformanceData = useMemo(() => {
    if (!rawSalesData?.tickets || !rawSalesData?.returns || !rawSalesData?.giftCards) {
      return [];
    }

    const storeMetricsMap = new Map();

    // Get unique store IDs from all data sources
    const allStoreIds = new Set([
      ...rawSalesData.tickets.map((t: any) => t.store_id),
      ...rawSalesData.returns.map((r: any) => r.store_id),
      ...rawSalesData.giftCards.map((g: any) => g.store_id)
    ]);

    allStoreIds.forEach(storeId => {
      if (!storeId) return;

      // Filter data for this store - use repFilters for consistency
      const startDate = repFilters.dateRange?.from ? repFilters.dateRange.from : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = repFilters.dateRange?.to ? repFilters.dateRange.to : new Date();

      const storeTickets = rawSalesData.tickets.filter((t: any) => {
        if (t.store_id !== storeId) return false;
        const saleDate = new Date(t.sale_date);
        return saleDate >= startDate && saleDate <= endDate;
      });

      const storeReturns = rawSalesData.returns.filter((r: any) => {
        if (r.store_id !== storeId) return false;
        const saleDate = new Date(r.sale_date);
        return saleDate >= startDate && saleDate <= endDate;
      });

      const storeGiftCards = rawSalesData.giftCards.filter((g: any) => {
        if (g.store_id !== storeId) return false;
        const saleDate = new Date(g.sale_date);
        return saleDate >= startDate && saleDate <= endDate;
      });

      // Calculate store metrics - EXCLUDE RETURNS from average ticket calculations
      const uniqueSalesTickets = new Set();
      const uniqueReturnTickets = new Set();
      const salesTicketTotals = new Map();
      const ticketGrossProfitMap = new Map();

      // Process sales tickets ONLY for average ticket size
      storeTickets.forEach((ticket: any) => {
        const ticketNum = ticket.ticket_number;
        if (ticketNum) {
          uniqueSalesTickets.add(ticketNum);
          
          if (!salesTicketTotals.has(ticketNum)) {
            salesTicketTotals.set(ticketNum, ticket.transaction_total || 0);
          }
          
          if (ticket.gross_profit && !ticketGrossProfitMap.has(ticketNum)) {
            const gp = parseFloat(ticket.gross_profit.toString().replace('%', ''));
            if (!isNaN(gp)) {
              ticketGrossProfitMap.set(ticketNum, gp);
            }
          }
        }
      });

      // Process returns ONLY for return rate calculation (not avg ticket)
      storeReturns.forEach((ret: any) => {
        const ticketNum = ret.ticket_number;
        if (ticketNum) {
          uniqueReturnTickets.add(ticketNum);
        }
      });

      // Process gift cards for total revenue
      const giftCardsByTicket = new Map();
      storeGiftCards.forEach((gc: any) => {
        const ticketNum = gc.ticket_number;
        if (ticketNum) {
          const giftAmount = gc.giftcard_amount || 0;
          const current = giftCardsByTicket.get(ticketNum) || 0;
          giftCardsByTicket.set(ticketNum, current + giftAmount);
        }
      });

      // Add gift card tickets to sales tickets
      giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
        uniqueSalesTickets.add(ticketNum);
        if (!salesTicketTotals.has(ticketNum)) {
          salesTicketTotals.set(ticketNum, totalGiftAmount);
        }
      });

      // Calculate totals based on SALES tickets only (no returns)
      let totalSalesRevenue = 0;
      salesTicketTotals.forEach(total => {
        totalSalesRevenue += total;
      });

      let totalGrossProfitPercent = 0;
      ticketGrossProfitMap.forEach(gpPercent => {
        totalGrossProfitPercent += gpPercent;
      });

      const avgGrossProfitPercent = uniqueSalesTickets.size > 0 
        ? totalGrossProfitPercent / uniqueSalesTickets.size 
        : 0;

      // Average ticket size based on SALES tickets only (excludes returns)
      const avgTicketSize = uniqueSalesTickets.size > 0 ? totalSalesRevenue / uniqueSalesTickets.size : 0;
      
      // Return rate: return tickets vs all tickets (sales + returns)
      const allTickets = new Set([...uniqueSalesTickets, ...uniqueReturnTickets]);
      const returnRate = allTickets.size > 0 ? (uniqueReturnTickets.size / allTickets.size) * 100 : 0;

      const itemsSold = storeTickets.reduce((sum: number, ticket: any) => {
        return sum + (ticket.qty_sold || 0);
      }, 0);

      if (uniqueSalesTickets.size > 0) {
        storeMetricsMap.set(storeId, {
          storeId,
          storeName: `Store ${storeId}`,
          avgTicketSize,
          grossProfitMargin: avgGrossProfitPercent,
          revenue: totalSalesRevenue,
          ticketCount: uniqueSalesTickets.size,
          itemsSold,
          returnRate
        });
      }
    });

    return Array.from(storeMetricsMap.values());
  }, [rawSalesData?.tickets, rawSalesData?.returns, rawSalesData?.giftCards, repFilters.dateRange]);

  // Compute underperforming stores and reps
  const underperformingStores = useMemo(() => {
    return storePerformanceData.filter(store => 
      store.avgTicketSize < 70 && 
      store.ticketCount > 0 && 
      store.revenue > 0
    );
  }, [storePerformanceData]);

  const underperformingReps = useMemo(() => {
    if (!rawSalesData?.tickets) return [];

    return processedReps.filter(rep => 
      rep.avgTicketSize < 70 && 
      rep.ticketCount > 0 && 
      rep.revenue > 0
    ).map(rep => {
      const startDate = repFilters.dateRange?.from ? repFilters.dateRange.from : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = repFilters.dateRange?.to ? repFilters.dateRange.to : new Date();

      // Calculate daily performance for this rep - EXCLUDE RETURNS and zero quantity tickets
      const repSalesTickets = rawSalesData.tickets.filter((ticket: any) => {
        const saleDate = new Date(ticket.sale_date);
        const qtySold = ticket.qty_sold || 0;
        const transactionTotal = ticket.transaction_total || 0;
        
        return ticket.sales_rep === rep.repName &&
               saleDate >= startDate && 
               saleDate <= endDate &&
               (qtySold > 0 && transactionTotal > 0); // Only include valid sales with both qty and value
      });

      // Group SALES tickets by date and then by ticket number to get unique tickets per day
      const dailyData = new Map();
      repSalesTickets.forEach((ticket: any) => {
        const dateKey = ticket.sale_date.split('T')[0]; // Get YYYY-MM-DD
        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, {
            date: dateKey,
            ticketTotals: new Map(), // Map of ticket_number -> total
            allTicketsForDay: [] // Store all tickets for this day for PDF export
          });
        }
        const dayData = dailyData.get(dateKey);
        
        // Get ticket details
        const ticketNum = ticket.ticket_number;
        const ticketTotal = ticket.transaction_total || 0;
        
        // Store the full ticket data for PDF export (exclude $0 tickets)
        if (ticketTotal > 0) {
          dayData.allTicketsForDay.push(ticket);
        }
        
        // Track unique ticket totals (one total per ticket number) - exclude $0 tickets
        if (ticketNum && !dayData.ticketTotals.has(ticketNum) && ticketTotal > 0) {
          dayData.ticketTotals.set(ticketNum, ticketTotal);
        }
      });

      // Calculate avg ticket size per day based on unique ticket totals
      const dailyPerformance = Array.from(dailyData.values()).map(day => {
        const uniqueTicketCount = day.ticketTotals.size;
        const ticketTotals = Array.from(day.ticketTotals.values()) as number[];
        const totalRevenue = ticketTotals.reduce((sum: number, total: number) => sum + total, 0);
        
        return {
          date: day.date,
          avgTicketSize: uniqueTicketCount > 0 ? totalRevenue / uniqueTicketCount : 0,
          ticketCount: uniqueTicketCount,
          allTicketsForDay: day.allTicketsForDay // Include all ticket data for PDF export
        };
      });

      return {
        repName: rep.repName,
        avgTicketSize: rep.avgTicketSize,
        ticketCount: rep.ticketCount,
        revenue: rep.revenue,
        stores: rep.stores || [],
        dailyPerformance
      };
    });
  }, [processedReps, rawSalesData?.tickets, repFilters.dateRange]);

  // PDF export handler
  const handleExportRepPDF = useCallback(async (repName: string) => {
    const rep = processedReps.find(r => r.repName === repName);
    const underperformingRep = underperformingReps.find(r => r.repName === repName);
    if (!rep || !underperformingRep) return;

    const startDate = repFilters.dateRange?.from ? repFilters.dateRange.from : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = repFilters.dateRange?.to ? repFilters.dateRange.to : new Date();

    // Get tickets specifically from underperforming days (days with avg ticket < $70)
    const underperformingDays = underperformingRep.dailyPerformance.filter((day: any) => day.avgTicketSize < 70);
    
    // Collect all tickets from underperforming days
    const underperformingTickets: any[] = [];
    underperformingDays.forEach((day: any) => {
      if (day.allTicketsForDay) {
        underperformingTickets.push(...day.allTicketsForDay);
      }
    });

    // Group tickets by ticket number to get proper line items from underperforming days
    const ticketMap = new Map();
    underperformingTickets.forEach((ticket: any) => {
      const ticketNum = ticket.ticket_number;
      if (!ticketMap.has(ticketNum)) {
        ticketMap.set(ticketNum, {
          ticketNumber: ticketNum,
          saleDate: ticket.sale_date,
          storeId: ticket.store_id,
          transactionTotal: ticket.transaction_total || 0,
          lineItems: []
        });
      }
      
      // Add each individual line item from Convex using correct schema field names
      ticketMap.get(ticketNum).lineItems.push({
        item_number: ticket.item_number || '',
        product_name: ticket.product_name || '',
        qty_sold: ticket.qty_sold || 0,
        selling_unit: ticket.selling_unit || '',
        gross_profit: ticket.gross_profit || ''
      });
    });

    const transformedTickets = Array.from(ticketMap.values());

    const exportData = {
      repName,
      dateRange: { 
        start: startDate.toISOString(), 
        end: endDate.toISOString() 
      },
      avgTicketSize: rep.avgTicketSize,
      totalRevenue: rep.revenue,
      ticketCount: rep.ticketCount,
      underperformingDays: underperformingRep.dailyPerformance.filter((day: any) => day.avgTicketSize < 70),
      tickets: transformedTickets
    };

    try {
      generateRepPerformancePDF(exportData);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please check the console for details.');
    }
  }, [processedReps, underperformingReps, rawSalesData?.tickets, repFilters.dateRange]);

  // Handle scrolling to anchor after everything loads
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && rawSalesData && underperformingReps) {
      // Wait for data to load and components to render, then scroll
      const scrollToElement = () => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true; // Success
        }
        return false; // Not found
      };
      
      // Try multiple times with increasing delays
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryScroll = () => {
        attempts++;
        if (scrollToElement() || attempts >= maxAttempts) {
          return; // Success or max attempts reached
        }
        setTimeout(tryScroll, 300 * attempts); // Increasing delay
      };
      
      // Start trying after initial delay
      setTimeout(tryScroll, 200);
    }
  }, [rawSalesData, underperformingReps]); // Depend on data loading

  // Early return for loading state - after all hooks are defined
  if (!rawSalesData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sales Rep Performance
            </h1>
            <p className="text-muted-foreground">
              Analyze rep productivity, revenue trends, and performance metrics across all stores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Schedule Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Store-Level Filter - affects only the top 8 metric cards */}
        <ModernSalesFilter
          filters={{
            dateRange: storeFilters.dateRange,
            storeId: storeFilters.storeId,
            salesRepId: "all", // Not used for store-level
            searchQuery: "", // Not used for store-level
            includeReturns: storeFilters.includeReturns
          }}
          onFiltersChange={(filters) => {
            setStoreFilters({
              dateRange: filters.dateRange,
              storeId: filters.storeId,
              includeReturns: filters.includeReturns
            });
          }}
          filterData={transformedFilterData}
          isLoading={!filterData}
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={`$${Math.round(overallMetrics.totalRevenue).toLocaleString()}`}
            icon={DollarSign}
            description="Across all reps"
            delay={0.2}
          />
          <MetricCard
            title="Total Tickets"
            value={overallMetrics.totalTickets.toLocaleString()}
            icon={ShoppingCart}
            description={`${overallMetrics.activeReps} active reps`}
            delay={0.25}
          />
          <MetricCard
            title="Avg Ticket Size"
            value={`$${Math.round(overallMetrics.avgTicketSize)}`}
            icon={TrendingUp}
            description="Per transaction"
            delay={0.3}
          />
          <MetricCard
            title="Avg GP Margin"
            value={`${(overallMetrics.avgGPMargin || 0).toFixed(1)}%`}
            icon={Target}
            description="Company average"
            delay={0.35}
          />
          <MetricCard
            title="Active Reps"
            value={overallMetrics.activeReps}
            icon={Users}
            description={`of ${repData?.totalReps || 0} total`}
            delay={0.4}
          />
          <MetricCard
            title="Return Rate"
            value={`${(overallMetrics.returnRate || 0).toFixed(1)}%`}
            icon={RotateCcw}
            description="Return tickets / Total tickets"
            delay={0.45}
          />
          <MetricCard
            title="Gift Card Sales"
            value={`$${Math.round(overallMetrics.totalGiftCards).toLocaleString()}`}
            icon={CreditCard}
            description="Total value"
            delay={0.5}
          />
          <MetricCard
            title="Gross Profit"
            value={`$${Math.round(overallMetrics.totalGrossProfit).toLocaleString()}`}
            icon={Award}
            description="Total GP generated"
            delay={0.55}
          />
        </div>

        {/* New Leaderboards Section */}
        <SalesLeaderboards 
          repData={processedReps.map(rep => ({
            repName: rep.repName,
            avgTicketSize: rep.avgTicketSize,
            grossProfitMargin: rep.grossProfitMargin,
            revenue: rep.revenue,
            ticketCount: rep.ticketCount,
            stores: rep.stores || [],
            trend: rep.trend
          }))}
          storeData={storePerformanceData}
          dateRange={repData?.dateRange}
        />

        {/* Performance Alerts Section */}
        <div id="performance-alerts">
          <PerformanceAlerts
            underperformingStores={underperformingStores}
            underperformingReps={underperformingReps}
            threshold={70}
            onExportRep={handleExportRepPDF}
          />
        </div>

        {/* Performance Tables Section */}
        <PerformanceTables
          storeData={storePerformanceData}
          repData={processedReps.map(rep => ({
            repName: rep.repName,
            avgTicketSize: rep.avgTicketSize,
            grossProfitMargin: rep.grossProfitMargin,
            revenue: rep.revenue,
            ticketCount: rep.ticketCount,
            itemsSold: rep.itemsSold,
            stores: rep.stores || [],
            returnRate: rep.returnRate || 0
          }))}
        />

        {/* Keep existing tabs for backward compatibility but hidden */}
        <div className="hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Rep Performance List */}
              <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Sales Rep Rankings</CardTitle>
                      <CardDescription>
                        {repData?.filteredCount || 0} reps shown • Sorted by {sortBy}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {repData?.dateRange && (
                        <>
                          {new Date(repData.dateRange.start).toLocaleDateString()} - 
                          {new Date(repData.dateRange.end).toLocaleDateString()}
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {processedReps.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-muted-foreground">
                        No sales reps found matching your filters
                      </p>
                    </div>
                  ) : (
                    processedReps.map((rep, index) => (
                      <RepPerformanceRow
                        key={rep.repName}
                        rep={rep}
                        rank={index + 1}
                        companyAvg={repData?.companyMetrics}
                        onSelect={setSelectedRepForDetail}
                        delay={Math.min(index * 0.05, 0.5)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              {/* Top performers showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top Revenue */}
                <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Top Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {processedReps.slice(0, 5).map((rep, i) => (
                      <div key={rep.repName} className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                          i === 0 ? "bg-yellow-500" :
                          i === 1 ? "bg-gray-400" :
                          i === 2 ? "bg-orange-600" :
                          "bg-gray-300"
                        )}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {rep.repName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ${Math.round(rep.revenue).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Top GP % */}
                <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Highest GP %
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[...processedReps]
                      .sort((a, b) => b.grossProfitMargin - a.grossProfitMargin)
                      .slice(0, 5)
                      .map((rep, i) => (
                        <div key={rep.repName} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              {i + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {rep.repName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {(rep.grossProfitMargin || 0).toFixed(1)}% margin
                            </p>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

              </div>

              {/* Bottom performers / Need attention */}
              <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Needs Attention
                  </CardTitle>
                  <CardDescription>
                    Reps with declining performance or low activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {processedReps
                      .filter(rep => 
                        rep.daysSinceLastSale > 7 || 
                        (rep.revenueChange && parseFloat(rep.revenueChange) < -20)
                      )
                      .slice(0, 6)
                      .map(rep => (
                        <div key={rep.repName} className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">
                              {rep.repName}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRepForDetail(rep)}
                            >
                              View Details
                            </Button>
                          </div>
                          <div className="space-y-1 text-sm">
                            {rep.daysSinceLastSale > 7 && (
                              <p className="text-yellow-700 dark:text-yellow-300">
                                • No sales in {rep.daysSinceLastSale} days
                              </p>
                            )}
                            {rep.revenueChange && parseFloat(rep.revenueChange) < -20 && (
                              <p className="text-yellow-700 dark:text-yellow-300">
                                • Revenue down {Math.abs(parseFloat(rep.revenueChange))}%
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {/* Performance distribution */}
              <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Performance Distribution</CardTitle>
                  <CardDescription>
                    How reps are distributed across performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Revenue distribution */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Revenue Distribution
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: "$0-5k", min: 0, max: 5000 },
                          { label: "$5-10k", min: 5000, max: 10000 },
                          { label: "$10-25k", min: 10000, max: 25000 },
                          { label: "$25k+", min: 25000, max: Infinity }
                        ].map(range => {
                          const count = processedReps.filter(rep => 
                            rep.revenue >= range.min && rep.revenue < range.max
                          ).length;
                          const percentage = (count / processedReps.length) * 100;
                          
                          return (
                            <div key={range.label} className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-16">
                                {range.label}
                              </span>
                              <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1, delay: 0.5 }}
                                  className="h-full bg-blue-500 dark:bg-blue-400"
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* Store performance comparison */}
              <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Store Performance Comparison</CardTitle>
                  <CardDescription>
                    Average rep performance by store location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filterData?.stores.map((store: any) => {
                      const storeReps = processedReps.filter(rep => 
                        rep.metadata?.storeId === store
                      );
                      const storeRevenue = storeReps.reduce((sum, rep) => sum + rep.revenue, 0);
                      const avgRevenue = storeReps.length > 0 ? storeRevenue / storeReps.length : 0;
                      const avgGP = storeReps.length > 0 
                        ? storeReps.reduce((sum, rep) => sum + rep.grossProfitMargin, 0) / storeReps.length
                        : 0;
                      
                      return (
                        <div key={store} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div>
                            <h4 className="font-medium text-foreground">
                              Store {store}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {storeReps.length} reps • ${Math.round(storeRevenue).toLocaleString()} total
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Avg Revenue</p>
                              <p className="font-medium text-foreground">
                                ${Math.round(avgRevenue).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Avg GP %</p>
                              <p className="font-medium text-foreground">
                                {(avgGP || 0).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Rep Detail Panel */}
        <AnimatePresence>
          {selectedRepForDetail && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRepForDetail(null)}
                className="fixed inset-0 bg-black z-40"
              />
              <RepDetailPanel
                rep={selectedRepForDetail}
                onClose={() => setSelectedRepForDetail(null)}
              />
            </>
          )}
        </AnimatePresence>
      </div>
  );
}

