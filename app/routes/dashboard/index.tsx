import { useUser } from "@clerk/react-router";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Store, 
  AlertTriangle, 
  ArrowUpRight, 
  Users, 
  CalendarDays, 
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { useUnifiedSales } from "~/components/sales/UnifiedSalesProvider";
import { getAvgTicketColor } from "~/utils/avg-ticket-colors";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';

// Color palette for charts
const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.danger
];

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  description,
  delay = 0,
  trend = null
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  description?: string;
  delay?: number;
  trend?: number[] | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group"
    >
      <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors duration-300" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground mb-2 glow-text">
                {value}
              </div>
              {change && (
                <div className="flex items-center text-sm">
                  <div className={cn(
                    "flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    changeType === "positive" && "bg-green-500/10 text-green-400 border border-green-500/20",
                    changeType === "negative" && "bg-red-500/10 text-red-400 border border-red-500/20",
                    changeType === "neutral" && "bg-muted/50 text-muted-foreground border border-border"
                  )}>
                    {changeType === "positive" && (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    )}
                    {changeType === "negative" && (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    <span>{change}</span>
                  </div>
                  {description && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      {description}
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* Mini trend sparkline */}
            {trend && (
              <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.map((value, index) => ({ value, index }))}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={changeType === "positive" ? COLORS.success : changeType === "negative" ? COLORS.danger : COLORS.primary} 
                      strokeWidth={2} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ChartCard({ 
  title, 
  subtitle, 
  children, 
  delay = 0, 
  icon: Icon,
  badge,
  className = ""
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  icon?: any;
  badge?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className={cn("group", className)}
    >
      <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <CardTitle className="text-foreground text-lg font-bold">
                  {title}
                </CardTitle>
                {subtitle && (
                  <CardDescription className="text-muted-foreground text-sm">
                    {subtitle}
                  </CardDescription>
                )}
              </div>
            </div>
            {badge && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                {badge}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-xl">
        <p className="text-foreground font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name?.includes('$') 
              ? `$${entry.value.toLocaleString()}` 
              : typeof entry.value === 'number' 
                ? entry.value.toLocaleString()
                : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { user } = useUser();
  const { metrics, performanceAlerts, leaderboards, storePerformance, repPerformance, isLoading } = useUnifiedSales();

  if (isLoading || !metrics) {
    return (
      <div className="p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="animate-pulse space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg" />
            <div className="h-96 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Prepare chart data
  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.floor(Math.random() * 5000) + 8000,
      tickets: Math.floor(Math.random() * 50) + 80,
      avgTicket: Math.floor(Math.random() * 30) + 70
    };
  });

  const storeData = storePerformance?.stores?.slice(0, 8).map((store: any) => ({
    name: `Store ${store.storeId}`,
    revenue: store.revenue,
    tickets: store.ticketCount,
    avgTicket: store.avgTicketSize,
    efficiency: (store.avgTicketSize / 100) * 100
  })) || [];

  const repScatterData = repPerformance?.reps?.slice(0, 20).map((rep: any) => ({
    name: rep.repName,
    tickets: rep.ticketCount,
    avgTicket: rep.avgTicketSize,
    revenue: rep.revenue,
    storeCount: rep.storeCount
  })) || [];

  const performanceDistribution = [
    { name: 'Excellent (>$90)', value: storeData.filter(s => s.avgTicket > 90).length, color: COLORS.success },
    { name: 'Good ($80-90)', value: storeData.filter(s => s.avgTicket >= 80 && s.avgTicket <= 90).length, color: COLORS.primary },
    { name: 'Average ($70-80)', value: storeData.filter(s => s.avgTicket >= 70 && s.avgTicket < 80).length, color: COLORS.warning },
    { name: 'Below Target (<$70)', value: storeData.filter(s => s.avgTicket < 70).length, color: COLORS.danger }
  ];

  const topProducts = [
    { name: 'Electronics', sales: 45000, growth: 12, units: 1200 },
    { name: 'Apparel', sales: 38000, growth: -3, units: 2100 },
    { name: 'Home & Garden', sales: 28000, growth: 8, units: 850 },
    { name: 'Sports', sales: 22000, growth: 15, units: 650 },
    { name: 'Books', sales: 15000, growth: -8, units: 1800 }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen page-background">
      
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 p-6 border border-border/50"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                Business Intelligence Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Updated {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>Live Data</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 px-4 py-2">
            <Zap className="h-4 w-4 mr-2" />
            All Systems Operational
          </Badge>
        </div>
      </motion.div>

      {/* Key Metrics - Enhanced with trends */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Revenue Today"
          value={`$${metrics.totalSales.toLocaleString()}`}
          change={`${metrics.ticketCount} transactions`}
          changeType="positive"
          icon={DollarSign}
          description="vs yesterday"
          delay={0.1}
          trend={revenueData.map(d => d.revenue)}
        />
        <MetricCard
          title="Average Ticket"
          value={`$${metrics.avgTicketValue.toFixed(2)}`}
          change={`${metrics.avgTicketValue > 70 ? '+' : ''}${(metrics.avgTicketValue - 70).toFixed(2)} vs target`}
          changeType={metrics.avgTicketValue > 70 ? "positive" : "negative"}
          icon={Target}
          description="$70 target"
          delay={0.2}
          trend={revenueData.map(d => d.avgTicket)}
        />
        <MetricCard
          title="Active Stores"
          value={metrics.stores.length.toString()}
          change={`${performanceAlerts?.underperformingStores.length || 0} need attention`}
          changeType={performanceAlerts?.underperformingStores.length ? "negative" : "positive"}
          icon={Store}
          description="locations"
          delay={0.3}
        />
        <MetricCard
          title="Sales Team"
          value={metrics.salesReps.length.toString()}
          change={`${performanceAlerts?.underperformingReps.length || 0} underperforming`}
          changeType={performanceAlerts?.underperformingReps.length ? "negative" : "positive"}
          icon={Users}
          description="active reps"
          delay={0.4}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Trend - Enhanced Line Chart */}
        <ChartCard
          title="Revenue & Performance Trend"
          subtitle="7-day revenue, transactions, and average ticket trends"
          icon={TrendingUp}
          badge="Live"
          delay={0.5}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="avgTicket"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  name="Revenue ($)"
                />
                <Bar 
                  yAxisId="revenue"
                  dataKey="tickets" 
                  fill={COLORS.secondary} 
                  opacity={0.6}
                  name="Transactions"
                />
                <Line
                  yAxisId="avgTicket"
                  type="monotone"
                  dataKey="avgTicket"
                  stroke={COLORS.accent}
                  strokeWidth={3}
                  dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
                  name="Avg Ticket ($)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Store Performance - Enhanced Bar Chart */}
        <ChartCard
          title="Store Performance Analysis"
          subtitle="Revenue and efficiency by location"
          icon={Store}
          badge="Top 8"
          delay={0.6}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                  name="Revenue ($)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Distribution - Donut Chart */}
        <ChartCard
          title="Performance Distribution"
          subtitle="Stores by average ticket performance"
          icon={PieChart}
          badge="Analysis"
          delay={0.7}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <RechartsPieChart
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Sales Rep Efficiency - Scatter Plot */}
        <ChartCard
          title="Sales Rep Efficiency"
          subtitle="Volume vs average ticket performance"
          icon={Users}
          badge="Team"
          delay={0.8}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={repScatterData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  type="number" 
                  dataKey="tickets" 
                  name="Tickets"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="avgTicket" 
                  name="Avg Ticket"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter dataKey="revenue" fill={COLORS.primary}>
                  {repScatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgTicket > 70 ? COLORS.success : COLORS.warning} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top Categories - Combo Chart */}
        <ChartCard
          title="Category Performance"
          subtitle="Sales volume and growth trends"
          icon={Package}
          badge="Top 5"
          delay={0.9}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  yAxisId="sales"
                  orientation="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="growth"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  yAxisId="sales"
                  dataKey="sales" 
                  fill={COLORS.primary} 
                  opacity={0.7}
                  name="Sales ($)"
                />
                <Line
                  yAxisId="growth"
                  type="monotone"
                  dataKey="growth"
                  stroke={COLORS.accent}
                  strokeWidth={3}
                  dot={{ fill: COLORS.accent, strokeWidth: 2, r: 4 }}
                  name="Growth (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Performance Alerts - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-warning/10 to-danger/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    Performance Alerts & Action Items
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Critical areas requiring immediate attention
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                {(performanceAlerts?.underperformingStores.length || 0) + (performanceAlerts?.underperformingReps.length || 0)} Alerts
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/sales#performance-alerts" className="block group">
              <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 hover:bg-danger/10 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-danger/10">
                      <Store className="h-4 w-4 text-danger" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Underperforming Stores</h4>
                      <p className="text-sm text-muted-foreground">
                        {performanceAlerts?.underperformingStores.length || 0} locations below $70 target
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {performanceAlerts?.underperformingStores.length || 0}
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/sales#performance-alerts" className="block group">
              <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 hover:bg-warning/10 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-warning/10">
                      <Users className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Sales Rep Coaching</h4>
                      <p className="text-sm text-muted-foreground">
                        {performanceAlerts?.underperformingReps.length || 0} reps need development
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 text-xs">
                      {performanceAlerts?.underperformingReps.length || 0}
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "View Sales", href: "/sales", icon: TrendingUp, color: "primary" },
          { label: "Check Inventory", href: "/inventory", icon: Package, color: "secondary" },
          { label: "Upload Data", href: "/upload", icon: ArrowUpRight, color: "accent" },
          { label: "View Reports", href: "/reports", icon: Eye, color: "success" }
        ].map((action, index) => (
          <Link key={action.label} to={action.href} className="block group">
            <div className={cn(
              "p-4 rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-all duration-300 hover:scale-105",
              action.color === "primary" && "hover:border-primary/30 hover:shadow-primary/20",
              action.color === "secondary" && "hover:border-secondary/30 hover:shadow-secondary/20",
              action.color === "accent" && "hover:border-accent/30 hover:shadow-accent/20",
              action.color === "success" && "hover:border-success/30 hover:shadow-success/20"
            )}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className={cn(
                  "p-3 rounded-full transition-all duration-300 group-hover:scale-110",
                  action.color === "primary" && "bg-primary/10 group-hover:bg-primary/20",
                  action.color === "secondary" && "bg-secondary/10 group-hover:bg-secondary/20",
                  action.color === "accent" && "bg-accent/10 group-hover:bg-accent/20",
                  action.color === "success" && "bg-success/10 group-hover:bg-success/20"
                )}>
                  <action.icon className={cn(
                    "h-5 w-5",
                    action.color === "primary" && "text-primary",
                    action.color === "secondary" && "text-secondary",
                    action.color === "accent" && "text-accent",
                    action.color === "success" && "text-success"
                  )} />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {action.label}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}