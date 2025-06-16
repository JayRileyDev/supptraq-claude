import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { Store, User, ArrowUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface StorePerformanceData {
  storeId: string;
  storeName?: string;
  avgTicketSize: number;
  grossProfitMargin: number;
  revenue: number;
  ticketCount: number;
  itemsSold: number;
  returnRate: number;
}

interface RepPerformanceData {
  repName: string;
  avgTicketSize: number;
  grossProfitMargin: number;
  revenue: number;
  ticketCount: number;
  itemsSold: number;
  stores: string[];
  returnRate: number;
}

interface PerformanceTablesProps {
  storeData: StorePerformanceData[];
  repData: RepPerformanceData[];
}

type SortField = 'name' | 'avgTicketSize' | 'grossProfitMargin' | 'revenue' | 'ticketCount' | 'returnRate';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

function StorePerformanceTable({ data }: { data: StorePerformanceData[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter data based on search
  const filteredData = data.filter(store => {
    const searchLower = searchQuery.toLowerCase();
    return (
      store.storeId.toLowerCase().includes(searchLower) ||
      (store.storeName?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'name':
        aValue = a.storeName || a.storeId;
        bValue = b.storeName || b.storeId;
        break;
      case 'avgTicketSize':
        aValue = a.avgTicketSize;
        bValue = b.avgTicketSize;
        break;
      case 'grossProfitMargin':
        aValue = a.grossProfitMargin;
        bValue = b.grossProfitMargin;
        break;
      case 'revenue':
        aValue = a.revenue;
        bValue = b.revenue;
        break;
      case 'ticketCount':
        aValue = a.ticketCount;
        bValue = b.ticketCount;
        break;
      case 'returnRate':
        aValue = a.returnRate;
        bValue = b.returnRate;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Store Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 w-[200px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky top-0 bg-background">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-2"
                    onClick={() => handleSort('name')}
                  >
                    Store
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('avgTicketSize')}
                  >
                    Avg Ticket
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('grossProfitMargin')}
                  >
                    GP %
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('revenue')}
                  >
                    Revenue
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('ticketCount')}
                  >
                    Tickets
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('returnRate')}
                  >
                    Return %
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No stores found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((store, index) => (
                  <TableRow 
                    key={store.storeId}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {store.storeName || `Store ${store.storeId}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-mono",
                        store.avgTicketSize < 70 && "text-blue-600 dark:text-blue-400"
                      )}>
                        ${Math.round(store.avgTicketSize)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="font-mono">
                        {store.grossProfitMargin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${Math.round(store.revenue).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {store.ticketCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-mono",
                        store.returnRate > 10 && "text-red-600 dark:text-red-400"
                      )}>
                        {store.returnRate.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length)} of {sortedData.length} stores
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RepPerformanceTable({ data }: { data: RepPerformanceData[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter data based on search and exclude reps with no valid sales
  const filteredData = data.filter(rep => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = rep.repName.toLowerCase().includes(searchLower);
    
    // Only include reps with actual sales (positive tickets, revenue, or items sold)
    const hasValidSales = rep.ticketCount > 0 && (rep.revenue > 0 || rep.itemsSold > 0);
    
    return matchesSearch && hasValidSales;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'name':
        aValue = a.repName;
        bValue = b.repName;
        break;
      case 'avgTicketSize':
        aValue = a.avgTicketSize;
        bValue = b.avgTicketSize;
        break;
      case 'grossProfitMargin':
        aValue = a.grossProfitMargin;
        bValue = b.grossProfitMargin;
        break;
      case 'revenue':
        aValue = a.revenue;
        bValue = b.revenue;
        break;
      case 'ticketCount':
        aValue = a.ticketCount;
        bValue = b.ticketCount;
        break;
      case 'returnRate':
        aValue = a.returnRate;
        bValue = b.returnRate;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Sales Rep Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search reps..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 w-[200px]"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky top-0 bg-background">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-2"
                    onClick={() => handleSort('name')}
                  >
                    Sales Rep
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-center">Stores</TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('avgTicketSize')}
                  >
                    Avg Ticket
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('grossProfitMargin')}
                  >
                    GP %
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('revenue')}
                  >
                    Revenue
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('ticketCount')}
                  >
                    Tickets
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="sticky top-0 bg-background text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort('returnRate')}
                  >
                    Return %
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No sales reps found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((rep, index) => (
                  <TableRow 
                    key={rep.repName}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{rep.repName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {rep.stores.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-mono",
                        rep.avgTicketSize < 70 && "text-blue-600 dark:text-blue-400"
                      )}>
                        ${Math.round(rep.avgTicketSize)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="font-mono">
                        {rep.grossProfitMargin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${Math.round(rep.revenue).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {rep.ticketCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-mono",
                        rep.returnRate > 10 && "text-red-600 dark:text-red-400"
                      )}>
                        {rep.returnRate.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length)} of {sortedData.length} reps
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PerformanceTables({ storeData, repData }: PerformanceTablesProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StorePerformanceTable data={storeData} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <RepPerformanceTable data={repData} />
      </motion.div>
    </div>
  );
}