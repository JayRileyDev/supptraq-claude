import { query } from './_generated/server';
import { v } from 'convex/values';
import { getUserContext } from './accessControl';

export const debugTicketStats = query({
  args: {},
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    // Get all data
    let ticketHistoryQuery = ctx.db.query('ticket_history');
    let returnTicketsQuery = ctx.db.query('return_tickets');
    let giftCardQuery = ctx.db.query('gift_card_tickets');
    
    // Always filter by franchise
    ticketHistoryQuery = ticketHistoryQuery.filter(q => q.eq(q.field('franchiseId'), userContext.franchiseId));
    returnTicketsQuery = returnTicketsQuery.filter(q => q.eq(q.field('franchiseId'), userContext.franchiseId));
    giftCardQuery = giftCardQuery.filter(q => q.eq(q.field('franchiseId'), userContext.franchiseId));
    
    const [ticketHistory, returnTickets, giftCards] = await Promise.all([
      ticketHistoryQuery.collect(),
      returnTicketsQuery.collect(),
      giftCardQuery.collect()
    ]);

    // Analyze transaction totals
    const transactionTotalsByTicket = new Map<string, Set<number>>();
    
    // Check for duplicate/inconsistent transaction totals within same ticket
    ticketHistory.forEach(item => {
      const ticket = item.ticket_number;
      const total = item.transaction_total || 0;
      
      if (!transactionTotalsByTicket.has(ticket)) {
        transactionTotalsByTicket.set(ticket, new Set());
      }
      transactionTotalsByTicket.get(ticket)!.add(total);
    });

    returnTickets.forEach(item => {
      const ticket = item.ticket_number;
      const total = item.transaction_total || 0;
      
      if (!transactionTotalsByTicket.has(ticket)) {
        transactionTotalsByTicket.set(ticket, new Set());
      }
      transactionTotalsByTicket.get(ticket)!.add(total);
    });

    // Find tickets with inconsistent totals
    const inconsistentTotals = Array.from(transactionTotalsByTicket.entries())
      .filter(([ticket, totals]) => totals.size > 1)
      .map(([ticket, totals]) => ({ ticket, totals: Array.from(totals) }));

    // Sample some tickets for debugging
    const sampleTickets = ticketHistory.slice(0, 10).map(item => ({
      ticket_number: item.ticket_number,
      transaction_total: item.transaction_total,
      qty_sold: item.qty_sold,
      item_number: item.item_number
    }));

    // Count unique tickets in each table
    const uniqueTicketsInSales = new Set(ticketHistory.map(t => t.ticket_number)).size;
    const uniqueTicketsInReturns = new Set(returnTickets.map(t => t.ticket_number)).size;
    const uniqueTicketsInGiftCards = new Set(giftCards.map(t => t.ticket_number)).size;

    // Overall unique tickets
    const allUniqueTickets = new Set([
      ...ticketHistory.map(t => t.ticket_number),
      ...returnTickets.map(t => t.ticket_number),
      ...giftCards.map(t => t.ticket_number)
    ]).size;

    return {
      counts: {
        salesItems: ticketHistory.length,
        returnItems: returnTickets.length,
        giftCardItems: giftCards.length,
        uniqueTicketsInSales,
        uniqueTicketsInReturns,
        uniqueTicketsInGiftCards,
        allUniqueTickets
      },
      inconsistentTotals: inconsistentTotals.slice(0, 10), // First 10 problematic tickets
      sampleTickets,
      totalQtyActual: ticketHistory.reduce((sum, t) => sum + (t.qty_sold || 0), 0) + 
                     returnTickets.reduce((sum, t) => sum + (t.qty_sold || 0), 0)
    };
  }
});