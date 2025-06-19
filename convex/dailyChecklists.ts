import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

// Default daily tasks based on the screenshot
const DEFAULT_TASKS = [
  { task_name: "Check Computer Restart Date", task_category: "System", is_required: true },
  { task_name: "Catch Up On FB Chat Texts", task_category: "Communication", is_required: true },
  { task_name: "Check POS Sync Problems", task_category: "System", is_required: true },
  { task_name: "Message Gmail Catch Up", task_category: "Communication", is_required: false },
  { task_name: "Count Store Floats", task_category: "Finance", is_required: false },
  { task_name: "Clean & Face Energy", task_category: "Store Maintenance", is_required: false },
  { task_name: "Check Wall Expiry Dates", task_category: "Inventory", is_required: false },
  { task_name: "Clean & Face Multis", task_category: "Store Maintenance", is_required: false },
  { task_name: "Check In On Staff", task_category: "Team", is_required: false },
  { task_name: "Delivery", task_category: "Operations", is_required: false },
  { task_name: "Count Safe Drop", task_category: "Finance", is_required: false },
  { task_name: "Send EOD Till Sheet", task_category: "Finance", is_required: false },
  { task_name: "Create Staff Tasks For Tomorrow", task_category: "Planning", is_required: false },
  { task_name: "Check Next Day Schedule", task_category: "Planning", is_required: false },
];

export const getWeeklyChecklist = query({
  args: {
    week_start: v.string(), // "2024-01-01" (Monday)
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const checklist = await ctx.db
      .query("daily_checklists")
      .withIndex("by_franchise_week", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("week_start", args.week_start)
      )
      .first();

    // Return null if no checklist exists - frontend will handle creation
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
      .query("daily_checklists")
      .withIndex("by_franchise_week", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("week_start", args.week_start)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new checklist with default tasks
    const checklistId = await ctx.db.insert("daily_checklists", {
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      week_start: args.week_start,
      tasks: DEFAULT_TASKS.map(task => ({
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
      .query("daily_checklists")
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
      is_required: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const checklist = await ctx.db
      .query("daily_checklists")
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
      .query("daily_checklists")
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