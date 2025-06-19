import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

export const getStoreProfile = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const profile = await ctx.db
      .query("store_profiles")
      .withIndex("by_org_franchise", (q) =>
        q.eq("orgId", userContext.orgId).eq("franchiseId", userContext.franchiseId)
      )
      .first();

    return profile;
  },
});

export const upsertStoreProfile = mutation({
  args: {
    store_name: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    wifi_password: v.optional(v.string()),
    lockbox_code: v.optional(v.string()),
    landlord_name: v.optional(v.string()),
    landlord_phone: v.optional(v.string()),
    landlord_email: v.optional(v.string()),
    store_lead: v.optional(v.string()),
    district_manager: v.optional(v.string()),
    regional_manager: v.optional(v.string()),
    pos_credentials: v.optional(v.object({
      username: v.optional(v.string()),
      password: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
    other_info: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const existing = await ctx.db
      .query("store_profiles")
      .withIndex("by_org_franchise", (q) =>
        q.eq("orgId", userContext.orgId).eq("franchiseId", userContext.franchiseId)
      )
      .first();

    const data = {
      ...args,
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      updated_by: userContext.userId,
      updated_at: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("store_profiles", data);
    }
  },
});