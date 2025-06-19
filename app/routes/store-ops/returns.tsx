import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { 
  Package, 
  Plus,
  Filter,
  Edit,
  Trash2,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RotateCcw,
  TrendingUp,
  Users,
  Building,
  Target
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ReturnStatus = "pending" | "in_progress" | "completed" | "rejected";

const STATUS_CONFIG: Record<ReturnStatus, { 
  label: string; 
  color: string; 
  icon: any;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  pending: { 
    label: "Pending", 
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", 
    icon: Clock,
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    textClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-200 dark:border-amber-800"
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", 
    icon: RotateCcw,
    bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-800"
  },
  completed: { 
    label: "Completed", 
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", 
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-200 dark:border-emerald-800"
  },
  rejected: { 
    label: "Rejected", 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", 
    icon: XCircle,
    bgClass: "bg-red-500/10 dark:bg-red-500/20",
    textClass: "text-red-600 dark:text-red-400",
    borderClass: "border-red-200 dark:border-red-800"
  },
};

export default function ReturnsTracker() {
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const returns = useQuery(api.returns.listReturns, 
    statusFilter === "all" ? {} : { status: statusFilter }
  );
  const stats = useQuery(api.returns.getReturnStats);
  const createReturn = useMutation(api.returns.createReturn);
  const updateReturn = useMutation(api.returns.updateReturn);
  const deleteReturn = useMutation(api.returns.deleteReturn);

  const [formData, setFormData] = useState({
    staff_member: "",
    customer_name: "",
    customer_phone: "",
    vendor: "",
    product_name: "",
    size: "",
    quantity: 1,
    expiry_date: "",
    lot_number: "",
    reason_for_return: "",
    notes: "",
    status: "pending" as ReturnStatus,
  });

  const handleCreate = async () => {
    if (!formData.staff_member || !formData.vendor || !formData.product_name || !formData.reason_for_return) {
      return;
    }

    await createReturn({
      staff_member: formData.staff_member,
      customer_name: formData.customer_name || undefined,
      customer_phone: formData.customer_phone || undefined,
      vendor: formData.vendor,
      product_name: formData.product_name,
      size: formData.size || undefined,
      quantity: formData.quantity || undefined,
      expiry_date: formData.expiry_date || undefined,
      lot_number: formData.lot_number || undefined,
      reason_for_return: formData.reason_for_return,
      notes: formData.notes || undefined,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingReturn) return;

    await updateReturn({
      returnId: editingReturn._id,
      ...formData,
      last_follow_up: new Date().toISOString().split('T')[0],
    });

    setEditingReturn(null);
    resetForm();
  };

  const handleDelete = async (returnId: Id<"returns">) => {
    if (confirm("Are you sure you want to delete this return?")) {
      await deleteReturn({ returnId });
    }
  };

  const resetForm = () => {
    setFormData({
      staff_member: "",
      customer_name: "",
      customer_phone: "",
      vendor: "",
      product_name: "",
      size: "",
      quantity: 1,
      expiry_date: "",
      lot_number: "",
      reason_for_return: "",
      notes: "",
      status: "pending",
    });
  };

  const openEditDialog = (ret: any) => {
    setFormData({
      staff_member: ret.staff_member,
      customer_name: ret.customer_name || "",
      customer_phone: ret.customer_phone || "",
      vendor: ret.vendor,
      product_name: ret.product_name,
      size: ret.size || "",
      quantity: ret.quantity || 1,
      expiry_date: ret.expiry_date || "",
      lot_number: ret.lot_number || "",
      reason_for_return: ret.reason_for_return,
      notes: ret.notes || "",
      status: ret.status,
    });
    setEditingReturn(ret);
  };

  const filteredReturns = returns?.filter(ret => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ret.customer_name?.toLowerCase().includes(query) ||
        ret.product_name.toLowerCase().includes(query) ||
        ret.vendor.toLowerCase().includes(query) ||
        ret.staff_member.toLowerCase().includes(query) ||
        ret.reason_for_return.toLowerCase().includes(query) ||
        ret.lot_number?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getCompletionRate = () => {
    if (!stats) return 0;
    const total = stats.total || 0;
    const completed = stats.completed || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
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
          <h1 className="text-3xl font-bold text-foreground">Product Returns</h1>
          <p className="text-muted-foreground">
            Track and manage product returns through the complete workflow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
            <Package className="w-3 h-3 mr-1" />
            {filteredReturns?.length || 0} Active
          </Badge>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Return
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">{getCompletionRate()}%</p>
                <p className="text-xs text-muted-foreground">Returns processed</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <Progress value={getCompletionRate()} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Returns</p>
                <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{stats?.pending || 0}</p>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{stats?.completed || 0}</p>
                <p className="text-xs text-muted-foreground">Processed</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      {stats && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(STATUS_CONFIG).map(([status, config], index) => (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all group",
                    config.borderClass,
                    config.bgClass
                  )}
                  onClick={() => setStatusFilter(status as ReturnStatus)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className={cn("text-sm font-medium", config.textClass)}>{config.label}</p>
                      <p className={cn("text-2xl font-bold", config.textClass)}>
                        {stats[status as keyof typeof stats] || 0}
                      </p>
                    </div>
                    <config.icon className={cn("h-6 w-6 group-hover:scale-110 transition-transform", config.textClass)} />
                  </div>
                </motion.div>
              ))}
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
                placeholder="Search returns by customer, product, vendor, or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status as ReturnStatus)}
                    className="text-xs"
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Returns Workflow
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {filteredReturns?.length || 0} {statusFilter !== "all" ? `${STATUS_CONFIG[statusFilter]?.label}` : "returns"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredReturns?.map((ret, index) => {
                const config = STATUS_CONFIG[ret.status];
                return (
                  <motion.div
                    key={ret._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg border transition-all hover:shadow-md group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Status & Date */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-2 rounded-lg", config.bgClass)}>
                              <config.icon className={cn("h-4 w-4", config.textClass)} />
                            </div>
                            <div>
                              <Badge className={config.color} size="sm">
                                {config.label}
                              </Badge>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(ret.date_submitted)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{ret.product_name}</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {ret.vendor}
                            </p>
                            {(ret.size || ret.quantity) && (
                              <p>
                                {ret.size && `Size: ${ret.size}`}
                                {ret.size && ret.quantity && " • "}
                                {ret.quantity && `Qty: ${ret.quantity}`}
                              </p>
                            )}
                            {ret.lot_number && (
                              <p>Lot: {ret.lot_number}</p>
                            )}
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-1">
                          {ret.customer_name ? (
                            <div>
                              <p className="text-sm font-medium text-foreground">{ret.customer_name}</p>
                              {ret.customer_phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {ret.customer_phone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No customer info</p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Staff: {ret.staff_member}
                          </p>
                        </div>

                        {/* Return Reason */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Return Reason</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ret.reason_for_return}
                          </p>
                          {ret.expiry_date && (
                            <p className="text-xs text-muted-foreground">
                              Expiry: {formatDate(ret.expiry_date)}
                            </p>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-1">
                          {ret.notes && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Notes</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {ret.notes}
                              </p>
                            </div>
                          )}
                          {ret.last_follow_up && (
                            <p className="text-xs text-muted-foreground">
                              Last update: {formatDate(ret.last_follow_up)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(ret)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ret._id)}
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
            
            {filteredReturns?.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">No returns found</p>
                    <p className="text-muted-foreground">
                      {statusFilter !== "all" 
                        ? `No returns with status "${STATUS_CONFIG[statusFilter]?.label}"`
                        : searchQuery 
                          ? "Try adjusting your search terms"
                          : "Create your first return to get started"
                      }
                    </p>
                  </div>
                  {statusFilter === "all" && !searchQuery && (
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Process First Return
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingReturn} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingReturn(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReturn ? "Edit Return" : "Create New Return"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="staff_member">Staff Member*</Label>
                <Input
                  id="staff_member"
                  value={formData.staff_member}
                  onChange={(e) => setFormData({ ...formData, staff_member: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vendor">Vendor*</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Customer Phone</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="product_name">Product Name*</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="lot_number">Lot Number</Label>
              <Input
                id="lot_number"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="reason_for_return">Reason for Return*</Label>
              <Textarea
                id="reason_for_return"
                value={formData.reason_for_return}
                onChange={(e) => setFormData({ ...formData, reason_for_return: e.target.value })}
                rows={3}
              />
            </div>

            {editingReturn && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ReturnStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setEditingReturn(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingReturn ? handleUpdate : handleCreate}>
              {editingReturn ? "Update Return" : "Create Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}