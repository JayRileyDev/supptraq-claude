import { query } from "./_generated/server";
import { v } from "convex/values";

export const getInventoryOverview = query({
  args: { 
    userId: v.string(),
    storeId: v.optional(v.string()),
    vendor: v.optional(v.string()),
    stockLevel: v.optional(v.string()), // "low", "out", "overstock", "normal"
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let inventoryQuery = ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("user_id"), args.userId));

    let inventoryData = await inventoryQuery.collect();

    // Apply filters
    if (args.storeId && args.storeId !== "all") {
      inventoryData = inventoryData.filter(item => item.store_id === args.storeId);
    }

    if (args.vendor && args.vendor !== "all") {
      inventoryData = inventoryData.filter(item => item.primary_vendor === args.vendor);
    }

    if (args.stockLevel && args.stockLevel !== "all") {
      inventoryData = inventoryData.filter(item => {
        switch (args.stockLevel) {
          case "low":
            return item.qty_on_hand <= 5 && item.qty_on_hand > 0;
          case "out":
            return item.qty_on_hand === 0;
          case "overstock":
            return item.qty_on_hand > 50; // Assuming 50+ is overstock
          case "normal":
            return item.qty_on_hand > 5 && item.qty_on_hand <= 50;
          default:
            return true;
        }
      });
    }

    if (args.search && args.search.trim() !== "") {
      const searchTerm = args.search.toLowerCase().trim();
      inventoryData = inventoryData.filter(item => 
        item.product_name.toLowerCase().includes(searchTerm) ||
        item.item_number.toLowerCase().includes(searchTerm)
      );
    }

    // Get vendor information
    const vendors = await ctx.db.query("vendors").collect();
    const vendorMap = new Map(vendors.map(v => [v.vendor_code, v.name]));

    // Calculate metrics
    const totalItems = inventoryData.length;
    const totalValue = inventoryData.reduce((sum, item) => sum + (item.qty_on_hand * 10), 0); // Assuming $10 avg cost
    const lowStockItems = inventoryData.filter(item => item.qty_on_hand <= 5 && item.qty_on_hand > 0);
    const outOfStockItems = inventoryData.filter(item => item.qty_on_hand === 0);
    const reorderItems = inventoryData.filter(item => item.flag_reorder);
    const transferItems = inventoryData.filter(item => item.flag_transfer);

    // Store inventory health
    const storeInventory = new Map();
    inventoryData.forEach(item => {
      if (!storeInventory.has(item.store_id)) {
        storeInventory.set(item.store_id, {
          storeId: item.store_id,
          totalItems: 0,
          totalValue: 0,
          lowStock: 0,
          outOfStock: 0
        });
      }
      const store = storeInventory.get(item.store_id);
      store.totalItems += 1;
      store.totalValue += item.qty_on_hand * 10;
      if (item.qty_on_hand <= 5 && item.qty_on_hand > 0) store.lowStock += 1;
      if (item.qty_on_hand === 0) store.outOfStock += 1;
    });

    const storeStats = Array.from(storeInventory.values())
      .sort((a, b) => b.totalValue - a.totalValue);

    // Vendor performance
    const vendorPerformance = new Map();
    inventoryData.forEach(item => {
      if (!vendorPerformance.has(item.primary_vendor)) {
        vendorPerformance.set(item.primary_vendor, {
          vendorCode: item.primary_vendor,
          vendorName: vendorMap.get(item.primary_vendor) || item.primary_vendor,
          totalItems: 0,
          totalValue: 0,
          avgTurnover: 0
        });
      }
      const vendor = vendorPerformance.get(item.primary_vendor);
      vendor.totalItems += 1;
      vendor.totalValue += item.qty_on_hand * 10;
      vendor.avgTurnover += item.qty_sold || 0;
    });

    // Calculate avg turnover
    vendorPerformance.forEach(vendor => {
      vendor.avgTurnover = vendor.totalItems > 0 ? vendor.avgTurnover / vendor.totalItems : 0;
    });

    const vendorStats = Array.from(vendorPerformance.values())
      .sort((a, b) => b.totalValue - a.totalValue);

    return {
      metrics: {
        totalItems,
        totalValue,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        reorderCount: reorderItems.length,
        transferCount: transferItems.length
      },
      storeStats,
      vendorStats,
      lowStockItems: lowStockItems.slice(0, 10),
      reorderSuggestions: reorderItems.slice(0, 10),
      transferSuggestions: transferItems.slice(0, 10),
      inventoryItems: inventoryData.slice(0, 50) // Paginated for performance
    };
  },
});

export const getInventoryFilters = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const inventoryData = await ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .collect();

    const vendors = await ctx.db.query("vendors").collect();
    const vendorMap = new Map(vendors.map(v => [v.vendor_code, v.name]));

    const stores = [...new Set(inventoryData.map(item => item.store_id))].sort();
    const vendorCodes = [...new Set(inventoryData.map(item => item.primary_vendor))];
    
    const vendorsWithNames = vendorCodes.map(code => ({
      code,
      name: vendorMap.get(code) || code
    })).sort((a, b) => a.name.localeCompare(b.name));

    return {
      stores,
      vendors: vendorsWithNames
    };
  },
});

export const getTransferLogs = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const transfers = await ctx.db
      .query("transfer_logs")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .order("desc")
      .take(20);

    return transfers;
  },
});