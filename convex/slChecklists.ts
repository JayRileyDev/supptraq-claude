import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

// Default SL tasks based on the screenshot
export const DEFAULT_SL_TASKS = [
  { task_name: "Catch up on FB chats", task_category: "Communication" },
  { task_name: "Walk store to check what we're missing", task_category: "Inventory" },
  { task_name: "Talk with all staff on shift + plan out day", task_category: "Team Management" },
  { task_name: "Check ticket history to see if staff need training", task_category: "Training" },
  { task_name: "Check inventory management system", task_category: "Inventory" },
  { task_name: "Check Gmails", task_category: "Communication" },
  { task_name: "Send 3 transfers", task_category: "Operations" },
  { task_name: "SL - Training", task_category: "Training" },
  { task_name: "Process Returns", task_category: "Customer Service" },
  { task_name: "Order/Receive products", task_category: "Inventory" },
];

export const getWeeklyChecklist = query({
  args: {
    week_start: v.string(), // "2024-01-01" (Monday)
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const checklist = await ctx.db
      .query("sl_checklists")
      .withIndex("by_franchise_week", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("week_start", args.week_start)
      )
      .first();

    return checklist;
  },
});

export const initializeWeeklyChecklist = mutation({
  args: {
    week_start: v.string(),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Check if already exists
    const existing = await ctx.db
      .query("sl_checklists")
      .withIndex("by_franchise_week", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("week_start", args.week_start)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new checklist with default tasks
    const checklistId = await ctx.db.insert("sl_checklists", {
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      week_start: args.week_start,
      tasks: DEFAULT_SL_TASKS.map(task => ({
        ...task,
        monday: undefined,
        tuesday: undefined,
        wednesday: undefined,
        thursday: undefined,
        friday: undefined,
        saturday: undefined,
        sunday: undefined,
      })),
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return checklistId;
  },
});

export const updateTaskCompletion = mutation({
  args: {
    week_start: v.string(),
    task_index: v.number(),
    day: v.union(
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday")
    ),
    initials: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const checklist = await ctx.db
      .query("sl_checklists")
      .withIndex("by_franchise_week", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("week_start", args.week_start)
      )
      .first();

    if (!checklist) {
      throw new Error("Checklist not found");
    }

    // Update the specific task's day
    const updatedTasks = checklist.tasks.map((task, index) => {
      if (index === args.task_index) {
        return {
          ...task,
          [args.day]: args.initials || undefined,
        };
      }
      return task;
    });

    await ctx.db.patch(checklist._id, {
      tasks: updatedTasks,
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return checklist._id;
  },
});

export const addCustomTask = mutation({
  args: {
    week_start: v.string(),
    task: v.object({
      task_name: v.string(),
      task_category: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const checklist = await ctx.db
      .query("sl_checklists")
      .withIndex("by_franchise_week", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("week_start", args.week_start)
      )
      .first();

    if (!checklist) {
      throw new Error("Checklist not found");
    }

    const newTask = {
      ...args.task,
      monday: undefined,
      tuesday: undefined,
      wednesday: undefined,
      thursday: undefined,
      friday: undefined,
      saturday: undefined,
      sunday: undefined,
    };

    await ctx.db.patch(checklist._id, {
      tasks: [...checklist.tasks, newTask],
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return checklist._id;
  },
});

export const removeTask = mutation({
  args: {
    week_start: v.string(),
    task_index: v.number(),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const checklist = await ctx.db
      .query("sl_checklists")
      .withIndex("by_franchise_week", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("week_start", args.week_start)
      )
      .first();

    if (!checklist) {
      throw new Error("Checklist not found");
    }

    const updatedTasks = checklist.tasks.filter((_, index) => index !== args.task_index);

    await ctx.db.patch(checklist._id, {
      tasks: updatedTasks,
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return checklist._id;
  },
});