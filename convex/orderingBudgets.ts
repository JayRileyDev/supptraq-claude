import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

// Default vendors based on the screenshot
const DEFAULT_VENDORS = [
  "Advanced Genetics (Renegade)",
  "Believe",
  "Ballistic",
  "Blue Star Nutraceuticals",
  "Body Energy Club",
  "Canadian Protein",
  "CNP Professional",
  "EHP Labs",
  "Gorilla Mind",
  "HD Muscle",
  "Mammoth",
  "Mutant",
  "North Coast Naturals",
  "Perfect Sports",
  "Progressive",
  "PVL",
  "Revolution",
  "Ryse",
  "TC Nutrition",
];

export const getMonthlyBudgets = query({
  args: {
    startMonth: v.string(), // "2024-01"
    endMonth: v.string(), // "2024-06"
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Get all budget entries in the date range
    const budgets = await ctx.db
      .query("ordering_budgets")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    // Filter by month range
    const filteredBudgets = budgets.filter(b => 
      b.month >= args.startMonth && b.month <= args.endMonth
    );

    // Get all budget targets
    const targets = await ctx.db
      .query("budget_targets")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    // Get list of all vendors (from budgets and targets)
    const vendorSet = new Set([...DEFAULT_VENDORS]);
    filteredBudgets.forEach(b => vendorSet.add(b.vendor_name));
    targets.forEach(t => vendorSet.add(t.vendor_name));
    
    const vendors = Array.from(vendorSet).sort();

    // Generate month list
    const months: string[] = [];
    const start = new Date(args.startMonth + "-01");
    const end = new Date(args.endMonth + "-01");
    
    while (start <= end) {
      months.push(start.toISOString().slice(0, 7));
      start.setMonth(start.getMonth() + 1);
    }

    // Build budget matrix
    const budgetMatrix: Record<string, Record<string, number>> = {};
    vendors.forEach(vendor => {
      budgetMatrix[vendor] = {};
      months.forEach(month => {
        const budget = filteredBudgets.find(
          b => b.vendor_name === vendor && b.month === month
        );
        budgetMatrix[vendor][month] = budget?.amount_spent || 0;
      });
    });

    // Calculate totals
    const monthlyTotals: Record<string, number> = {};
    months.forEach(month => {
      monthlyTotals[month] = vendors.reduce(
        (sum, vendor) => sum + (budgetMatrix[vendor][month] || 0), 
        0
      );
    });

    const vendorTotals: Record<string, number> = {};
    vendors.forEach(vendor => {
      vendorTotals[vendor] = months.reduce(
        (sum, month) => sum + (budgetMatrix[vendor][month] || 0), 
        0
      );
    });

    return {
      vendors,
      months,
      budgetMatrix,
      monthlyTotals,
      vendorTotals,
      targets: targets.reduce((acc, t) => {
        acc[t.vendor_name] = t;
        return acc;
      }, {} as Record<string, typeof targets[0]>),
    };
  },
});

export const updateBudgetEntry = mutation({
  args: {
    vendor_name: v.string(),
    month: v.string(),
    amount_spent: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    // Find existing entry
    const existing = await ctx.db
      .query("ordering_budgets")
      .withIndex("by_franchise_vendor_month", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
          .eq("vendor_name", args.vendor_name)
          .eq("month", args.month)
      )
      .first();

    if (existing) {
      if (args.amount_spent === 0) {
        // Delete if setting to 0
        await ctx.db.delete(existing._id);
      } else {
        // Update existing
        await ctx.db.patch(existing._id, {
          amount_spent: args.amount_spent,
          notes: args.notes,
          updated_by: userContext.userId,
          updated_at: Date.now(),
        });
      }
    } else if (args.amount_spent > 0) {
      // Create new entry only if amount > 0
      await ctx.db.insert("ordering_budgets", {
        orgId: userContext.orgId,
        franchiseId: userContext.franchiseId,
        vendor_name: args.vendor_name,
        month: args.month,
        amount_spent: args.amount_spent,
        notes: args.notes,
        updated_by: userContext.userId,
        updated_at: Date.now(),
      });
    }

    return { success: true };
  },
});

export const upsertBudgetTarget = mutation({
  args: {
    vendor_name: v.string(),
    monthly_budget: v.number(),
    minimum_inventory_target: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    // Find existing target
    const existing = await ctx.db
      .query("budget_targets")
      .withIndex("by_franchise_vendor", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
          .eq("vendor_name", args.vendor_name)
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
      return await ctx.db.insert("budget_targets", data);
    }
  },
});

export const getBudgetSummary = query({
  args: {
    month: v.string(), // Current month
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Get current month's spending
    const currentMonthBudgets = await ctx.db
      .query("ordering_budgets")
      .withIndex("by_franchise_month", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("month", args.month)
      )
      .collect();

    // Get all targets
    const targets = await ctx.db
      .query("budget_targets")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    const totalMonthlyBudget = targets.reduce((sum, t) => sum + t.monthly_budget, 0);
    const totalSpent = currentMonthBudgets.reduce((sum, b) => sum + b.amount_spent, 0);
    const budgetRemaining = totalMonthlyBudget - totalSpent;

    // Calculate vendor-specific summaries
    const vendorSummaries = targets.map(target => {
      const spent = currentMonthBudgets
        .filter(b => b.vendor_name === target.vendor_name)
        .reduce((sum, b) => sum + b.amount_spent, 0);
      
      const remaining = target.monthly_budget - spent;
      const percentUsed = target.monthly_budget > 0 
        ? Math.round((spent / target.monthly_budget) * 100)
        : 0;

      // Calculate suggested order amount to maintain inventory
      let suggestedOrder = 0;
      if (target.minimum_inventory_target && remaining > 0) {
        // Simple calculation: if we're below 50% of budget spent and past mid-month,
        // suggest ordering to reach minimum inventory target
        const today = new Date();
        const dayOfMonth = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const monthProgress = dayOfMonth / daysInMonth;
        
        if (monthProgress > 0.5 && percentUsed < 50) {
          suggestedOrder = Math.min(
            target.minimum_inventory_target,
            remaining
          );
        }
      }

      return {
        vendor_name: target.vendor_name,
        monthly_budget: target.monthly_budget,
        spent,
        remaining,
        percentUsed,
        minimum_inventory_target: target.minimum_inventory_target,
        suggestedOrder,
      };
    });

    return {
      totalMonthlyBudget,
      totalSpent,
      budgetRemaining,
      percentUsed: totalMonthlyBudget > 0 
        ? Math.round((totalSpent / totalMonthlyBudget) * 100)
        : 0,
      vendorSummaries,
    };
  },
});