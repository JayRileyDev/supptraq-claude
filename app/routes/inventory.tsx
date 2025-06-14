import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";


import { useUser } from "@clerk/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, TrendingDown, ArrowUpDown, Store, Search, Filter, Download, RefreshCw, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  delay = 0,
  onClick
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  delay?: number;
  onClick?: () => void;
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
          <div className="text-3xl font-bold text-foreground mb-2 glow-text">
            {value}
          </div>
          {change && (
            <div className={cn(
              "flex items-center px-2 py-1 rounded-full text-xs font-medium",
              changeType === "positive" && "bg-green-500/10 text-green-400 border border-green-500/20",
              changeType === "negative" && "bg-red-500/10 text-red-400 border border-red-500/20",
              changeType === "neutral" && "bg-muted/50 text-muted-foreground border border-border"
            )}>
              {change}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InventoryTable({ items }: { items: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-foreground">Product</th>
            <th className="text-left py-3 px-4 font-medium text-foreground">Store</th>
            <th className="text-left py-3 px-4 font-medium text-foreground">On Hand</th>
            <th className="text-left py-3 px-4 font-medium text-foreground">Sold</th>
            <th className="text-left py-3 px-4 font-medium text-foreground">Vendor</th>
            <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <motion.tr
              key={`${item.item_number}-${item.store_id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-200"
            >
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium text-foreground text-sm">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">#{item.item_number}</p>
                </div>
              </td>
              <td className="py-3 px-4">
                <Badge variant="outline">Store {item.store_id}</Badge>
              </td>
              <td className="py-3 px-4">
                <span className={cn(
                  "font-medium",
                  item.qty_on_hand === 0 && "text-red-600 dark:text-red-400",
                  item.qty_on_hand <= 5 && item.qty_on_hand > 0 && "text-amber-600 dark:text-amber-400",
                  item.qty_on_hand > 5 && "text-foreground"
                )}>
                  {item.qty_on_hand}
                </span>
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                {item.qty_sold || 0}
              </td>
              <td className="py-3 px-4 text-muted-foreground text-sm">
                {item.primary_vendor}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  {item.qty_on_hand === 0 && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                  {item.qty_on_hand <= 5 && item.qty_on_hand > 0 && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      Low Stock
                    </Badge>
                  )}
                  {item.flag_reorder && (
                    <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                      Reorder
                    </Badge>
                  )}
                  {item.flag_transfer && (
                    <Badge variant="outline" className="text-purple-600 dark:text-purple-400">
                      Transfer
                    </Badge>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useUser();
  const userId = user?.id;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filters, setFilters] = useState({
    storeId: "all",
    vendor: "all",
    stockLevel: "all",
    search: ""
  });

  const inventoryData = useQuery(
    api.inventoryQueries.getInventoryOverview,
    userId ? { userId, ...filters } : "skip"
  );

  const inventoryFilters = useQuery(
    api.inventoryQueries.getInventoryFilters,
    userId ? { userId } : "skip"
  );

  const transferLogs = useQuery(
    api.inventoryQueries.getTransferLogs,
    userId ? { userId } : "skip"
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh - in real app this would refetch data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleExport = () => {
    if (!inventoryData) return;
    
    const csvData = [
      ['Product', 'Store', 'On Hand', 'Sold', 'Vendor', 'Status'].join(','),
      ...inventoryData.inventoryItems.map(item => [
        item.product_name,
        `Store ${item.store_id}`,
        item.qty_on_hand,
        item.qty_sold || 0,
        item.primary_vendor,
        item.qty_on_hand === 0 ? 'Out of Stock' : 
        item.qty_on_hand <= 5 ? 'Low Stock' : 'In Stock'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReorder = (item: any) => {
    // For now, just show an alert - in a real app this would create a purchase order
    alert(`Reorder request created for ${item.product_name} at Store ${item.store_id}`);
  };

  if (!inventoryData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 glow-text">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Monitor stock levels, manage transfers, and track vendor performance.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Sync'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Filter className="h-5 w-5 text-primary" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Store
                </label>
                <Select value={filters.storeId} onValueChange={(value) => setFilters(prev => ({ ...prev, storeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stores</SelectItem>
                    {inventoryFilters?.stores.map(store => (
                      <SelectItem key={store} value={store}>Store {store}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Vendor
                </label>
                <Select value={filters.vendor} onValueChange={(value) => setFilters(prev => ({ ...prev, vendor: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All vendors</SelectItem>
                    {inventoryFilters?.vendors.map(vendor => (
                      <SelectItem key={vendor.code} value={vendor.code}>{vendor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Stock Level
                </label>
                <Select value={filters.stockLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, stockLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="overstock">Overstock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 h-4 w-4" />
                  <Input 
                    placeholder="Product name, SKU..." 
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setFilters({
                    storeId: "all",
                    vendor: "all", 
                    stockLevel: "all",
                    search: ""
                  })}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Items"
          value={inventoryData.metrics.totalItems.toLocaleString()}
          change="Across all stores"
          changeType="neutral"
          icon={Package}
          delay={0.2}
        />
        <MetricCard
          title="Inventory Value"
          value={`$${Math.round(inventoryData.metrics.totalValue).toLocaleString()}`}
          change="+3.2% from last month"
          changeType="positive"
          icon={TrendingDown}
          delay={0.25}
        />
        <MetricCard
          title="Low Stock Items"
          value={inventoryData.metrics.lowStockCount.toString()}
          change={inventoryData.metrics.lowStockCount > 0 ? "Needs attention" : "All good"}
          changeType={inventoryData.metrics.lowStockCount > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
          delay={0.3}
          onClick={() => setFilters(prev => ({ ...prev, stockLevel: "low" }))}
        />
        <MetricCard
          title="Transfer Suggestions"
          value={inventoryData.metrics.transferCount.toString()}
          change="Optimization opportunities"
          changeType="neutral"
          icon={ArrowUpDown}
          delay={0.35}
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="group"
        >
          <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Action Required
              </CardTitle>
              <CardDescription className="text-muted-foreground">Items needing immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventoryData.reorderSuggestions.slice(0, 5).map((item, index) => (
                <div key={`${item.item_number}-${item.store_id}`} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm">
                  <div>
                    <p className="font-medium text-sm text-foreground">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">Store {item.store_id} • {item.qty_on_hand} left</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleReorder(item)}
                  >
                    Reorder
                  </Button>
                </div>
              ))}
              {inventoryData.reorderSuggestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No reorders needed</p>
                  <p className="text-sm">All inventory levels are healthy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Store Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="group"
        >
          <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Store className="h-5 w-5 text-primary" />
                Store Health
              </CardTitle>
              <CardDescription className="text-muted-foreground">Inventory status by location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventoryData.storeStats.map((store) => (
                <div key={store.storeId} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm">
                  <div>
                    <p className="font-medium text-sm text-foreground">Store {store.storeId}</p>
                    <p className="text-xs text-muted-foreground">
                      {store.totalItems} items • ${Math.round(store.totalValue).toLocaleString()} value
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {store.outOfStock > 0 && (
                      <Badge variant="destructive" className="text-xs">{store.outOfStock}</Badge>
                    )}
                    {store.lowStock > 0 && (
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                        {store.lowStock}
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors duration-200" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transfer Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="group"
        >
          <Card className="glow-card card-shadow hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <ArrowUpDown className="h-5 w-5 text-accent" />
                Recent Transfers
              </CardTitle>
              <CardDescription className="text-muted-foreground">Latest inter-store movements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {transferLogs?.slice(0, 5).map((transfer) => (
                <div key={`${transfer.item_number}-${transfer.from_store_id}-${transfer.to_store_id}`} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-foreground">{transfer.product_name}</p>
                    <span className="text-xs text-muted-foreground">{transfer.qty} units</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Store {transfer.from_store_id}</span>
                    <ArrowRight className="h-3 w-3 mx-2" />
                    <span>Store {transfer.to_store_id}</span>
                  </div>
                </div>
              ))}
              {(!transferLogs || transferLogs.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowUpDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent transfers</p>
                  <p className="text-sm">No inter-store movements yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Inventory Items</CardTitle>
            <CardDescription className="text-muted-foreground">Current stock levels across all locations</CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryTable items={inventoryData.inventoryItems} />
          </CardContent>
        </Card>
      </motion.div>
      </div>
  );
}