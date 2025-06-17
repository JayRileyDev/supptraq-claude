import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Batch update function - processes one table at a time with pagination
export const updateTableFranchiseIds = mutation({
  args: {
    franchiseId: v.id("franchises"),
    tableName: v.union(
      v.literal("inventory_uploads"),
      v.literal("ticket_uploads"),
      v.literal("dashboard_metrics_cache"),
      v.literal("inventory_lines"),
      v.literal("transfer_logs"),
      v.literal("ticket_history"),
      v.literal("return_tickets"),
      v.literal("gift_card_tickets")
    ),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { franchiseId, tableName, batchSize = 100 } = args;
    
    console.log(`Updating ${tableName} with franchiseId: ${franchiseId}, batch size: ${batchSize}`);
    
    try {
      // Get records without franchiseId in batches
      const records = await ctx.db
        .query(tableName as any)
        .filter((q) => q.eq(q.field("franchiseId"), undefined))
        .take(batchSize);
      
      let updated = 0;
      for (const record of records) {
        await ctx.db.patch(record._id, { franchiseId });
        updated++;
      }
      
      console.log(`Updated ${updated} records in ${tableName}`);
      
      return {
        success: true,
        tableName,
        updated,
        hasMore: records.length === batchSize,
        message: `Updated ${updated} records in ${tableName}${records.length === batchSize ? ' (more records remain)' : ' (complete)'}`,
      };

    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      return {
        success: false,
        tableName,
        updated: 0,
        hasMore: false,
        message: `Failed to update ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

// Simple function to update all tables (you'll need to run this multiple times)
export const updateAllTablesInBatches = mutation({
  args: {
    franchiseId: v.id("franchises"),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { franchiseId, batchSize = 4000 } = args;
    
    const tables = [
      "inventory_uploads",
      "ticket_uploads", 
      "dashboard_metrics_cache",
      "inventory_lines",
      "transfer_logs",
      "ticket_history",
      "return_tickets",
      "gift_card_tickets"
    ] as const;
    
    const results = [];
    
    for (const tableName of tables) {
      try {
        // Process records per table with specified batch size
        const records = await ctx.db
          .query(tableName as any)
          .filter((q) => q.eq(q.field("franchiseId"), undefined))
          .take(batchSize);
        
        let updated = 0;
        for (const record of records) {
          await ctx.db.patch(record._id, { franchiseId });
          updated++;
        }
        
        results.push({
          tableName,
          updated,
          hasMore: records.length === batchSize,
        });
        
      } catch (error) {
        results.push({
          tableName,
          updated: 0,
          hasMore: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
    const hasMoreWork = results.some(r => r.hasMore);
    
    return {
      success: true,
      results,
      totalUpdated,
      hasMoreWork,
      batchSize,
      message: `Updated ${totalUpdated} records (batch size: ${batchSize}). ${hasMoreWork ? 'More records remain - run again.' : 'All records processed.'}`,
    };
  },
});

// Function to update orgId for all tables that need it
export const updateAllTablesWithOrgId = mutation({
  args: {
    orgId: v.id("organizations"),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { orgId, batchSize = 500 } = args;
    
    const tables = [
      "users",
      "inventory_uploads",
      "ticket_uploads", 
      "dashboard_metrics_cache",
      "inventory_lines",
      "transfer_logs",
      "vendors",
      "sales_reps",
      "sku_vendor_map",
      "brands",
      "ticket_history",
      "return_tickets",
      "gift_card_tickets"
    ] as const;
    
    const results = [];
    
    for (const tableName of tables) {
      try {
        // Process records per table with specified batch size
        const records = await ctx.db
          .query(tableName as any)
          .filter((q) => q.eq(q.field("orgId"), undefined))
          .take(batchSize);
        
        let updated = 0;
        for (const record of records) {
          await ctx.db.patch(record._id, { orgId });
          updated++;
        }
        
        results.push({
          tableName,
          updated,
          hasMore: records.length === batchSize,
        });
        
      } catch (error) {
        results.push({
          tableName,
          updated: 0,
          hasMore: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
    const hasMoreWork = results.some(r => r.hasMore);
    
    return {
      success: true,
      results,
      totalUpdated,
      hasMoreWork,
      batchSize,
      message: `Updated ${totalUpdated} records with orgId (batch size: ${batchSize}). ${hasMoreWork ? 'More records remain - run again.' : 'All records processed.'}`,
    };
  },
});

// Helper function to check how many records need updating (dry run)
export const countRecordsNeedingFranchiseId = mutation({
  handler: async (ctx) => {
    const counts = {
      inventory_uploads: 0,
      ticket_uploads: 0,
      dashboard_metrics_cache: 0,
      inventory_lines: 0,
      transfer_logs: 0,
      ticket_history: 0,
      return_tickets: 0,
      gift_card_tickets: 0,
    };

    // Count records without franchiseId in each table
    counts.inventory_uploads = (await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("franchiseId"), undefined))
      .collect()).length;

    counts.ticket_uploads = (await ctx.db
      .query("ticket_uploads")
      .filter((q) => q.eq(q.field("franchiseId"), undefined))
      .collect()).length;

    counts.dashboard_metrics_cache = (await ctx.db
      .query("dashboard_metrics_cache")
      .filter((q) => q.eq(q.field("franchiseId"), undefined))
      .collect()).length;

    counts.inventory_lines = (await ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("franchiseId"), undefined))
      .collect()).length;

    counts.transfer_logs = (await ctx.db
      .query("transfer_logs")
      .filter((q) => q.eq(q.field("franchiseId"), undefined))
      .collect()).length;

    counts.ticket_history = (await ctx.db
      .query("ticket_history")
      .filter((q) => q.eq(q.field("franchiseId"), undefined))
      .collect()).length;

    counts.return_tickets = (await ctx.db
      .query("return_tickets")
      .filter((q) => q.eq(q.field("franchiseId"), undefined))
      .collect()).length;

    counts.gift_card_tickets = (await ctx.db
      .query("gift_card_tickets")
      .filter((q) => q.eq(q.field("franchiseId"), undefined))
      .collect()).length;

    const totalNeedingUpdate = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return {
      counts,
      totalNeedingUpdate,
      message: `Found ${totalNeedingUpdate} records that need franchiseId updates`,
    };
  },
});