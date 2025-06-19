import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
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
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Calendar,
  Package,
  ChevronLeft,
  ChevronRight,
  Settings,
  Download
} from "lucide-react";
import { cn } from "~/lib/utils";

export default function OrderingBudget() {
  const [monthRange, setMonthRange] = useState(() => {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return {
      start: startMonth.toISOString().slice(0, 7),
      end: now.toISOString().slice(0, 7),
    };
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const budgetData = useQuery(api.orderingBudgets.getMonthlyBudgets, {
    startMonth: monthRange.start,
    endMonth: monthRange.end,
  });
  const budgetSummary = useQuery(api.orderingBudgets.getBudgetSummary, {
    month: currentMonth,
  });
  
  const updateBudget = useMutation(api.orderingBudgets.updateBudgetEntry);
  const updateTarget = useMutation(api.orderingBudgets.upsertBudgetTarget);

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [targetForm, setTargetForm] = useState({
    monthly_budget: "",
    minimum_inventory_target: "",
    notes: "",
  });

  const handleCellClick = (vendor: string, month: string) => {
    const key = `${vendor}-${month}`;
    const currentValue = budgetData?.budgetMatrix[vendor][month] || 0;
    setEditingCell(key);
    setEditValue(currentValue.toString());
  };

  const handleCellUpdate = async (vendor: string, month: string) => {
    const amount = parseFloat(editValue) || 0;
    await updateBudget({
      vendor_name: vendor,
      month,
      amount_spent: amount,
    });
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent, vendor: string, month: string) => {
    if (e.key === "Enter") {
      handleCellUpdate(vendor, month);
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  const openTargetDialog = (vendor: string) => {
    setSelectedVendor(vendor);
    const target = budgetData?.targets[vendor];
    setTargetForm({
      monthly_budget: target?.monthly_budget?.toString() || "",
      minimum_inventory_target: target?.minimum_inventory_target?.toString() || "",
      notes: target?.notes || "",
    });
    setIsTargetDialogOpen(true);
  };

  const handleTargetUpdate = async () => {
    if (!selectedVendor) return;

    await updateTarget({
      vendor_name: selectedVendor,
      monthly_budget: parseFloat(targetForm.monthly_budget) || 0,
      minimum_inventory_target: targetForm.minimum_inventory_target 
        ? parseFloat(targetForm.minimum_inventory_target) 
        : undefined,
      notes: targetForm.notes || undefined,
    });

    setIsTargetDialogOpen(false);
    setSelectedVendor("");
    setTargetForm({ monthly_budget: "", minimum_inventory_target: "", notes: "" });
  };

  const navigateMonths = (direction: number) => {
    const start = new Date(monthRange.start + "-01");
    const end = new Date(monthRange.end + "-01");
    
    start.setMonth(start.getMonth() + direction);
    end.setMonth(end.getMonth() + direction);
    
    setMonthRange({
      start: start.toISOString().slice(0, 7),
      end: end.toISOString().slice(0, 7),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCellColor = (vendor: string, spent: number) => {
    const target = budgetData?.targets[vendor];
    if (!target?.monthly_budget) return "";
    
    const percentUsed = (spent / target.monthly_budget) * 100;
    if (percentUsed >= 100) return "bg-red-50 text-red-700";
    if (percentUsed >= 80) return "bg-yellow-50 text-yellow-700";
    if (spent > 0) return "bg-green-50 text-green-700";
    return "";
  };

  if (!budgetData || !budgetSummary) {
    return <div className="p-8">Loading budget data...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordering Budget</h1>
          <p className="mt-2 text-gray-600">
            Track monthly spending and budget allocation by vendor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonths(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[200px] text-center font-medium">
            {monthRange.start} to {monthRange.end}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonths(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current Month Summary */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Budget</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(budgetSummary.totalMonthlyBudget)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Spent</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(budgetSummary.totalSpent)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${Math.min(budgetSummary.percentUsed, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={budgetSummary.budgetRemaining < 0 ? "ring-2 ring-red-500" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Budget Left</p>
                <p className={cn(
                  "text-2xl font-bold",
                  budgetSummary.budgetRemaining < 0 ? "text-red-600" : "text-green-600"
                )}>
                  {formatCurrency(budgetSummary.budgetRemaining)}
                </p>
              </div>
              <AlertCircle className={cn(
                "h-8 w-8",
                budgetSummary.budgetRemaining < 0 ? "text-red-600" : "text-green-600"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Month</p>
                <p className="text-2xl font-bold">
                  {new Date(currentMonth + "-01").toLocaleDateString('en-US', { 
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending by Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="sticky left-0 bg-white p-2 text-left">Vendor</th>
                  {budgetData.months.map(month => (
                    <th key={month} className={cn(
                      "min-w-[100px] p-2 text-center text-sm",
                      month === currentMonth && "bg-blue-50 font-bold"
                    )}>
                      {new Date(month + "-01").toLocaleDateString('en-US', { 
                        month: 'short'
                      })}
                    </th>
                  ))}
                  <th className="p-2 text-center font-bold">Total</th>
                  <th className="p-2 text-center">Target</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {budgetData.vendors.map(vendor => {
                  const vendorTotal = budgetData.vendorTotals[vendor] || 0;
                  const target = budgetData.targets[vendor];
                  
                  return (
                    <tr key={vendor} className="border-b hover:bg-gray-50">
                      <td className="sticky left-0 bg-white p-2 font-medium text-sm">
                        {vendor}
                      </td>
                      {budgetData.months.map(month => {
                        const key = `${vendor}-${month}`;
                        const value = budgetData.budgetMatrix[vendor][month] || 0;
                        const isEditing = editingCell === key;
                        
                        return (
                          <td
                            key={month}
                            className={cn(
                              "p-1 text-center cursor-pointer hover:bg-gray-100",
                              month === currentMonth && "bg-blue-50",
                              getCellColor(vendor, value)
                            )}
                            onClick={() => handleCellClick(vendor, month)}
                          >
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellUpdate(vendor, month)}
                                onKeyDown={(e) => handleKeyPress(e, vendor, month)}
                                className="h-8 w-full text-center text-sm"
                                autoFocus
                              />
                            ) : (
                              <span className="text-sm">
                                {value > 0 ? formatCurrency(value) : "-"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2 text-center font-bold text-sm">
                        {formatCurrency(vendorTotal)}
                      </td>
                      <td className="p-2 text-center">
                        {target?.monthly_budget ? (
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(target.monthly_budget)}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openTargetDialog(vendor)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {/* Monthly Totals Row */}
                <tr className="font-bold bg-gray-50">
                  <td className="sticky left-0 bg-gray-50 p-2">Monthly Total</td>
                  {budgetData.months.map(month => (
                    <td key={month} className="p-2 text-center">
                      {formatCurrency(budgetData.monthlyTotals[month] || 0)}
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    {formatCurrency(
                      Object.values(budgetData.vendorTotals).reduce((sum, val) => sum + val, 0)
                    )}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-600">
              💡 Click on any cell to edit the amount spent
            </p>
            {budgetSummary.vendorSummaries.some(v => v.suggestedOrder > 0) && (
              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="font-medium text-blue-900 mb-2">Suggested Orders</h4>
                {budgetSummary.vendorSummaries
                  .filter(v => v.suggestedOrder > 0)
                  .map(vendor => (
                    <p key={vendor.vendor_name} className="text-sm text-blue-700">
                      {vendor.vendor_name}: Order {formatCurrency(vendor.suggestedOrder)} 
                      to maintain ${formatCurrency(vendor.minimum_inventory_target || 0)} in inventory
                    </p>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Target Settings Dialog */}
      <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Budget Settings - {selectedVendor}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="monthly_budget">Monthly Budget</Label>
              <Input
                id="monthly_budget"
                type="number"
                value={targetForm.monthly_budget}
                onChange={(e) => setTargetForm({ ...targetForm, monthly_budget: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="minimum_inventory_target">Minimum Inventory Target</Label>
              <Input
                id="minimum_inventory_target"
                type="number"
                value={targetForm.minimum_inventory_target}
                onChange={(e) => setTargetForm({ ...targetForm, minimum_inventory_target: e.target.value })}
                placeholder="Optional"
              />
              <p className="text-xs text-gray-500 mt-1">
                System will suggest orders to maintain this inventory level
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={targetForm.notes}
                onChange={(e) => setTargetForm({ ...targetForm, notes: e.target.value })}
                placeholder="Any special notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsTargetDialogOpen(false);
              setSelectedVendor("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleTargetUpdate}>
              Update Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}