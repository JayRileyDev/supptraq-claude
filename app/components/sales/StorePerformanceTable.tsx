import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useUnifiedSales } from "./UnifiedSalesProvider";
import { cn } from "~/lib/utils";
import { exportToExcel } from "~/utils/excel-export";
import { getAvgTicketColor } from "~/utils/avg-ticket-colors";
import { 
  Store,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Target,
  TrendingUp,
  Package,
  RefreshCw,
  BarChart3,
  Download
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

interface StorePerformanceTableProps {
  // Props no longer needed since data comes from context
}

type SortField = 'storeId' | 'revenue' | 'ticketCount' | 'avgTicketSize' | 'grossProfitPercent' | 'returnRate' | 'itemsSold' | 'consistencyScore';
type SortDirection = 'asc' | 'desc';

interface StoreData {
  storeId: string;
  revenue: number;
  ticketCount: number;
  avgTicketSize: number;
  grossProfitPercent: number;
  returnRate: number;
  itemsSold: number;
  consistencyScore: number;
}

function SortButton({ 
  field, 
  currentField, 
  direction, 
  onSort 
}: { 
  field: SortField; 
  currentField: SortField; 
  direction: SortDirection; 
  onSort: (field: SortField) => void; 
}) {
  const isActive = currentField === field;
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      className={cn(
        "h-8 px-2 text-xs font-medium transition-colors",
        isActive && "bg-muted"
      )}
    >
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3" />
      )}
    </Button>
  );
}

function StoreRow({ store, index }: { store: StoreData; index: number }) {
  const getPerformanceColor = (value: number, field: SortField) => {
    switch (field) {
      case 'avgTicketSize':
        return getAvgTicketColor(value);
      case 'grossProfitPercent':
        if (value >= 30) return 'text-green-600 dark:text-green-400';
        if (value >= 20) return 'text-blue-600 dark:text-blue-400';
        return 'text-orange-600 dark:text-orange-400';
      case 'returnRate':
        if (value <= 5) return 'text-green-600 dark:text-green-400';
        if (value <= 10) return 'text-blue-600 dark:text-blue-400';
        return 'text-red-600 dark:text-red-400';
      case 'consistencyScore':
        if (value >= 80) return 'text-green-600 dark:text-green-400';
        if (value >= 60) return 'text-blue-600 dark:text-blue-400';
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-foreground';
    }
  };

  const getConsistencyBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Consistent', color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Moderate', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' };
    return { variant: 'destructive' as const, label: 'Variable', color: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' };
  };

  const consistencyBadge = getConsistencyBadge(store.consistencyScore);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-muted/30 hover:bg-muted/30 transition-colors"
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-foreground">Store {store.storeId}</div>
            <div className="text-xs text-muted-foreground">ID: {store.storeId}</div>
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="font-semibold text-foreground">
          ${store.revenue.toLocaleString()}
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="font-medium text-foreground">
          {store.ticketCount.toLocaleString()}
        </div>
      </td>
      <td className="p-4 text-right">
        <div className={cn("font-semibold", getPerformanceColor(store.avgTicketSize, 'avgTicketSize'))}>
          ${store.avgTicketSize.toFixed(2)}
        </div>
        {store.avgTicketSize < 70 && (
          <Badge variant="outline" className="mt-1 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900">
            Below $70
          </Badge>
        )}
      </td>
      <td className="p-4 text-right">
        <div className={cn("font-medium", getPerformanceColor(store.grossProfitPercent, 'grossProfitPercent'))}>
          {store.grossProfitPercent.toFixed(1)}%
        </div>
      </td>
      <td className="p-4 text-right">
        <div className={cn("font-medium", getPerformanceColor(store.returnRate, 'returnRate'))}>
          {store.returnRate.toFixed(1)}%
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="font-medium text-foreground">
          {store.itemsSold.toLocaleString()}
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <div className={cn("font-medium", getPerformanceColor(store.consistencyScore, 'consistencyScore'))}>
            {store.consistencyScore.toFixed(0)}
          </div>
          <Badge className={cn("text-xs", consistencyBadge.color)}>
            {consistencyBadge.label}
          </Badge>
        </div>
      </td>
    </motion.tr>
  );
}

export function StorePerformanceTable({}: StorePerformanceTableProps) {
  const { storePerformance, isLoading } = useUnifiedSales();
  
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportExcel = () => {
    if (!storePerformance?.stores || storePerformance.stores.length === 0) return;

    const headers = [
      'Store ID',
      'Revenue',
      'Ticket Count',
      'Avg Ticket Size',
      'Gross Profit %',
      'Return Rate %',
      'Items Sold',
      'Consistency Score'
    ];

    const data = sortedStores.map(store => [
      store.storeId,
      `$${store.revenue.toLocaleString()}`,
      store.ticketCount,
      `$${store.avgTicketSize.toFixed(2)}`,
      `${store.grossProfitPercent.toFixed(1)}%`,
      `${store.returnRate.toFixed(1)}%`,
      store.itemsSold,
      store.consistencyScore.toFixed(1)
    ]);

    exportToExcel({
      filename: `store-performance-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Store Performance',
      headers,
      data,
      autoFit: true,
      headerStyle: true
    });
  };

  const sortedStores = useMemo(() => {
    if (!storePerformance?.stores) return [];
    
    return [...storePerformance.stores].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle string comparison for storeId
      if (sortField === 'storeId') {
        aVal = aVal as string;
        bVal = bVal as string;
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      // Handle numeric comparison
      aVal = aVal as number;
      bVal = bVal as number;
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [storePerformance?.stores, sortField, sortDirection]);

  if (isLoading || !storePerformance) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!storePerformance.stores || storePerformance.stores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Store Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Store Data Available</h3>
            <p className="text-muted-foreground">
              No store performance data found for the selected date range.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Store Performance</h2>
          <p className="text-muted-foreground">
            Comprehensive performance metrics for all stores
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span>{storePerformance.stores.length} stores</span>
          </div>
          <Button
            onClick={handleExportExcel}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>


      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Store Performance Details
            <Badge variant="outline" className="ml-auto">
              {storePerformance.stores.length} stores
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-muted/30 bg-muted/20">
                  <th className="p-4 text-left font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      Store
                      <SortButton 
                        field="storeId" 
                        currentField={sortField} 
                        direction={sortDirection} 
                        onSort={handleSort} 
                      />
                    </div>
                  </th>
                  <th className="p-4 text-right font-medium text-muted-foreground">
                    <div className="flex items-center justify-end gap-2">
                      Total Sales
                      <SortButton 
                        field="revenue" 
                        currentField={sortField} 
                        direction={sortDirection} 
                        onSort={handleSort} 
                      />
                    </div>
                  </th>
                  <th className="p-4 text-center font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      Ticket Count
                      <SortButton 
                        field="ticketCount" 
                        currentField={sortField} 
                        direction={sortDirection} 
                        onSort={handleSort} 
                      />
                    </div>
                  </th>
                  <th className="p-4 text-right font-medium text-muted-foreground">
                    <div className="flex items-center justify-end gap-2">
                      Avg Ticket Value
                      <SortButton 
                        field="avgTicketSize" 
                        currentField={sortField} 
                        direction={sortDirection} 
                        onSort={handleSort} 
                      />
                    </div>
                  </th>
                  <th className="p-4 text-right font-medium text-muted-foreground">
                    <div className="flex items-center justify-end gap-2">
                      Gross Profit %
                      <SortButton 
                        field="grossProfitPercent" 
                        currentField={sortField} 
                        direction={sortDirection} 
                        onSort={handleSort} 
                      />
                    </div>
                  </th>
                  <th className="p-4 text-right font-medium text-muted-foreground">
                    <div className="flex items-center justify-end gap-2">
                      Return Rate
                      <SortButton 
                        field="returnRate" 
                        currentField={sortField} 
                        direction={sortDirection} 
                        onSort={handleSort} 
                      />
                    </div>
                  </th>
                  <th className="p-4 text-center font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      Items Sold
                      <SortButton 
                        field="itemsSold" 
                        currentField={sortField} 
                        direction={sortDirection} 
                        onSort={handleSort} 
                      />
                    </div>
                  </th>
                  <th className="p-4 text-center font-medium text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      Consistency
                      <SortButton 
                        field="consistencyScore" 
                        currentField={sortField} 
                        direction={sortDirection} 
                        onSort={handleSort} 
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStores.map((store, index) => (
                  <StoreRow key={store.storeId} store={store} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}