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
  MapPin
} from "lucide-react";
import { cn } from "~/lib/utils";

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
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tablet Counts</h1>
          <p className="mt-2 text-gray-600">
            Track inventory counts by brand and location
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Brands</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className={stats.neverCounted > 0 ? "ring-2 ring-red-500" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Never Counted</p>
                  <p className="text-xl font-bold text-red-600">{stats.neverCounted}</p>
                </div>
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={stats.overdue > 0 ? "ring-2 ring-orange-500" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Overdue</p>
                  <p className="text-xl font-bold text-orange-600">{stats.overdue}</p>
                </div>
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Due Soon</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.dueSoon}</p>
                </div>
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Recent</p>
                  <p className="text-xl font-bold text-green-600">{stats.recent}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Priority</p>
                  <p className="text-xl font-bold text-purple-600">{stats.priority}</p>
                </div>
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filter by location:</span>
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {allLocations.map(location => (
              <SelectItem key={location} value={location}>
                {location}
                {stats?.byLocation[location] && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({stats.byLocation[location]})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Counts List */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Counts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Brand</th>
                  <th className="p-2 text-left">Location</th>
                  <th className="p-2 text-left">Last Count</th>
                  <th className="p-2 text-left">Counted By</th>
                  <th className="p-2 text-center">Priority</th>
                  <th className="p-2 text-center">Quick Count</th>
                  <th className="p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {counts?.map((count) => {
                  const daysAgo = getDaysAgo(count.last_counted_date);
                  return (
                    <tr key={count._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <p className="font-medium">{count.brand_name}</p>
                      </td>
                      <td className="p-2">
                        {count.location && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {count.location}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        <div>
                          <Badge className={cn("text-xs", getCountColor(daysAgo))}>
                            {getCountLabel(daysAgo)}
                          </Badge>
                          {count.count !== undefined && (
                            <p className="mt-1 text-sm font-medium">Count: {count.count}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-sm text-gray-500">
                        {count.last_counted_by || "-"}
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => togglePriority({ tabletCountId: count._id })}
                        >
                          {count.priority ? (
                            <Star className="h-4 w-4 text-purple-600 fill-purple-600" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            placeholder="Count"
                            className="w-20 h-8 text-sm"
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
                            className="h-8"
                            onClick={() => handleQuickUpdate(count._id, quickCount[count._id] || "")}
                            disabled={!quickCount[count._id]}
                          >
                            Update
                          </Button>
                        </div>
                      </td>
                      <td className="p-2">
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {count.notes || "-"}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {counts?.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No brands found {locationFilter !== "all" && `for ${locationFilter}`}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-red-50 border border-red-200" />
                <span>Overdue (30+ days)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-yellow-50 border border-yellow-200" />
                <span>Due (7-30 days)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-50 border border-green-200" />
                <span>Recent (&lt;7 days)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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