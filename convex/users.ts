import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext, generateFranchiseId } from "./accessControl";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { createClerkClient } from "@clerk/backend";

export const findUserByToken = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    // Get the user's identity from the auth context
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Check if we've already stored this identity before
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (user !== null) {
      return user;
    }

    return null;
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    try {
      const userContext = await getUserContext(ctx.auth, ctx.db);
      return await ctx.db.get(userContext.userId);
    } catch {
      return null;
    }
  },
});

export const upsertUser = mutation({
  args: {
    isStoreOps: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Check if user exists by token
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (existingUser) {
      // Update if needed
      const updates: any = {};
      if (existingUser.name !== identity.name) updates.name = identity.name;
      if (existingUser.email !== identity.email) updates.email = identity.email;
      if (args.isStoreOps !== undefined && existingUser.isStoreOps !== args.isStoreOps) {
        updates.isStoreOps = args.isStoreOps;
      }
      
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existingUser._id, updates);
      }
      return existingUser;
    }

    // Check if there's a pre-created profile with this email
    const preCreatedProfile = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (preCreatedProfile && preCreatedProfile.tokenIdentifier.startsWith("pending_")) {
      // Link the Clerk account to the pre-created profile
      await ctx.db.patch(preCreatedProfile._id, {
        tokenIdentifier: identity.subject,
        name: identity.name || preCreatedProfile.name,
        isStoreOps: args.isStoreOps,
      });

      // Update subscription userId if exists
      const subscription = await ctx.db
        .query("subscriptions")
        .filter((q) => q.eq(q.field("userId"), preCreatedProfile.tokenIdentifier))
        .first();

      if (subscription) {
        await ctx.db.patch(subscription._id, {
          userId: identity.subject,
        });
      }

      return await ctx.db.get(preCreatedProfile._id);
    }

    // Create new user (this will show account-pending page since no org/franchise)
    const userId = await ctx.db.insert("users", {
      name: identity.name,
      email: identity.email,
      tokenIdentifier: identity.subject,
      isStoreOps: args.isStoreOps,
      createdAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

// New streamlined setup for Supplement King users
export const setupSupplementKingUser = mutation({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find existing user or create if doesn't exist
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (!user) {
      // Create the user if they don't exist yet
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        name: identity.name,
        email: identity.email,
        tokenIdentifier: identity.subject,
        createdAt: now,
      });

      // Auto-grant 30-day early access for new users
      const trialDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
      const endDate = now + trialDurationMs;

      await ctx.db.insert("subscriptions", {
        userId: identity.subject,
        polarId: `trial_${now}`,
        polarPriceId: "trial_pro",
        currency: "USD",
        interval: "month",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
        amount: 0, // Early access
        startedAt: now,
        metadata: {
          type: "auto_early_access",
          grantedAt: new Date().toISOString(),
          planType: "pro",
          durationDays: 30,
          isEarlyAccess: true,
        },
      });

      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new Error("Failed to create or find user");
    }

    // Check if user already has a subscription, if not create one
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (!existingSubscription) {
      // Auto-grant 30-day early access for users without subscription
      const now = Date.now();
      const trialDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
      const endDate = now + trialDurationMs;

      await ctx.db.insert("subscriptions", {
        userId: identity.subject,
        polarId: `trial_${now}`,
        polarPriceId: "trial_pro",
        currency: "USD",
        interval: "month",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
        amount: 0, // Early access
        startedAt: now,
        metadata: {
          type: "auto_early_access",
          grantedAt: new Date().toISOString(),
          planType: "pro",
          durationDays: 30,
          isEarlyAccess: true,
        },
      });
    }

    // Find or create Supplement King organization
    let org = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), "Supplement King"))
      .first();

    if (!org) {
      // Create the Supplement King organization if it doesn't exist
      const orgId = await ctx.db.insert("organizations", {
        name: "Supplement King",
        createdBy: user._id,
        createdAt: Date.now(),
      });
      org = await ctx.db.get(orgId);
    }
    if (!org) {
      throw new Error("Failed to get Supplement King organization");
    }

    // Use the name from Clerk identity (already includes first + last name)
    const fullName = identity.name || user.name || "User";
    const franchiseIdString = generateFranchiseId(fullName, "Supplement King");

    // Create franchise for this user
    const franchiseId = await ctx.db.insert("franchises", {
      name: `${fullName} - Supplement King`,
      franchiseId: franchiseIdString,
      orgId: org._id,
      ownerId: user._id,
      createdAt: Date.now(),
    });

    // Update user with complete info
    await ctx.db.patch(user._id, {
      name: fullName, // Ensure name is up to date
      orgId: org._id,
      franchiseId,
      role: "owner", // All Supplement King users are owners
      allowedPages: [], // Full access
    });

    return await ctx.db.get(user._id);
  },
});

export const setupUserWithOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    role: v.union(v.literal("owner"), v.literal("member")),
    allowedPages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get organization details
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Generate franchise ID string for this user
    const franchiseIdString = generateFranchiseId(user.name || "user", org.name);

    // Create franchise for this user
    const franchiseId = await ctx.db.insert("franchises", {
      name: `${user.name || "User"} Group`,
      franchiseId: franchiseIdString,
      orgId: args.orgId,
      ownerId: user._id,
      createdAt: Date.now(),
    });

    // Update user with org/franchise info
    await ctx.db.patch(user._id, {
      orgId: args.orgId,
      franchiseId,
      role: args.role,
      allowedPages: args.allowedPages || [],
    });

    return await ctx.db.get(user._id);
  },
});

export const getOrganizations = query({
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

// Find or create the main Supplement King organization
export const getSupplementKingOrganization = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if Supplement King organization already exists
    const existingOrg = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), "Supplement King"))
      .first();

    if (existingOrg) {
      return existingOrg;
    }

    // Create the Supplement King organization if it doesn't exist
    const orgId = await ctx.db.insert("organizations", {
      name: "Supplement King",
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return await ctx.db.get(orgId);
  },
});

export const createOrganization = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return await ctx.db.get(orgId);
  },
});

export const getTeamMembers = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Only owners can view team members
    if (userContext.role !== "owner") {
      throw new Error("Access denied: Only owners can view team members");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", userContext.orgId))
      .collect();
  },
});

export const updateMemberPermissions = mutation({
  args: {
    userId: v.id("users"),
    allowedPages: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Only owners can update permissions
    if (userContext.role !== "owner") {
      throw new Error("Access denied: Only owners can update member permissions");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || targetUser.orgId !== userContext.orgId) {
      throw new Error("User not found or not in your organization");
    }

    await ctx.db.patch(args.userId, {
      allowedPages: args.allowedPages,
    });

    return await ctx.db.get(args.userId);
  },
});

export const createTeamMember = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    allowedPages: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Only owners can create team members
    if (userContext.role !== "owner") {
      throw new Error("Access denied: Only owners can create team members");
    }

    // Check if user with this email already exists in our database
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // Get organization details
    const org = await ctx.db.get(userContext.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Initialize Clerk client
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    try {
      // Create user in Clerk
      const clerkUser = await clerk.users.createUser({
        emailAddress: [args.email],
        password: args.password,
        firstName: args.name.split(' ')[0] || args.name,
        lastName: args.name.split(' ').slice(1).join(' ') || undefined,
      });

      // Create the user in our database with Clerk's token identifier
      const userId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        tokenIdentifier: clerkUser.id,
        createdAt: Date.now(),
        orgId: userContext.orgId,
        role: "member",
        allowedPages: args.allowedPages,
      });

      // Generate franchise ID for the new member
      const franchiseIdString = generateFranchiseId(args.name, org.name);

      // Create franchise for this user
      const franchiseId = await ctx.db.insert("franchises", {
        name: `${args.name} - ${org.name}`,
        franchiseId: franchiseIdString,
        orgId: userContext.orgId,
        ownerId: userId,
        createdAt: Date.now(),
      });

      // Update user with franchise info
      await ctx.db.patch(userId, {
        franchiseId,
      });

      return await ctx.db.get(userId);
    } catch (clerkError: any) {
      // Handle Clerk-specific errors
      if (clerkError.errors && clerkError.errors.length > 0) {
        const errorMessage = clerkError.errors[0].message;
        throw new Error(`Failed to create user account: ${errorMessage}`);
      }
      throw new Error("Failed to create user account. Please try again.");
    }
  },
});

export const removeMember = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Only owners can remove members
    if (userContext.role !== "owner") {
      throw new Error("Access denied: Only owners can remove members");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || targetUser.orgId !== userContext.orgId) {
      throw new Error("User not found or not in your organization");
    }

    // Cannot remove yourself
    if (args.userId === userContext.userId) {
      throw new Error("Cannot remove yourself from the organization");
    }

    // Remove org association (this effectively removes them from the organization)
    await ctx.db.patch(args.userId, {
      orgId: undefined,
      franchiseId: undefined,
      role: undefined,
      allowedPages: undefined,
    });

    return { success: true };
  },
});
