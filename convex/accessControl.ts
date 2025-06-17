import type { Auth } from "convex/server";
import type { DatabaseReader } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export interface UserContext {
  userId: Id<"users">;
  orgId: Id<"organizations">;
  franchiseId: Id<"franchises">;
  role: "owner" | "member";
  allowedPages: string[];
}

/**
 * Gets user context with organization and franchise information
 * This should be called at the start of every Convex query or mutation
 */
export async function getUserContext(
  auth: Auth,
  db: DatabaseReader
): Promise<UserContext> {
  const identity = await auth.getUserIdentity();
  
  if (!identity) {
    throw new Error("User not authenticated");
  }

  // Find user by token
  const user = await db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user has been migrated to new structure
  if (!user.orgId || !user.franchiseId || !user.role) {
    throw new Error("User account needs to be migrated. Please contact support.");
  }

  return {
    userId: user._id,
    orgId: user.orgId,
    franchiseId: user.franchiseId,
    role: user.role,
    allowedPages: user.allowedPages || [],
  };
}

/**
 * Checks if a user can access a specific page
 * Owners have access to all pages, members only to allowed pages
 */
export function canAccessPage(userContext: UserContext, pagePath: string): boolean {
  // Owners have full access
  if (userContext.role === "owner") {
    return true;
  }
  
  // Members need explicit permission
  return userContext.allowedPages.includes(pagePath);
}

/**
 * All available pages in the application for permission management
 */
export const AVAILABLE_PAGES = [
  "/dashboard",
  "/inventory",
  "/sales", 
  "/reports",
  "/upload",
  "/budget",
  "/chat",
  "/notifications",
  "/settings",
] as const;

/**
 * Page display names for UI
 */
export const PAGE_DISPLAY_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventory Management", 
  "/sales": "Sales Analytics",
  "/reports": "Reports",
  "/upload": "Data Upload",
  "/budget": "Budget Planning",
  "/chat": "AI Chat",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

/**
 * Throws an error if user cannot access the page
 */
export function requirePageAccess(userContext: UserContext, pagePath: string): void {
  if (!canAccessPage(userContext, pagePath)) {
    throw new Error(`Access denied: You don't have permission to access ${pagePath}`);
  }
}

/**
 * Helper to check if user is an owner
 */
export function isOwner(userContext: UserContext): boolean {
  return userContext.role === "owner";
}

/**
 * Helper to check if user is a member  
 */
export function isMember(userContext: UserContext): boolean {
  return userContext.role === "member";
}

/**
 * Generate a franchise ID from user name and organization
 */
export function generateFranchiseId(userName: string, orgName: string): string {
  const cleanName = userName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
  
  const cleanOrg = orgName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .map(word => word.charAt(0))
    .join('');
    
  return `${cleanName}-${cleanOrg}`;
}