import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { 
  Sparkles, 
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  RotateCcw,
  Trash2,
  Target,
  Users
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
  "Lifestyle": "bg-blue-100 text-blue-700 border-blue-200",
  "Mass Gainer": "bg-purple-100 text-purple-700 border-purple-200",
  "Main Wall": "bg-green-100 text-green-700 border-green-200",
  "Other": "bg-gray-100 text-gray-700 border-gray-200",
};

export default function CleaningSheet() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<Set<Id<"cleaning_logs">>>(new Set());
  const [userInitials, setUserInitials] = useState(() => {
    return localStorage.getItem("userInitials") || "";
  });

  const logs = useQuery(api.cleaningLogs.listCleaningLogs, 
    categoryFilter === "all" ? {} : { category: categoryFilter }
  );
  const stats = useQuery(api.cleaningLogs.getCleaningStats);
  const initializeAreas = useMutation(api.cleaningLogs.initializeCleaningAreas);
  const markCleaned = useMutation(api.cleaningLogs.markAreaCleaned);
  const resetArea = useMutation(api.cleaningLogs.resetArea);
  const addArea = useMutation(api.cleaningLogs.addCustomArea);
  const deleteArea = useMutation(api.cleaningLogs.deleteArea);

  const [newArea, setNewArea] = useState({
    area_name: "",
    area_category: "Other",
  });

  useEffect(() => {
    if (userInitials) {
      localStorage.setItem("userInitials", userInitials);
    }
  }, [userInitials]);

  // Initialize default areas if none exist
  useEffect(() => {
    if (logs && logs.length === 0) {
      initializeAreas();
    }
  }, [logs, initializeAreas]);

  const handleMarkCleaned = async () => {
    if (selectedAreas.size === 0 || !userInitials) return;

    const promises = Array.from(selectedAreas).map(id => 
      markCleaned({
        cleaningLogId: id,
        cleaned_by: userInitials,
      })
    );

    await Promise.all(promises);
    setSelectedAreas(new Set());
  };

  const handleAddArea = async () => {
    if (!newArea.area_name) return;

    await addArea(newArea);
    setIsAddOpen(false);
    setNewArea({ area_name: "", area_category: "Other" });
  };

  const toggleAreaSelection = (id: Id<"cleaning_logs">) => {
    const newSelection = new Set(selectedAreas);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedAreas(newSelection);
  };

  const getDaysAgo = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (log: any) => {
    if (!log.last_cleaned_date) return "text-red-600";
    const daysAgo = getDaysAgo(log.last_cleaned_date);
    if (daysAgo === null || daysAgo > 7) return "text-red-600";
    if (daysAgo > 3) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusLabel = (log: any) => {
    if (!log.last_cleaned_date) return "Never cleaned";
    const daysAgo = getDaysAgo(log.last_cleaned_date);
    if (daysAgo === 0) return "Cleaned today";
    if (daysAgo === 1) return "Cleaned yesterday";
    return `Cleaned ${daysAgo} days ago`;
  };

  const categories = ["all", "Lifestyle", "Mass Gainer", "Main Wall", "Other"];

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
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cleaning Sheet</h1>
              <p className="text-muted-foreground">
                Track store cleaning tasks and schedules
              </p>
            </div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <Label htmlFor="initials" className="text-sm font-medium text-muted-foreground">
              Your initials:
            </Label>
            <Input
              id="initials"
              placeholder="ABC"
              value={userInitials}
              onChange={(e) => setUserInitials(e.target.value.toUpperCase())}
              className="w-20 text-center font-mono border-0 bg-muted/50 focus:bg-background"
              maxLength={3}
            />
          </div>
          <Button onClick={() => setIsAddOpen(true)} variant="outline" className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Area
          </Button>
          <Button 
            onClick={handleMarkCleaned}
            disabled={selectedAreas.size === 0 || !userInitials}
            className="shadow-lg"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Cleaned ({selectedAreas.size})
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        >
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Total Areas</p>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
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
                  <p className="text-xs font-medium text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-0 shadow-sm hover:shadow-lg transition-all duration-200",
            stats.overdue > 0 && "ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-900/10"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Overdue</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Due Soon</p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.dueSoon}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-200 dark:border-amber-800">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Completion</p>
                  <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{stats.completionRate}%</p>
                </div>
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-200 dark:border-violet-800">
                  <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Filter by category:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(category)}
              className="shadow-sm"
            >
              {category === "all" ? "All Categories" : category}
              {stats?.byCategory[category] && (
                <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-xs">
                  {stats.byCategory[category].completed}/{stats.byCategory[category].total}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Cleaning Areas Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid gap-6 lg:grid-cols-2"
      >
        {Object.entries(
          logs?.reduce((acc, log) => {
            if (!acc[log.area_category]) acc[log.area_category] = [];
            acc[log.area_category].push(log);
            return acc;
          }, {} as Record<string, typeof logs>) || {}
        ).map(([category, categoryLogs]) => (
          <Card key={category} className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
            <CardHeader className={cn(
              "border-b border-border",
              category === "Lifestyle" && "bg-blue-50/50 dark:bg-blue-900/10",
              category === "Mass Gainer" && "bg-purple-50/50 dark:bg-purple-900/10", 
              category === "Main Wall" && "bg-emerald-50/50 dark:bg-emerald-900/10",
              category === "Other" && "bg-gray-50/50 dark:bg-gray-900/10"
            )}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    category === "Lifestyle" && "bg-blue-500",
                    category === "Mass Gainer" && "bg-purple-500",
                    category === "Main Wall" && "bg-emerald-500", 
                    category === "Other" && "bg-gray-500"
                  )} />
                  {category}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {categoryLogs.length} areas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {categoryLogs.map((log, index) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className={cn(
                      "flex items-center justify-between p-4 transition-colors",
                      log.is_completed 
                        ? "bg-emerald-50/50 dark:bg-emerald-900/10" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAreas.has(log._id)}
                        onCheckedChange={() => toggleAreaSelection(log._id)}
                        disabled={log.is_completed}
                        className="border-2"
                      />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{log.area_name}</p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getStatusColor(log))}
                          >
                            {getStatusLabel(log)}
                          </Badge>
                          {log.cleaned_by && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {log.cleaned_by}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {log.is_completed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                          onClick={() => resetArea({ cleaningLogId: log._id })}
                        >
                          <RotateCcw className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={() => deleteArea({ cleaningLogId: log._id })}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Add Area Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cleaning Area</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="area_name">Area Name*</Label>
              <Input
                id="area_name"
                value={newArea.area_name}
                onChange={(e) => setNewArea({ ...newArea, area_name: e.target.value })}
                placeholder="e.g., Display Case"
              />
            </div>

            <div>
              <Label htmlFor="area_category">Category</Label>
              <Select
                value={newArea.area_category}
                onValueChange={(value) => setNewArea({ ...newArea, area_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="Mass Gainer">Mass Gainer</SelectItem>
                  <SelectItem value="Main Wall">Main Wall</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddOpen(false);
              setNewArea({ area_name: "", area_category: "Other" });
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddArea}>
              Add Area
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Helpful Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-800">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Pro Tip</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Uncheck boxes at the beginning of each month, but keep the dates for reference. 
                  Select multiple areas and mark them as cleaned at once for efficiency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}