import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { 
  AlertTriangle, 
  Plus,
  Edit,
  Trash2,
  Calendar,
  Package,
  Clock,
  AlertCircle,
  Filter,
  Search,
  TrendingDown,
  Target,
  BarChart3,
  Zap
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type FilterOption = "all" | "expired" | "week" | "month" | "three_months";

export default function CloseDatedProducts() {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const products = useQuery(api.closeDatedInventory.listCloseDatedProducts, {
    daysThreshold: filter === "all" ? undefined : 
      filter === "expired" ? -1 :
      filter === "week" ? 7 :
      filter === "month" ? 30 :
      filter === "three_months" ? 90 : undefined
  });
  const stats = useQuery(api.closeDatedInventory.getExpiryStats);
  const addProduct = useMutation(api.closeDatedInventory.addCloseDatedProduct);
  const updateProduct = useMutation(api.closeDatedInventory.updateCloseDatedProduct);
  const deleteProduct = useMutation(api.closeDatedInventory.deleteCloseDatedProduct);

  const [formData, setFormData] = useState({
    product_name: "",
    flavor: "",
    size: "",
    quantity: 1,
    expiry_date: "",
  });

  const handleCreate = async () => {
    if (!formData.product_name || !formData.quantity || !formData.expiry_date) {
      return;
    }

    await addProduct({
      product_name: formData.product_name,
      flavor: formData.flavor || undefined,
      size: formData.size || undefined,
      quantity: formData.quantity,
      expiry_date: formData.expiry_date,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;

    await updateProduct({
      productId: editingProduct._id,
      ...formData,
    });

    setEditingProduct(null);
    resetForm();
  };

  const handleDelete = async (productId: Id<"close_dated_inventory">) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct({ productId });
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      flavor: "",
      size: "",
      quantity: 1,
      expiry_date: "",
    });
  };

  const openEditDialog = (product: any) => {
    setFormData({
      product_name: product.product_name,
      flavor: product.flavor || "",
      size: product.size || "",
      quantity: product.quantity,
      expiry_date: product.expiry_date,
    });
    setEditingProduct(product);
  };

  const getExpiryColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
    if (daysUntilExpiry <= 7) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800";
    if (daysUntilExpiry <= 30) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    if (daysUntilExpiry <= 90) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  };

  const getExpiryBgColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return "bg-red-500/10 dark:bg-red-500/20";
    if (daysUntilExpiry <= 7) return "bg-orange-500/10 dark:bg-orange-500/20";
    if (daysUntilExpiry <= 30) return "bg-amber-500/10 dark:bg-amber-500/20";
    if (daysUntilExpiry <= 90) return "bg-blue-500/10 dark:bg-blue-500/20";
    return "bg-emerald-500/10 dark:bg-emerald-500/20";
  };

  const getExpiryTextColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return "text-red-600 dark:text-red-400";
    if (daysUntilExpiry <= 7) return "text-orange-600 dark:text-orange-400";
    if (daysUntilExpiry <= 30) return "text-amber-600 dark:text-amber-400";
    if (daysUntilExpiry <= 90) return "text-blue-600 dark:text-blue-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const getExpiryIcon = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return AlertCircle;
    if (daysUntilExpiry <= 7) return AlertTriangle;
    if (daysUntilExpiry <= 30) return Clock;
    return Calendar;
  };

  const getExpiryLabel = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
    if (daysUntilExpiry === 0) return "Expires today";
    if (daysUntilExpiry === 1) return "Expires tomorrow";
    return `Expires in ${daysUntilExpiry} days`;
  };

  const getRowColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30";
    if (daysUntilExpiry <= 7) return "bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/30";
    if (daysUntilExpiry <= 30) return "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/30";
    return "hover:bg-muted/50";
  };

  const filterOptions: { value: FilterOption; label: string; count?: number }[] = [
    { value: "all", label: "All Products", count: stats?.total },
    { value: "expired", label: "Expired", count: stats?.expired },
    { value: "week", label: "This Week", count: stats?.expiringThisWeek },
    { value: "month", label: "This Month", count: stats?.expiringThisMonth },
    { value: "three_months", label: "3 Months", count: stats?.expiringInThreeMonths },
  ];

  const filteredProducts = products?.filter(product => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.product_name.toLowerCase().includes(query) ||
        product.flavor?.toLowerCase().includes(query) ||
        product.size?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getExpiryProgress = () => {
    if (!stats) return 0;
    const total = stats.total || 0;
    const safe = (stats.total || 0) - (stats.expired || 0) - (stats.expiringThisWeek || 0) - (stats.expiringThisMonth || 0);
    return total > 0 ? Math.round((safe / total) * 100) : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Expiry Management</h1>
          <p className="text-muted-foreground">
            Monitor and track products approaching expiration dates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {filteredProducts?.length || 0} Tracked
          </Badge>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Safety Score</p>
                <p className="text-2xl font-bold text-foreground">{getExpiryProgress()}%</p>
                <p className="text-xs text-muted-foreground">Products safe</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <Progress value={getExpiryProgress()} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className={cn("border-0 shadow-sm", stats?.expired > 0 && "ring-2 ring-red-200 dark:ring-red-800")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-foreground">{stats?.expired || 0}</p>
                <p className="text-xs text-muted-foreground">Immediate action</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-0 shadow-sm", stats?.expiringThisWeek > 0 && "ring-2 ring-orange-200 dark:ring-orange-800")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground">{stats?.expiringThisWeek || 0}</p>
                <p className="text-xs text-muted-foreground">Urgent attention</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Tracked</p>
                <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">All inventory</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiry Timeline */}
      {stats && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Expiry Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {filterOptions.map((option, index) => {
                const count = option.count || 0;
                const colors = {
                  all: { bg: "bg-gray-500/10 dark:bg-gray-500/20", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-gray-800" },
                  expired: { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
                  week: { bg: "bg-orange-500/10 dark:bg-orange-500/20", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
                  month: { bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
                  three_months: { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" }
                };
                const color = colors[option.value];

                return (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all group",
                      color.border,
                      color.bg,
                      filter === option.value && "ring-2 ring-primary/20"
                    )}
                    onClick={() => setFilter(option.value)}
                  >
                    <div className="text-center space-y-2">
                      <p className={cn("text-sm font-medium", color.text)}>{option.label}</p>
                      <p className={cn("text-2xl font-bold group-hover:scale-110 transition-transform", color.text)}>
                        {count}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products by name, flavor, or size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-2 flex-wrap">
                {filterOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(option.value)}
                    className="text-xs"
                  >
                    {option.label}
                    {option.count !== undefined && option.count > 0 && (
                      <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Product Inventory
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {filteredProducts?.length || 0} {filter !== "all" ? `${filterOptions.find(f => f.value === filter)?.label}` : "products"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredProducts?.map((product, index) => {
                const ExpiryIcon = getExpiryIcon(product.days_until_expiry);
                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md group",
                      getRowColor(product.days_until_expiry)
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Product Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", getExpiryBgColor(product.days_until_expiry))}>
                              <ExpiryIcon className={cn("h-4 w-4", getExpiryTextColor(product.days_until_expiry))} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{product.product_name}</p>
                              {product.flavor && (
                                <p className="text-sm text-muted-foreground">{product.flavor}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Details</p>
                          <div className="flex flex-wrap gap-2">
                            {product.size && (
                              <Badge variant="outline" size="sm">{product.size}</Badge>
                            )}
                            <Badge variant="secondary" size="sm">Qty: {product.quantity}</Badge>
                          </div>
                        </div>

                        {/* Expiry Date */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Expiry Date</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(product.expiry_date)}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Status</p>
                          <Badge className={getExpiryColor(product.days_until_expiry)} size="sm">
                            {getExpiryLabel(product.days_until_expiry)}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product._id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredProducts?.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">No products found</p>
                    <p className="text-muted-foreground">
                      {filter !== "all" 
                        ? `No products ${filterOptions.find(f => f.value === filter)?.label.toLowerCase()}`
                        : searchQuery 
                          ? "Try adjusting your search terms"
                          : "Start tracking products approaching expiration"
                      }
                    </p>
                  </div>
                  {filter === "all" && !searchQuery && (
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Product
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Legend */}
          {filteredProducts && filteredProducts.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium text-foreground mb-3">Expiry Legend</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/40" />
                  <span className="text-muted-foreground">Expired</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500/20 border border-orange-500/40" />
                  <span className="text-muted-foreground">≤ 7 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                  <span className="text-muted-foreground">≤ 30 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                  <span className="text-muted-foreground">Safe</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingProduct(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Close-Dated Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="product_name">Product Name*</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder="e.g., Whey Protein"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flavor">Flavor</Label>
                <Input
                  id="flavor"
                  value={formData.flavor}
                  onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                  placeholder="e.g., Chocolate"
                />
              </div>
              <div>
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="e.g., 5 lbs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity*</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date*</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setEditingProduct(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingProduct ? handleUpdate : handleCreate}>
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}