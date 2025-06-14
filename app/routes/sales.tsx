import { useQuery } from "convex/react";
// Removed unused imports - handled by dashboard layout
import { useUser } from "@clerk/react-router";
import { useState, useMemo } from "react";
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

  // Filter states
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | undefined>(undefined);
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedRep, setSelectedRep] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [minTickets, setMinTickets] = useState<number | undefined>(undefined);
  const [includeReturns, setIncludeReturns] = useState(true);
  const [includeGiftCards, setIncludeGiftCards] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"revenue" | "tickets" | "gp">("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // UI states
  const [selectedRepForDetail, setSelectedRepForDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const filters = useQuery(
    api.salesRepQueries.getRepFilters,
    userId ? { userId } : "skip"
  );

  const repData = useQuery(
    api.salesRepQueries.getRepPerformanceData,
    userId ? {
      userId,
      dateRange,
      storeId: selectedStore,
      salesRep: selectedRep,
      performanceFilter,
      minTickets,
      includeReturns,
      includeGiftCards
    } : "skip"
  );

  // Process and filter reps
  const processedReps = useMemo(() => {
    if (!repData?.reps) return [];

    let reps = [...repData.reps];

    // Apply search filter
    if (searchQuery) {
      reps = reps.filter(rep => 
        rep.repName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

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
  }, [repData, searchQuery, sortBy, sortOrder]);

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    if (!repData?.reps || repData.reps.length === 0) {
      return {
        totalRevenue: 0,
        totalTickets: 0,
        avgTicketSize: 0,
        totalGrossProfit: 0,
        avgGPMargin: 0,
        totalReturns: 0,
        avgReturnRate: 0,
        totalGiftCards: 0,
        activeReps: 0
      };
    }

    const reps = repData.reps;
    const totalRevenue = reps.reduce((sum: number, rep: any) => sum + rep.revenue, 0);
    const totalTickets = reps.reduce((sum: number, rep: any) => sum + rep.ticketCount, 0);
    const totalGrossProfit = reps.reduce((sum: number, rep: any) => sum + rep.grossProfit, 0);
    const totalReturns = reps.reduce((sum: number, rep: any) => sum + rep.returns, 0);
    const totalGiftCards = reps.reduce((sum: number, rep: any) => sum + rep.giftCardRevenue, 0);
    const activeReps = reps.filter((rep: any) => rep.ticketCount > 0).length;

    return {
      totalRevenue,
      totalTickets,
      avgTicketSize: totalTickets > 0 ? totalRevenue / totalTickets : 0,
      totalGrossProfit,
      avgGPMargin: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
      totalReturns,
      avgReturnRate: reps.reduce((sum: number, rep: any) => sum + rep.returnRate, 0) / reps.length,
      totalGiftCards,
      activeReps
    };
  }, [repData]);

  const handleDateRangeSelect = (days: number | string) => {
    const end = new Date();
    const start = new Date();
    
    if (days === "ytd") {
      start.setMonth(0, 1);
    } else if (typeof days === "number") {
      start.setDate(start.getDate() - days);
    }
    
    setDateRange({
      start: start.toISOString(),
      end: end.toISOString()
    });
  };

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
      const storeFilter = selectedStore !== "all" ? `_store-${selectedStore}` : "";
      const repFilter = selectedRep !== "all" ? `_rep-${selectedRep.replace(/\s+/g, "-")}` : "";
      
      link.setAttribute("download", `sales-rep-performance_${dateStr}${storeFilter}${repFilter}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!repData) {
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

        {/* Advanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="include-returns"
                      checked={includeReturns}
                      onCheckedChange={setIncludeReturns}
                    />
                    <Label htmlFor="include-returns">Include Returns</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="include-gift-cards"
                      checked={includeGiftCards}
                      onCheckedChange={setIncludeGiftCards}
                    />
                    <Label htmlFor="include-gift-cards">Include Gift Cards</Label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date range and primary filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Date Range
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        {dateRange ? "Custom Range" : "Last 30 days"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {dateRangePresets.map(preset => (
                        <DropdownMenuItem
                          key={preset.label}
                          onClick={() => handleDateRangeSelect(preset.value)}
                        >
                          {preset.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Store
                  </Label>
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger>
                      <SelectValue placeholder="All stores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All stores</SelectItem>
                      {filters?.stores.map((store: any) => (
                        <SelectItem key={store} value={store}>
                          Store {store}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Sales Rep
                  </Label>
                  <Select value={selectedRep} onValueChange={setSelectedRep}>
                    <SelectTrigger>
                      <SelectValue placeholder="All reps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All reps</SelectItem>
                      {filters?.reps.map((rep: any) => (
                        <SelectItem key={rep.name} value={rep.name}>
                          {rep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Performance
                  </Label>
                  <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All reps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All performers</SelectItem>
                      <SelectItem value="top">Top 10</SelectItem>
                      <SelectItem value="bottom">Bottom 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search reps..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Additional filters */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="min-tickets" className="text-sm">
                      Min tickets:
                    </Label>
                    <Input
                      id="min-tickets"
                      type="number"
                      placeholder="5"
                      value={minTickets || ""}
                      onChange={(e) => setMinTickets(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Sort by:
                  </span>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="tickets">Tickets</SelectItem>
                      <SelectItem value="gp">GP %</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  >
                    {sortOrder === "desc" ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
            description={`of ${repData.totalReps} total`}
            delay={0.4}
          />
          <MetricCard
            title="Return Rate"
            value={`${(overallMetrics.avgReturnRate || 0).toFixed(1)}%`}
            icon={RotateCcw}
            description="Average across reps"
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

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
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
                        {repData.filteredCount} reps shown • Sorted by {sortBy}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {repData.dateRange && (
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
                        companyAvg={repData.companyMetrics}
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
                    {filters?.stores.map(store => {
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
        </motion.div>

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

