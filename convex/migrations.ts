import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateFranchiseId } from "./accessControl";
import type { Id } from "./_generated/dataModel";

/**
 * CRITICAL MIGRATION: Convert existing users to multi-tenant structure
 * This ensures existing users maintain full access to their data
 */
export const migrateToMultiTenant = mutation({
  handler: async (ctx) => {
    console.log("🚀 Starting multi-tenant migration...");

    // Step 1: Create Supplement King organization
    let supplementKingOrg = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), "Supplement King"))
      .first();

    if (!supplementKingOrg) {
      // Find first user to be the org creator
      const firstUser = await ctx.db.query("users").first();
      if (!firstUser) {
        throw new Error("No users found to create organization");
      }

      const orgId = await ctx.db.insert("organizations", {
        name: "Supplement King",
        createdBy: firstUser._id,
        createdAt: Date.now(),
      });

      supplementKingOrg = await ctx.db.get(orgId);
      console.log("✅ Created Supplement King organization");
    }

    if (!supplementKingOrg) {
      throw new Error("Failed to create organization");
    }

    // Step 2: Create franchises for all existing users and convert them to owners
    const allUsers = await ctx.db.query("users").collect();
    console.log(`📊 Found ${allUsers.length} users to migrate`);

    const userFranchiseMap = new Map();

    for (const user of allUsers) {
      // Skip if already migrated
      if (user.orgId && user.franchiseId && user.role) {
        console.log(`⏩ User ${user.name} already migrated`);
        continue;
      }

      // Generate unique franchise ID string for this user
      const franchiseIdString = generateFranchiseId(
        user.name || user.email || "user", 
        "Supplement King"
      );

      // Create franchise for this user
      const franchiseId = await ctx.db.insert("franchises", {
        name: `${user.name || "User"} Group`,
        franchiseId: franchiseIdString,
        orgId: supplementKingOrg._id,
        ownerId: user._id,
        createdAt: Date.now(),
      });

      // Update user with org and franchise info
      await ctx.db.patch(user._id, {
        orgId: supplementKingOrg._id,
        franchiseId,
        role: "owner" as const, // All existing users become owners
        allowedPages: [], // Owners don't need explicit permissions
        createdAt: user.createdAt || Date.now(),
      });

      userFranchiseMap.set(user._id, {
        orgId: supplementKingOrg._id,
        franchiseId
      });

      console.log(`✅ Migrated user ${user.name} with franchise: ${franchiseIdString}`);
    }

    // Step 3: Migrate franchise-scoped data tables
    await migrateFranchiseScopedTables(ctx, userFranchiseMap);

    // Step 4: Migrate organization-scoped data tables  
    await migrateOrgScopedTables(ctx, supplementKingOrg._id);

    console.log("🎉 Multi-tenant migration completed successfully!");
    return { 
      success: true, 
      migratedUsers: allUsers.length,
      organizationId: supplementKingOrg._id
    };
  },
});

async function migrateFranchiseScopedTables(
  ctx: any, 
  userFranchiseMap: Map<string, any>
) {
  console.log("📦 Migrating franchise-scoped tables...");

  // Migrate inventory_uploads
  const inventoryUploads = await ctx.db.query("inventory_uploads").collect();
  for (const upload of inventoryUploads) {
    if (!upload.orgId && upload.user_id) {
      const franchiseInfo = userFranchiseMap.get(upload.user_id);
      if (franchiseInfo) {
        await ctx.db.patch(upload._id, franchiseInfo);
      }
    }
  }

  // Migrate ticket_uploads
  const ticketUploads = await ctx.db.query("ticket_uploads").collect();
  for (const upload of ticketUploads) {
    if (!upload.orgId && upload.user_id) {
      const franchiseInfo = userFranchiseMap.get(upload.user_id);
      if (franchiseInfo) {
        await ctx.db.patch(upload._id, franchiseInfo);
      }
    }
  }

  // Migrate dashboard_metrics_cache
  const dashboardMetrics = await ctx.db.query("dashboard_metrics_cache").collect();
  for (const metric of dashboardMetrics) {
    if (!metric.orgId && metric.user_id) {
      const franchiseInfo = userFranchiseMap.get(metric.user_id);
      if (franchiseInfo) {
        await ctx.db.patch(metric._id, franchiseInfo);
      }
    }
  }

  // Migrate inventory_lines (process in batches for performance)
  await migrateLargeTable(ctx, "inventory_lines", userFranchiseMap);

  // Migrate transfer_logs
  const transferLogs = await ctx.db.query("transfer_logs").collect();
  for (const log of transferLogs) {
    if (!log.orgId && log.user_id) {
      const franchiseInfo = userFranchiseMap.get(log.user_id);
      if (franchiseInfo) {
        await ctx.db.patch(log._id, franchiseInfo);
      }
    }
  }

  // Migrate ticket tables
  await migrateLargeTable(ctx, "ticket_history", userFranchiseMap);
  await migrateLargeTable(ctx, "return_tickets", userFranchiseMap);
  await migrateLargeTable(ctx, "gift_card_tickets", userFranchiseMap);

  console.log("✅ Franchise-scoped tables migrated");
}

async function migrateOrgScopedTables(ctx: any, orgId: Id<"organizations">) {
  console.log("🏢 Migrating organization-scoped tables...");

  // Migrate vendors
  const vendors = await ctx.db.query("vendors").collect();
  for (const vendor of vendors) {
    if (!vendor.orgId) {
      await ctx.db.patch(vendor._id, { orgId });
    }
  }

  // Migrate sales_reps
  const salesReps = await ctx.db.query("sales_reps").collect();
  for (const rep of salesReps) {
    if (!rep.orgId) {
      await ctx.db.patch(rep._id, { orgId });
    }
  }

  // Migrate sku_vendor_map
  const skuVendorMaps = await ctx.db.query("sku_vendor_map").collect();
  for (const map of skuVendorMaps) {
    if (!map.orgId) {
      await ctx.db.patch(map._id, { orgId });
    }
  }

  // Migrate brands
  const brands = await ctx.db.query("brands").collect();
  for (const brand of brands) {
    if (!brand.orgId) {
      await ctx.db.patch(brand._id, { orgId });
    }
  }

  console.log("✅ Organization-scoped tables migrated");
}

async function migrateLargeTable(
  ctx: any, 
  tableName: string, 
  userFranchiseMap: Map<string, any>
) {
  console.log(`🔄 Migrating ${tableName}...`);
  
  const batchSize = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await ctx.db.query(tableName).paginate({ 
      cursor: null, 
      numItems: batchSize 
    });
    
    for (const record of batch.page) {
      if (!record.orgId && record.user_id) {
        const franchiseInfo = userFranchiseMap.get(record.user_id);
        if (franchiseInfo) {
          await ctx.db.patch(record._id, franchiseInfo);
        }
      }
    }

    hasMore = batch.isDone === false;
    offset += batchSize;
    
    if (offset % 500 === 0) {
      console.log(`   📈 Processed ${offset} records in ${tableName}`);
    }
  }
  
  console.log(`✅ Completed ${tableName} migration`);
}

/**
 * Utility to check migration status
 */
export const checkMigrationStatus = mutation({
  handler: async (ctx) => {
    const org = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), "Supplement King"))
      .first();

    const users = await ctx.db.query("users").collect();
    const migratedUsers = users.filter(u => u.orgId && u.franchiseId && u.role);

    return {
      organizationExists: !!org,
      totalUsers: users.length,
      migratedUsers: migratedUsers.length,
      migrationComplete: users.length === migratedUsers.length && !!org,
    };
  },
});

/**
 * Emergency rollback function (use with caution!)
 */
export const rollbackMigration = mutation({
  args: { confirmText: v.string() },
  handler: async (ctx, args) => {
    if (args.confirmText !== "ROLLBACK_MIGRATION") {
      throw new Error("Invalid confirmation text");
    }

    console.log("⚠️  Rolling back migration...");

    // Remove org/franchise fields from users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.patch(user._id, {
        orgId: undefined,
        franchiseId: undefined,
        role: undefined,
        allowedPages: undefined,
      });
    }

    // Remove all franchises
    const franchises = await ctx.db.query("franchises").collect();
    for (const franchise of franchises) {
      await ctx.db.delete(franchise._id);
    }

    // Remove Supplement King organization
    const org = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), "Supplement King"))
      .first();
    
    if (org) {
      await ctx.db.delete(org._id);
    }

    console.log("🔄 Migration rolled back");
    return { success: true };
  },
});