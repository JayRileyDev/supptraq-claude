import { query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

export const getInventoryOverview = query({
  args: { 
    storeId: v.optional(v.string()),
    vendor: v.optional(v.string()),
    uploadId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // MAJOR OPTIMIZATION: Apply filters at database level
    let inventoryQuery = ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId));

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
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // MAJOR OPTIMIZATION: Limit data fetch for filter generation
    const inventoryData = await ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(1000); // Only need sample to get unique values

    // Get uploads with limit
    const uploads = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(100); // Limit uploads

    // Get unique stores from inventory_lines
    const stores = [...new Set(inventoryData.map(item => item.store_id))].sort();
    
    // Get unique vendors from inventory_uploads
    const vendorCodes = [...new Set(uploads.map(upload => upload.primary_vendor))];
    
    // Format uploads with labels (shorter date format)
    const formattedUploads = uploads.map(upload => {
      // Convert date strings to shorter format (e.g., "2024-01-15" -> "Jan 15")
      const formatShortDate = (dateStr: string) => {
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
          });
        } catch {
          // If date parsing fails, just return the original string
          return dateStr;
        }
      };

      const startDate = formatShortDate(upload.window_start);
      const endDate = formatShortDate(upload.window_end);
      
      return {
        id: upload._id,
        vendor: upload.primary_vendor,
        label: `${upload.primary_vendor} – ${startDate} to ${endDate}`
      };
    });

    return {
      stores,
      vendors: vendorCodes.sort(),
      uploads: formattedUploads
    };
  },
});

export const getTransferLogs = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const transfers = await ctx.db
      .query("transfer_logs")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .order("desc")
      .take(20);

    return transfers;
  },
});

export const getInventoryDataForReport = query({
  args: { 
    uploadId: v.string(),
    storeId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    let query = ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .filter((q) => q.eq(q.field("upload_id"), args.uploadId));
    
    if (args.storeId) {
      query = query.filter((q) => q.eq(q.field("store_id"), args.storeId));
    }
    
    const inventoryLines = await query.take(5000); // Limit for performance, paginated on frontend
    
    // Get SKU vendor map for product name lookup (org-scoped, shared across franchise)
    const skuVendorMap = await ctx.db
      .query("sku_vendor_map")
      .filter((q) => q.eq(q.field("orgId"), userContext.orgId))
      .take(5000);
    const skuMap = new Map(skuVendorMap.map(item => [item.item_number, item.description]));
    
    // Get all inventory lines for this franchise to use as fallback for product names
    const allInventoryLines = await ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(10000);
    
    // Create a map of item_number to product_name from all stores
    const productNameMap = new Map();
    allInventoryLines.forEach(line => {
      if (line.product_name && line.product_name.trim()) {
        productNameMap.set(line.item_number, line.product_name);
      }
    });
    
    return {
      inventoryLines: inventoryLines.map(line => {
        // Determine the best product name to use
        let productName = line.product_name;
        
        // If product name is missing or empty, try to find it from other sources
        if (!productName || !productName.trim()) {
          // First try SKU vendor map
          productName = skuMap.get(line.item_number) || '';
          
          // If still empty, try from other stores with same item number
          if (!productName || !productName.trim()) {
            productName = productNameMap.get(line.item_number) || '';
          }
          
          // Last resort - use item number as product name
          if (!productName || !productName.trim()) {
            productName = `Item ${line.item_number}`;
          }
        }
        
        return {
          _id: line._id,
          item_number: line.item_number,
          product_name: productName,
          qty_sold: line.qty_sold,
          qty_on_hand: line.qty_on_hand,
          transfer_in_qty: line.transfer_in_qty,
          transfer_out_qty: line.transfer_out_qty,
          suggested_reorder_qty: line.suggested_reorder_qty
        };
      })
    };
  },
});

export const getTransferLogsForReport = query({
  args: { 
    uploadId: v.string(),
    storeId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    let query = ctx.db
      .query("transfer_logs")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .filter((q) => q.eq(q.field("upload_id"), args.uploadId));
    
    const transferLogs = await query.take(5000);
    
    // Get SKU vendor map for product name lookup (org-scoped)
    const skuVendorMap = await ctx.db
      .query("sku_vendor_map")
      .filter((q) => q.eq(q.field("orgId"), userContext.orgId))
      .take(5000);
    const skuMap = new Map(skuVendorMap.map(item => [item.item_number, item.description]));
    
    // Get all inventory lines for this franchise to use as fallback for product names
    const allInventoryLines = await ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(10000);
    
    // Create a map of item_number to product_name from all stores
    const productNameMap = new Map();
    allInventoryLines.forEach(line => {
      if (line.product_name && line.product_name.trim()) {
        productNameMap.set(line.item_number, line.product_name);
      }
    });
    
    // If storeId is provided, we want transfers both in and out of this store
    const relevantTransfers = args.storeId 
      ? transferLogs.filter(log => 
          log.from_store_id === args.storeId || log.to_store_id === args.storeId
        )
      : transferLogs;
    
    // Group transfers by item_number and store
    const transferMap = new Map();
    
    relevantTransfers.forEach(transfer => {
      const key = `${transfer.item_number}-${args.storeId || 'all'}`;
      
      // Determine the best product name to use
      let productName = transfer.product_name;
      
      // If product name is missing or empty, try to find it from other sources
      if (!productName || !productName.trim()) {
        // First try SKU vendor map
        productName = skuMap.get(transfer.item_number) || '';
        
        // If still empty, try from other stores with same item number
        if (!productName || !productName.trim()) {
          productName = productNameMap.get(transfer.item_number) || '';
        }
        
        // Last resort - use item number as product name
        if (!productName || !productName.trim()) {
          productName = `Item ${transfer.item_number}`;
        }
      }
      
      if (!transferMap.has(key)) {
        transferMap.set(key, {
          item_number: transfer.item_number,
          product_name: productName,
          transfers_in: [],
          transfers_out: []
        });
      }
      
      const item = transferMap.get(key);
      // Update product name if we found a better one
      if (productName && productName.trim() && productName !== `Item ${transfer.item_number}`) {
        item.product_name = productName;
      }
      
      if (args.storeId) {
        // For a specific store view
        if (transfer.to_store_id === args.storeId) {
          item.transfers_in.push({
            from_store: transfer.from_store_id,
            qty: transfer.qty
          });
        }
        if (transfer.from_store_id === args.storeId) {
          item.transfers_out.push({
            to_store: transfer.to_store_id,
            qty: transfer.qty
          });
        }
      } else {
        // For all stores view - we'll need to handle this differently
        // This is complex for a combined view, so we'll return raw data
        return relevantTransfers;
      }
    });
    
    return Array.from(transferMap.values());
  },
});

export const getVendorBrandMapping = query({
  args: { 
    primaryVendor: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Get vendors for this org
    const vendors = await ctx.db
      .query("vendors")
      .filter((q) => q.eq(q.field("orgId"), userContext.orgId))
      .take(200); // Limit for performance
    
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
    uploadId: v.optional(v.string()),
    storeId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Query inventory lines for top sold items
    let inventoryQuery = ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId));
    
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
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId));
    
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
    
    // Get SKU vendor map for this org
    const skuVendorMap = await ctx.db
      .query("sku_vendor_map")
      .filter((q) => q.eq(q.field("orgId"), userContext.orgId))
      .take(5000); // Limit for performance
    const priceMap = new Map(skuVendorMap.map(item => [item.item_number, item.retail_price || 0]));
    
    // Count total transfers from transfer logs
    const transfersOutCount = transferLogs.length;
    
    // Create a map of item_number to product_name for fallback
    const productNameMap = new Map();
    skuVendorMap.forEach(item => {
      if (item.description && item.description.trim()) {
        productNameMap.set(item.item_number, item.description);
      }
    });
    
    // Also add product names from other inventory lines
    inventoryLines.forEach(line => {
      if (line.product_name && line.product_name.trim()) {
        productNameMap.set(line.item_number, line.product_name);
      }
    });
    
    // Get top 5 sold items (aggregate by item_number across all stores)
    const itemSalesMap = new Map();
    
    inventoryLines.forEach(line => {
      if (line.qty_sold > 0) {
        const key = line.item_number;
        
        // Determine best product name
        let productName = line.product_name;
        if (!productName || !productName.trim()) {
          productName = productNameMap.get(line.item_number) || `Item ${line.item_number}`;
        }
        
        if (itemSalesMap.has(key)) {
          const existing = itemSalesMap.get(key);
          existing.qty_sold += line.qty_sold;
          existing.retail_total += line.qty_sold * (priceMap.get(line.item_number) || 0);
          // Update product name if we found a better one
          if (productName && productName.trim() && productName !== `Item ${line.item_number}`) {
            existing.product_name = productName;
          }
        } else {
          itemSalesMap.set(key, {
            item_number: line.item_number,
            product_name: productName,
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

export const getTransferLogsForManagement = query({
  args: { 
    uploadId: v.string(),
    storeId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    let query = ctx.db
      .query("transfer_logs")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .filter((q) => q.eq(q.field("upload_id"), args.uploadId));
    
    const transferLogs = await query.take(5000);
    
    // Filter by store if specified (check both from_store_id and to_store_id)
    const relevantTransfers = args.storeId 
      ? transferLogs.filter(log => 
          log.from_store_id === args.storeId || log.to_store_id === args.storeId
        )
      : transferLogs;
    
    return relevantTransfers;
  },
});

export const getAvailableItemsForUpload = query({
  args: { 
    uploadId: v.string(),
    searchTerm: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Get inventory lines for this upload
    let inventoryQuery = ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .filter((q) => q.eq(q.field("upload_id"), args.uploadId));
    
    const inventoryLines = await inventoryQuery.take(5000);
    
    // Get SKU vendor map for product name lookup and vendor info
    const skuVendorMap = await ctx.db
      .query("sku_vendor_map")
      .filter((q) => q.eq(q.field("orgId"), userContext.orgId))
      .take(5000);
    const skuMap = new Map(skuVendorMap.map(item => [item.item_number, {
      description: item.description || '',
      primary_vendor: item.vendor || ''
    }]));
    
    // Get unique items with their best product names and vendors
    const itemsMap = new Map();
    
    inventoryLines.forEach(line => {
      if (!itemsMap.has(line.item_number)) {
        // Determine the best product name and vendor
        let productName = line.product_name;
        let primaryVendor = line.primary_vendor;
        
        // Try to get better info from SKU vendor map
        const skuInfo = skuMap.get(line.item_number);
        if (skuInfo) {
          if (!productName || !productName.trim()) {
            productName = skuInfo.description;
          }
          if (!primaryVendor || !primaryVendor.trim()) {
            primaryVendor = skuInfo.primary_vendor;
          }
        }
        
        // Fallback to item number if still no product name
        if (!productName || !productName.trim()) {
          productName = `Item ${line.item_number}`;
        }
        
        itemsMap.set(line.item_number, {
          item_number: line.item_number,
          product_name: productName,
          primary_vendor: primaryVendor || 'Unknown'
        });
      }
    });
    
    let items = Array.from(itemsMap.values());
    
    // Filter by search term if provided
    if (args.searchTerm && args.searchTerm.trim()) {
      const searchLower = args.searchTerm.toLowerCase().trim();
      items = items.filter(item => 
        item.product_name.toLowerCase().includes(searchLower) ||
        item.item_number.toLowerCase().includes(searchLower) ||
        item.primary_vendor.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by product name (prioritizing product name matches) and limit results
    return items
      .sort((a, b) => {
        // If there's a search term, prioritize product name matches
        if (args.searchTerm && args.searchTerm.trim()) {
          const searchLower = args.searchTerm.toLowerCase().trim();
          const aProductMatch = a.product_name.toLowerCase().includes(searchLower);
          const bProductMatch = b.product_name.toLowerCase().includes(searchLower);
          
          if (aProductMatch && !bProductMatch) return -1;
          if (!aProductMatch && bProductMatch) return 1;
        }
        
        // Then sort by product name alphabetically
        return a.product_name.localeCompare(b.product_name);
      })
      .slice(0, 50); // Limit to 50 results for performance
  },
});