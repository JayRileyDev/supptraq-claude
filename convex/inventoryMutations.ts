import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

export const updateInventoryLine = mutation({
  args: { 
    lineId: v.string(),
    updates: v.object({
      transfer_in_qty: v.optional(v.number()),
      transfer_out_qty: v.optional(v.number()),
      suggested_reorder_qty: v.optional(v.number())
    })
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const { lineId, updates } = args;
    
    // Convert string ID to Convex ID type
    const id = lineId as any;
    
    // Get the existing line to verify it exists and belongs to user's franchise
    const existingLine = await ctx.db.get(id);
    if (!existingLine) {
      throw new Error("Inventory line not found");
    }
    
    // Type guard to check if this is an inventory line with franchiseId
    if ('franchiseId' in existingLine && existingLine.franchiseId !== userContext.franchiseId) {
      throw new Error("Access denied: Inventory line belongs to different franchise");
    }
    
    // Update only the provided fields
    await ctx.db.patch(id, updates);
    
    return { success: true };
  },
});

export const deleteInventoryLinesBatch = mutation({
  args: { 
    uploadId: v.string()
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const { uploadId } = args;
    
    // Verify the upload exists and belongs to the user's franchise
    const upload = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("_id"), uploadId))
      .first();
      
    if (!upload || upload.franchiseId !== userContext.franchiseId) {
      throw new Error("Upload not found or access denied");
    }
    
    // Delete a small batch of inventory lines
    const batch = await ctx.db
      .query("inventory_lines")
      .withIndex("by_upload", (q) => q.eq("upload_id", uploadId))
      .take(100);
    
    for (const line of batch) {
      await ctx.db.delete(line._id);
    }
    
    return { 
      deletedCount: batch.length,
      hasMore: batch.length === 100
    };
  },
});

export const deleteTransferLogsBatch = mutation({
  args: { 
    uploadId: v.string()
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const { uploadId } = args;
    
    // Verify the upload exists and belongs to the user's franchise
    const upload = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("_id"), uploadId))
      .first();
      
    if (!upload || upload.franchiseId !== userContext.franchiseId) {
      throw new Error("Upload not found or access denied");
    }
    
    // Delete a small batch of transfer logs
    const batch = await ctx.db
      .query("transfer_logs")
      .withIndex("by_upload", (q) => q.eq("upload_id", uploadId))
      .take(100);
    
    for (const log of batch) {
      await ctx.db.delete(log._id);
    }
    
    return { 
      deletedCount: batch.length,
      hasMore: batch.length === 100
    };
  },
});

export const deleteUploadRecord = mutation({
  args: { 
    uploadId: v.string()
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const { uploadId } = args;
    
    // Verify the upload exists and belongs to the user's franchise
    const upload = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("_id"), uploadId))
      .first();
      
    if (!upload || upload.franchiseId !== userContext.franchiseId) {
      throw new Error("Upload not found or access denied");
    }
    
    // Delete the upload record itself
    await ctx.db.delete(uploadId as any);
    
    return { success: true };
  },
});

export const createTransferLog = mutation({
  args: {
    uploadId: v.string(),
    itemNumber: v.string(),
    productName: v.string(),
    fromStoreId: v.string(),
    toStoreId: v.string(),
    qty: v.number(),
    primaryVendor: v.string(),
    boxQty: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Verify the upload exists and belongs to the user's franchise
    const upload = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("_id"), args.uploadId))
      .first();
      
    if (!upload || upload.franchiseId !== userContext.franchiseId) {
      throw new Error("Upload not found or access denied");
    }
    
    // Create the new transfer log
    const transferLogId = await ctx.db.insert("transfer_logs", {
      upload_id: args.uploadId,
      user_id: userContext.userId,
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      item_number: args.itemNumber,
      product_name: args.productName,
      from_store_id: args.fromStoreId,
      to_store_id: args.toStoreId,
      qty: args.qty,
      primary_vendor: args.primaryVendor,
      box_qty: args.boxQty || false
    });
    
    return { success: true, transferLogId };
  },
});

export const updateTransferLog = mutation({
  args: {
    transferLogId: v.string(),
    updates: v.object({
      fromStoreId: v.optional(v.string()),
      toStoreId: v.optional(v.string()),
      qty: v.optional(v.number())
    })
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const transferLogId = args.transferLogId as any;
    
    // Get the existing transfer log to verify it exists and belongs to user's franchise
    const existingLog = await ctx.db.get(transferLogId);
    if (!existingLog) {
      throw new Error("Transfer log not found");
    }
    
    // Type guard to check if this is a transfer log with franchiseId
    if ('franchiseId' in existingLog && existingLog.franchiseId !== userContext.franchiseId) {
      throw new Error("Access denied: Transfer log belongs to different franchise");
    }
    
    // Build update object with proper field names
    const updateFields: any = {};
    if (args.updates.fromStoreId !== undefined) {
      updateFields.from_store_id = args.updates.fromStoreId;
    }
    if (args.updates.toStoreId !== undefined) {
      updateFields.to_store_id = args.updates.toStoreId;
    }
    if (args.updates.qty !== undefined) {
      updateFields.qty = args.updates.qty;
    }
    
    // Update the transfer log
    await ctx.db.patch(transferLogId, updateFields);
    
    return { success: true };
  },
});

export const deleteTransferLog = mutation({
  args: {
    transferLogId: v.string()
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const transferLogId = args.transferLogId as any;
    
    // Get the existing transfer log to verify it exists and belongs to user's franchise
    const existingLog = await ctx.db.get(transferLogId);
    if (!existingLog) {
      throw new Error("Transfer log not found");
    }
    
    // Type guard to check if this is a transfer log with franchiseId
    if ('franchiseId' in existingLog && existingLog.franchiseId !== userContext.franchiseId) {
      throw new Error("Access denied: Transfer log belongs to different franchise");
    }
    
    // Delete the transfer log
    await ctx.db.delete(transferLogId);
    
    return { success: true, deletedLog: existingLog };
  },
});

export const recalculateInventoryQuantities = mutation({
  args: {
    uploadId: v.string(),
    itemNumber: v.optional(v.string()),
    storeId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Verify the upload exists and belongs to the user's franchise
    const upload = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("_id"), args.uploadId))
      .first();
      
    if (!upload || upload.franchiseId !== userContext.franchiseId) {
      throw new Error("Upload not found or access denied");
    }
    
    // Get transfer logs for this upload
    let transferQuery = ctx.db
      .query("transfer_logs")
      .filter((q) => q.eq(q.field("upload_id"), args.uploadId))
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId));
    
    if (args.itemNumber) {
      transferQuery = transferQuery.filter((q) => q.eq(q.field("item_number"), args.itemNumber));
    }
    
    const transferLogs = await transferQuery.take(1000);
    
    // Get inventory lines to update
    let inventoryQuery = ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("upload_id"), args.uploadId))
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId));
    
    if (args.itemNumber) {
      inventoryQuery = inventoryQuery.filter((q) => q.eq(q.field("item_number"), args.itemNumber));
    }
    
    if (args.storeId) {
      inventoryQuery = inventoryQuery.filter((q) => q.eq(q.field("store_id"), args.storeId));
    }
    
    const inventoryLines = await inventoryQuery.take(1000);
    
    // Get SKU vendor map for box qty detection
    const skuVendorMap = await ctx.db
      .query("sku_vendor_map")
      .filter((q) => q.eq(q.field("orgId"), userContext.orgId))
      .take(5000);
    
    // Create SKU map for box qty lookup
    const skuMap = new Map(skuVendorMap.map(item => [item.item_number, {
      retail_price: item.retail_price || 0,
      description: item.description || ''
    }]));
    
    // Helper function to check if item is box qty
    const isBoxQtyItem = (itemNumber: string): boolean => {
      const sku = skuMap.get(itemNumber);
      return sku ? sku.retail_price >= 1.99 && sku.retail_price <= 7.99 : false;
    };
    
    // Calculate intelligent reorder quantities
    const calculateReorderQuantity = (line: any, transferInQty: number, transferOutQty: number): number => {
      const HEALTHY_BUFFER = 2;
      const DEFAULT_REORDER = 2;
      const BOX_QTY_SIZE = 12;
      
      const box_qty = isBoxQtyItem(line.item_number);
      const projected_on_hand = line.qty_on_hand + transferInQty - transferOutQty;
      const healthy_level = line.qty_sold + HEALTHY_BUFFER;
      
      let suggested_reorder_qty = 0;
      
      if (box_qty) {
        // Box qty ordering logic - work at box level (12 units = 1 box)
        const qtySoldBoxes = Math.ceil(line.qty_sold / BOX_QTY_SIZE);
        const projectedOnHandBoxes = Math.floor(projected_on_hand / BOX_QTY_SIZE);
        const healthyLevelBoxes = qtySoldBoxes + Math.ceil(HEALTHY_BUFFER / BOX_QTY_SIZE);
        
        // Special case: if qty_sold = 0 and projected_on_hand = 0, order 24 (2 boxes)
        if (line.qty_sold === 0 && projected_on_hand === 0) {
          suggested_reorder_qty = 24; // 2 boxes
        }
        // If projected on hand is less than what was sold, order to reach healthy level
        else if (projectedOnHandBoxes < qtySoldBoxes) {
          const boxesNeeded = qtySoldBoxes - projectedOnHandBoxes + 1; // +1 for buffer
          suggested_reorder_qty = boxesNeeded * BOX_QTY_SIZE;
        }
        // If projected on hand is already at healthy level, no reorder
        else if (projectedOnHandBoxes >= healthyLevelBoxes) {
          suggested_reorder_qty = 0;
        }
        // Otherwise order to reach healthy level
        else {
          const boxesNeeded = healthyLevelBoxes - projectedOnHandBoxes;
          suggested_reorder_qty = boxesNeeded * BOX_QTY_SIZE;
        }
        
        // Always order in multiples of 12 for box qty items
        suggested_reorder_qty = Math.ceil(suggested_reorder_qty / BOX_QTY_SIZE) * BOX_QTY_SIZE;
      } else {
        // Regular item ordering logic
        if (projected_on_hand >= healthy_level) {
          // Healthy, no reorder
          suggested_reorder_qty = 0;
        } else if (projected_on_hand < line.qty_sold) {
          // Still understocked after transfers
          suggested_reorder_qty = healthy_level - projected_on_hand;
        } else {
          // Between qty_sold and healthy level
          suggested_reorder_qty = healthy_level - projected_on_hand;
        }
        
        // Special cases for regular items
        if (line.qty_sold === 1 && projected_on_hand === 1) {
          suggested_reorder_qty = 1;
        }
        if (line.qty_sold === 0 && projected_on_hand === 0) {
          suggested_reorder_qty = DEFAULT_REORDER;
        }
        
        // On-hand order model: order at least 50% more if on-hand is low
        if (line.qty_on_hand > 0 && projected_on_hand < healthy_level) {
          suggested_reorder_qty = Math.max(suggested_reorder_qty, Math.ceil(line.qty_on_hand * 0.5));
        }
        
        // Cap reorder to not exceed what's needed
        suggested_reorder_qty = Math.max(0, Math.min(suggested_reorder_qty, healthy_level - projected_on_hand));
      }
      
      return suggested_reorder_qty;
    };
    
    // Calculate new transfer quantities and reorder quantities for each inventory line
    const updatedLines = [];
    
    for (const line of inventoryLines) {
      // Calculate transfer in quantity (transfers TO this store)
      const transfersIn = transferLogs.filter(log => 
        log.to_store_id === line.store_id && log.item_number === line.item_number
      );
      const transferInQty = transfersIn.reduce((sum, log) => sum + log.qty, 0);
      
      // Calculate transfer out quantity (transfers FROM this store)
      const transfersOut = transferLogs.filter(log => 
        log.from_store_id === line.store_id && log.item_number === line.item_number
      );
      const transferOutQty = transfersOut.reduce((sum, log) => sum + log.qty, 0);
      
      // Calculate intelligent reorder quantity
      const newReorderQty = calculateReorderQuantity(line, transferInQty, transferOutQty);
      
      // Update flags
      const flag_transfer = transferInQty > 0;
      const flag_reorder = newReorderQty > 0;
      
      // Update the inventory line with new transfer quantities and reorder quantity
      await ctx.db.patch(line._id, {
        transfer_in_qty: transferInQty,
        transfer_out_qty: transferOutQty,
        suggested_reorder_qty: newReorderQty,
        flag_transfer,
        flag_reorder
      });
      
      updatedLines.push({
        itemNumber: line.item_number,
        storeId: line.store_id,
        transferInQty,
        transferOutQty,
        newReorderQty,
        projectedOnHand: line.qty_on_hand + transferInQty - transferOutQty
      });
    }
    
    return { 
      success: true, 
      updatedLines,
      message: `Updated ${updatedLines.length} inventory lines with intelligent reorder calculations`
    };
  },
});