import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConvex } from "convex/react";
import { useUser } from "@clerk/react-router";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useUnifiedSales } from "./UnifiedSalesProvider";
import { cn } from "~/lib/utils";
import { 
  AlertTriangle, 
  Store, 
  User, 
  ChevronDown, 
  FileText, 
  Calendar, 
  DollarSign, 
  Download,
  Target,
  TrendingDown
} from "lucide-react";
import { generateRepPerformancePDF } from "~/utils/pdf-export";
import { getAvgTicketColor } from "~/utils/avg-ticket-colors";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Separator } from "~/components/ui/separator";


interface UnderperformingStore {
  storeId: string;
  revenue: number;
  ticketCount: number;
  avgTicketSize: number;
  grossProfitPercent: number;
}

interface UnderperformingDay {
  date: string;
  ticketCount: number;
  avgTicketSize: number;
  revenue: number;
}

interface UnderperformingRep {
  repName: string;
  underperformingDays: UnderperformingDay[];
  daysBelow70: number;
  totalDaysWorked: number;
  performanceRatio: number;
  needsCoaching: boolean;
}

interface UnifiedPerformanceAlertsProps {
  // Props no longer needed since data comes from context
}

function StoreAlertItem({ store }: { store: UnderperformingStore }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 hover:bg-red-100/40 dark:hover:bg-red-950/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
            <Store className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">
              Store {store.storeId}
            </h4>
            <p className="text-sm text-muted-foreground">
              {store.ticketCount} tickets • <span className={getAvgTicketColor(store.avgTicketSize)}>${store.avgTicketSize.toFixed(2)} avg</span>
            </p>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="font-semibold text-foreground">
            ${store.revenue.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {store.grossProfitPercent.toFixed(1)}% GP
          </div>
          <Badge variant="destructive" className="text-xs">
            Below $70
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

function RepAlertItem({ 
  rep, 
  onExportDay 
}: { 
  rep: UnderperformingRep; 
  onExportDay?: (repName: string, date: string) => void; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "rounded-lg border",
        rep.needsCoaching
          ? "border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20"
          : "border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/30 dark:bg-yellow-950/20"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-4 transition-colors cursor-pointer",
            rep.needsCoaching
              ? "hover:bg-red-100/40 dark:hover:bg-red-950/30"
              : "hover:bg-yellow-100/40 dark:hover:bg-yellow-950/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  rep.needsCoaching
                    ? "bg-red-100 dark:bg-red-900/50"
                    : "bg-yellow-100 dark:bg-yellow-900/50"
                )}>
                  <User className={cn(
                    "h-4 w-4",
                    rep.needsCoaching
                      ? "text-red-600 dark:text-red-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  )} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{rep.repName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {rep.daysBelow70} out of {rep.totalDaysWorked} days below $70
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Badge 
                    variant={rep.needsCoaching ? "destructive" : "secondary"} 
                    className={cn(
                      "text-xs",
                      rep.needsCoaching 
                        ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300" 
                        : "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"
                    )}
                  >
                    {rep.needsCoaching ? "Needs coaching" : "Be aware"}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(rep.performanceRatio * 100).toFixed(0)}% of days
                  </div>
                </div>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isExpanded && "transform rotate-180"
                  )} 
                />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <Separator className="mb-4" />
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground mb-2">
                Underperforming Days:
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rep.underperformingDays.map((day, index) => (
                  <div 
                    key={day.date}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.ticketCount} tickets • <span className={getAvgTicketColor(day.avgTicketSize)}>${day.avgTicketSize.toFixed(2)} avg</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={cn("text-sm font-medium", getAvgTicketColor(day.avgTicketSize))}>
                          ${day.avgTicketSize.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${day.revenue.toLocaleString()} total
                        </div>
                      </div>
                      
                      {onExportDay && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onExportDay(rep.repName, day.date)}
                          className="text-xs h-8 px-2"
                          data-export={`${rep.repName}-${day.date}`}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Export PDF
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export function UnifiedPerformanceAlerts({}: UnifiedPerformanceAlertsProps) {
  const { performanceAlerts, isLoading } = useUnifiedSales();
  const convex = useConvex();
  const { user } = useUser();

  const handleExportDay = async (repName: string, date: string) => {
    console.log('handleExportDay called with:', { repName, date });
    
    const userId = user?.id;
    if (!userId) {
      console.error('No user ID available for export');
      alert('User not authenticated. Please refresh and try again.');
      return;
    }
    
    console.log('Starting export for rep:', repName, 'date:', date, 'userId:', userId);
    
    try {
      // Show loading state
      const exportButton = document.querySelector(`[data-export="${repName}-${date}"]`) as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.innerHTML = '<svg class="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Exporting...';
      }

      // Get the rep day data from Convex using the client
      console.log('Fetching rep day data from Convex...');
      const repDayData = await convex.query(api.salesUnified.getRepDayExportData, {
        repName,
        date
      });
      
      console.log('Rep day data received:', repDayData);

      // Find the rep in the alerts data to get overall context
      const repContext = performanceAlerts?.underperformingReps.find((rep: any) => rep.repName === repName);
      console.log('Rep context:', repContext);
      
      // Transform data to match RepPerformanceExport interface
      // This creates a focused single-day report with context of overall performance
      const pdfData = {
        repName: repDayData.repName,
        dateRange: {
          start: repDayData.date,
          end: repDayData.date
        },
        avgTicketSize: repDayData.avgTicketSize, // This day's average
        totalRevenue: repDayData.totalRevenue,   // This day's revenue
        ticketCount: repDayData.ticketCount,     // This day's ticket count
        underperformingDays: repContext ? repContext.underperformingDays : (repDayData.isUnderperforming ? [{
          date: repDayData.date,
          avgTicketSize: repDayData.avgTicketSize,
          ticketCount: repDayData.ticketCount
        }] : []),
        tickets: repDayData.tickets.map((ticket: any) => ({
          ticketNumber: ticket.ticketNumber,
          saleDate: ticket.saleDate,
          storeId: ticket.storeId,
          transactionTotal: ticket.transactionTotal,
          lineItems: ticket.lineItems
        })),
        _context: repContext ? {
          totalUnderperformingDays: repContext.daysBelow70,
          totalDaysWorked: repContext.totalDaysWorked,
          performanceRatio: repContext.performanceRatio,
          needsCoaching: repContext.needsCoaching
        } : null
      };

      // Generate and download professional PDF
      console.log('Calling generateRepPerformancePDF with data:', pdfData);
      await generateRepPerformancePDF(pdfData);
      console.log('PDF generation function completed');

    } catch (error) {
      console.error("Export error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack available');
      alert("Failed to export PDF. Please try again.\n\nError: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      // Reset button state
      const exportButton = document.querySelector(`[data-export="${repName}-${date}"]`) as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.innerHTML = '<svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Export PDF';
      }
    }
  };

  if (isLoading || !performanceAlerts) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { underperformingStores, underperformingReps, benchmark } = performanceAlerts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Alerts</h2>
          <p className="text-muted-foreground">
            Stores and reps not meeting the ${benchmark} average ticket benchmark
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>${benchmark} Benchmark</span>
        </div>
      </div>

      {/* Benchmark Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">$70 Average Ticket Benchmark</h3>
              <p className="text-sm text-muted-foreground">
                Quick diagnostics to identify stores and reps needing coaching support
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Needs coaching:</strong> Over 50% of days below $70 • <strong>Be aware:</strong> Under 50% of days below $70
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Stores Below $70 Avg Ticket */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Stores Below $70 Avg Ticket
              <Badge variant="destructive" className="ml-auto">
                {underperformingStores.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {underperformingStores.length === 0 ? (
              <div className="relative overflow-hidden">
                {/* Success Animation Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 rounded-lg"></div>
                
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 opacity-20">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
                
                <div className="relative py-12 px-6 text-center">
                  {/* Icon with Glow Effect */}
                  <div className="relative mx-auto mb-6 w-20 h-20">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4 shadow-xl">
                      <Target className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  
                  {/* Success Message */}
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
                    Outstanding Performance! 🎯
                  </h3>
                  <p className="text-green-600 dark:text-green-400 mb-4 font-medium">
                    All stores are exceeding the $70 benchmark
                  </p>
                  
                  {/* Achievement Badge */}
                  <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md border border-green-200 dark:border-green-800">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      100% Benchmark Compliance
                    </span>
                  </div>
                  
                  {/* Encouraging Message */}
                  <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                    Your team is consistently delivering excellent average ticket values. Keep up the momentum!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {underperformingStores.map((store: any) => (
                  <StoreAlertItem key={store.storeId} store={store} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Sales Reps Below $70 Avg Ticket */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Sales Reps Below $70 Avg Ticket
              <Badge variant="secondary" className="ml-auto bg-orange-100 dark:bg-orange-900/50">
                {underperformingReps.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {underperformingReps.length === 0 ? (
              <div className="relative overflow-hidden">
                {/* Success Animation Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 rounded-lg"></div>
                
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 opacity-20">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                </div>
                
                <div className="relative py-12 px-6 text-center">
                  {/* Icon with Glow Effect */}
                  <div className="relative mx-auto mb-6 w-20 h-20">
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full p-4 shadow-xl">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  
                  {/* Success Message */}
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                    Exceptional Team Performance! 🌟
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 mb-4 font-medium">
                    All reps are consistently hitting $70+ per ticket
                  </p>
                  
                  {/* Achievement Badge */}
                  <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md border border-blue-200 dark:border-blue-800">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Team Excellence Achieved
                    </span>
                  </div>
                  
                  {/* Encouraging Message */}
                  <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                    Your sales team is demonstrating consistent high performance. Celebrate this success!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {underperformingReps.map((rep: any) => (
                  <RepAlertItem 
                    key={rep.repName} 
                    rep={rep} 
                    onExportDay={handleExportDay}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coaching Opportunities Summary */}
      {(underperformingStores.length > 0 || underperformingReps.length > 0) && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-3">Coaching Action Plan</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Immediate Coaching */}
                  {underperformingReps.filter((rep: any) => rep.needsCoaching).length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <h4 className="font-medium text-red-700 dark:text-red-300">Immediate Coaching</h4>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                        {underperformingReps.filter((rep: any) => rep.needsCoaching).length} reps need urgent attention
                      </p>
                      <p className="text-xs text-red-500 dark:text-red-400">
                        Over 50% of their working days below $70
                      </p>
                    </div>
                  )}

                  {/* Monitoring */}
                  {underperformingReps.filter((rep: any) => !rep.needsCoaching).length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <h4 className="font-medium text-yellow-700 dark:text-yellow-300">Monitor & Support</h4>
                      </div>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                        {underperformingReps.filter((rep: any) => !rep.needsCoaching).length} reps to keep aware of
                      </p>
                      <p className="text-xs text-yellow-500 dark:text-yellow-400">
                        Occasional underperformance, spot coaching
                      </p>
                    </div>
                  )}

                  {/* Store Support */}
                  {underperformingStores.length > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <h4 className="font-medium text-purple-700 dark:text-purple-300">Store Support</h4>
                      </div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                        {underperformingStores.length} stores below $70 avg ticket
                      </p>
                      <p className="text-xs text-purple-500 dark:text-purple-400">
                        Review processes and training needs
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Items */}
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Recommended Actions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {underperformingReps.filter((rep: any) => rep.needsCoaching).length > 0 && (
                      <li>• Schedule immediate 1-on-1s with "Needs coaching" reps</li>
                    )}
                    {underperformingReps.filter((rep: any) => !rep.needsCoaching).length > 0 && (
                      <li>• Review specific underperforming days for "Be aware" reps</li>
                    )}
                    {underperformingStores.length > 0 && (
                      <li>• Analyze store-level factors affecting ticket averages</li>
                    )}
                    <li>• Export daily breakdowns using PDF buttons for coaching conversations</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}