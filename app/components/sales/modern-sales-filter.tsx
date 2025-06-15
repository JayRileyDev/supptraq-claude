"use client"

import * as React from "react"
import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, 
  Store, 
  Users, 
  Search, 
  X, 
  ChevronDown,
  Filter as FilterIcon,
  CalendarDays,
  Check
} from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Badge } from "~/components/ui/badge"
import { Calendar as CalendarComponent } from "~/components/ui/calendar"
import { cn } from "~/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
// Removed Command components - using simpler approach

interface FilterData {
  stores: string[];
  reps: string[];
  totalStores?: number;
  totalReps?: number;
}

interface SalesFilters {
  dateRange: { from: Date | undefined; to?: Date | undefined } | undefined;
  storeId: string;
  salesRepId?: string; // Optional for store-level filters
  searchQuery?: string; // Optional for store-level filters
  includeReturns: boolean;
}

interface ModernSalesFilterProps {
  filters: SalesFilters;
  onFiltersChange: (filters: SalesFilters) => void;
  filterData: FilterData | null;
  isLoading?: boolean;
}


export function ModernSalesFilter({
  filters,
  onFiltersChange,
  filterData,
  isLoading = false
}: ModernSalesFilterProps) {

  // Show limited reps in dropdown for performance
  const filteredReps = useMemo(() => {
    if (!filterData?.reps) return [];
    return filterData.reps.slice(0, 50); // Limit display for performance
  }, [filterData?.reps]);

  // Get selected store name
  const selectedStoreName = useMemo(() => {
    if (filters.storeId === "all") return "All Stores";
    return `Store ${filters.storeId}`;
  }, [filters.storeId]);

  // Only show rep selection if salesRepId is being used (not for store-level filters)
  const showRepSelection = filters.salesRepId !== undefined && filters.searchQuery !== undefined;

  // Calculate active preset to avoid complex inline calculations
  const activePresetDays = useMemo(() => {
    if (!filters.dateRange?.from || !filters.dateRange?.to) return null;
    const diffTime = filters.dateRange.to.getTime() - filters.dateRange.from.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [filters.dateRange]);

  const handleDateRangeChange = useCallback((range: any) => {
    let dateRange;
    if (range?.from) {
      dateRange = {
        from: startOfDay(range.from),
        to: range.to ? endOfDay(range.to) : endOfDay(range.from)
      };
    } else {
      dateRange = undefined;
    }
    onFiltersChange({ ...filters, dateRange });
  }, [filters, onFiltersChange]);

  const handleStoreChange = useCallback((storeId: string) => {
    const newFilters = { 
      ...filters, 
      storeId
    };
    
    // Only reset rep fields if they exist
    if (showRepSelection) {
      newFilters.salesRepId = "all";
      newFilters.searchQuery = "";
    }
    
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange, showRepSelection]);

  const handleRepSelect = useCallback((repName: string) => {
    if (showRepSelection) {
      onFiltersChange({ 
        ...filters, 
        salesRepId: repName,
        searchQuery: ""
      });
    }
  }, [filters, onFiltersChange, showRepSelection]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (showRepSelection) {
      const searchQuery = e.target.value;
      onFiltersChange({ 
        ...filters, 
        searchQuery,
        salesRepId: searchQuery ? "search" : "all"
      });
    }
  }, [filters, onFiltersChange, showRepSelection]);

  const handleSearchClear = useCallback(() => {
    if (showRepSelection) {
      onFiltersChange({ 
        ...filters, 
        searchQuery: "",
        salesRepId: "all"
      });
    }
  }, [filters, onFiltersChange, showRepSelection]);

  const handleIncludeReturnsChange = useCallback((includeReturns: boolean) => {
    // No event object passed from Switch component, so no need for preventDefault
    onFiltersChange({ ...filters, includeReturns });
  }, [filters, onFiltersChange]);


  const handleClearAll = useCallback(() => {
    const clearedFilters: any = {
      dateRange: undefined,
      storeId: "all",
      includeReturns: true
    };
    
    // Only reset rep fields if they exist
    if (showRepSelection) {
      clearedFilters.salesRepId = "all";
      clearedFilters.searchQuery = "";
    }
    
    onFiltersChange(clearedFilters);
  }, [onFiltersChange, showRepSelection]);

  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange) count++;
    if (filters.storeId !== "all") count++;
    if (showRepSelection && (filters.salesRepId !== "all" || filters.searchQuery)) count++;
    if (!filters.includeReturns) count++;
    return count;
  }, [filters, showRepSelection]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-sm border border-border/30 rounded-xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <FilterIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Sales Filters</h3>
            <p className="text-sm text-muted-foreground">
              {filterData?.totalStores || 0} stores • {filterData?.totalReps || 0} reps
            </p>
          </div>
        </div>
        {getActiveFiltersCount > 0 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {getActiveFiltersCount} active
          </Badge>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Date Range Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Range</Label>
          <Select 
            value={activePresetDays?.toString() || "custom"} 
            onValueChange={(value) => {
              if (value === "clear") {
                onFiltersChange({ ...filters, dateRange: undefined });
              } else if (value !== "custom") {
                const days = parseInt(value);
                const today = new Date();
                const startDate = subDays(today, days - 1);
                handleDateRangeChange({ from: startDate, to: today });
              }
            }}
          >
            <SelectTrigger className={cn(
              filters.dateRange && "bg-primary/5 border-primary/20"
            )}>
              <CalendarDays className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select date range">
                {filters.dateRange?.from && filters.dateRange?.to ? (
                  <>
                    {format(filters.dateRange.from, "MMM d")} - {format(filters.dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  "Select date range"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              {filters.dateRange && (
                <SelectItem value="clear">Clear date filter</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Store Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Store</Label>
          <Select value={filters.storeId} onValueChange={handleStoreChange}>
            <SelectTrigger className={cn(
              filters.storeId !== "all" && "bg-primary/5 border-primary/20"
            )}>
              <Store className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select store">
                {selectedStoreName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {filterData?.stores?.map((store) => (
                <SelectItem key={store} value={store}>
                  Store {store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        {/* Returns Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Include Returns</Label>
          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            <Switch
              id="returns-toggle"
              checked={filters.includeReturns}
              onCheckedChange={handleIncludeReturnsChange}
            />
            <Label 
              htmlFor="returns-toggle" 
              className="text-sm cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {filters.includeReturns ? "Including" : "Excluding"} returns
            </Label>
          </div>
        </div>
      </div>


      {/* Active Filters & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getActiveFiltersCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground">Active filters:</span>
              <div className="flex gap-2 flex-wrap">
                {filters.dateRange && (
                  <Badge variant="outline" className="text-xs">
                    {filters.dateRange.to 
                      ? `${format(filters.dateRange.from!, "MMM d")} - ${format(filters.dateRange.to, "MMM d")}`
                      : format(filters.dateRange.from!, "MMM d")
                    }
                  </Badge>
                )}
                {filters.storeId !== "all" && (
                  <Badge variant="outline" className="text-xs">
                    {selectedStoreName}
                  </Badge>
                )}
                {showRepSelection && (filters.salesRepId !== "all" || filters.searchQuery) && (
                  <Badge variant="outline" className="text-xs">
                    {filters.searchQuery ? `"${filters.searchQuery}"` : (filters.salesRepId || "Unknown Rep")}
                  </Badge>
                )}
                {!filters.includeReturns && (
                  <Badge variant="outline" className="text-xs">
                    No returns
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
        
        {getActiveFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Clear all filters
          </Button>
        )}
      </div>
    </motion.div>
  );
}