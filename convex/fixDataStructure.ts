import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";

// This file contains fixes for all queries, parsers, and uploaders to ensure they work with the new org/franchise structure

// ISSUE SUMMARY FOUND:
// 1. inventoryQueries.ts - Some functions still use user_id instead of franchiseId
// 2. ticketParserFixed.ts - Missing orgId and franchiseId when inserting records  
// 3. Need to check all upload functions for proper orgId/franchiseId insertion
// 4. Need to ensure all queries filter by franchiseId instead of user_id

// Function to verify data structure integrity
export const verifyDataStructure = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const checks = {
      userHasOrgAndFranchise: !!(userContext.orgId && userContext.franchiseId),
      franchiseExists: false,
      orgExists: false,
      dataByFranchise: {},
      dataByUserId: {},
    };

    // Check if franchise and org exist
    if (userContext.franchiseId) {
      const franchise = await ctx.db.get(userContext.franchiseId);
      checks.franchiseExists = !!franchise;
    }

    if (userContext.orgId) {
      const org = await ctx.db.get(userContext.orgId);
      checks.orgExists = !!org;
    }

    // Check data counts by franchise vs user_id
    const tables = [
      "inventory_uploads",
      "inventory_lines", 
      "ticket_history",
      "return_tickets",
      "gift_card_tickets",
      "transfer_logs"
    ];

    for (const table of tables) {
      // Count by franchise
      const byFranchise = await ctx.db
        .query(table as any)
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .collect();

      // Count by user_id (legacy)
      const byUserId = await ctx.db
        .query(table as any)
        .filter((q) => q.eq(q.field("user_id"), userContext.userId))
        .collect();

      (checks.dataByFranchise as any)[table] = byFranchise.length;
      (checks.dataByUserId as any)[table] = byUserId.length;
    }

    return checks;
  },
});

// Test function to see what data is visible with current queries
export const testCurrentQueries = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const results = {
      userContext,
      inventoryCount: 0,
      salesCount: 0,
      uploadsCount: 0,
    };

    // Test inventory query (should match existing query pattern)
    const inventoryData = await ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(10);
    results.inventoryCount = inventoryData.length;

    // Test sales query
    const salesData = await ctx.db
      .query("ticket_history")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(10);
    results.salesCount = salesData.length;

    // Test uploads query
    const uploadsData = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(10);
    results.uploadsCount = uploadsData.length;

    return results;
  },
});