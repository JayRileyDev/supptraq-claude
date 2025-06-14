import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Target, Calendar, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";


function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  delay = 0 
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </div>
          {change && (
            <p className={cn(
              "text-xs",
              changeType === "positive" && "text-green-600 dark:text-green-400",
              changeType === "negative" && "text-red-600 dark:text-red-400",
              changeType === "neutral" && "text-gray-600 dark:text-gray-400"
            )}>
              {change}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BudgetCard({ vendor, delay = 0 }: { vendor: any; delay?: number }) {
  const percentSpent = (vendor.spent / vendor.budgetAllocated) * 100;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "over-budget":
        return "bg-red-500";
      case "near-limit":
        return "bg-amber-500";
      case "on-track":
        return "bg-blue-500";
      case "under-budget":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "over-budget":
        return "Over Budget";
      case "near-limit":
        return "Near Limit";
      case "on-track":
        return "On Track";
      case "under-budget":
        return "Under Budget";
      default:
        return "Unknown";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{vendor.vendor}</CardTitle>
              <CardDescription>{vendor.category}</CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-white border-transparent",
                getStatusColor(vendor.status)
              )}
            >
              {getStatusText(vendor.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Budget Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {percentSpent.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(percentSpent, 100)} 
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Allocated</p>
              <p className="font-medium text-gray-900 dark:text-white">
                ${vendor.budgetAllocated.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Spent</p>
              <p className="font-medium text-gray-900 dark:text-white">
                ${vendor.spent.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Remaining</p>
              <p className={cn(
                "font-medium",
                vendor.remaining >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                ${Math.abs(vendor.remaining).toLocaleString()}
                {vendor.remaining < 0 && " over"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Last Purchase</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(vendor.lastPurchase).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
            <Button size="sm" className="flex-1">
              Adjust Budget
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SpendingChart({ data }: { data: any[] }) {
  const maxAmount = Math.max(...data.map(d => Math.max(d.spent, d.budget)));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
          <CardDescription>Budget vs actual spending over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4 h-64">
            {data.map((month, index) => (
              <div key={month.month} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center space-y-1">
                  {/* Budget bar (background) */}
                  <div
                    className="w-8 bg-gray-200 dark:bg-gray-700 rounded"
                    style={{
                      height: `${(month.budget / maxAmount) * 200}px`,
                      minHeight: "4px"
                    }}
                  />
                  {/* Spent bar (overlay) */}
                  <div
                    className={cn(
                      "w-8 rounded absolute",
                      month.spent > month.budget 
                        ? "bg-red-500 dark:bg-red-400" 
                        : "bg-blue-500 dark:bg-blue-400"
                    )}
                    style={{
                      height: `${(month.spent / maxAmount) * 200}px`,
                      minHeight: "4px",
                      marginTop: `${200 - (month.spent / maxAmount) * 200}px`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {month.month}
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  ${(month.spent / 1000).toFixed(0)}k
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Budget</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Actual</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Over Budget</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function BudgetPage() {

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2 glow-text">
          Budget Tracking
        </h1>
        <p className="text-muted-foreground">
          Monitor vendor spending and manage purchase budgets
        </p>
      </motion.div>

      {/* Coming Soon State */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <Card className="w-full max-w-2xl glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center group"
              >
                <DollarSign className="h-10 w-10 text-primary group-hover:text-primary/80 transition-colors duration-300" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <h3 className="text-2xl font-bold text-foreground mb-3 glow-text">
                  Budget Tracking Coming Soon
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We're building powerful budget management tools to help you monitor vendor spending, set spending limits, and track purchase budgets with real-time alerts and insights.
                </p>
              </motion.div>
              
              {/* Feature Preview Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50">
                  <Target className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-medium text-foreground text-sm mb-1">Budget Allocation</h4>
                  <p className="text-xs text-muted-foreground">Set and manage vendor-specific spending limits</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50">
                  <TrendingUp className="h-6 w-6 text-accent mb-2" />
                  <h4 className="font-medium text-foreground text-sm mb-1">Spending Analytics</h4>
                  <p className="text-xs text-muted-foreground">Track spending patterns and forecast future costs</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50">
                  <AlertCircle className="h-6 w-6 text-amber-400 mb-2" />
                  <h4 className="font-medium text-foreground text-sm mb-1">Budget Alerts</h4>
                  <p className="text-xs text-muted-foreground">Get notified when approaching spending limits</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="pt-6 border-t border-border/50"
              >
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Coming in v2.0
                </Badge>
                <p className="text-xs text-muted-foreground/70 mt-3">
                  Track your current spending through the Sales page while we build these advanced budget features
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
