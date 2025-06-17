import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useUnifiedSales } from "./UnifiedSalesProvider";
import { getAvgTicketColor } from "~/utils/avg-ticket-colors";
import { 
  Trophy,
  Store,
  User,
  DollarSign,
  Target,
  TrendingUp
} from "lucide-react";
import { Badge } from "~/components/ui/badge";

interface LeaderboardsProps {
  // Props no longer needed since data comes from context
}

interface LeaderboardItemProps {
  rank: number;
  name: string;
  primaryValue: string;
  secondaryValue: string;
  tertiaryValue?: string;
  icon: React.ComponentType<any>;
  primaryValueColor?: string;
}

function LeaderboardItem({ 
  rank, 
  name, 
  primaryValue, 
  secondaryValue, 
  tertiaryValue,
  icon: Icon,
  primaryValueColor = "text-foreground"
}: LeaderboardItemProps) {
  const rankColors = {
    1: "from-yellow-400 to-yellow-600 text-yellow-900",
    2: "from-gray-300 to-gray-500 text-gray-900", 
    3: "from-amber-600 to-amber-800 text-amber-100"
  };

  const bgColor = rank <= 3 ? rankColors[rank as keyof typeof rankColors] : "from-blue-100 to-blue-200 text-blue-900";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="flex items-center gap-3 p-3 rounded-lg border border-muted/30 bg-card/50 hover:bg-card/80 transition-colors"
    >
      {/* Rank Badge */}
      <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${bgColor} font-bold text-sm shadow-sm`}>
        {rank <= 3 && rank === 1 ? <Trophy className="h-4 w-4" /> : rank}
      </div>
      
      {/* Icon */}
      <div className="p-2 rounded-lg bg-muted/30">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground truncate">
          {name}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{secondaryValue}</span>
          {tertiaryValue && (
            <>
              <span>•</span>
              <span>{tertiaryValue}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Primary Value */}
      <div className="text-right">
        <div className={`font-bold text-sm ${primaryValueColor}`}>
          {primaryValue}
        </div>
      </div>
    </motion.div>
  );
}

export function Leaderboards({}: LeaderboardsProps) {
  const { leaderboards, isLoading } = useUnifiedSales();

  if (isLoading || !leaderboards) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Leaderboards</h2>
          <p className="text-muted-foreground">
            Top 5 performers across key metrics
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4" />
          <span>Top 5 Rankings</span>
        </div>
      </div>

      {/* Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Sales Rep Leaderboards */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              Reps by Avg Ticket
              <Badge variant="outline" className="ml-auto text-xs">
                ${(() => {
                  const topAvg = leaderboards.reps.avgTicketSize[0]?.avgTicketSize;
                  return topAvg ? topAvg.toFixed(0) : '0';
                })()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboards.reps.avgTicketSize.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No rep data available</p>
              </div>
            ) : (
              leaderboards.reps.avgTicketSize.map((rep: any, index: number) => (
                <LeaderboardItem
                  key={rep.repName}
                  rank={index + 1}
                  name={rep.repName}
                  primaryValue={`$${rep.avgTicketSize.toFixed(2)}`}
                  secondaryValue={`${rep.ticketCount} tickets`}
                  tertiaryValue={`${rep.storeCount} stores`}
                  icon={User}
                  primaryValueColor={getAvgTicketColor(rep.avgTicketSize)}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              Reps by Gross Profit %
              <Badge variant="outline" className="ml-auto text-xs">
                {(() => {
                  const topGP = leaderboards.reps.grossProfit[0]?.grossProfitPercent;
                  return topGP ? `${topGP.toFixed(1)}%` : '0%';
                })()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboards.reps.grossProfit.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No rep data available</p>
              </div>
            ) : (
              leaderboards.reps.grossProfit.map((rep: any, index: number) => (
                <LeaderboardItem
                  key={rep.repName}
                  rank={index + 1}
                  name={rep.repName}
                  primaryValue={`${rep.grossProfitPercent.toFixed(1)}%`}
                  secondaryValue={`${rep.ticketCount} tickets`}
                  tertiaryValue={`${rep.storeCount} stores`}
                  icon={TrendingUp}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              Reps by Total Revenue
              <Badge variant="outline" className="ml-auto text-xs">
                ${(() => {
                  const topRev = leaderboards.reps.totalRevenue[0]?.revenue;
                  return topRev ? (topRev / 1000).toFixed(0) + 'K' : '0';
                })()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboards.reps.totalRevenue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No rep data available</p>
              </div>
            ) : (
              leaderboards.reps.totalRevenue.map((rep: any, index: number) => (
                <LeaderboardItem
                  key={rep.repName}
                  rank={index + 1}
                  name={rep.repName}
                  primaryValue={`$${rep.revenue.toLocaleString()}`}
                  secondaryValue={`${rep.ticketCount} tickets`}
                  tertiaryValue={`$${rep.avgTicketSize.toFixed(2)} avg`}
                  icon={DollarSign}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Store Leaderboards */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <Store className="h-4 w-4 text-primary" />
              </div>
              Stores by Avg Ticket
              <Badge variant="outline" className="ml-auto text-xs">
                ${(() => {
                  const topAvg = leaderboards.stores.avgTicketSize[0]?.avgTicketSize;
                  return topAvg ? topAvg.toFixed(0) : '0';
                })()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboards.stores.avgTicketSize.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No store data available</p>
              </div>
            ) : (
              leaderboards.stores.avgTicketSize.map((store: any, index: number) => (
                <LeaderboardItem
                  key={store.storeId}
                  rank={index + 1}
                  name={`Store ${store.storeId}`}
                  primaryValue={`$${store.avgTicketSize.toFixed(2)}`}
                  secondaryValue={`${store.ticketCount} tickets`}
                  tertiaryValue={`$${store.revenue.toLocaleString()}`}
                  icon={Store}
                  primaryValueColor={getAvgTicketColor(store.avgTicketSize)}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              Stores by Gross Profit %
              <Badge variant="outline" className="ml-auto text-xs">
                {(() => {
                  const topGP = leaderboards.stores.grossProfit[0]?.grossProfitPercent;
                  return topGP ? `${topGP.toFixed(1)}%` : '0%';
                })()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboards.stores.grossProfit.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No store data available</p>
              </div>
            ) : (
              leaderboards.stores.grossProfit.map((store: any, index: number) => (
                <LeaderboardItem
                  key={store.storeId}
                  rank={index + 1}
                  name={`Store ${store.storeId}`}
                  primaryValue={`${store.grossProfitPercent.toFixed(1)}%`}
                  secondaryValue={`${store.ticketCount} tickets`}
                  tertiaryValue={`$${store.revenue.toLocaleString()}`}
                  icon={Target}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              Stores by Total Revenue
              <Badge variant="outline" className="ml-auto text-xs">
                ${(() => {
                  const topRev = leaderboards.stores.totalRevenue[0]?.revenue;
                  return topRev ? (topRev / 1000).toFixed(0) + 'K' : '0';
                })()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboards.stores.totalRevenue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No store data available</p>
              </div>
            ) : (
              leaderboards.stores.totalRevenue.map((store: any, index: number) => (
                <LeaderboardItem
                  key={store.storeId}
                  rank={index + 1}
                  name={`Store ${store.storeId}`}
                  primaryValue={`$${store.revenue.toLocaleString()}`}
                  secondaryValue={`${store.ticketCount} tickets`}
                  tertiaryValue={`$${store.avgTicketSize.toFixed(2)} avg`}
                  icon={DollarSign}
                />
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}