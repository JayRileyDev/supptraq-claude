import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

export const getMonthlyAverages = query({
  args: {
    month: v.string(), // "2024-01"
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const averages = await ctx.db
      .query("rep_averages")
      .withIndex("by_franchise_month", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("month", args.month)
      )
      .collect();

    return averages;
  },
});

export const upsertRepAverage = mutation({
  args: {
    month: v.string(),
    rep_name: v.string(),
    daily_averages: v.array(v.object({
      date: v.number(),
      amount: v.optional(v.number()),
      shifts: v.optional(v.number()),
    })),
    monthly_average: v.optional(v.number()),
    monthly_shifts: v.optional(v.number()),
    commission_level: v.optional(v.union(
      v.literal(125),
      v.literal(199),
      v.literal(299)
    )),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    // Calculate monthly average and shifts from daily data
    let totalAmount = 0;
    let totalShifts = 0;
    let daysWorked = 0;

    args.daily_averages.forEach(day => {
      if (day.amount && day.amount > 0) {
        totalAmount += day.amount;
        daysWorked++;
      }
      if (day.shifts) {
        totalShifts += day.shifts;
      }
    });

    const monthlyAverage = daysWorked > 0 ? totalAmount / daysWorked : 0;

    // Find existing record
    const existing = await ctx.db
      .query("rep_averages")
      .withIndex("by_franchise_rep", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("rep_name", args.rep_name)
      )
      .filter((q) => q.eq(q.field("month"), args.month))
      .first();

    const data = {
      ...args,
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      monthly_average: monthlyAverage,
      monthly_shifts: totalShifts,
      updated_by: userContext.userId,
      updated_at: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("rep_averages", data);
    }
  },
});

export const getAllReps = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Get unique rep names from the rep_averages table
    const averages = await ctx.db
      .query("rep_averages")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    const repNames = [...new Set(averages.map(avg => avg.rep_name))];
    return repNames.sort();
  },
});