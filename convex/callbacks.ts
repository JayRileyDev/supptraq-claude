import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

export const listCallbacks = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("no_answer"),
      v.literal("voicemail"),
      v.literal("contacted"),
      v.literal("in_transfer"),
      v.literal("important"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    let query = ctx.db
      .query("callbacks")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      );

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const callbacks = await query.collect();
    
    // Sort by date_requested descending (newest first), with important ones first
    return callbacks.sort((a, b) => {
      if (a.status === "important" && b.status !== "important") return -1;
      if (a.status !== "important" && b.status === "important") return 1;
      return new Date(b.date_requested).getTime() - new Date(a.date_requested).getTime();
    });
  },
});

export const createCallback = mutation({
  args: {
    staff_member: v.string(),
    item_requested: v.string(),
    flavor: v.optional(v.string()),
    size_servings: v.optional(v.string()),
    quantity: v.optional(v.number()),
    customer_name: v.string(),
    customer_phone: v.string(),
    prepaid: v.boolean(),
    transfer_location: v.optional(v.string()),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const callbackId = await ctx.db.insert("callbacks", {
      ...args,
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      date_requested: new Date().toISOString().split('T')[0],
      status: "pending",
      created_at: Date.now(),
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return callbackId;
  },
});

export const updateCallback = mutation({
  args: {
    callbackId: v.id("callbacks"),
    staff_member: v.optional(v.string()),
    item_requested: v.optional(v.string()),
    flavor: v.optional(v.string()),
    size_servings: v.optional(v.string()),
    quantity: v.optional(v.number()),
    customer_name: v.optional(v.string()),
    customer_phone: v.optional(v.string()),
    prepaid: v.optional(v.boolean()),
    transfer_location: v.optional(v.string()),
    call_date: v.optional(v.string()),
    called_by: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("no_answer"),
      v.literal("voicemail"),
      v.literal("contacted"),
      v.literal("in_transfer"),
      v.literal("important"),
      v.literal("completed")
    )),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.callbackId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Callback not found or access denied");
    }

    const { callbackId, ...updateData } = args;
    
    // If marking as called, set call_date if not provided
    if (updateData.status && 
        ["contacted", "no_answer", "voicemail", "completed"].includes(updateData.status) &&
        !updateData.call_date) {
      updateData.call_date = new Date().toISOString().split('T')[0];
    }
    
    await ctx.db.patch(callbackId, {
      ...updateData,
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return callbackId;
  },
});

export const deleteCallback = mutation({
  args: {
    callbackId: v.id("callbacks"),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.callbackId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Callback not found or access denied");
    }

    await ctx.db.delete(args.callbackId);
    return { success: true };
  },
});

export const getCallbackStats = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const callbacks = await ctx.db
      .query("callbacks")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    const today = new Date().toISOString().split('T')[0];
    const overdueCallbacks = callbacks.filter(cb => 
      cb.status === "pending" && 
      new Date(cb.date_requested) < new Date(today)
    );

    const stats = {
      total: callbacks.length,
      pending: callbacks.filter(c => c.status === "pending").length,
      no_answer: callbacks.filter(c => c.status === "no_answer").length,
      voicemail: callbacks.filter(c => c.status === "voicemail").length,
      contacted: callbacks.filter(c => c.status === "contacted").length,
      in_transfer: callbacks.filter(c => c.status === "in_transfer").length,
      important: callbacks.filter(c => c.status === "important").length,
      completed: callbacks.filter(c => c.status === "completed").length,
      overdue: overdueCallbacks.length,
    };

    return stats;
  },
});