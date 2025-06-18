import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";
import { createClerkClient } from "@clerk/backend";

// Get all organizations for dropdown
export const getOrganizations = query({
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

// Get franchises for a specific org
export const getFranchisesByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    return await ctx.db
      .query("franchises")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

// Get all franchises with organization and owner details
export const getAllFranchises = query({
  handler: async (ctx) => {
    const franchises = await ctx.db.query("franchises").collect();
    
    // Enrich with organization and owner details
    const enrichedFranchises = await Promise.all(
      franchises.map(async (franchise) => {
        let orgName = null;
        let ownerName = null;
        let ownerEmail = null;
        
        if (franchise.orgId) {
          const org = await ctx.db.get(franchise.orgId);
          orgName = org?.name;
        }
        
        if (franchise.ownerId) {
          const owner = await ctx.db.get(franchise.ownerId);
          ownerName = owner?.name;
          ownerEmail = owner?.email;
        }
        
        return {
          ...franchise,
          orgName,
          ownerName,
          ownerEmail,
        };
      })
    );
    
    return enrichedFranchises;
  },
});

// Create or update user with full access setup
export const createUserProfile = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    role: v.union(v.literal("owner"), v.literal("member")),
    allowedPages: v.optional(v.array(v.string())),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Note: This creates a user profile that will be linked when they sign in
    // The tokenIdentifier will be set when they actually authenticate via Clerk
    
    // Check if user already exists by email
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        orgId: args.orgId,
        franchiseId: args.franchiseId,
        role: args.role,
        allowedPages: args.allowedPages,
      });
      return { success: true, userId: existingUser._id, action: "updated" };
    }

    // Create new user profile
    const tokenIdentifier = args.clerkId 
      ? args.clerkId // Use raw Clerk ID if provided
      : `pending_${Date.now()}_${args.email}`; // Temporary for manual creation

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      tokenIdentifier,
      orgId: args.orgId,
      franchiseId: args.franchiseId,
      role: args.role,
      allowedPages: args.allowedPages,
      createdAt: Date.now(),
    });

    // Auto-create subscription for new user
    const now = Date.now();
    const trialDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    const endDate = now + trialDurationMs;

    await ctx.db.insert("subscriptions", {
      userId: tokenIdentifier, // Use the same tokenIdentifier
      polarId: `admin_trial_${now}`,
      polarPriceId: "trial_pro",
      currency: "USD",
      interval: "month",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      amount: 0,
      startedAt: now,
      metadata: {
        type: "admin_created",
        grantedAt: new Date().toISOString(),
        planType: "pro",
        durationDays: 30,
        createdBy: "admin_dashboard",
      },
    });

    return { success: true, userId, action: "created" };
  },
});

// Create organization (if needed)
export const createOrganization = mutation({
  args: {
    name: v.string(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const orgData: any = {
      name: args.name,
      createdAt: Date.now(),
    };

    // Only add createdBy if provided and valid
    if (args.createdBy) {
      orgData.createdBy = args.createdBy;
    }

    const orgId = await ctx.db.insert("organizations", orgData);

    return { success: true, orgId };
  },
});

// Create franchise
export const createFranchise = mutation({
  args: {
    name: v.string(),
    franchiseId: v.string(),
    orgId: v.id("organizations"),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const franchiseData: any = {
      name: args.name,
      franchiseId: args.franchiseId,
      orgId: args.orgId,
      createdAt: Date.now(),
    };

    // Only add ownerId if provided and valid
    if (args.ownerId) {
      franchiseData.ownerId = args.ownerId;
    }

    const franchiseId = await ctx.db.insert("franchises", franchiseData);

    return { success: true, franchiseId };
  },
});

// List all users for management
export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    // Get org and franchise names for each user
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        let orgName = null;
        let franchiseName = null;
        
        if (user.orgId) {
          const org = await ctx.db.get(user.orgId);
          orgName = org?.name;
        }
        
        if (user.franchiseId) {
          const franchise = await ctx.db.get(user.franchiseId);
          franchiseName = franchise?.name;
        }
        
        return {
          ...user,
          orgName,
          franchiseName,
        };
      })
    );
    
    return enrichedUsers;
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
    role: v.optional(v.union(v.literal("owner"), v.literal("member"))),
    allowedPages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    await ctx.db.patch(userId, updates);
    
    return { success: true };
  },
});

// Link Clerk user to existing profile on first sign-in
export const linkClerkUserToProfile = mutation({
  args: {
    email: v.string(),
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find existing profile by email
    const existingProfile = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingProfile && existingProfile.tokenIdentifier.startsWith("pending_")) {
      // Update the profile with real Clerk token
      await ctx.db.patch(existingProfile._id, {
        tokenIdentifier: args.tokenIdentifier,
        name: args.name || existingProfile.name,
      });

      // Update subscription userId
      const subscription = await ctx.db
        .query("subscriptions")
        .filter((q) => q.eq(q.field("userId"), existingProfile.tokenIdentifier))
        .first();

      if (subscription) {
        await ctx.db.patch(subscription._id, {
          userId: args.tokenIdentifier,
        });
      }

      return existingProfile;
    }

    return null;
  },
});

// Create user and assign to existing franchise (for members)
export const createUserWithExistingFranchise = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    franchiseId: v.id("franchises"),
    role: v.union(v.literal("owner"), v.literal("member")),
    allowedPages: v.optional(v.array(v.string())),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by email
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Get franchise to get orgId
    const franchise = await ctx.db.get(args.franchiseId);
    if (!franchise) {
      throw new Error("Franchise not found");
    }

    // Create user profile
    const tokenIdentifier = args.clerkId 
      ? args.clerkId // Use raw Clerk ID if provided
      : `pending_${Date.now()}_${args.email}`; // Temporary for manual creation

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      tokenIdentifier,
      orgId: franchise.orgId,
      franchiseId: args.franchiseId,
      role: args.role,
      allowedPages: args.allowedPages || [],
      createdAt: Date.now(),
    });

    return {
      userId,
      franchiseId: args.franchiseId,
      orgId: franchise.orgId,
    };
  },
});

// Create user with auto-generated franchise (for owners)
export const createUserWithNewFranchise = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    orgId: v.id("organizations"),
    role: v.union(v.literal("owner"), v.literal("member")),
    allowedPages: v.optional(v.array(v.string())),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by email
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Get organization to create franchise name
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Generate franchise name and ID
    const franchiseName = `${args.name} Franchise`;
    const franchiseIdString = args.name.toLowerCase().replace(/\s+/g, '-') + '-' + org.name.toLowerCase().replace(/\s+/g, '-');

    // Create franchise first
    const franchiseId = await ctx.db.insert("franchises", {
      name: franchiseName,
      franchiseId: franchiseIdString,
      orgId: args.orgId,
      createdAt: Date.now(),
    });

    // Create user profile
    const tokenIdentifier = args.clerkId 
      ? args.clerkId // Use raw Clerk ID if provided
      : `pending_${Date.now()}_${args.email}`; // Temporary for manual creation

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      tokenIdentifier,
      orgId: args.orgId,
      franchiseId,
      role: args.role,
      allowedPages: args.allowedPages,
      createdAt: Date.now(),
    });

    // Update franchise with owner
    await ctx.db.patch(franchiseId, {
      ownerId: userId,
    });

    // Auto-create subscription for new user
    const now = Date.now();
    const trialDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    const endDate = now + trialDurationMs;

    await ctx.db.insert("subscriptions", {
      userId: tokenIdentifier,
      polarId: `admin_trial_${now}`,
      polarPriceId: "trial_pro",
      currency: "USD",
      interval: "month",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      amount: 0,
      startedAt: now,
      metadata: {
        type: "admin_created",
        grantedAt: new Date().toISOString(),
        planType: "pro",
        durationDays: 30,
        createdBy: "admin_dashboard",
      },
    });

    return { success: true, userId, franchiseId };
  },
});

// Update user token identifier (for linking Clerk users)
export const updateUserTokenIdentifier = mutation({
  args: {
    email: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, { email, tokenIdentifier }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      tokenIdentifier,
    });

    // Also update subscription userId
    const subscription = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("userId"), user.tokenIdentifier))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        userId: tokenIdentifier,
      });
    }

    return { success: true };
  },
});

// Edit user
export const editUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("owner"), v.literal("member"))),
    allowedPages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(userId, cleanUpdates);
    
    return { success: true };
  },
});

// Delete user (from both Convex and Clerk)
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Only delete from Clerk if user has been linked (not pending)
    if (user.tokenIdentifier && !user.tokenIdentifier.startsWith("pending_")) {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      try {
        // Extract Clerk user ID from tokenIdentifier (format: "https://...#user_id")
        const clerkUserId = user.tokenIdentifier.split("#").pop() || user.tokenIdentifier;
        console.log("🔍 Attempting to delete Clerk user ID:", clerkUserId);
        
        await clerk.users.deleteUser(clerkUserId);
        console.log("✅ Deleted user from Clerk:", clerkUserId);
      } catch (clerkError: any) {
        console.error("❌ Failed to delete from Clerk:", clerkError.message || clerkError);
        // Continue with Convex deletion even if Clerk fails
      }
    }

    // Delete related data from Convex
    // Delete subscriptions
    const subscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("userId"), user.tokenIdentifier))
      .collect();
    
    for (const subscription of subscriptions) {
      await ctx.db.delete(subscription._id);
    }

    // Delete franchise if user is the owner
    if (user.franchiseId) {
      const franchise = await ctx.db.get(user.franchiseId);
      if (franchise && franchise.ownerId === args.userId) {
        await ctx.db.delete(user.franchiseId);
        console.log("✅ Deleted user's franchise:", franchise.name);
      }
    }

    // Delete user data (inventory, tickets, etc.)
    const userDataTables = [
      "inventory_uploads",
      "inventory_lines", 
      "ticket_history",
      "return_tickets",
      "gift_card_tickets",
      "transfer_logs",
      "dashboard_metrics_cache"
    ];

    for (const tableName of userDataTables) {
      const items = await ctx.db
        .query(tableName as any)
        .filter((q: any) => q.eq(q.field("user_id"), user.tokenIdentifier))
        .collect();
      
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
    }

    // Finally delete the user
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});