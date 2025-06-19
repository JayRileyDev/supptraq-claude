import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

export const listTabletCounts = query({
  args: {
    location: v.optional(v.string()),
    priority: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    let query = ctx.db
      .query("tablet_counts")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      );

    const counts = await query.collect();
    
    // Filter by location if specified
    let filteredCounts = counts;
    if (args.location) {
      filteredCounts = counts.filter(c => c.location === args.location);
    }
    
    // Filter by priority if specified
    if (args.priority !== undefined) {
      filteredCounts = filteredCounts.filter(c => c.priority === args.priority);
    }

    // Sort by last counted date (oldest first) and priority
    return filteredCounts.sort((a, b) => {
      // Priority items first
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      
      // Then by last counted date (oldest first)
      if (!a.last_counted_date && b.last_counted_date) return -1;
      if (a.last_counted_date && !b.last_counted_date) return 1;
      if (a.last_counted_date && b.last_counted_date) {
        return new Date(a.last_counted_date).getTime() - new Date(b.last_counted_date).getTime();
      }
      
      // Finally by brand name
      return a.brand_name.localeCompare(b.brand_name);
    });
  },
});

export const upsertTabletCount = mutation({
  args: {
    brand_name: v.string(),
    count: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    priority: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    // Find existing count for this brand
    const existing = await ctx.db
      .query("tablet_counts")
      .withIndex("by_franchise_brand", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("brand_name", args.brand_name)
      )
      .first();

    const data = {
      ...args,
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      last_counted_date: new Date().toISOString().split('T')[0],
      last_counted_by: userContext.userId,
      priority: args.priority || false,
      updated_at: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("tablet_counts", data);
    }
  },
});

export const updateCountOnly = mutation({
  args: {
    tabletCountId: v.id("tablet_counts"),
    count: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.tabletCountId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Tablet count not found or access denied");
    }

    await ctx.db.patch(args.tabletCountId, {
      count: args.count,
      notes: args.notes,
      last_counted_date: new Date().toISOString().split('T')[0],
      last_counted_by: userContext.userId,
      updated_at: Date.now(),
    });

    return args.tabletCountId;
  },
});

export const togglePriority = mutation({
  args: {
    tabletCountId: v.id("tablet_counts"),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.tabletCountId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Tablet count not found or access denied");
    }

    await ctx.db.patch(args.tabletCountId, {
      priority: !existing.priority,
      updated_at: Date.now(),
    });

    return args.tabletCountId;
  },
});

export const deleteTabletCount = mutation({
  args: {
    tabletCountId: v.id("tablet_counts"),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.tabletCountId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Tablet count not found or access denied");
    }

    await ctx.db.delete(args.tabletCountId);
    return { success: true };
  },
});

export const getCountStats = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const counts = await ctx.db
      .query("tablet_counts")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    let neverCounted = 0;
    let overdue = 0; // Not counted in 30+ days
    let dueSoon = 0; // Not counted in 7-30 days
    let recent = 0; // Counted in last 7 days
    let priority = 0;

    counts.forEach(count => {
      if (count.priority) priority++;
      
      if (!count.last_counted_date) {
        neverCounted++;
      } else {
        const lastCounted = new Date(count.last_counted_date);
        if (lastCounted < thirtyDaysAgo) {
          overdue++;
        } else if (lastCounted < sevenDaysAgo) {
          dueSoon++;
        } else {
          recent++;
        }
      }
    });

    // Get location breakdown
    const locationCounts: Record<string, number> = {};
    counts.forEach(count => {
      const location = count.location || "Unassigned";
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    return {
      total: counts.length,
      neverCounted,
      overdue,
      dueSoon,
      recent,
      priority,
      byLocation: locationCounts,
    };
  },
});

// Get all unique locations
export const getLocations = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const counts = await ctx.db
      .query("tablet_counts")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    const locations = new Set<string>();
    counts.forEach(count => {
      if (count.location) {
        locations.add(count.location);
      }
    });

    return Array.from(locations).sort();
  },
});