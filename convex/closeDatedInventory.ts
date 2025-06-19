import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

export const listCloseDatedProducts = query({
  args: {
    daysThreshold: v.optional(v.number()), // Filter products expiring within X days
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    let products = await ctx.db
      .query("close_dated_inventory")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    // Calculate days until expiry for each product
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    products = products.map(product => {
      const expiryDate = new Date(product.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...product,
        days_until_expiry: daysUntilExpiry,
      };
    });

    // Filter by days threshold if provided
    if (args.daysThreshold !== undefined) {
      const threshold = args.daysThreshold;
      products = products.filter(p => p.days_until_expiry <= threshold);
    }

    // Sort by expiry date (soonest first)
    return products.sort((a, b) => a.days_until_expiry - b.days_until_expiry);
  },
});

export const addCloseDatedProduct = mutation({
  args: {
    product_name: v.string(),
    flavor: v.optional(v.string()),
    size: v.optional(v.string()),
    quantity: v.number(),
    expiry_date: v.string(), // "2024-01-31"
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);

    // Calculate days until expiry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(args.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const productId = await ctx.db.insert("close_dated_inventory", {
      ...args,
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      days_until_expiry: daysUntilExpiry,
      created_at: Date.now(),
      updated_by: userContext.userId,
      updated_at: Date.now(),
    });

    return productId;
  },
});

export const updateCloseDatedProduct = mutation({
  args: {
    productId: v.id("close_dated_inventory"),
    product_name: v.optional(v.string()),
    flavor: v.optional(v.string()),
    size: v.optional(v.string()),
    quantity: v.optional(v.number()),
    expiry_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.productId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Product not found or access denied");
    }

    const { productId, ...updateData } = args;
    
    // Recalculate days until expiry if expiry date is updated
    if (updateData.expiry_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(updateData.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      await ctx.db.patch(productId, {
        ...updateData,
        days_until_expiry: daysUntilExpiry,
        updated_by: userContext.userId,
        updated_at: Date.now(),
      });
    } else {
      await ctx.db.patch(productId, {
        ...updateData,
        updated_by: userContext.userId,
        updated_at: Date.now(),
      });
    }

    return productId;
  },
});

export const deleteCloseDatedProduct = mutation({
  args: {
    productId: v.id("close_dated_inventory"),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const existing = await ctx.db.get(args.productId);
    if (!existing || existing.franchiseId !== userContext.franchiseId) {
      throw new Error("Product not found or access denied");
    }

    await ctx.db.delete(args.productId);
    return { success: true };
  },
});

export const getExpiryStats = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const products = await ctx.db
      .query("close_dated_inventory")
      .withIndex("by_franchise", (q) =>
        q.eq("franchiseId", userContext.franchiseId)
      )
      .collect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expired = 0;
    let expiringThisWeek = 0;
    let expiringThisMonth = 0;
    let expiringInThreeMonths = 0;

    products.forEach(product => {
      const expiryDate = new Date(product.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        expired++;
      } else if (daysUntilExpiry <= 7) {
        expiringThisWeek++;
      } else if (daysUntilExpiry <= 30) {
        expiringThisMonth++;
      } else if (daysUntilExpiry <= 90) {
        expiringInThreeMonths++;
      }
    });

    return {
      total: products.length,
      expired,
      expiringThisWeek,
      expiringThisMonth,
      expiringInThreeMonths,
    };
  },
});