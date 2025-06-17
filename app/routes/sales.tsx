import { useUser } from "@clerk/react-router";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Filter, Download, Search, ChevronDown, ChevronUp, 
  BarChart3, Target, Clock, Package, CreditCard,
  ArrowUpRight, ArrowDownRight, Loader2, X, ChevronRight,
  Star, TrendingDown, Info, RotateCcw, Trophy, RefreshCw
} from "lucide-react";
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
import { UnifiedSalesProvider, useUnifiedSales, type SalesFilters } from "~/components/sales/UnifiedSalesProvider";
import { UnifiedMetricCards } from "~/components/sales/UnifiedMetricCards";
import { UnifiedPerformanceAlerts } from "~/components/sales/UnifiedPerformanceAlerts";
import { Leaderboards } from "~/components/sales/Leaderboards";
import { StorePerformanceTable } from "~/components/sales/StorePerformanceTable";
import { RepPerformanceTable } from "~/components/sales/RepPerformanceTable";
import { SchedulingOptimizer } from "~/components/sales/SchedulingOptimizer";
import { DailyRepReport } from "~/components/sales/DailyRepReport";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

// Convert our date format to the string format expected by the backend
const formatDateForBackend = (date: Date): string => {
  return date.toISOString();
};

// Convert Date range to backend format using UTC to avoid timezone issues
const convertDateRangeForBackend = (dateRange: { from: Date | undefined; to?: Date | undefined } | undefined) => {
  if (!dateRange?.from) return undefined;
  
  // Use UTC dates to avoid timezone conversion issues
  const startDate = new Date(dateRange.from);
  startDate.setUTCHours(0, 0, 0, 0); // Start of day in UTC
  
  const endDate = new Date(dateRange.to || dateRange.from);
  endDate.setUTCHours(23, 59, 59, 999); // End of day in UTC
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
};

// Main sales content component
function SalesContent() {
  const { user } = useUser();
  const { 
    metrics, 
    filterOptions, 
    filters, 
    updateFilters, 
    refreshData, 
    isLoading, 
    error 
  } = useUnifiedSales();

  // Convert our filter format to the format expected by modern-sales-filter
  const modernFilters = useMemo(() => ({
    dateRange: filters.dateRange ? {
      from: new Date(filters.dateRange.start),
      to: new Date(filters.dateRange.end)
    } : undefined,
    storeId: filters.storeId || "all",
    salesRepId: filters.salesRepId,
    searchQuery: undefined, // Not used in unified system
    includeReturns: filters.includeReturns,
    includeGiftCards: filters.includeGiftCards
  }), [filters]);

  // Convert filter options to the format expected by modern-sales-filter
  const modernFilterData = useMemo(() => {
    if (!filterOptions) return null;
    
    return {
      stores: filterOptions.stores,
      reps: filterOptions.salesReps,
      totalStores: filterOptions.storeCount,
      totalReps: filterOptions.repCount
    };
  }, [filterOptions]);

  // Handle filter changes from the modern filter component
  const handleFiltersChange = useCallback((newFilters: any) => {
    const updatedFilters: Partial<SalesFilters> = {
      includeReturns: newFilters.includeReturns,
      includeGiftCards: newFilters.includeGiftCards
    };

    // Convert date range
    if (newFilters.dateRange) {
      updatedFilters.dateRange = convertDateRangeForBackend(newFilters.dateRange);
    } else {
      updatedFilters.dateRange = undefined;
    }

    // Store filter
    if (newFilters.storeId && newFilters.storeId !== "all") {
      updatedFilters.storeId = newFilters.storeId;
    } else {
      updatedFilters.storeId = undefined;
    }

    // Sales rep filter
    if (newFilters.salesRepId && newFilters.salesRepId !== "all") {
      updatedFilters.salesRepId = newFilters.salesRepId;
    } else {
      updatedFilters.salesRepId = undefined;
    }

    updateFilters(updatedFilters);
  }, [updateFilters]);

  // Date range for performance alerts (convert back to string format)
  const performanceAlertsDateRange = useMemo(() => {
    return filters.dateRange;
  }, [filters.dateRange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Sales Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive sales performance tracking and insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh all sales data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Filters */}
        <ModernSalesFilter
          filters={modernFilters}
          onFiltersChange={handleFiltersChange}
          filterData={modernFilterData}
          isLoading={isLoading}
        />

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Failed to Load Sales Data
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* Metrics Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Key Metrics</h2>
            {metrics && (
              <Badge variant="secondary" className="text-xs">
                {metrics.totalLines.toLocaleString()} total lines processed
              </Badge>
            )}
          </div>
          <UnifiedMetricCards />
        </motion.section>

        {/* Performance Alerts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <UnifiedPerformanceAlerts />
        </motion.section>

        {/* Scheduling Optimizer Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SchedulingOptimizer />
        </motion.section>

        {/* Daily Rep Report Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <DailyRepReport />
        </motion.section>

        {/* Leaderboards Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Leaderboards />
        </motion.section>

        {/* Store Performance Table Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <StorePerformanceTable />
        </motion.section>

        {/* Sales Rep Performance Table Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <RepPerformanceTable />
        </motion.section>
      </div>
    </div>
  );
}

// Main sales page component with provider
export default function SalesPage() {
  return (
    <UnifiedSalesProvider>
      <SalesContent />
    </UnifiedSalesProvider>
  );
}