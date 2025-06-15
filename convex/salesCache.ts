import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get fresh sales transaction data (no caching due to size limits)
export const getSalesData = query({
  args: { 
    userId: v.string(),
    dateRange: v.optional(v.number()) // Days to look back (7, 30, 90)
  },
  handler: async (ctx, args) => {
    try {
      const dateRange = args.dateRange || 30;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      // Get all tickets in date range with optimized query
      const tickets = await ctx.db
        .query("ticket_history")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDate.toISOString()),
            q.lte(q.field("sale_date"), endDate.toISOString())
          )
        )
        .collect(); // Use collect() for complete data

      // Get all returns in date range  
      const returns = await ctx.db
        .query("return_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDate.toISOString()),
            q.lte(q.field("sale_date"), endDate.toISOString())
          )
        )
        .collect();

      // Get all gift cards in date range
      const giftCards = await ctx.db
        .query("gift_card_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDate.toISOString()),
            q.lte(q.field("sale_date"), endDate.toISOString())
          )
        )
        .collect();

      // Return fresh data for client-side filtering and calculations
      return {
        tickets,
        returns,
        giftCards,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: dateRange
        },
        summary: {
          totalTickets: tickets.length,
          totalReturns: returns.length,
          totalGiftCards: giftCards.length,
          dateRange: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
          lastUpdated: Date.now()
        },
        cached: false,
        fresh: true
      };

    } catch (error) {
      console.error("Error in getSalesData:", error);
      return {
        tickets: [],
        returns: [],
        giftCards: [],
        dateRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          days: 30
        },
        summary: {
          totalTickets: 0,
          totalReturns: 0,
          totalGiftCards: 0,
          dateRange: "No data",
          lastUpdated: Date.now()
        },
        cached: false,
        fresh: false,
        error: "Failed to load sales data"
      };
    }
  }
});

// Utility function to trigger data refresh (if needed for real-time updates)
export const refreshSalesData = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // This mutation can be used to trigger reactive updates
      // For now, it just returns success since we're fetching fresh data
      return { success: true, message: "Data will be refreshed on next query" };
    } catch (error) {
      console.error("Error in refreshSalesData:", error);
      return { success: false, error: "Failed to trigger refresh" };
    }
  }
});

// Get filter options (stores and sales reps) for the sales page
export const getSalesFilterOptions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Get ALL data from all tables to capture complete store and rep lists
      const [tickets, returns, giftCards] = await Promise.all([
        ctx.db
          .query("ticket_history")
          .filter((q) => q.eq(q.field("user_id"), args.userId))
          .collect(), // Get all tickets
        ctx.db
          .query("return_tickets")
          .filter((q) => q.eq(q.field("user_id"), args.userId))
          .collect(), // Get all returns
        ctx.db
          .query("gift_card_tickets")
          .filter((q) => q.eq(q.field("user_id"), args.userId))
          .collect() // Get all gift cards
      ]);

      const storeSet = new Set<string>();
      const repSet = new Set<string>();

      // Process all ticket types to get complete lists
      [...tickets, ...returns, ...giftCards].forEach(ticket => {
        if (ticket.store_id) storeSet.add(ticket.store_id);
        if (ticket.sales_rep) repSet.add(ticket.sales_rep);
      });

      const stores = Array.from(storeSet).sort((a, b) => {
        // Sort stores numerically if they're numbers, otherwise alphabetically
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.localeCompare(b);
      });

      const reps = Array.from(repSet).sort();

      return {
        stores,
        reps,
        totalStores: stores.length,
        totalReps: reps.length
      };
    } catch (error) {
      console.error("Error in getSalesFilterOptions:", error);
      return {
        stores: [],
        reps: [],
        totalStores: 0,
        totalReps: 0,
        error: "Failed to load filter options"
      };
    }
  }
});

