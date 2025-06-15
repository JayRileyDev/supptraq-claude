import { query } from "./_generated/server";
import { v } from "convex/values";

export const getInventoryOverview = query({
  args: { 
    userId: v.string(),
    storeId: v.optional(v.string()),
    vendor: v.optional(v.string()),
    uploadId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // MAJOR OPTIMIZATION: Apply filters at database level
    let inventoryQuery = ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("user_id"), args.userId));

    // Apply store filter at query level
    if (args.storeId && args.storeId !== "all") {
      inventoryQuery = inventoryQuery.filter((q) => q.eq(q.field("store_id"), args.storeId));
    }

    // Apply vendor filter at query level
    if (args.vendor && args.vendor !== "all") {
      inventoryQuery = inventoryQuery.filter((q) => q.eq(q.field("primary_vendor"), args.vendor));
    }

    // Apply upload filter at query level
    if (args.uploadId && args.uploadId !== "all") {
      inventoryQuery = inventoryQuery.filter((q) => q.eq(q.field("upload_id"), args.uploadId));
    }

    // MAJOR OPTIMIZATION: Limit data fetch for overview
    const inventoryData = await inventoryQuery.take(2000); // Limit for performance

    // MAJOR OPTIMIZATION: Limit vendor data fetch
    const vendors = await ctx.db.query("vendors").take(200); // Limit vendor lookup
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
    // MAJOR OPTIMIZATION: Limit data fetch for filter generation
    const inventoryData = await ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .take(1000); // Only need sample to get unique values

    // Get uploads with limit
    const uploads = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .take(100); // Limit uploads

    // Get unique stores from inventory_lines
    const stores = [...new Set(inventoryData.map(item => item.store_id))].sort();
    
    // Get unique vendors from inventory_uploads
    const vendorCodes = [...new Set(uploads.map(upload => upload.primary_vendor))];
    
    // Format uploads with labels
    const formattedUploads = uploads.map(upload => ({
      id: upload._id,
      vendor: upload.primary_vendor,
      label: `${upload.primary_vendor} – ${upload.window_start} to ${upload.window_end}`
    }));

    return {
      stores,
      vendors: vendorCodes.sort(),
      uploads: formattedUploads
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

export const getInventoryDataForReport = query({
  args: { 
    userId: v.string(),
    uploadId: v.string(),
    storeId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .filter((q) => q.eq(q.field("upload_id"), args.uploadId));
    
    if (args.storeId) {
      query = query.filter((q) => q.eq(q.field("store_id"), args.storeId));
    }
    
    const inventoryLines = await query.take(5000); // Limit for performance, paginated on frontend
    
    return {
      inventoryLines: inventoryLines.map(line => ({
        _id: line._id,
        item_number: line.item_number,
        product_name: line.product_name,
        qty_sold: line.qty_sold,
        qty_on_hand: line.qty_on_hand,
        transfer_in_qty: line.transfer_in_qty,
        transfer_out_qty: line.transfer_out_qty,
        suggested_reorder_qty: line.suggested_reorder_qty
      }))
    };
  },
});

export const getVendorBrandMapping = query({
  args: { 
    userId: v.string(),
    primaryVendor: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // MAJOR OPTIMIZATION: Limit vendors table fetch
    const vendors = await ctx.db.query("vendors").take(200); // Limit for performance
    
    if (args.primaryVendor) {
      // Find vendor name where vendor_code matches primary_vendor
      const vendorEntry = vendors.find(vendor => 
        vendor.vendor_code === args.primaryVendor
      );
      
      console.log(`Looking for primary_vendor: ${args.primaryVendor}`);
      console.log(`Found vendor entry:`, vendorEntry);
      console.log(`Available vendor_codes:`, vendors.slice(0, 5).map(v => v.vendor_code));
      
      return {
        brandName: vendorEntry?.name || args.primaryVendor,
        vendorCode: args.primaryVendor,
        found: !!vendorEntry
      };
    }
    
    // Return full mapping if no specific vendor requested
    const vendorMapping = new Map();
    vendors.forEach(vendor => {
      if (vendor.vendor_code && vendor.name) {
        vendorMapping.set(vendor.vendor_code, vendor.name);
      }
    });
    
    return Object.fromEntries(vendorMapping);
  },
});

export const getUploadOverview = query({
  args: { 
    userId: v.string(),
    uploadId: v.optional(v.string()),
    storeId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Query inventory lines for top sold items
    let inventoryQuery = ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("user_id"), args.userId));
    
    if (args.uploadId) {
      inventoryQuery = inventoryQuery.filter((q) => q.eq(q.field("upload_id"), args.uploadId));
    }
    
    if (args.storeId) {
      inventoryQuery = inventoryQuery.filter((q) => q.eq(q.field("store_id"), args.storeId));
    }
    
    const inventoryLines = await inventoryQuery.take(3000); // Limit for performance while allowing aggregation
    
    // Query transfer logs for transfer count
    let transferQuery = ctx.db
      .query("transfer_logs")
      .filter((q) => q.eq(q.field("user_id"), args.userId));
    
    if (args.uploadId) {
      transferQuery = transferQuery.filter((q) => q.eq(q.field("upload_id"), args.uploadId));
    }
    
    let transferLogs = await transferQuery.take(1000); // Limit transfer logs for performance
    
    // Filter by store if specified (check both from_store_id and to_store_id)
    if (args.storeId) {
      transferLogs = transferLogs.filter(log => 
        log.from_store_id === args.storeId || log.to_store_id === args.storeId
      );
    }
    
    // MAJOR OPTIMIZATION: Limit SKU vendor map fetch
    const skuVendorMap = await ctx.db.query("sku_vendor_map").take(5000); // Limit for performance
    const priceMap = new Map(skuVendorMap.map(item => [item.item_number, item.retail_price || 0]));
    
    // Count total transfers from transfer logs
    const transfersOutCount = transferLogs.length;
    
    // Get top 5 sold items (aggregate by item_number across all stores)
    const itemSalesMap = new Map();
    
    inventoryLines.forEach(line => {
      if (line.qty_sold > 0) {
        const key = line.item_number;
        if (itemSalesMap.has(key)) {
          const existing = itemSalesMap.get(key);
          existing.qty_sold += line.qty_sold;
          existing.retail_total += line.qty_sold * (priceMap.get(line.item_number) || 0);
        } else {
          itemSalesMap.set(key, {
            item_number: line.item_number,
            product_name: line.product_name,
            qty_sold: line.qty_sold,
            retail_total: line.qty_sold * (priceMap.get(line.item_number) || 0)
          });
        }
      }
    });
    
    const topSoldItems = Array.from(itemSalesMap.values())
      .sort((a, b) => b.qty_sold - a.qty_sold)
      .slice(0, 5);
    
    return {
      transfersOutCount,
      topSoldItems
    };
  },
});