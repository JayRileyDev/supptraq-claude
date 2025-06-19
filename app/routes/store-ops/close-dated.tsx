import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
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
  Filter
} from "lucide-react";
import { cn } from "~/lib/utils";

type FilterOption = "all" | "expired" | "week" | "month" | "three_months";

export default function CloseDatedProducts() {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
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
    if (daysUntilExpiry < 0) return "bg-red-100 text-red-800 border-red-200";
    if (daysUntilExpiry <= 7) return "bg-orange-100 text-orange-800 border-orange-200";
    if (daysUntilExpiry <= 30) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (daysUntilExpiry <= 90) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getExpiryLabel = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
    if (daysUntilExpiry === 0) return "Expires today";
    if (daysUntilExpiry === 1) return "Expires tomorrow";
    return `Expires in ${daysUntilExpiry} days`;
  };

  const getRowColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return "bg-red-50 hover:bg-red-100";
    if (daysUntilExpiry <= 30) return "bg-yellow-50 hover:bg-yellow-100";
    if (daysUntilExpiry <= 90) return "bg-blue-50 hover:bg-blue-100";
    return "hover:bg-gray-50";
  };

  const filterOptions: { value: FilterOption; label: string; count?: number }[] = [
    { value: "all", label: "All Products", count: stats?.total },
    { value: "expired", label: "Expired", count: stats?.expired },
    { value: "week", label: "This Week", count: stats?.expiringThisWeek },
    { value: "month", label: "This Month", count: stats?.expiringThisMonth },
    { value: "three_months", label: "3 Months", count: stats?.expiringInThreeMonths },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Close-Dated Products</h1>
          <p className="mt-2 text-gray-600">
            Track products approaching expiration dates
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tracked</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className={stats.expired > 0 ? "ring-2 ring-red-500" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={stats.expiringThisWeek > 0 ? "ring-2 ring-orange-500" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">This Week</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiringThisWeek}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.expiringThisMonth}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Next 3 Months</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.expiringInThreeMonths}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filter by expiry:</span>
        </div>
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(option.value)}
              className="relative"
            >
              {option.label}
              {option.count !== undefined && option.count > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 px-1.5 text-xs"
                >
                  {option.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">Details</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Expiry Date</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {products?.map((product) => (
                  <tr 
                    key={product._id} 
                    className={cn(
                      "border-b transition-colors",
                      getRowColor(product.days_until_expiry)
                    )}
                  >
                    <td className="p-2">
                      <p className="font-medium">{product.product_name}</p>
                      {product.flavor && (
                        <p className="text-sm text-gray-500">{product.flavor}</p>
                      )}
                    </td>
                    <td className="p-2">
                      {product.size && (
                        <Badge variant="outline" className="text-xs">
                          {product.size}
                        </Badge>
                      )}
                    </td>
                    <td className="p-2">
                      <span className="font-medium">{product.quantity}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{product.expiry_date}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={cn("border", getExpiryColor(product.days_until_expiry))}>
                        {getExpiryLabel(product.days_until_expiry)}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(product._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {products?.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No products found {filter !== "all" && `for selected filter`}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-red-100 border border-red-200" />
                <span>Expired</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-yellow-100 border border-yellow-200" />
                <span>&lt; 3 months</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-blue-100 border border-blue-200" />
                <span>3+ months</span>
              </div>
            </div>
          </div>
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