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
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { cn } from "~/lib/utils";

type ReturnStatus = "pending" | "in_progress" | "completed" | "rejected";

const STATUS_CONFIG: Record<ReturnStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function ReturnsTracker() {
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<any>(null);
  
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

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Returns Tracker</h1>
          <p className="mt-2 text-gray-600">
            Manage product returns and track their status
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Return
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Returns</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Card key={status} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setStatusFilter(status as ReturnStatus)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{config.label}</p>
                    <p className="text-2xl font-bold">{stats[status as keyof typeof stats]}</p>
                  </div>
                  <config.icon className={cn("h-8 w-8", config.color.replace("bg-", "text-").replace("100", "600"))} />
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
              onClick={() => setStatusFilter(status as ReturnStatus)}
            >
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Returns List */}
      <Card>
        <CardHeader>
          <CardTitle>Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Staff</th>
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">Vendor</th>
                  <th className="p-2 text-left">Reason</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {returns?.map((ret) => (
                  <tr key={ret._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{ret.date_submitted}</span>
                      </div>
                    </td>
                    <td className="p-2 text-sm">{ret.staff_member}</td>
                    <td className="p-2">
                      {ret.customer_name && (
                        <div>
                          <p className="text-sm font-medium">{ret.customer_name}</p>
                          {ret.customer_phone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {ret.customer_phone}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="text-sm font-medium">{ret.product_name}</p>
                        {(ret.size || ret.quantity) && (
                          <p className="text-xs text-gray-500">
                            {ret.size && `Size: ${ret.size}`}
                            {ret.size && ret.quantity && " • "}
                            {ret.quantity && `Qty: ${ret.quantity}`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-sm">{ret.vendor}</td>
                    <td className="p-2 text-sm">{ret.reason_for_return}</td>
                    <td className="p-2">
                      <Badge className={STATUS_CONFIG[ret.status].color}>
                        {STATUS_CONFIG[ret.status].label}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(ret)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(ret._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {returns?.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No returns found {statusFilter !== "all" && `with status "${STATUS_CONFIG[statusFilter].label}"`}
              </div>
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