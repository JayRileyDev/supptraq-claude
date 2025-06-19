import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

// Default cleaning areas based on the screenshot
export const DEFAULT_AREAS = [
  { area_name: "Lifestyle Wall - Top Shelves", area_category: "Lifestyle" },
  { area_name: "Lifestyle Wall - Middle Shelves", area_category: "Lifestyle" },
  { area_name: "Lifestyle Wall - Bottom Shelves", area_category: "Lifestyle" },
  { area_name: "Lifestyle Wall - Windows", area_category: "Lifestyle" },
  { area_name: "Mass Gainer Wall - Top Shelves", area_category: "Mass Gainer" },
  { area_name: "Mass Gainer Wall - Middle Shelves", area_category: "Mass Gainer" },
  { area_name: "Mass Gainer Wall - Bottom Shelves", area_category: "Mass Gainer" },
  { area_name: "Main Wall - Proteins", area_category: "Main Wall" },
  { area_name: "Main Wall - Pre-Workouts", area_category: "Main Wall" },
  { area_name: "Main Wall - Aminos", area_category: "Main Wall" },
  { area_name: "Main Wall - Creatine", area_category: "Main Wall" },
  { area_name: "Front Counter", area_category: "Other" },
  { area_name: "Bathroom", area_category: "Other" },
  { area_name: "Back Room", area_category: "Other" },
  { area_name: "Windows - Front", area_category: "Other" },
  { area_name: "Windows - Side", area_category: "Other" },
];

export const listCleaningLogs = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    let query = ctx.db
      .query("cleaning_logs")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      );

    const logs = await query.collect();
    
    // Filter by category if specified
    let filteredLogs = logs;
    if (args.category) {
      filteredLogs = logs.filter(log => log.area_category === args.category);
    }

    // Sort by last cleaned date (oldest first) and completion status
    return filteredLogs.sort((a, b) => {
      // Incomplete items first
      if (!a.is_completed && b.is_completed) return -1;
      if (a.is_completed && !b.is_completed) return 1;
      
      // Then by last cleaned date (oldest first)
      if (!a.last_cleaned_date && b.last_cleaned_date) return -1;
      if (a.last_cleaned_date && !b.last_cleaned_date) return 1;
      if (a.last_cleaned_date && b.last_cleaned_date) {
        return new Date(a.last_cleaned_date).getTime() - new Date(b.last_cleaned_date).getTime();
      }
      
      return 0;
    });
  },
});

export const initializeCleaningAreas = mutation({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Check if areas already exist
    const existingAreas = await ctx.db
      .query("cleaning_logs")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    if (existingAreas.length > 0) {
      return { message: "Areas already initialized" };
    }

    // Create default areas
    const promises = DEFAULT_AREAS.map(area => 
      ctx.db.insert("cleaning_logs", {
        ...area,
        orgId: userContext.orgId,
        franchiseId: userContext.franchiseId,
        is_completed: false,
        updated_at: Date.now(),
      })
    );

    await Promise.all(promises);
    return { message: "Areas initialized successfully" };
  },
});

export const markAreaCleaned = mutation({
  args: {
    cleaningLogId: v.id("cleaning_logs"),
    cleaned_by: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.cleaningLogId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Cleaning log not found or access denied");
    }

    const today = new Date().toISOString().split('T')[0];
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 7); // Default to weekly cleaning

    await ctx.db.patch(args.cleaningLogId, {
      last_cleaned_date: today,
      cleaned_by: args.cleaned_by,
      next_due_date: nextDueDate.toISOString().split('T')[0],
      is_completed: true,
      notes: args.notes,
      updated_at: Date.now(),
    });

    return args.cleaningLogId;
  },
});

export const resetArea = mutation({
  args: {
    cleaningLogId: v.id("cleaning_logs"),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.cleaningLogId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Cleaning log not found or access denied");
    }

    await ctx.db.patch(args.cleaningLogId, {
      is_completed: false,
      updated_at: Date.now(),
    });

    return args.cleaningLogId;
  },
});

export const addCustomArea = mutation({
  args: {
    area_name: v.string(),
    area_category: v.string(),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const areaId = await ctx.db.insert("cleaning_logs", {
      ...args,
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      is_completed: false,
      updated_at: Date.now(),
    });

    return areaId;
  },
});

export const deleteArea = mutation({
  args: {
    cleaningLogId: v.id("cleaning_logs"),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.cleaningLogId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Cleaning log not found or access denied");
    }

    await ctx.db.delete(args.cleaningLogId);
    return { success: true };
  },
});

export const getCleaningStats = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const logs = await ctx.db
      .query("cleaning_logs")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    let total = logs.length;
    let completed = 0;
    let overdue = 0;
    let dueSoon = 0;

    logs.forEach(log => {
      if (log.is_completed) {
        completed++;
      }
      
      if (log.next_due_date) {
        const dueDate = new Date(log.next_due_date);
        if (dueDate < today) {
          overdue++;
        } else if (dueDate <= sevenDaysAgo) {
          dueSoon++;
        }
      } else if (!log.last_cleaned_date) {
        overdue++; // Never cleaned counts as overdue
      }
    });

    // Category breakdown
    const byCategory: Record<string, { total: number; completed: number }> = {};
    logs.forEach(log => {
      if (!byCategory[log.area_category]) {
        byCategory[log.area_category] = { total: 0, completed: 0 };
      }
      byCategory[log.area_category].total++;
      if (log.is_completed) {
        byCategory[log.area_category].completed++;
      }
    });

    return {
      total,
      completed,
      overdue,
      dueSoon,
      byCategory,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
});