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
  CheckCircle,
  XCircle,
  Clock,
  Voicemail,
  PhoneMissed,
  TruckIcon,
  Star
} from "lucide-react";
import { cn } from "~/lib/utils";

type CallbackStatus = "pending" | "no_answer" | "voicemail" | "contacted" | "in_transfer" | "important" | "completed";

const STATUS_CONFIG: Record<CallbackStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-800", icon: Clock },
  no_answer: { label: "No Answer", color: "bg-yellow-100 text-yellow-800", icon: PhoneMissed },
  voicemail: { label: "Voicemail", color: "bg-orange-100 text-orange-800", icon: Voicemail },
  contacted: { label: "Contacted", color: "bg-blue-100 text-blue-800", icon: Phone },
  in_transfer: { label: "In Transfer", color: "bg-purple-100 text-purple-800", icon: TruckIcon },
  important: { label: "Important", color: "bg-red-100 text-red-800", icon: Star },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
};

export default function CallbackList() {
  const [statusFilter, setStatusFilter] = useState<CallbackStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCallback, setEditingCallback] = useState<any>(null);
  
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

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Callback List</h1>
          <p className="mt-2 text-gray-600">
            Track customer follow-ups and product requests
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Callback
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <Card className={cn(
            "cursor-pointer hover:shadow-lg transition-shadow",
            stats.overdue > 0 && "ring-2 ring-red-500"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Overdue</p>
                  <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Card key={status} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setStatusFilter(status as CallbackStatus)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{config.label}</p>
                    <p className="text-xl font-bold">{stats[status as keyof typeof stats]}</p>
                  </div>
                  <config.icon className={cn("h-6 w-6", config.color.replace("bg-", "text-").replace("100", "600"))} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filter by status:</span>
        </div>
        <div className="flex gap-2">
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
            >
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Callbacks List */}
      <Card>
        <CardHeader>
          <CardTitle>Callbacks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-left">Details</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Actions</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {callbacks?.map((callback) => (
                  <tr key={callback._id} className={cn(
                    "border-b hover:bg-gray-50",
                    callback.status === "important" && "bg-red-50"
                  )}>
                    <td className="p-2">
                      <div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium">{callback.date_requested}</span>
                        </div>
                        {callback.call_date && (
                          <p className="text-xs text-gray-500">
                            Called: {callback.call_date} by {callback.called_by}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="text-sm font-medium">{callback.item_requested}</p>
                        <div className="text-xs text-gray-500">
                          {callback.flavor && `${callback.flavor} • `}
                          {callback.size_servings && `${callback.size_servings} • `}
                          {callback.quantity && `Qty: ${callback.quantity}`}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="text-sm font-medium">{callback.customer_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatPhoneNumber(callback.customer_phone)}
                        </p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        {callback.prepaid && (
                          <Badge variant="secondary" className="text-xs">Prepaid</Badge>
                        )}
                        {callback.transfer_location && (
                          <Badge variant="outline" className="text-xs">
                            Transfer: {callback.transfer_location}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={STATUS_CONFIG[callback.status].color}>
                        {STATUS_CONFIG[callback.status].label}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleQuickStatusUpdate(callback._id, "contacted")}
                          disabled={callback.status === "contacted" || callback.status === "completed"}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Called
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleQuickStatusUpdate(callback._id, "no_answer")}
                          disabled={callback.status === "completed"}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(callback)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(callback._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {callbacks?.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No callbacks found {statusFilter !== "all" && `with status "${STATUS_CONFIG[statusFilter].label}"`}
              </div>
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