import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUserSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      return null;
    }

    // Convert amount from cents to dollars for display
    return {
      ...subscription,
      amount: subscription.amount ? subscription.amount / 100 : 0,
      amountCents: subscription.amount, // Keep original for calculations
      formattedAmount: subscription.amount 
        ? `$${(subscription.amount / 100).toFixed(2)}` 
        : "$0.00"
    };
  },
});

/**
 * Helper function to format currency amounts
 */
export function formatCurrency(amountInCents: number, currency: string = "USD"): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Helper function to convert dollars to cents for storage
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Helper function to convert cents to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}