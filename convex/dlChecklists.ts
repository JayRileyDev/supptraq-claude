import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

// Default DL categories and tasks based on the screenshot
const DEFAULT_DL_CATEGORIES = [
  {
    category_name: "Housekeeping",
    tasks: [
      { task_name: "Floors clean" },
      { task_name: "Shelves dusted" },
      { task_name: "Windows cleaned" },
      { task_name: "Bathroom spotless" },
      { task_name: "Back room organized" },
    ]
  },
  {
    category_name: "Finance",
    tasks: [
      { task_name: "Till balanced" },
      { task_name: "Safe counted" },
      { task_name: "Deposits made" },
      { task_name: "Receiving matched" },
      { task_name: "Float correct" },
    ]
  },
  {
    category_name: "Operations",
    tasks: [
      { task_name: "Schedule posted" },
      { task_name: "Transfers completed" },
      { task_name: "Returns processed" },
      { task_name: "Inventory counts done" },
      { task_name: "Orders placed on time" },
    ]
  },
  {
    category_name: "Marketing",
    tasks: [
      { task_name: "Social media posts" },
      { task_name: "Promotions updated" },
      { task_name: "Window displays fresh" },
      { task_name: "Price tags correct" },
      { task_name: "Customer feedback reviewed" },
    ]
  }
];

export const getMonthlyChecklist = query({
  args: {
    month: v.string(), // "2024-01"
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const checklist = await ctx.db
      .query("dl_checklists")
      .withIndex("by_franchise_month", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("month", args.month)
      )
      .first();

    return checklist;
  },
});

export const initializeMonthlyChecklist = mutation({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Check if already exists
    const existing = await ctx.db
      .query("dl_checklists")
      .withIndex("by_franchise_month", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("month", args.month)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new checklist with default categories
    const checklistId = await ctx.db.insert("dl_checklists", {
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      month: args.month,
      categories: DEFAULT_DL_CATEGORIES.map(category => ({
        category_name: category.category_name,
        tasks: category.tasks.map(task => ({
          task_name: task.task_name,
          completed_dates: [],
        })),
      })),
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return checklistId;
  },
});

export const toggleTaskCompletion = mutation({
  args: {
    month: v.string(),
    category_index: v.number(),
    task_index: v.number(),
    date: v.string(), // "2024-01-15"
    completed_by: v.string(),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const checklist = await ctx.db
      .query("dl_checklists")
      .withIndex("by_franchise_month", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("month", args.month)
      )
      .first();

    if (!checklist) {
      throw new Error("Checklist not found");
    }

    // Update the specific task's completion
    const updatedCategories = checklist.categories.map((category, catIndex) => {
      if (catIndex === args.category_index) {
        return {
          ...category,
          tasks: category.tasks.map((task, taskIndex) => {
            if (taskIndex === args.task_index) {
              const existingDateIndex = task.completed_dates.findIndex(
                (cd) => cd.date === args.date
              );
              
              if (existingDateIndex >= 0) {
                // Remove completion if already exists
                return {
                  ...task,
                  completed_dates: task.completed_dates.filter(
                    (_, index) => index !== existingDateIndex
                  ),
                };
              } else {
                // Add completion
                return {
                  ...task,
                  completed_dates: [
                    ...task.completed_dates,
                    {
                      date: args.date,
                      completed_by: args.completed_by,
                    },
                  ],
                };
              }
            }
            return task;
          }),
        };
      }
      return category;
    });

    await ctx.db.patch(checklist._id, {
      categories: updatedCategories,
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return checklist._id;
  },
});

export const addTask = mutation({
  args: {
    month: v.string(),
    category_name: v.string(),
    task_name: v.string(),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const checklist = await ctx.db
      .query("dl_checklists")
      .withIndex("by_franchise_month", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("month", args.month)
      )
      .first();

    if (!checklist) {
      throw new Error("Checklist not found");
    }

    const updatedCategories = checklist.categories.map((category) => {
      if (category.category_name === args.category_name) {
        return {
          ...category,
          tasks: [
            ...category.tasks,
            {
              task_name: args.task_name,
              completed_dates: [],
            },
          ],
        };
      }
      return category;
    });

    await ctx.db.patch(checklist._id, {
      categories: updatedCategories,
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return checklist._id;
  },
});

export const removeTask = mutation({
  args: {
    month: v.string(),
    category_index: v.number(),
    task_index: v.number(),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    const checklist = await ctx.db
      .query("dl_checklists")
      .withIndex("by_franchise_month", (q) =>
        q.eq("franchiseId", userContext.franchiseId).eq("month", args.month)
      )
      .first();

    if (!checklist) {
      throw new Error("Checklist not found");
    }

    const updatedCategories = checklist.categories.map((category, catIndex) => {
      if (catIndex === args.category_index) {
        return {
          ...category,
          tasks: category.tasks.filter((_, taskIndex) => taskIndex !== args.task_index),
        };
      }
      return category;
    });

    await ctx.db.patch(checklist._id, {
      categories: updatedCategories,
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return checklist._id;
  },
});