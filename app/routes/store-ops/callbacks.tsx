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
import { Checkbox } from "~/components/ui/checkbox";
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
  Phone, 
  Plus,
  Filter,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Voicemail,
  PhoneMissed,
  TruckIcon,
  Star,
  Search,
  MoreHorizontal,
  ExternalLink,
  Users,
  TrendingUp,
  Target
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type CallbackStatus = "pending" | "no_answer" | "voicemail" | "contacted" | "in_transfer" | "important" | "completed";

const STATUS_CONFIG: Record<CallbackStatus, { 
  label: string; 
  color: string; 
  icon: any;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  pending: { 
    label: "Pending", 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300", 
    icon: Clock,
    bgClass: "bg-gray-500/10 dark:bg-gray-500/20",
    textClass: "text-gray-600 dark:text-gray-400",
    borderClass: "border-gray-200 dark:border-gray-800"
  },
  no_answer: { 
    label: "No Answer", 
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", 
    icon: PhoneMissed,
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    textClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-200 dark:border-amber-800"
  },
  voicemail: { 
    label: "Voicemail", 
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", 
    icon: Voicemail,
    bgClass: "bg-orange-500/10 dark:bg-orange-500/20",
    textClass: "text-orange-600 dark:text-orange-400",
    borderClass: "border-orange-200 dark:border-orange-800"
  },
  contacted: { 
    label: "Contacted", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", 
    icon: Phone,
    bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-800"
  },
  in_transfer: { 
    label: "In Transfer", 
    color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300", 
    icon: TruckIcon,
    bgClass: "bg-violet-500/10 dark:bg-violet-500/20",
    textClass: "text-violet-600 dark:text-violet-400",
    borderClass: "border-violet-200 dark:border-violet-800"
  },
  important: { 
    label: "Important", 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", 
    icon: Star,
    bgClass: "bg-red-500/10 dark:bg-red-500/20",
    textClass: "text-red-600 dark:text-red-400",
    borderClass: "border-red-200 dark:border-red-800"
  },
  completed: { 
    label: "Completed", 
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", 
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-200 dark:border-emerald-800"
  },
};

export default function CallbackList() {
  const [statusFilter, setStatusFilter] = useState<CallbackStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCallback, setEditingCallback] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const callbacks = useQuery(api.callbacks.listCallbacks, 
    statusFilter === "all" ? {} : { status: statusFilter }
  );
  const stats = useQuery(api.callbacks.getCallbackStats);
  const createCallback = useMutation(api.callbacks.createCallback);
  const updateCallback = useMutation(api.callbacks.updateCallback);
  const deleteCallback = useMutation(api.callbacks.deleteCallback);

  const [formData, setFormData] = useState({
    staff_member: "",
    item_requested: "",
    flavor: "",
    size_servings: "",
    quantity: 1,
    customer_name: "",
    customer_phone: "",
    prepaid: false,
    transfer_location: "",
    call_date: "",
    called_by: "",
    status: "pending" as CallbackStatus,
    comments: "",
  });

  const handleCreate = async () => {
    if (!formData.staff_member || !formData.item_requested || !formData.customer_name || !formData.customer_phone) {
      return;
    }

    await createCallback({
      staff_member: formData.staff_member,
      item_requested: formData.item_requested,
      flavor: formData.flavor || undefined,
      size_servings: formData.size_servings || undefined,
      quantity: formData.quantity || undefined,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      prepaid: formData.prepaid,
      transfer_location: formData.transfer_location || undefined,
      comments: formData.comments || undefined,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingCallback) return;

    await updateCallback({
      callbackId: editingCallback._id,
      ...formData,
    });

    setEditingCallback(null);
    resetForm();
  };

  const handleQuickStatusUpdate = async (callbackId: Id<"callbacks">, status: CallbackStatus) => {
    await updateCallback({
      callbackId,
      status,
      called_by: localStorage.getItem("userInitials") || "Staff",
    });
  };

  const handleDelete = async (callbackId: Id<"callbacks">) => {
    if (confirm("Are you sure you want to delete this callback?")) {
      await deleteCallback({ callbackId });
    }
  };

  const resetForm = () => {
    setFormData({
      staff_member: "",
      item_requested: "",
      flavor: "",
      size_servings: "",
      quantity: 1,
      customer_name: "",
      customer_phone: "",
      prepaid: false,
      transfer_location: "",
      call_date: "",
      called_by: "",
      status: "pending",
      comments: "",
    });
  };

  const openEditDialog = (callback: any) => {
    setFormData({
      staff_member: callback.staff_member,
      item_requested: callback.item_requested,
      flavor: callback.flavor || "",
      size_servings: callback.size_servings || "",
      quantity: callback.quantity || 1,
      customer_name: callback.customer_name,
      customer_phone: callback.customer_phone,
      prepaid: callback.prepaid,
      transfer_location: callback.transfer_location || "",
      call_date: callback.call_date || "",
      called_by: callback.called_by || "",
      status: callback.status,
      comments: callback.comments || "",
    });
    setEditingCallback(callback);
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const filteredCallbacks = callbacks?.filter(callback => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        callback.customer_name.toLowerCase().includes(query) ||
        callback.item_requested.toLowerCase().includes(query) ||
        callback.customer_phone.includes(query) ||
        callback.flavor?.toLowerCase().includes(query) ||
        callback.comments?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getOverallProgress = () => {
    if (!stats) return 0;
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0) - (stats.overdue || 0);
    const completed = stats.completed || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Customer Callbacks</h1>
          <p className="text-muted-foreground">
            Track and manage customer follow-ups and product requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <Phone className="w-3 h-3 mr-1" />
            {filteredCallbacks?.length || 0} Active
          </Badge>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Callback
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
                <p className="text-2xl font-bold text-foreground">{getOverallProgress()}%</p>
                <p className="text-xs text-muted-foreground">Overall progress</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <Progress value={getOverallProgress()} className="mt-3 h-2" />
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
                <p className="text-sm font-medium text-muted-foreground">Contacted</p>
                <p className="text-2xl font-bold text-foreground">{stats?.contacted || 0}</p>
                <p className="text-xs text-muted-foreground">In progress</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Phone className="h-6 w-6" />
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
                <p className="text-xs text-muted-foreground">Finished</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Grid */}
      {stats && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
              {stats.overdue > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-lg border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setStatusFilter("all")}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">Overdue</p>
                      <p className="text-lg font-bold text-red-700 dark:text-red-300">{stats.overdue}</p>
                    </div>
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </motion.div>
              )}

              {Object.entries(STATUS_CONFIG).map(([status, config], index) => (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all group",
                    config.borderClass,
                    config.bgClass
                  )}
                  onClick={() => setStatusFilter(status as CallbackStatus)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className={cn("text-xs font-medium", config.textClass)}>{config.label}</p>
                      <p className={cn("text-lg font-bold", config.textClass)}>
                        {stats[status as keyof typeof stats] || 0}
                      </p>
                    </div>
                    <config.icon className={cn("h-5 w-5 group-hover:scale-110 transition-transform", config.textClass)} />
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
                placeholder="Search customers, items, phone numbers..."
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
                    onClick={() => setStatusFilter(status as CallbackStatus)}
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

      {/* Callbacks List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Callback List
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {filteredCallbacks?.length || 0} {statusFilter !== "all" ? `${STATUS_CONFIG[statusFilter]?.label}` : "callbacks"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredCallbacks?.map((callback, index) => {
                const config = STATUS_CONFIG[callback.status];
                return (
                  <motion.div
                    key={callback._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md group",
                      callback.status === "important" && "ring-2 ring-red-200 dark:ring-red-800",
                      callback.status === "overdue" && "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Customer Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-2 rounded-lg", config.bgClass)}>
                              <config.icon className={cn("h-4 w-4", config.textClass)} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{callback.customer_name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {formatPhoneNumber(callback.customer_phone)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{callback.item_requested}</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {callback.flavor && <p>Flavor: {callback.flavor}</p>}
                            {callback.size_servings && <p>Size: {callback.size_servings}</p>}
                            {callback.quantity && <p>Qty: {callback.quantity}</p>}
                          </div>
                        </div>

                        {/* Status & Date */}
                        <div className="space-y-2">
                          <Badge className={config.color} size="sm">
                            {config.label}
                          </Badge>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {callback.date_requested}
                            </p>
                            {callback.call_date && (
                              <p>Called: {callback.call_date}</p>
                            )}
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {callback.prepaid && (
                              <Badge variant="secondary" size="sm">Prepaid</Badge>
                            )}
                            {callback.transfer_location && (
                              <Badge variant="outline" size="sm">
                                Transfer: {callback.transfer_location}
                              </Badge>
                            )}
                          </div>
                          {callback.comments && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {callback.comments}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickStatusUpdate(callback._id, "contacted")}
                          disabled={callback.status === "contacted" || callback.status === "completed"}
                          className="h-8"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickStatusUpdate(callback._id, "no_answer")}
                          disabled={callback.status === "completed"}
                          className="h-8"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(callback)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(callback._id)}
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
            
            {filteredCallbacks?.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="space-y-3">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Phone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">No callbacks found</p>
                    <p className="text-muted-foreground">
                      {statusFilter !== "all" 
                        ? `No callbacks with status "${STATUS_CONFIG[statusFilter]?.label}"`
                        : searchQuery 
                          ? "Try adjusting your search terms"
                          : "Create your first callback to get started"
                      }
                    </p>
                  </div>
                  {statusFilter === "all" && !searchQuery && (
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Callback
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingCallback} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingCallback(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCallback ? "Edit Callback" : "Create New Callback"}
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
                <Label htmlFor="item_requested">Item Requested*</Label>
                <Input
                  id="item_requested"
                  value={formData.item_requested}
                  onChange={(e) => setFormData({ ...formData, item_requested: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="flavor">Flavor</Label>
                <Input
                  id="flavor"
                  value={formData.flavor}
                  onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="size_servings">Size/Servings</Label>
                <Input
                  id="size_servings"
                  value={formData.size_servings}
                  onChange={(e) => setFormData({ ...formData, size_servings: e.target.value })}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name*</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Customer Phone*</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prepaid"
                  checked={formData.prepaid}
                  onCheckedChange={(checked) => setFormData({ ...formData, prepaid: !!checked })}
                />
                <Label htmlFor="prepaid" className="cursor-pointer">
                  Prepaid
                </Label>
              </div>
              <div>
                <Label htmlFor="transfer_location">Transfer Location</Label>
                <Input
                  id="transfer_location"
                  value={formData.transfer_location}
                  onChange={(e) => setFormData({ ...formData, transfer_location: e.target.value })}
                  placeholder="e.g., Edmonton South"
                />
              </div>
            </div>

            {editingCallback && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="call_date">Call Date</Label>
                    <Input
                      id="call_date"
                      type="date"
                      value={formData.call_date}
                      onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="called_by">Called By</Label>
                    <Input
                      id="called_by"
                      value={formData.called_by}
                      onChange={(e) => setFormData({ ...formData, called_by: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: CallbackStatus) => setFormData({ ...formData, status: value })}
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
              </>
            )}

            <div>
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setEditingCallback(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingCallback ? handleUpdate : handleCreate}>
              {editingCallback ? "Update Callback" : "Create Callback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}