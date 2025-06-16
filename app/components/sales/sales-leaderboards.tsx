import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { Trophy, TrendingUp, DollarSign, Target, Medal, Crown, Award } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

interface RepData {
  repName: string;
  avgTicketSize: number;
  grossProfitMargin: number;
  revenue: number;
  ticketCount: number;
  stores: string[];
  trend?: number;
}

interface StoreData {
  storeId: string;
  storeName?: string;
  avgTicketSize: number;
  grossProfitMargin: number;
  revenue: number;
  ticketCount: number;
  trend?: number;
}

interface SalesLeaderboardsProps {
  repData: RepData[];
  storeData: StoreData[];
  dateRange?: { start: string; end: string };
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-orange-600" />;
    default:
      return null;
  }
};

const getRankBadgeClass = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-500 to-amber-500 text-white";
    case 2:
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
    case 3:
      return "bg-gradient-to-r from-orange-500 to-orange-600 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

function LeaderboardCard({
  title,
  icon: Icon,
  items,
  valueFormatter,
  subValueFormatter,
  delay = 0
}: {
  title: string;
  icon: any;
  items: { name: string; value: number; subValue?: string; trend?: number }[];
  valueFormatter: (value: number) => string;
  subValueFormatter?: (item: any) => string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="h-full glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available
            </div>
          ) : (
            items.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + (index * 0.1), duration: 0.3 }}
                className="group"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-sm",
                    getRankBadgeClass(index + 1)
                  )}>
                    {getRankIcon(index + 1) || (index + 1)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="font-medium text-sm truncate cursor-help">
                            {item.name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.name}</p>
                          {subValueFormatter && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {subValueFormatter(item)}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {item.subValue && (
                      <p className="text-xs text-muted-foreground">{item.subValue}</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-sm">{valueFormatter(item.value)}</p>
                    {item.trend !== undefined && (
                      <div className={cn(
                        "flex items-center justify-end gap-1 text-xs",
                        item.trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        <TrendingUp className={cn("h-3 w-3", item.trend < 0 && "rotate-180")} />
                        {Math.abs(item.trend)}%
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SalesLeaderboards({ repData, storeData, dateRange }: SalesLeaderboardsProps) {
  // Process rep leaderboards
  const topRepsByAvgTicket = [...repData]
    .filter(rep => rep.ticketCount > 0)
    .sort((a, b) => b.avgTicketSize - a.avgTicketSize)
    .slice(0, 5)
    .map(rep => ({
      name: rep.repName,
      value: rep.avgTicketSize,
      subValue: `${rep.ticketCount} tickets`,
      trend: rep.trend
    }));

  const topRepsByGP = [...repData]
    .filter(rep => rep.ticketCount > 0)
    .sort((a, b) => b.grossProfitMargin - a.grossProfitMargin)
    .slice(0, 5)
    .map(rep => ({
      name: rep.repName,
      value: rep.grossProfitMargin,
      subValue: `$${Math.round(rep.revenue).toLocaleString()} revenue`,
      trend: rep.trend
    }));

  const topRepsByRevenue = [...repData]
    .filter(rep => rep.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(rep => ({
      name: rep.repName,
      value: rep.revenue,
      subValue: `${rep.stores.length} store${rep.stores.length !== 1 ? 's' : ''}`,
      trend: rep.trend
    }));

  // Process store leaderboards
  const topStoresByAvgTicket = [...storeData]
    .filter(store => store.ticketCount > 0)
    .sort((a, b) => b.avgTicketSize - a.avgTicketSize)
    .slice(0, 5)
    .map(store => ({
      name: store.storeName || `Store ${store.storeId}`,
      value: store.avgTicketSize,
      subValue: `${store.ticketCount} tickets`,
      trend: store.trend
    }));

  const topStoresByGP = [...storeData]
    .filter(store => store.ticketCount > 0)
    .sort((a, b) => b.grossProfitMargin - a.grossProfitMargin)
    .slice(0, 5)
    .map(store => ({
      name: store.storeName || `Store ${store.storeId}`,
      value: store.grossProfitMargin,
      subValue: `$${Math.round(store.revenue).toLocaleString()} revenue`,
      trend: store.trend
    }));

  const topStoresByRevenue = [...storeData]
    .filter(store => store.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(store => ({
      name: store.storeName || `Store ${store.storeId}`,
      value: store.revenue,
      subValue: `${store.ticketCount} tickets`,
      trend: store.trend
    }));

  return (
    <div className="space-y-8">
      {/* Sales Rep Leaderboards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Sales Rep Leaderboards</h2>
          {dateRange && (
            <Badge variant="outline" className="ml-auto text-xs">
              {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LeaderboardCard
            title="Average Ticket Size"
            icon={Target}
            items={topRepsByAvgTicket}
            valueFormatter={(value) => `$${Math.round(value)}`}
            delay={0.1}
          />
          
          <LeaderboardCard
            title="Gross Profit %"
            icon={TrendingUp}
            items={topRepsByGP}
            valueFormatter={(value) => `${value.toFixed(1)}%`}
            delay={0.2}
          />
          
          <LeaderboardCard
            title="Total Revenue"
            icon={DollarSign}
            items={topRepsByRevenue}
            valueFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
            delay={0.3}
          />
        </div>
      </motion.div>

      {/* Store Leaderboards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Store Leaderboards</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LeaderboardCard
            title="Average Ticket Size"
            icon={Target}
            items={topStoresByAvgTicket}
            valueFormatter={(value) => `$${Math.round(value)}`}
            delay={0.5}
          />
          
          <LeaderboardCard
            title="Gross Profit %"
            icon={TrendingUp}
            items={topStoresByGP}
            valueFormatter={(value) => `${value.toFixed(1)}%`}
            delay={0.6}
          />
          
          <LeaderboardCard
            title="Total Revenue"
            icon={DollarSign}
            items={topStoresByRevenue}
            valueFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
            delay={0.7}
          />
        </div>
      </motion.div>
    </div>
  );
}