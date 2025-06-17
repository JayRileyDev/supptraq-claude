import { query } from "./_generated/server";
import { getUserContext } from "./accessControl";

// Simple test to verify sales data is working correctly
export const testSalesDataAccess = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    const results = {
      userContext: {
        franchiseId: userContext.franchiseId,
        orgId: userContext.orgId,
      },
      directDataCounts: {
        ticketHistory: 0,
        returnTickets: 0,
        giftCardTickets: 0,
      },
      sampleData: {
        ticketHistory: [] as any[],
        returnTickets: [] as any[],
        giftCardTickets: [] as any[],
      }
    };

    // Test direct access to ticket_history
    const ticketHistory = await ctx.db
      .query("ticket_history")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(5);
    
    results.directDataCounts.ticketHistory = ticketHistory.length;
    results.sampleData.ticketHistory = ticketHistory.map(t => ({
      ticket_number: t.ticket_number,
      store_id: t.store_id,
      sale_date: t.sale_date,
      transaction_total: t.transaction_total,
      franchiseId: t.franchiseId,
      orgId: t.orgId,
    }));

    // Test direct access to return_tickets
    const returnTickets = await ctx.db
      .query("return_tickets")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(5);
    
    results.directDataCounts.returnTickets = returnTickets.length;
    results.sampleData.returnTickets = returnTickets.map(t => ({
      ticket_number: t.ticket_number,
      store_id: t.store_id,
      sale_date: t.sale_date,
      transaction_total: t.transaction_total,
      franchiseId: t.franchiseId,
      orgId: t.orgId,
    }));

    // Test direct access to gift_card_tickets
    const giftCardTickets = await ctx.db
      .query("gift_card_tickets")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .take(5);
    
    results.directDataCounts.giftCardTickets = giftCardTickets.length;
    results.sampleData.giftCardTickets = giftCardTickets.map(t => ({
      ticket_number: t.ticket_number,
      store_id: t.store_id,
      sale_date: t.sale_date,
      giftcard_amount: t.giftcard_amount,
      franchiseId: t.franchiseId,
      orgId: t.orgId,
    }));

    const totalTickets = results.directDataCounts.ticketHistory + 
                        results.directDataCounts.returnTickets + 
                        results.directDataCounts.giftCardTickets;

    return {
      ...results,
      summary: {
        totalTickets,
        hasData: totalTickets > 0,
        message: totalTickets > 0 
          ? `Found ${totalTickets} total tickets for this franchise`
          : "No tickets found for this franchise - check if data was properly migrated"
      }
    };
  },
});