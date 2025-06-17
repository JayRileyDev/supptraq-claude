import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAllDataWithPagination } from "./utils/pagination";


// Get fresh sales transaction data with complete pagination
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

      console.log(`🔍 Fetching ALL sales data for user ${args.userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`📅 Date range: ${dateRange} days back from ${endDate.toISOString()}`);

      // Get ALL data using pagination to avoid Convex limits
      const [tickets, returns, giftCards] = await Promise.all([
        getAllDataWithPagination(ctx, "ticket_history", args.userId, startDate.toISOString(), endDate.toISOString()),
        getAllDataWithPagination(ctx, "return_tickets", args.userId, startDate.toISOString(), endDate.toISOString()),
        getAllDataWithPagination(ctx, "gift_card_tickets", args.userId, startDate.toISOString(), endDate.toISOString())
      ]);

      console.log(`✅ Fetched complete data: ${tickets.length} tickets, ${returns.length} returns, ${giftCards.length} gift cards`);
      
      // Log sample of data for debugging
      if (tickets.length > 0) {
        console.log(`📊 Sample ticket dates: ${tickets.slice(0, 3).map(t => t.sale_date).join(', ')}`);
      }

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
        fresh: true,
        truncated: false, // No longer truncated!
        complete: true // Flag to indicate we have complete data
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
        truncated: false,
        complete: false,
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

// DEBUG: Test function to get data without date filtering
export const testGetAllData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      console.log(`🧪 TEST: Fetching ALL data for user ${args.userId} (no date filter)`);

      // Get ALL data without date filtering to test pagination
      const [tickets, returns, giftCards] = await Promise.all([
        getAllDataWithPagination(ctx, "ticket_history", args.userId),
        getAllDataWithPagination(ctx, "return_tickets", args.userId),
        getAllDataWithPagination(ctx, "gift_card_tickets", args.userId)
      ]);

      console.log(`🧪 TEST: Total data: ${tickets.length} tickets, ${returns.length} returns, ${giftCards.length} gift cards`);

      return {
        totalTickets: tickets.length,
        totalReturns: returns.length,
        totalGiftCards: giftCards.length,
        sampleTicketDates: tickets.slice(0, 5).map(t => ({ id: t._id, date: t.sale_date })),
        dateRange: {
          earliest: tickets.length > 0 ? Math.min(...tickets.map(t => new Date(t.sale_date).getTime())) : null,
          latest: tickets.length > 0 ? Math.max(...tickets.map(t => new Date(t.sale_date).getTime())) : null
        }
      };
    } catch (error) {
      console.error("TEST Error:", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
});

// Get filter options (stores and sales reps) for the sales page
export const getSalesFilterOptions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      console.log(`🔍 Fetching ALL filter options for user ${args.userId}`);

      // Get ALL data from all tables using pagination to capture complete store and rep lists
      const [tickets, returns, giftCards] = await Promise.all([
        getAllDataWithPagination(ctx, "ticket_history", args.userId),
        getAllDataWithPagination(ctx, "return_tickets", args.userId),
        getAllDataWithPagination(ctx, "gift_card_tickets", args.userId)
      ]);

      console.log(`✅ Fetched complete filter data: ${tickets.length} tickets, ${returns.length} returns, ${giftCards.length} gift cards`);

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
        totalReps: reps.length,
        truncated: false, // No longer truncated!
        complete: true // Flag to indicate we have complete data
      };
    } catch (error) {
      console.error("Error in getSalesFilterOptions:", error);
      return {
        stores: [],
        reps: [],
        totalStores: 0,
        totalReps: 0,
        truncated: false,
        complete: false,
        error: "Failed to load filter options"
      };
    }
  }
});

