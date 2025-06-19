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
  Download,
  Target,
  Wallet,
  PieChart
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ordering Budget</h1>
              <p className="text-muted-foreground">
                Track monthly spending and budget allocation by vendor
              </p>
            </div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 bg-muted rounded-lg p-1"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonths(-1)}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[180px] text-center font-medium text-sm px-3">
            {monthRange.start} to {monthRange.end}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonths(1)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Current Month Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Monthly Budget</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(budgetSummary.totalMonthlyBudget)}
                </p>
                <p className="text-xs text-muted-foreground">Total allocated</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-800">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Current Spent</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(budgetSummary.totalSpent)}
                </p>
                <p className="text-xs text-muted-foreground">{budgetSummary.percentUsed.toFixed(1)}% used</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(budgetSummary.percentUsed, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-0 shadow-sm hover:shadow-lg transition-all duration-200",
          budgetSummary.budgetRemaining < 0 && "ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-900/10"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Budget Left</p>
                <p className={cn(
                  "text-xl font-bold",
                  budgetSummary.budgetRemaining < 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                )}>
                  {formatCurrency(budgetSummary.budgetRemaining)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {budgetSummary.budgetRemaining < 0 ? "Over budget" : "Remaining"}
                </p>
              </div>
              <div className={cn(
                "p-2 rounded-lg border",
                budgetSummary.budgetRemaining < 0 
                  ? "bg-red-500/10 border-red-200 dark:border-red-800" 
                  : "bg-amber-500/10 border-amber-200 dark:border-amber-800"
              )}>
                <AlertCircle className={cn(
                  "h-4 w-4",
                  budgetSummary.budgetRemaining < 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Current Month</p>
                <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
                  {new Date(currentMonth + "-01").toLocaleDateString('en-US', { 
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-muted-foreground">Active period</p>
              </div>
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-200 dark:border-violet-800">
                <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Monthly Spending by Vendor</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {budgetData.vendors.length} vendors
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 bg-background p-3 text-left font-semibold text-foreground">Vendor</th>
                    {budgetData.months.map(month => (
                      <th key={month} className={cn(
                        "min-w-[100px] p-3 text-center text-sm font-medium text-muted-foreground",
                        month === currentMonth && "bg-primary/5 font-bold text-primary"
                      )}>
                        {new Date(month + "-01").toLocaleDateString('en-US', { 
                          month: 'short'
                        })}
                      </th>
                    ))}
                    <th className="p-3 text-center font-semibold text-foreground">Total</th>
                    <th className="p-3 text-center font-semibold text-foreground">Target</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
              <tbody>
                {budgetData.vendors.map(vendor => {
                  const vendorTotal = budgetData.vendorTotals[vendor] || 0;
                  const target = budgetData.targets[vendor];
                  
                  return (
                    <tr key={vendor} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="sticky left-0 bg-background p-3 font-medium text-foreground border-r border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {vendor[0]}
                          </div>
                          {vendor}
                        </div>
                      </td>
                      {budgetData.months.map(month => {
                        const key = `${vendor}-${month}`;
                        const value = budgetData.budgetMatrix[vendor][month] || 0;
                        const isEditing = editingCell === key;
                        
                        return (
                          <td
                            key={month}
                            className={cn(
                              "p-2 text-center cursor-pointer hover:bg-muted/30 transition-colors",
                              month === currentMonth && "bg-primary/5",
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
                                className="h-8 w-full text-center text-sm border-0 bg-background"
                                autoFocus
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {value > 0 ? formatCurrency(value) : "-"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center border-l border-border">
                        <Badge variant="secondary" className="font-medium">
                          {formatCurrency(vendorTotal)}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {target?.monthly_budget ? (
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(target.monthly_budget)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No target</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10"
                          onClick={() => openTargetDialog(vendor)}
                        >
                          <Settings className="h-4 w-4 text-primary" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {/* Monthly Totals Row */}
                <tr className="font-bold bg-muted/50 border-t-2 border-border">
                  <td className="sticky left-0 bg-muted/50 p-3 font-semibold text-foreground border-r border-border">Monthly Total</td>
                  {budgetData.months.map(month => (
                    <td key={month} className="p-3 text-center font-semibold text-foreground">
                      {formatCurrency(budgetData.monthlyTotals[month] || 0)}
                    </td>
                  ))}
                  <td className="p-3 text-center border-l border-border">
                    <Badge variant="default" className="font-semibold">
                      {formatCurrency(
                        Object.values(budgetData.vendorTotals).reduce((sum, val) => sum + val, 0)
                      )}
                    </Badge>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Help and Suggestions */}
          <div className="mt-6 space-y-4">
            <Card className="border-0 shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-800">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Quick Tip</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Click on any cell to edit the amount spent. Use the settings button to configure budget targets for each vendor.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {budgetSummary.vendorSummaries.some(v => v.suggestedOrder > 0) && (
              <Card className="border-0 shadow-sm bg-emerald-50/50 dark:bg-emerald-900/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-emerald-900 dark:text-emerald-100 mb-2">Suggested Orders</h4>
                      <div className="space-y-1">
                        {budgetSummary.vendorSummaries
                          .filter(v => v.suggestedOrder > 0)
                          .map(vendor => (
                            <div key={vendor.vendor_name} className="flex items-center justify-between text-sm">
                              <span className="font-medium text-emerald-800 dark:text-emerald-200">
                                {vendor.vendor_name}
                              </span>
                              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                Order {formatCurrency(vendor.suggestedOrder)}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>

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