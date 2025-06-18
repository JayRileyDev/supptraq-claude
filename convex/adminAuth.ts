import { query } from "./_generated/server";

// Check if user is an admin
export const isUserAdmin = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return { isAdmin: false, reason: "Not authenticated" };
    }

    // Get admin emails from environment variable
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    
    if (adminEmails.length === 0) {
      console.warn("⚠️ No ADMIN_EMAILS configured in environment");
      return { isAdmin: false, reason: "No admins configured" };
    }

    const userEmail = identity.email || "";
    const isAdmin = userEmail && adminEmails.includes(userEmail);

    console.log(`🔐 Admin check for ${userEmail}: ${isAdmin ? 'ALLOWED' : 'DENIED'}`);
    
    return { 
      isAdmin, 
      userEmail,
      reason: isAdmin ? "Authorized admin" : "Email not in admin list"
    };
  },
});

// Get current user admin status and info
export const getAdminInfo = query({
  handler: async (ctx): Promise<{ email: string | undefined; name: string | undefined; isAdmin: boolean; reason: string } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }

    // Check admin status directly to avoid circular reference
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const userEmail = identity.email || "";
    const isAdmin = userEmail && adminEmails.includes(userEmail);
    
    return {
      email: identity.email,
      name: identity.name,
      isAdmin: Boolean(isAdmin),
      reason: isAdmin ? "Authorized admin" : "Email not in admin list"
    };
  },
});