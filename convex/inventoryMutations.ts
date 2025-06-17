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