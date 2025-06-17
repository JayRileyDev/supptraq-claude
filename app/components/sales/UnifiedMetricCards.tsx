import React from 'react';
import { motion } from "framer-motion";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Target, 
  Package, 
  RotateCcw, 
  CreditCard, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { useUnifiedSales } from "./UnifiedSalesProvider";
import { getAvgTicketColor } from "~/utils/avg-ticket-colors";

// Utility function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Utility function to format percentage
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Utility function to format numbers
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Individual metric card component
function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  description,
  delay = 0,
  onClick,
  valueColor
}: {
  title: string;
  value: string | number;
  change?: string | null;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  description?: string;
  delay?: number;
  onClick?: () => void;
  valueColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(onClick && "cursor-pointer", "group")}
    >
      <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
            <Icon className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors duration-300" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className={cn("text-3xl font-bold mb-2 glow-text", valueColor || "text-foreground")}>
              {value}
            </div>
            {change && (
              <div className={cn(
                "flex items-center px-2 py-1 rounded-full text-xs font-medium",
                changeType === "positive" && "bg-green-500/10 text-green-400 border border-green-500/20",
                changeType === "negative" && "bg-red-500/10 text-red-400 border border-red-500/20",
                changeType === "neutral" && "bg-muted/50 text-muted-foreground border border-border"
              )}>
                {changeType === "positive" && <ArrowUpRight className="mr-1 h-3 w-3" />}
                {changeType === "negative" && <ArrowDownRight className="mr-1 h-3 w-3" />}
                <span>{change}</span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main unified metric cards component
export function UnifiedMetricCards() {
  const { metrics, isLoading, error } = useUnifiedSales();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card className="h-32">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-32 border-red-200 dark:border-red-900/50">
            <CardContent className="p-6 flex items-center justify-center">
              <p className="text-sm text-red-500 text-center">
                {error || 'Failed to load'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Sales",
      value: formatCurrency(metrics.totalSales),
      icon: DollarSign,
      description: `From ${formatNumber(metrics.uniqueTickets)} unique tickets`,
      delay: 0,
      valueColor: undefined
    },
    {
      title: "Ticket Count",
      value: formatNumber(metrics.ticketCount),
      icon: ShoppingCart,
      description: `${formatNumber(metrics.totalLines)} total line items`,
      delay: 0.1,
      valueColor: undefined
    },
    {
      title: "Avg Ticket Value",
      value: formatCurrency(metrics.avgTicketValue),
      icon: TrendingUp,
      description: metrics.ticketCount > 0 ? "Per transaction average" : "No transactions",
      delay: 0.2,
      valueColor: getAvgTicketColor(metrics.avgTicketValue)
    },
    {
      title: "Gross Profit %",
      value: formatPercentage(metrics.grossProfitPercent),
      icon: Target,
      description: "Weighted average margin",
      delay: 0.3,
      valueColor: undefined
    },
    {
      title: "Items Sold",
      value: formatNumber(metrics.itemsSold),
      icon: Package,
      description: "Total quantity across all sales",
      delay: 0.4,
      valueColor: undefined
    },
    {
      title: "Return Rate",
      value: formatPercentage(metrics.returnRate),
      icon: RotateCcw,
      description: `${formatCurrency(metrics.totalReturnValue)} total returns`,
      delay: 0.5,
      valueColor: undefined
    },
    {
      title: "Gift Card Usage",
      value: formatPercentage(metrics.giftCardUsage),
      icon: CreditCard,
      description: `${formatCurrency(metrics.totalGiftCardValue)} in gift cards`,
      delay: 0.6,
      valueColor: undefined
    },
    {
      title: "Sales Consistency",
      value: formatPercentage(metrics.salesConsistency),
      icon: BarChart3,
      description: "Daily sales variation score",
      delay: 0.7,
      valueColor: undefined
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <MetricCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          description={card.description}
          delay={card.delay}
          valueColor={card.valueColor}
        />
      ))}
    </div>
  );
}