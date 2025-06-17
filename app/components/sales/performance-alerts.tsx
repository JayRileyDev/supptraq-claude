import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { getAvgTicketColor } from "~/utils/avg-ticket-colors";
import { AlertTriangle, Store, User, ChevronDown, FileText, Calendar, DollarSign } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Separator } from "~/components/ui/separator";

interface UnderperformingStore {
  storeId: string;
  storeName?: string;
  avgTicketSize: number;
  ticketCount: number;
  revenue: number;
  trend?: number;
}

interface UnderperformingRep {
  repName: string;
  avgTicketSize: number;
  ticketCount: number;
  revenue: number;
  stores: string[];
  dailyPerformance?: {
    date: string;
    avgTicketSize: number;
    ticketCount: number;
  }[];
}

interface PerformanceAlertsProps {
  underperformingStores: UnderperformingStore[];
  underperformingReps: UnderperformingRep[];
  threshold?: number;
  onExportRep?: (repName: string) => void;
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
            <p className="font-medium text-foreground">
              {store.storeName || `Store ${store.storeId}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {store.ticketCount} tickets • ${Math.round(store.revenue).toLocaleString()} revenue
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-bold", getAvgTicketColor(store.avgTicketSize))}>
            ${Math.round(store.avgTicketSize)}
          </p>
          <p className="text-xs text-muted-foreground">avg ticket</p>
        </div>
      </div>
    </motion.div>
  );
}

function RepAlertItem({ 
  rep, 
  onExport 
}: { 
  rep: UnderperformingRep; 
  onExport?: (repName: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const belowThresholdDays = rep.dailyPerformance?.filter(day => day.avgTicketSize < 70) || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 overflow-hidden"
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="w-full p-4 hover:bg-red-100/40 dark:hover:bg-red-950/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                <User className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{rep.repName}</p>
                <p className="text-sm text-muted-foreground">
                  {rep.ticketCount} tickets • {rep.stores.length} store{rep.stores.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={cn("text-2xl font-bold", getAvgTicketColor(rep.avgTicketSize))}>
                  ${Math.round(rep.avgTicketSize)}
                </p>
                <p className="text-xs text-muted-foreground">avg ticket</p>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <Separator className="bg-red-200 dark:bg-red-900/50" />
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Days Below $70 Average ({belowThresholdDays.length} days)
                </h4>
                {onExport && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onExport(rep.repName)}
                    className="gap-2"
                  >
                    <FileText className="h-3 w-3" />
                    Export PDF
                  </Button>
                )}
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {belowThresholdDays.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No daily data available
                  </p>
                ) : (
                  belowThresholdDays.map((day, index) => (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 rounded bg-background/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-3 w-3 text-red-500" />
                        <span className="text-sm font-medium">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          {day.ticketCount} ticket{day.ticketCount !== 1 ? 's' : ''}
                        </span>
                        <Badge variant="outline" className={cn("font-mono", getAvgTicketColor(day.avgTicketSize))}>
                          ${Math.round(day.avgTicketSize)}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export function PerformanceAlerts({ 
  underperformingStores, 
  underperformingReps, 
  threshold = 70,
  onExportRep 
}: PerformanceAlertsProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-red-200/50 dark:border-red-900/50 bg-gradient-to-br from-red-50/30 to-red-100/20 dark:from-red-950/20 dark:to-red-900/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Underperforming Stores */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Stores with Average Ticket Below ${threshold}
                <Badge variant="outline" className="ml-2">
                  {underperformingStores.length} store{underperformingStores.length !== 1 ? 's' : ''}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Based on sales transactions only (returns excluded)
              </p>
              
              {underperformingStores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">All stores are performing above threshold</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {underperformingStores.map((store, index) => (
                    <motion.div
                      key={store.storeId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <StoreAlertItem store={store} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Underperforming Reps */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Sales Reps with Average Ticket Below ${threshold}
                <Badge variant="outline" className="ml-2">
                  {underperformingReps.length} rep{underperformingReps.length !== 1 ? 's' : ''}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Based on sales transactions only (returns excluded)
              </p>
              
              {underperformingReps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">All reps are performing above threshold</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {underperformingReps.map((rep, index) => (
                    <motion.div
                      key={rep.repName}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <RepAlertItem rep={rep} onExport={onExportRep} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}