import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useUnifiedSales } from "./UnifiedSalesProvider";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { getAvgTicketColor } from "~/utils/avg-ticket-colors";
import { 
  CalendarDays,
  Store,
  User,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  Info,
  Clock,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";

interface SchedulingOptimizerProps {
  // Props no longer needed since data comes from context
}

interface StoreSchedule {
  storeId: string;
  topReps: {
    repName: string;
    avgTicketValue: number;
    totalRevenue: number;
    ticketCount: number;
    rank: number;
  }[];
}

function RepRankingItem({ 
  rep, 
  storeId, 
  showRevenue = false 
}: { 
  rep: {
    repName: string;
    avgTicketValue: number;
    totalRevenue: number;
    ticketCount: number;
    rank: number;
  };
  storeId: string;
  showRevenue?: boolean;
}) {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: "🥇", color: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300" };
      case 2:
        return { icon: "🥈", color: "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300" };
      case 3:
        return { icon: "🥉", color: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300" };
      default:
        return { icon: rank.toString(), color: "bg-muted text-muted-foreground" };
    }
  };

  const rankBadge = getRankBadge(rep.rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rep.rank * 0.05 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        rep.rank === 1 && "bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-900/50",
        rep.rank > 1 && rep.rank <= 3 && "bg-muted/30 border-muted/50",
        rep.rank > 3 && "bg-background/50 border-muted/30 hover:bg-muted/20"
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Rank Badge */}
        <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm", rankBadge.color)}>
          {rankBadge.icon}
        </div>
        
        {/* Rep Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground truncate">{rep.repName}</span>
            {rep.rank === 1 && (
              <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800">
                <Sparkles className="h-3 w-3 mr-1" />
                Top Performer
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {rep.ticketCount} tickets • {showRevenue ? `$${rep.totalRevenue.toLocaleString()} total` : `Store ${storeId}`}
          </div>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="text-right">
        <div className={cn("font-bold text-sm", getAvgTicketColor(rep.avgTicketValue))}>
          ${rep.avgTicketValue.toFixed(2)}
        </div>
        <div className="text-xs text-muted-foreground">avg ticket</div>
      </div>
    </motion.div>
  );
}

function StoreScheduleCard({ store, index }: { store: StoreSchedule; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First store expanded by default
  const topRep = store.topReps[0];
  const potentialRevenue = store.topReps.slice(0, 3).reduce((sum, rep) => sum + rep.avgTicketValue, 0) * 8; // Assuming 8 tickets per shift
  
  // Calculate average ticket value for this store
  const storeAvgTicket = store.topReps.reduce((sum, rep) => sum + rep.avgTicketValue, 0) / store.topReps.length;
  
  // Identify poor performers - bottom 20% of performers with below-average tickets
  const bottomPerformerThreshold = Math.ceil(store.topReps.length * 0.8); // Top 80% cutoff
  const poorPerformers = store.topReps.filter((rep, idx) => 
    idx >= bottomPerformerThreshold && rep.avgTicketValue < storeAvgTicket * 0.8 // 20% below store average
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Store {store.storeId}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {store.topReps.length} qualified reps
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {topRep && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-muted-foreground">Best Performer</div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {topRep.repName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          ${topRep.avgTicketValue.toFixed(0)}/ticket
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className={cn(
                    "transition-transform",
                    isExpanded && "rotate-180"
                  )}>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* Revenue Potential Alert */}
              <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-900/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Potential Daily Revenue Impact
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Based on top 3 reps' avg tickets × 8 shifts</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  ${potentialRevenue.toFixed(0)}/day
                </div>
              </div>
              
              {/* Rep Rankings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground">Top Sales Reps by Average Ticket</h4>
                  <Badge variant="outline" className="text-xs">
                    Min 5 tickets
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {store.topReps.slice(0, 5).map((rep) => (
                    <RepRankingItem 
                      key={rep.repName} 
                      rep={rep} 
                      storeId={store.storeId}
                    />
                  ))}
                </div>
                
                {store.topReps.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    +{store.topReps.length - 5} more reps qualified at this location
                  </p>
                )}
              </div>

              {/* Relocation Recommendations */}
              {poorPerformers.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <h4 className="text-sm font-semibold text-foreground">Recommended for Relocation</h4>
                    <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                      Poor Performance
                    </Badge>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-900/50">
                    <div className="space-y-2">
                      {poorPerformers.map((rep) => (
                        <motion.div
                          key={rep.repName}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-2 rounded bg-white/50 dark:bg-gray-900/50 border border-orange-200 dark:border-orange-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-medium">
                              {rep.rank}
                            </div>
                            <div>
                              <span className="font-medium text-sm text-foreground">{rep.repName}</span>
                              <div className="text-xs text-muted-foreground">
                                {rep.ticketCount} tickets • {Math.round(((storeAvgTicket - rep.avgTicketValue) / storeAvgTicket) * 100)}% below store avg
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-medium text-sm text-orange-600 dark:text-orange-400">
                                ${rep.avgTicketValue.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">avg ticket</div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        <strong>Recommendation:</strong> Consider moving these reps to different locations where they might perform better, or provide additional training to improve their sales techniques.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scheduling Recommendation */}
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Scheduling Recommendation
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Prioritize {store.topReps.slice(0, 3).map(r => r.repName).join(", ")} for peak hours at this location to maximize revenue potential.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

export function SchedulingOptimizer({}: SchedulingOptimizerProps) {
  const { schedulingData, isLoading } = useUnifiedSales();
  const [minTickets, setMinTickets] = useState(5);
  const [isExpanded, setIsExpanded] = useState(false);

  const stores = schedulingData?.stores || [];
  
  // Calculate summary stats for compact view
  const totalPoorPerformers = stores.reduce((total: any, store: any) => {
    const storeAvgTicket = store.topReps.reduce((sum: any, rep: any) => sum + rep.avgTicketValue, 0) / store.topReps.length;
    const bottomPerformerThreshold = Math.ceil(store.topReps.length * 0.8);
    const poorPerformers = store.topReps.filter((rep: any, idx: any) => 
      idx >= bottomPerformerThreshold && rep.avgTicketValue < storeAvgTicket * 0.8
    );
    return total + poorPerformers.length;
  }, 0);

  if (isLoading || !schedulingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Scheduling Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Scheduling Optimizer</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isExpanded 
                      ? "Maximize revenue by scheduling reps where they perform best"
                      : `${schedulingData.totalStores} stores • ${schedulingData.totalReps} reps${totalPoorPerformers > 0 ? ` • ${totalPoorPerformers} relocation candidates` : ""}`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!isExpanded && totalPoorPerformers > 0 && (
                  <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {totalPoorPerformers} to relocate
                  </Badge>
                )}
                <div className={cn(
                  "transition-transform",
                  isExpanded && "rotate-180"
                )}>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-6">


              {/* Store-by-Store Rankings */}
              <div className="space-y-4">
                {stores.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Data Available</h3>
                      <p className="text-muted-foreground">
                        No stores have enough data for scheduling optimization.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  stores.map((store: any, index: number) => (
                    <StoreScheduleCard key={store.storeId} store={store} index={index} />
                  ))
                )}
              </div>

              {/* Best Practices */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
                      <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">Scheduling Best Practices</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Schedule top performers during peak hours (10am-2pm, 5pm-7pm)</li>
                        <li>• Pair new reps with high performers for training shifts</li>
                        <li>• Consider travel time when scheduling reps across multiple locations</li>
                        <li>• Review and update rankings monthly as performance changes</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}