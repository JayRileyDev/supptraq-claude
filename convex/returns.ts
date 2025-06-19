import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

export const listReturns = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("rejected")
    )),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    let query = ctx.db
      .query("returns")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      );

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const returns = await query.collect();
    
    // Sort by date_submitted descending (newest first)
    return returns.sort((a, b) => 
      new Date(b.date_submitted).getTime() - new Date(a.date_submitted).getTime()
    );
  },
});

export const createReturn = mutation({
  args: {
    staff_member: v.string(),
    customer_name: v.optional(v.string()),
    customer_phone: v.optional(v.string()),
    vendor: v.string(),
    product_name: v.string(),
    size: v.optional(v.string()),
    quantity: v.optional(v.number()),
    expiry_date: v.optional(v.string()),
    lot_number: v.optional(v.string()),
    reason_for_return: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const returnId = await ctx.db.insert("returns", {
      ...args,
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      date_submitted: new Date().toISOString().split('T')[0],
      status: "pending",
      created_at: Date.now(),
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return returnId;
  },
});

export const updateReturn = mutation({
  args: {
    returnId: v.id("returns"),
    staff_member: v.optional(v.string()),
    customer_name: v.optional(v.string()),
    customer_phone: v.optional(v.string()),
    vendor: v.optional(v.string()),
    product_name: v.optional(v.string()),
    size: v.optional(v.string()),
    quantity: v.optional(v.number()),
    expiry_date: v.optional(v.string()),
    lot_number: v.optional(v.string()),
    reason_for_return: v.optional(v.string()),
    last_follow_up: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("rejected")
    )),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.returnId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Return not found or access denied");
    }

    const { returnId, ...updateData } = args;
    
    await ctx.db.patch(returnId, {
      ...updateData,
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return returnId;
  },
});

export const deleteReturn = mutation({
  args: {
    returnId: v.id("returns"),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.returnId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Return not found or access denied");
    }

    await ctx.db.delete(args.returnId);
    return { success: true };
  },
});

export const getReturnStats = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const returns = await ctx.db
      .query("returns")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    const stats = {
      total: returns.length,
      pending: returns.filter(r => r.status === "pending").length,
      in_progress: returns.filter(r => r.status === "in_progress").length,
      completed: returns.filter(r => r.status === "completed").length,
      rejected: returns.filter(r => r.status === "rejected").length,
    };

    return stats;
  },
});