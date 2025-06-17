import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from "convex/react";
import { useUser } from "@clerk/react-router";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Database, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

// Unified filter interface
export interface SalesFilters {
  dateRange?: { start: string; end: string };
  storeId?: string;
  salesRepId?: string;
  includeReturns: boolean;
  includeGiftCards: boolean;
}

// Metrics data structure
export interface SalesMetrics {
  totalSales: number;
  ticketCount: number;
  avgTicketValue: number;
  grossProfitPercent: number;
  itemsSold: number;
  returnRate: number;
  giftCardUsage: number;
  salesConsistency: number;
  
  uniqueTickets: number;
  totalReturnValue: number;
  totalGiftCardValue: number;
  totalLines: number;
  
  stores: string[];
  salesReps: string[];
  dateRange: {
    earliest: string;
    latest: string;
  };
}

// Filter options
export interface FilterOptions {
  stores: string[];
  salesReps: string[];
  storeCount: number;
  repCount: number;
  totalLines: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
}

// Context interface - Extended to include all component data
interface UnifiedSalesContextType {
  // Data
  metrics: SalesMetrics | null;
  filterOptions: FilterOptions | null;
  
  // All component data from centralized query
  leaderboards: any | null;
  performanceAlerts: any | null;
  storePerformance: any | null;
  repPerformance: any | null;
  schedulingData: any | null;
  
  // State
  filters: SalesFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateFilters: (newFilters: Partial<SalesFilters>) => void;
  refreshData: () => void;
}

const UnifiedSalesContext = createContext<UnifiedSalesContextType | null>(null);

// Default filters
const DEFAULT_FILTERS: SalesFilters = {
  includeReturns: true,
  includeGiftCards: true
};

export function UnifiedSalesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const userId = user?.id;
  
  const [filters, setFilters] = useState<SalesFilters>(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single centralized query for ALL sales data
  const completeSalesData = useQuery(
    api.salesDataComplete.getCompleteSalesData,
    userId ? {
      userId,
      dateRange: filters.dateRange,
      storeId: filters.storeId,
      salesRepId: filters.salesRepId,
      includeReturns: filters.includeReturns,
      includeGiftCards: filters.includeGiftCards
    } : "skip"
  );

  // Handle loading states
  useEffect(() => {
    if (completeSalesData !== undefined) {
      setIsLoading(false);
      setError(null);
    } else {
      setIsLoading(true);
    }
  }, [completeSalesData]);

  // Handle errors
  useEffect(() => {
    if (completeSalesData instanceof Error) {
      setError(completeSalesData.message);
      setIsLoading(false);
    }
  }, [completeSalesData]);

  const updateFilters = (newFilters: Partial<SalesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setIsLoading(true);
    setError(null);
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
    setError(null);
  };

  const contextValue: UnifiedSalesContextType = {
    // Extract data from centralized query
    metrics: completeSalesData?.metrics || null,
    filterOptions: completeSalesData?.filterOptions || null,
    leaderboards: completeSalesData?.leaderboards || null,
    performanceAlerts: completeSalesData?.performanceAlerts || null,
    storePerformance: completeSalesData?.storePerformance || null,
    repPerformance: completeSalesData?.repPerformance || null,
    schedulingData: completeSalesData?.schedulingData || null,
    
    // State
    filters,
    isLoading,
    error,
    
    // Actions
    updateFilters,
    refreshData
  };

  return (
    <UnifiedSalesContext.Provider value={contextValue}>
      {children}
    </UnifiedSalesContext.Provider>
  );
}

function SalesLoadingOverlay({ 
  error, 
  onRetry 
}: { 
  error: string | null; 
  onRetry: () => void; 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <motion.div
              animate={error ? {} : { rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="flex justify-center"
            >
              <div className="p-4 rounded-full bg-primary/10">
                {error ? (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                ) : (
                  <Loader2 className="h-8 w-8 text-primary" />
                )}
              </div>
            </motion.div>

            <div>
              <h2 className="text-xl font-semibold mb-2">
                {error ? 'Error Loading Sales Data' : 'Loading Sales Analytics'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {error || 'Aggregating data from all ticket sources...'}
              </p>
            </div>

            {error && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                Retry Loading
              </motion.button>
            )}

            {!error && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Processing ticket history data</p>
                <p>• Processing return tickets data</p>
                <p>• Processing gift card data</p>
                <p>• Calculating unified metrics</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function useUnifiedSales() {
  const context = useContext(UnifiedSalesContext);
  if (!context) {
    throw new Error('useUnifiedSales must be used within a UnifiedSalesProvider');
  }
  return context;
}

