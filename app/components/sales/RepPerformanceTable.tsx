import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useUnifiedSales } from "./UnifiedSalesProvider";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { exportToExcel } from "~/utils/excel-export";
import { getAvgTicketColor } from "~/utils/avg-ticket-colors";
import { 
  User,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Target,
  TrendingUp,
  Package,
  RefreshCw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Store,
  Download
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

interface RepPerformanceTableProps {
  // Props no longer needed since data comes from context
}

type SortField = 'repName' | 'storesWorked' | 'revenue' | 'ticketCount' | 'avgTicketSize' | 'grossProfitPercent' | 'returnRate' | 'itemsSold';
type SortDirection = 'asc' | 'desc';

interface RepData {
  repName: string;
  storesWorked: string;
  storeCount: number;
  revenue: number;
  ticketCount: number;
  avgTicketSize: number;
  grossProfitPercent: number;
  returnRate: number;
  itemsSold: number;
}

const ITEMS_PER_PAGE = 12;

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

function RepRow({ rep, index }: { rep: RepData; index: number }) {
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
      default:
        return 'text-foreground';
    }
  };

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
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-foreground">{rep.repName}</div>
            <div className="text-xs text-muted-foreground">
              {rep.storeCount} store{rep.storeCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="max-w-xs">
          <div className="text-sm text-foreground truncate" title={rep.storesWorked}>
            {rep.storesWorked}
          </div>
          <div className="text-xs text-muted-foreground">
            {rep.storeCount} location{rep.storeCount !== 1 ? 's' : ''}
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="font-semibold text-foreground">
          ${rep.revenue.toLocaleString()}
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="font-medium text-foreground">
          {rep.ticketCount.toLocaleString()}
        </div>
      </td>
      <td className="p-4 text-right">
        <div className={cn("font-semibold", getPerformanceColor(rep.avgTicketSize, 'avgTicketSize'))}>
          ${rep.avgTicketSize.toFixed(2)}
        </div>
        {rep.avgTicketSize < 70 && (
          <Badge variant="outline" className="mt-1 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900">
            Below $70
          </Badge>
        )}
      </td>
      <td className="p-4 text-right">
        <div className={cn("font-medium", getPerformanceColor(rep.grossProfitPercent, 'grossProfitPercent'))}>
          {rep.grossProfitPercent.toFixed(1)}%
        </div>
      </td>
      <td className="p-4 text-right">
        <div className={cn("font-medium", getPerformanceColor(rep.returnRate, 'returnRate'))}>
          {rep.returnRate.toFixed(1)}%
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="font-medium text-foreground">
          {rep.itemsSold.toLocaleString()}
        </div>
      </td>
    </motion.tr>
  );
}

function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-muted-foreground">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="h-8 min-w-8 px-2"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function RepPerformanceTable({}: RepPerformanceTableProps) {
  const { repPerformance, isLoading } = useUnifiedSales();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleExportExcel = () => {
    if (!repPerformance?.reps || repPerformance.reps.length === 0) return;

    const headers = [
      'Sales Rep',
      'Stores Worked',
      'Store Count',
      'Revenue',
      'Ticket Count',
      'Avg Ticket Size',
      'Gross Profit %',
      'Return Rate %',
      'Items Sold'
    ];

    const data = filteredAndSortedReps.map(rep => [
      rep.repName,
      rep.storesWorked,
      rep.storeCount,
      `$${rep.revenue.toLocaleString()}`,
      rep.ticketCount,
      `$${rep.avgTicketSize.toFixed(2)}`,
      `${rep.grossProfitPercent.toFixed(1)}%`,
      `${rep.returnRate.toFixed(1)}%`,
      rep.itemsSold
    ]);

    exportToExcel({
      filename: `rep-performance-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Rep Performance',
      headers,
      data,
      autoFit: true,
      headerStyle: true
    });
  };

  const filteredAndSortedReps = useMemo(() => {
    if (!repPerformance?.reps) return [];
    
    // Filter by search term (fuzzy search on rep name)
    let filtered = repPerformance.reps;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = repPerformance.reps.filter((rep: any) => 
        rep.repName.toLowerCase().includes(searchLower) ||
        rep.storesWorked.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle string comparison
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      
      // Handle numeric comparison
      aVal = aVal as number;
      bVal = bVal as number;
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return sorted;
  }, [repPerformance?.reps, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedReps.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReps = filteredAndSortedReps.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (isLoading || !repPerformance) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!repPerformance.reps || repPerformance.reps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sales Rep Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Rep Data Available</h3>
            <p className="text-muted-foreground">
              No sales rep performance data found for the selected date range.
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
          <h2 className="text-2xl font-bold text-foreground">Sales Rep Performance</h2>
          <p className="text-muted-foreground">
            Comprehensive performance metrics for all sales representatives
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{repPerformance.reps.length} reps</span>
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


      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reps or stores..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredAndSortedReps.length} of {repPerformance.reps.length} reps
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rep Performance Details
            <Badge variant="outline" className="ml-auto">
              {filteredAndSortedReps.length} reps
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAndSortedReps.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                No reps match your search criteria. Try adjusting your search term.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-muted/30 bg-muted/20">
                      <th className="p-4 text-left font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          Rep Name
                          <SortButton 
                            field="repName" 
                            currentField={sortField} 
                            direction={sortDirection} 
                            onSort={handleSort} 
                          />
                        </div>
                      </th>
                      <th className="p-4 text-left font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          Stores Worked At
                          <SortButton 
                            field="storesWorked" 
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
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReps.map((rep, index) => (
                      <RepRow key={rep.repName} rep={rep} index={index} />
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-muted/30">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}