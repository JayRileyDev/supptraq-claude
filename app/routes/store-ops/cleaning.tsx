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
  Sparkles, 
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  RotateCcw,
  Trash2
} from "lucide-react";
import { cn } from "~/lib/utils";

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
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cleaning Sheet</h1>
          <p className="mt-2 text-gray-600">
            Track store cleaning tasks and schedules
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <Input
              placeholder="Your initials"
              value={userInitials}
              onChange={(e) => setUserInitials(e.target.value.toUpperCase())}
              className="w-24 text-center"
              maxLength={3}
            />
          </div>
          <Button onClick={() => setIsAddOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Area
          </Button>
          <Button 
            onClick={handleMarkCleaned}
            disabled={selectedAreas.size === 0 || !userInitials}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Cleaned ({selectedAreas.size})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Areas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Sparkles className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600 transition-all"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={stats.overdue > 0 ? "ring-2 ring-red-500" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Due Soon</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.dueSoon}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completion</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filter by category:</span>
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(category)}
            >
              {category === "all" ? "All Categories" : category}
              {stats?.byCategory[category] && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {stats.byCategory[category].completed}/{stats.byCategory[category].total}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Cleaning Areas Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(
          logs?.reduce((acc, log) => {
            if (!acc[log.area_category]) acc[log.area_category] = [];
            acc[log.area_category].push(log);
            return acc;
          }, {} as Record<string, typeof logs>) || {}
        ).map(([category, categoryLogs]) => (
          <Card key={category}>
            <CardHeader className={cn("border-b", CATEGORY_COLORS[category] || CATEGORY_COLORS.Other)}>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {categoryLogs.map((log) => (
                  <div
                    key={log._id}
                    className={cn(
                      "flex items-center justify-between p-4 transition-colors",
                      log.is_completed ? "bg-green-50" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAreas.has(log._id)}
                        onCheckedChange={() => toggleAreaSelection(log._id)}
                        disabled={log.is_completed}
                      />
                      <div>
                        <p className="font-medium">{log.area_name}</p>
                        <p className={cn("text-sm", getStatusColor(log))}>
                          {getStatusLabel(log)}
                        </p>
                        {log.cleaned_by && (
                          <p className="text-xs text-gray-500">
                            by {log.cleaned_by}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.is_completed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => resetArea({ cleaningLogId: log._id })}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {(
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteArea({ cleaningLogId: log._id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
              <select
                id="area_category"
                className="w-full rounded-md border border-gray-300 p-2"
                value={newArea.area_category}
                onChange={(e) => setNewArea({ ...newArea, area_category: e.target.value })}
              >
                <option value="Lifestyle">Lifestyle</option>
                <option value="Mass Gainer">Mass Gainer</option>
                <option value="Main Wall">Main Wall</option>
                <option value="Other">Other</option>
              </select>
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

      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          💡 Tip: Uncheck boxes at the beginning of each month, but keep the dates for reference. 
          Select multiple areas and mark them as cleaned at once.
        </p>
      </div>
    </div>
  );
}