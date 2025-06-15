import { query } from './_generated/server';
import { v } from 'convex/values';

// Find tickets with zero or missing transaction totals
export const findProblematicTickets = query({
  args: {
    user_id: v.string()
  },
  handler: async (ctx, { user_id }) => {
    // Get all tickets from all tables with reasonable limits for diagnostics
    const [ticketHistory, returnTickets, giftCards] = await Promise.all([
      ctx.db.query('ticket_history')
        .filter(q => q.eq(q.field('user_id'), user_id))
        .order('desc')
        .take(10000), // Reasonable limit for diagnostic analysis
      ctx.db.query('return_tickets')
        .filter(q => q.eq(q.field('user_id'), user_id))
        .order('desc')
        .take(5000),
      ctx.db.query('gift_card_tickets')
        .filter(q => q.eq(q.field('user_id'), user_id))
        .order('desc')
        .take(3000)
    ]);

    // Find tickets with zero or null transaction totals
    const zeroTransactionTickets = new Map<string, any[]>();
    
    ticketHistory.forEach(ticket => {
      if (!ticket.transaction_total || ticket.transaction_total === 0) {
        if (!zeroTransactionTickets.has(ticket.ticket_number)) {
          zeroTransactionTickets.set(ticket.ticket_number, []);
        }
        zeroTransactionTickets.get(ticket.ticket_number)!.push({
          table: 'ticket_history',
          ...ticket
        });
      }
    });

    returnTickets.forEach(ticket => {
      if (!ticket.transaction_total || ticket.transaction_total === 0) {
        if (!zeroTransactionTickets.has(ticket.ticket_number)) {
          zeroTransactionTickets.set(ticket.ticket_number, []);
        }
        zeroTransactionTickets.get(ticket.ticket_number)!.push({
          table: 'return_tickets',
          ...ticket
        });
      }
    });

    // Check for gift card only tickets
    const giftCardOnlyTickets = new Map<string, number>();
    const allSalesReturnTickets = new Set([
      ...ticketHistory.map(t => t.ticket_number),
      ...returnTickets.map(t => t.ticket_number)
    ]);

    giftCards.forEach(gc => {
      if (!allSalesReturnTickets.has(gc.ticket_number)) {
        const current = giftCardOnlyTickets.get(gc.ticket_number) || 0;
        giftCardOnlyTickets.set(gc.ticket_number, current + (gc.giftcard_amount || 0));
      }
    });

    // Find tickets that appear in multiple tables with different totals
    const ticketTotalsMap = new Map<string, Set<number>>();
    
    ticketHistory.forEach(ticket => {
      if (!ticketTotalsMap.has(ticket.ticket_number)) {
        ticketTotalsMap.set(ticket.ticket_number, new Set());
      }
      ticketTotalsMap.get(ticket.ticket_number)!.add(ticket.transaction_total || 0);
    });

    const inconsistentTickets = Array.from(ticketTotalsMap.entries())
      .filter(([_, totals]) => totals.size > 1)
      .map(([ticketNum, totals]) => ({
        ticket_number: ticketNum,
        different_totals: Array.from(totals)
      }));

    return {
      zero_transaction_tickets: Array.from(zeroTransactionTickets.entries()).map(([ticketNum, entries]) => ({
        ticket_number: ticketNum,
        entries: entries.slice(0, 5) // Limit to first 5 entries
      })),
      gift_card_only_tickets: Array.from(giftCardOnlyTickets.entries()).map(([ticketNum, total]) => ({
        ticket_number: ticketNum,
        total_gift_card_amount: total
      })),
      inconsistent_totals: inconsistentTickets,
      summary: {
        tickets_with_zero_total: zeroTransactionTickets.size,
        gift_card_only_count: giftCardOnlyTickets.size,
        gift_card_only_total: Array.from(giftCardOnlyTickets.values()).reduce((sum, val) => sum + val, 0),
        inconsistent_count: inconsistentTickets.length
      }
    };
  }
});

// Find specific tickets by number
export const findSpecificTickets = query({
  args: {
    ticket_numbers: v.array(v.string()),
    user_id: v.string()
  },
  handler: async (ctx, { ticket_numbers, user_id }) => {
    const results: any[] = [];

    for (const ticketNum of ticket_numbers) {
      const [salesEntries, returnEntries, giftCardEntries] = await Promise.all([
        ctx.db.query('ticket_history')
          .filter(q => q.and(
            q.eq(q.field('ticket_number'), ticketNum),
            q.eq(q.field('user_id'), user_id)
          ))
          .collect(),
        ctx.db.query('return_tickets')
          .filter(q => q.and(
            q.eq(q.field('ticket_number'), ticketNum),
            q.eq(q.field('user_id'), user_id)
          ))
          .collect(),
        ctx.db.query('gift_card_tickets')
          .filter(q => q.and(
            q.eq(q.field('ticket_number'), ticketNum),
            q.eq(q.field('user_id'), user_id)
          ))
          .collect()
      ]);

      const totalFromSales = salesEntries.length > 0 ? salesEntries[0].transaction_total || 0 : 0;
      const totalFromReturns = returnEntries.length > 0 ? returnEntries[0].transaction_total || 0 : 0;
      const totalFromGiftCards = giftCardEntries.reduce((sum, gc) => sum + (gc.giftcard_amount || 0), 0);

      results.push({
        ticket_number: ticketNum,
        found: salesEntries.length > 0 || returnEntries.length > 0 || giftCardEntries.length > 0,
        in_sales: salesEntries.length,
        in_returns: returnEntries.length,
        in_gift_cards: giftCardEntries.length,
        transaction_total_from_sales: totalFromSales,
        transaction_total_from_returns: totalFromReturns,
        gift_card_total: totalFromGiftCards,
        sales_items: salesEntries.map(e => ({
          item: e.item_number,
          qty: e.qty_sold,
          product: e.product_name
        })),
        return_items: returnEntries.map(e => ({
          item: e.item_number,
          qty: e.qty_sold,
          product: e.product_name
        })),
        gift_cards: giftCardEntries.map(e => ({
          amount: e.giftcard_amount,
          product: e.product_name
        }))
      });
    }

    return results;
  }
});

// Compare database totals with expected totals
export const compareStatTotals = query({
  args: {
    user_id: v.string()
  },
  handler: async (ctx, { user_id }) => {
    // Get raw counts and sums from each table with limits
    const [ticketHistory, returnTickets, giftCards] = await Promise.all([
      ctx.db.query('ticket_history')
        .filter(q => q.eq(q.field('user_id'), user_id))
        .order('desc')
        .take(15000), // Higher limit for comparison analysis
      ctx.db.query('return_tickets')
        .filter(q => q.eq(q.field('user_id'), user_id))
        .order('desc')
        .take(8000),
      ctx.db.query('gift_card_tickets')
        .filter(q => q.eq(q.field('user_id'), user_id))
        .order('desc')
        .take(5000)
    ]);

    // Method 1: Sum all transaction_totals (may double count)
    const method1Total = ticketHistory.reduce((sum, t) => sum + (t.transaction_total || 0), 0) +
                        returnTickets.reduce((sum, t) => sum + (t.transaction_total || 0), 0) +
                        giftCards.reduce((sum, t) => sum + (t.giftcard_amount || 0), 0);

    // Method 2: Unique tickets only (current implementation)
    const uniqueTickets = new Map<string, number>();
    const salesTickets = new Set<string>();
    
    ticketHistory.forEach(t => {
      salesTickets.add(t.ticket_number);
      if (!uniqueTickets.has(t.ticket_number)) {
        uniqueTickets.set(t.ticket_number, t.transaction_total || 0);
      }
    });

    returnTickets.forEach(t => {
      if (!salesTickets.has(t.ticket_number) && !uniqueTickets.has(t.ticket_number)) {
        uniqueTickets.set(t.ticket_number, t.transaction_total || 0);
      }
    });

    const returnTicketSet = new Set(returnTickets.map(t => t.ticket_number));
    
    giftCards.forEach(t => {
      if (!salesTickets.has(t.ticket_number) && !returnTicketSet.has(t.ticket_number)) {
        const current = uniqueTickets.get(t.ticket_number) || 0;
        uniqueTickets.set(t.ticket_number, current + (t.giftcard_amount || 0));
      }
    });

    const method2Total = Array.from(uniqueTickets.values()).reduce((sum, val) => sum + val, 0);

    // Method 3: Count gift cards separately
    const giftCardOnlyTotal = giftCards
      .filter(gc => !salesTickets.has(gc.ticket_number) && !returnTicketSet.has(gc.ticket_number))
      .reduce((sum, gc) => sum + (gc.giftcard_amount || 0), 0);

    return {
      method1_sum_all: Math.round(method1Total * 100) / 100,
      method2_unique_tickets: Math.round(method2Total * 100) / 100,
      gift_card_only_total: Math.round(giftCardOnlyTotal * 100) / 100,
      unique_ticket_count: uniqueTickets.size,
      table_counts: {
        ticket_history_rows: ticketHistory.length,
        return_tickets_rows: returnTickets.length,
        gift_card_tickets_rows: giftCards.length,
        ticket_history_unique: new Set(ticketHistory.map(t => t.ticket_number)).size,
        return_tickets_unique: new Set(returnTickets.map(t => t.ticket_number)).size,
        gift_card_tickets_unique: new Set(giftCards.map(t => t.ticket_number)).size
      },
      difference_method1_method2: Math.round((method1Total - method2Total) * 100) / 100
    };
  }
});