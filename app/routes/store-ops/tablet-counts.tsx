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
  Star,
  StarOff,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  Filter,
  Edit,
  MapPin,
  TrendingUp,
  Activity
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";

const DEFAULT_LOCATIONS = ["Main Wall", "SK Merch", "Lifestyle", "Mass Gainer", "Back Stock"];

export default function TabletCounts() {
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCount, setEditingCount] = useState<any>(null);
  
  const counts = useQuery(api.tabletCounts.listTabletCounts, 
    locationFilter === "all" ? {} : { location: locationFilter }
  );
  const stats = useQuery(api.tabletCounts.getCountStats);
  const locations = useQuery(api.tabletCounts.getLocations);
  const upsertCount = useMutation(api.tabletCounts.upsertTabletCount);
  const updateCountOnly = useMutation(api.tabletCounts.updateCountOnly);
  const togglePriority = useMutation(api.tabletCounts.togglePriority);
  const deleteCount = useMutation(api.tabletCounts.deleteTabletCount);

  const [formData, setFormData] = useState({
    brand_name: "",
    count: "",
    location: "",
    notes: "",
    priority: false,
  });

  const [quickCount, setQuickCount] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    if (!formData.brand_name) return;

    await upsertCount({
      brand_name: formData.brand_name,
      count: formData.count ? parseInt(formData.count) : undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
      priority: formData.priority,
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleQuickUpdate = async (tabletCountId: Id<"tablet_counts">, count: string) => {
    if (!count) return;
    
    await updateCountOnly({
      tabletCountId,
      count: parseInt(count),
    });
    
    setQuickCount(prev => ({ ...prev, [tabletCountId]: "" }));
  };

  const resetForm = () => {
    setFormData({
      brand_name: "",
      count: "",
      location: "",
      notes: "",
      priority: false,
    });
  };

  const getDaysAgo = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCountColor = (daysAgo: number | null) => {
    if (daysAgo === null) return "text-red-600 bg-red-50";
    if (daysAgo > 30) return "text-red-600 bg-red-50";
    if (daysAgo > 7) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getCountLabel = (daysAgo: number | null) => {
    if (daysAgo === null) return "Never counted";
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    if (daysAgo <= 7) return `${daysAgo} days ago`;
    if (daysAgo <= 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return `${Math.floor(daysAgo / 30)} months ago`;
  };

  const allLocations = [...new Set([...DEFAULT_LOCATIONS, ...(locations || [])])];

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
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tablet Counts</h1>
              <p className="text-muted-foreground">
                Track inventory counts by brand and location
              </p>
            </div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:grid-cols-3 lg:grid-cols-6"
        >
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Total Brands</p>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-800">
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-0 shadow-sm hover:shadow-lg transition-all duration-200",
            stats.neverCounted > 0 && "ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-900/10"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Never Counted</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.neverCounted}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-0 shadow-sm hover:shadow-lg transition-all duration-200",
            stats.overdue > 0 && "ring-2 ring-orange-500/20 bg-orange-50/50 dark:bg-orange-900/10"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Overdue</p>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.overdue}</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-200 dark:border-orange-800">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
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
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Recent</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.recent}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Priority</p>
                  <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{stats.priority}</p>
                </div>
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-200 dark:border-violet-800">
                  <Star className="h-4 w-4 text-violet-600 dark:text-violet-400" />
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
          <span className="text-sm font-medium text-foreground">Filter by location:</span>
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-64 border-0 bg-background shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {allLocations.map(location => (
              <SelectItem key={location} value={location}>
                <div className="flex items-center justify-between w-full">
                  <span>{location}</span>
                  {stats?.byLocation[location] && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {stats.byLocation[location]}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Brand Counts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Brand Inventory Counts</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {counts?.length || 0} brands
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 text-left font-semibold text-foreground">Brand</th>
                    <th className="p-3 text-left font-semibold text-foreground">Location</th>
                    <th className="p-3 text-left font-semibold text-foreground">Last Count</th>
                    <th className="p-3 text-left font-semibold text-foreground">Counted By</th>
                    <th className="p-3 text-center font-semibold text-foreground">Priority</th>
                    <th className="p-3 text-center font-semibold text-foreground">Quick Count</th>
                    <th className="p-3 text-left font-semibold text-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                {counts?.map((count, index) => {
                  const daysAgo = getDaysAgo(count.last_counted_date);
                  return (
                    <tr key={count._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {count.brand_name[0]}
                          </div>
                          <p className="font-medium text-foreground">{count.brand_name}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {count.location ? (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {count.location}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No location</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <Badge variant="secondary" className={cn("text-xs", getCountColor(daysAgo))}>
                            {getCountLabel(daysAgo)}
                          </Badge>
                          {count.count !== undefined && (
                            <p className="text-sm font-medium text-foreground">Count: {count.count}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">
                          {count.last_counted_by || "Not counted"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                          onClick={() => togglePriority({ tabletCountId: count._id })}
                        >
                          {count.priority ? (
                            <Star className="h-4 w-4 text-violet-600 fill-violet-600" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Count"
                            className="w-20 h-8 text-sm border-0 bg-muted/50 focus:bg-background transition-colors"
                            value={quickCount[count._id] || ""}
                            onChange={(e) => setQuickCount(prev => ({
                              ...prev,
                              [count._id]: e.target.value
                            }))}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleQuickUpdate(count._id, quickCount[count._id] || "");
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => handleQuickUpdate(count._id, quickCount[count._id] || "")}
                            disabled={!quickCount[count._id]}
                          >
                            Update
                          </Button>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {count.notes || "No notes"}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {counts?.length === 0 && (
              <div className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No brands found {locationFilter !== "all" && `for ${locationFilter}`}
                </p>
              </div>
            )}
          </div>

          {/* Status Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded bg-red-100 border border-red-200 dark:bg-red-900/30" />
              <span className="text-muted-foreground">Overdue (30+ days)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded bg-yellow-100 border border-yellow-200 dark:bg-yellow-900/30" />
              <span className="text-muted-foreground">Due (7-30 days)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded bg-green-100 border border-green-200 dark:bg-green-900/30" />
              <span className="text-muted-foreground">Recent (&lt;7 days)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="brand_name">Brand Name*</Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                placeholder="e.g., Optimum Nutrition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {allLocations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="count">Initial Count</Label>
                <Input
                  id="count"
                  type="number"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Any special notes..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="priority"
                checked={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="priority" className="cursor-pointer">
                Mark as priority
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Add Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}