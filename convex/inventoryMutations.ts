import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
    const { lineId, updates } = args;
    
    // Convert string ID to Convex ID type
    const id = lineId as any;
    
    // Get the existing line to verify it exists
    const existingLine = await ctx.db.get(id);
    if (!existingLine) {
      throw new Error("Inventory line not found");
    }
    
    // Update only the provided fields
    await ctx.db.patch(id, updates);
    
    return { success: true };
  },
});

export const deleteInventoryLinesBatch = mutation({
  args: { 
    userId: v.string(),
    uploadId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId, uploadId } = args;
    
    // Verify the upload exists and belongs to the user
    const upload = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("_id"), uploadId))
      .first();
      
    if (!upload || upload.user_id !== userId) {
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
    userId: v.string(),
    uploadId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId, uploadId } = args;
    
    // Verify the upload exists and belongs to the user
    const upload = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("_id"), uploadId))
      .first();
      
    if (!upload || upload.user_id !== userId) {
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
    userId: v.string(),
    uploadId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId, uploadId } = args;
    
    // Verify the upload exists and belongs to the user
    const upload = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("_id"), uploadId))
      .first();
      
    if (!upload || upload.user_id !== userId) {
      throw new Error("Upload not found or access denied");
    }
    
    // Delete the upload record itself
    await ctx.db.delete(uploadId as any);
    
    return { success: true };
  },
});