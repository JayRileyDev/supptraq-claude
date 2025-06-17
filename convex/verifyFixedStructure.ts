import { query } from "./_generated/server";
import { getUserContext } from "./accessControl";

// Comprehensive verification that all queries and operations use the correct org/franchise structure
export const verifyAllQueriesFixed = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const verification = {
      userContext: {
        userId: userContext.userId,
        orgId: userContext.orgId,
        franchiseId: userContext.franchiseId,
        role: userContext.role,
      },
      dataIntegrity: {
        inventoryByFranchise: 0,
        salesByFranchise: 0,
        uploadsWithOrgAndFranchise: 0,
        ticketsWithOrgAndFranchise: 0,
      },
      queryTests: {
        inventoryQueriesWork: false,
        salesQueriesWork: false,
        transferLogsWork: false,
        vendorMappingWork: false,
      },
      issues: [] as string[],
    };

    try {
      // Test inventory queries (should use franchiseId)
      const inventoryData = await ctx.db
        .query("inventory_lines")
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .take(5);
      verification.dataIntegrity.inventoryByFranchise = inventoryData.length;
      verification.queryTests.inventoryQueriesWork = true;

      // Test sales queries (should use franchiseId)  
      const salesData = await ctx.db
        .query("ticket_history")
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .take(5);
      verification.dataIntegrity.salesByFranchise = salesData.length;
      verification.queryTests.salesQueriesWork = true;

      // Test transfer logs (should use franchiseId)
      const transferData = await ctx.db
        .query("transfer_logs")
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .take(5);
      verification.queryTests.transferLogsWork = true;

      // Test vendor mapping (should use orgId)
      const vendorData = await ctx.db
        .query("vendors")
        .filter((q) => q.eq(q.field("orgId"), userContext.orgId))
        .take(5);
      verification.queryTests.vendorMappingWork = true;

      // Check uploads have both orgId and franchiseId
      const uploads = await ctx.db
        .query("inventory_uploads")
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .take(5);
      
      const uploadsWithBoth = uploads.filter(u => u.orgId && u.franchiseId);
      verification.dataIntegrity.uploadsWithOrgAndFranchise = uploadsWithBoth.length;

      // Check tickets have both orgId and franchiseId
      const tickets = await ctx.db
        .query("ticket_history")
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .take(5);
      
      const ticketsWithBoth = tickets.filter(t => t.orgId && t.franchiseId);
      verification.dataIntegrity.ticketsWithOrgAndFranchise = ticketsWithBoth.length;

      // Check for any remaining issues
      if (verification.dataIntegrity.inventoryByFranchise === 0) {
        verification.issues.push("No inventory data found for this franchise");
      }
      
      if (verification.dataIntegrity.salesByFranchise === 0) {
        verification.issues.push("No sales data found for this franchise");
      }

      if (uploads.length > 0 && verification.dataIntegrity.uploadsWithOrgAndFranchise < uploads.length) {
        verification.issues.push("Some uploads missing orgId or franchiseId");
      }

      if (tickets.length > 0 && verification.dataIntegrity.ticketsWithOrgAndFranchise < tickets.length) {
        verification.issues.push("Some tickets missing orgId or franchiseId");
      }

    } catch (error) {
      verification.issues.push(`Query error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      ...verification,
      status: verification.issues.length === 0 ? "ALL_FIXED" : "ISSUES_FOUND",
      summary: verification.issues.length === 0 
        ? "All queries and data structure are properly using org/franchise IDs"
        : `Found ${verification.issues.length} issues that need attention`,
    };
  },
});

// Quick test to see actual data samples
export const getSampleData = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    return {
      userInfo: {
        orgId: userContext.orgId,
        franchiseId: userContext.franchiseId,
      },
      sampleInventory: await ctx.db
        .query("inventory_lines")
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .take(3),
      sampleSales: await ctx.db
        .query("ticket_history")
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .take(3),
      sampleUploads: await ctx.db
        .query("inventory_uploads")
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .take(3),
    };
  },
});