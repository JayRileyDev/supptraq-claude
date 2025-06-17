import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/react-router";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Calendar,
  FileText,
  Users,
  Store,
  Download,
  BarChart3
} from "lucide-react";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { exportToExcel } from "~/utils/excel-export";
import { getAvgTicketColor } from "~/utils/avg-ticket-colors";

interface DailyRepReportProps {
  // No props needed for now
}

interface RepPerformance {
  repName: string;
  avgTicket: number;
  totalTickets: number;
  tier1Count: number; // $125-198
  tier2Count: number; // $199-298
  tier3Count: number; // $299+
}

interface StoreReport {
  storeId: string;
  reps: RepPerformance[];
  totalReps: number;
  storeAvgTicket: number;
}

function RepRow({ rep }: { rep: RepPerformance }) {

  return (
    <div className="grid grid-cols-6 gap-4 py-3 border-b border-muted/30 last:border-b-0">
      {/* Rep Name */}
      <div className="font-medium text-sm text-foreground">
        {rep.repName}
      </div>
      
      {/* Average Ticket */}
      <div className="text-right">
        <span className={cn("font-bold text-sm", getAvgTicketColor(rep.avgTicket))}>
          ${rep.avgTicket.toFixed(2)}
        </span>
        <div className="text-xs text-muted-foreground">
          {rep.totalTickets} tickets
        </div>
      </div>
      
      {/* Tier 1: $125-198 */}
      <div className="text-center">
        <div className="font-medium text-sm text-foreground">{rep.tier1Count}</div>
        <div className="text-xs text-muted-foreground">$125-198</div>
      </div>
      
      {/* Tier 2: $199-298 */}
      <div className="text-center">
        <div className="font-medium text-sm text-foreground">{rep.tier2Count}</div>
        <div className="text-xs text-muted-foreground">$199-298</div>
      </div>
      
      {/* Tier 3: $299+ */}
      <div className="text-center">
        <div className="font-medium text-sm text-foreground">{rep.tier3Count}</div>
        <div className="text-xs text-muted-foreground">$299+</div>
      </div>
      
      {/* Percentage of High Value */}
      <div className="text-center">
        <div className="font-medium text-sm text-foreground">
          {rep.totalTickets > 0 ? Math.round(((rep.tier2Count + rep.tier3Count) / rep.totalTickets) * 100) : 0}%
        </div>
        <div className="text-xs text-muted-foreground">high value</div>
      </div>
    </div>
  );
}

function StoreSection({ store }: { store: StoreReport }) {

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            Store {store.storeId}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {store.totalReps} reps
            </Badge>
            <Badge variant="outline" className={cn("text-xs", getAvgTicketColor(store.storeAvgTicket))}>
              ${store.storeAvgTicket.toFixed(2)} avg
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Header Row */}
        <div className="grid grid-cols-6 gap-4 py-2 border-b border-muted/50 mb-3">
          <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
            Sales Rep
          </div>
          <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide text-right">
            Avg Ticket
          </div>
          <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide text-center">
            Tier 1
          </div>
          <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide text-center">
            Tier 2
          </div>
          <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide text-center">
            Tier 3
          </div>
          <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide text-center">
            High Value %
          </div>
        </div>
        
        {/* Rep Rows */}
        <div className="space-y-0">
          {store.reps.map((rep) => (
            <RepRow key={rep.repName} rep={rep} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyRepReport({}: DailyRepReportProps) {
  const { user } = useUser();
  const userId = user?.id;
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [queryDate, setQueryDate] = useState<string | null>(null);
  
  const reportData = useQuery(
    api.salesUnified.getDailyRepReport,
    queryDate ? { date: queryDate } : "skip"
  );

  const handleGenerateReport = () => {
    setQueryDate(selectedDate);
  };

  const handleExportExcel = () => {
    if (!reportData?.stores || reportData.stores.length === 0) return;

    // Prepare data for export
    const headers = ['Store', 'Sales Rep', 'Avg Ticket', 'Total Tickets', 'Tier 1 ($125-198)', 'Tier 2 ($199-298)', 'Tier 3 ($299+)', 'High Value %'];
    const data: any[][] = [];

    reportData.stores.forEach(store => {
      store.reps.forEach((rep: RepPerformance) => {
        const highValuePercent = rep.totalTickets > 0 ? Math.round(((rep.tier2Count + rep.tier3Count) / rep.totalTickets) * 100) : 0;
        const row = [
          `Store ${store.storeId}`,
          rep.repName,
          rep.avgTicket.toFixed(2),
          rep.totalTickets,
          rep.tier1Count,
          rep.tier2Count,
          rep.tier3Count,
          `${highValuePercent}%`
        ];
        data.push(row);
      });
    });

    // Export to Excel with auto-fit columns
    exportToExcel({
      filename: `daily-rep-report-${selectedDate}`,
      sheetName: `Rep Report ${selectedDate}`,
      headers,
      data,
      autoFit: true,
      headerStyle: true
    });
  };

  const isLoading = Boolean(queryDate && !reportData);
  const hasData = reportData && reportData.stores.length > 0;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Daily Rep Performance Report
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track individual rep performance and sale tier breakdowns by day
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Generate Report Button */}
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>

            {/* Summary Stats */}
            {hasData && (
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span>{reportData.totalStores} stores</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{reportData.totalReps} reps</span>
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {!queryDate ? (
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">Select a Date</h3>
            <p className="text-muted-foreground">
              Choose a date above and click "Generate Report" to view daily rep performance
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-foreground mb-2">Generating Report</h3>
            <p className="text-muted-foreground">
              Loading data for {format(new Date(queryDate), 'MMMM dd, yyyy')}...
            </p>
          </CardContent>
        </Card>
      ) : reportData && reportData.stores.length === 0 ? (
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Data Available</h3>
            <p className="text-muted-foreground">
              No sales data found for {format(new Date(queryDate), 'MMMM dd, yyyy')}
            </p>
          </CardContent>
        </Card>
      ) : reportData ? (
        <div className="space-y-4">
          {reportData.stores.map((store, index) => (
            <motion.div
              key={store.storeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StoreSection store={store} />
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  );
}