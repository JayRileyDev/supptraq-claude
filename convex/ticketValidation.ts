import { query } from './_generated/server';
import { v } from 'convex/values';

// Validate ticket totals and find discrepancies
export const validateTicketTotals = query({
  args: {
    user_id: v.string(),
    expected_ticket_count: v.optional(v.number()),
    expected_total_amount: v.optional(v.number())
  },
  handler: async (ctx, { user_id, expected_ticket_count, expected_total_amount }) => {
    // Get all unique tickets
    const [ticketHistory, returnTickets, giftCards] = await Promise.all([
      ctx.db.query('ticket_history')
        .filter(q => q.eq(q.field('user_id'), user_id))
        .collect(),
      ctx.db.query('return_tickets')
        .filter(q => q.eq(q.field('user_id'), user_id))
        .collect(),
      ctx.db.query('gift_card_tickets')
        .filter(q => q.eq(q.field('user_id'), user_id))
        .collect()
    ]);

    // Collect all unique ticket numbers
    const allTicketNumbers = new Set<string>();
    const ticketDetails = new Map<string, any>();
    
    // Process each table
    ticketHistory.forEach(t => {
      allTicketNumbers.add(t.ticket_number);
      if (!ticketDetails.has(t.ticket_number)) {
        ticketDetails.set(t.ticket_number, {
          ticket_number: t.ticket_number,
          store_id: t.store_id,
          sale_date: t.sale_date,
          sales_rep: t.sales_rep,
          transaction_total: t.transaction_total || 0,
          in_tables: ['ticket_history']
        });
      }
    });

    returnTickets.forEach(t => {
      allTicketNumbers.add(t.ticket_number);
      if (ticketDetails.has(t.ticket_number)) {
        ticketDetails.get(t.ticket_number).in_tables.push('return_tickets');
      } else {
        ticketDetails.set(t.ticket_number, {
          ticket_number: t.ticket_number,
          store_id: t.store_id,
          sale_date: t.sale_date,
          sales_rep: t.sales_rep,
          transaction_total: t.transaction_total || 0,
          in_tables: ['return_tickets']
        });
      }
    });

    giftCards.forEach(t => {
      allTicketNumbers.add(t.ticket_number);
      if (ticketDetails.has(t.ticket_number)) {
        ticketDetails.get(t.ticket_number).in_tables.push('gift_card_tickets');
      } else {
        ticketDetails.set(t.ticket_number, {
          ticket_number: t.ticket_number,
          store_id: t.store_id,
          sale_date: t.sale_date,
          sales_rep: t.sales_rep,
          transaction_total: 0,
          gift_card_amount: t.giftcard_amount,
          in_tables: ['gift_card_tickets']
        });
      }
    });

    // Calculate actual totals using same logic as getTicketStats
    const ticketTotals = new Map<string, number>();
    const salesTickets = new Set<string>();
    
    ticketHistory.forEach(t => {
      salesTickets.add(t.ticket_number);
      if (!ticketTotals.has(t.ticket_number)) {
        ticketTotals.set(t.ticket_number, t.transaction_total || 0);
      }
    });

    const returnTicketSet = new Set(returnTickets.map(t => t.ticket_number));
    
    returnTickets.forEach(t => {
      if (!salesTickets.has(t.ticket_number) && !ticketTotals.has(t.ticket_number)) {
        ticketTotals.set(t.ticket_number, t.transaction_total || 0);
      }
    });

    // Group gift cards by ticket
    const giftCardsByTicket = new Map<string, number>();
    giftCards.forEach(t => {
      const current = giftCardsByTicket.get(t.ticket_number) || 0;
      giftCardsByTicket.set(t.ticket_number, current + (t.giftcard_amount || 0));
    });

    giftCardsByTicket.forEach((amount, ticketNum) => {
      if (!salesTickets.has(ticketNum) && !returnTicketSet.has(ticketNum)) {
        ticketTotals.set(ticketNum, amount);
      }
    });

    const actualTotal = Array.from(ticketTotals.values()).reduce((sum, val) => sum + val, 0);
    const actualCount = allTicketNumbers.size;

    // Find tickets with potential issues
    const zeroTotalTickets = Array.from(ticketDetails.entries())
      .filter(([_, details]) => {
        const total = ticketTotals.get(details.ticket_number) || 0;
        return total === 0;
      })
      .map(([ticketNum, details]) => ({
        ticket_number: ticketNum,
        ...details
      }));

    const result: any = {
      actual_ticket_count: actualCount,
      actual_total_amount: Math.round(actualTotal * 100) / 100,
      zero_total_tickets: zeroTotalTickets.length,
      sample_zero_tickets: zeroTotalTickets.slice(0, 10)
    };

    // Add comparison if expected values provided
    if (expected_ticket_count !== undefined) {
      result.ticket_count_difference = actualCount - expected_ticket_count;
    }
    
    if (expected_total_amount !== undefined) {
      result.amount_difference = Math.round((actualTotal - expected_total_amount) * 100) / 100;
    }

    // Find tickets by pattern to check for parsing issues
    const ticketPatterns = {
      standard: 0,      // AB-XX-TNNNNNN
      with_digit: 0,    // AB-XX#-TNNNNNN
      with_1T: 0,       // AB-XX-1TNNNNNN
      alternate: 0,     // ABXXNNNN-01
      without_AB: 0,    // XX-TNNNNNN
      other: 0
    };

    allTicketNumbers.forEach(ticketNum => {
      if (/^AB-[A-Z]{2,4}-T\d{5,7}$/.test(ticketNum)) {
        ticketPatterns.standard++;
      } else if (/^AB-[A-Z]{1,3}\d{1}-T\d{5,7}$/.test(ticketNum)) {
        ticketPatterns.with_digit++;
      } else if (/^AB-[A-Z]{2}-1T\d{5,7}$/.test(ticketNum)) {
        ticketPatterns.with_1T++;
      } else if (/^AB[A-Z]{2,4}\d{4,6}-\d{2}$/.test(ticketNum)) {
        ticketPatterns.alternate++;
      } else if (/^[A-Z]{2,4}-T\d{5,7}$/.test(ticketNum)) {
        ticketPatterns.without_AB++;
      } else {
        ticketPatterns.other++;
        console.log(`Unusual ticket pattern: ${ticketNum}`);
      }
    });

    result.ticket_patterns = ticketPatterns;

    return result;
  }
});

// Check for missing ticket numbers in a range
export const findMissingTicketNumbers = query({
  args: {
    user_id: v.string(),
    store_id: v.string(),
    start_number: v.number(),
    end_number: v.number()
  },
  handler: async (ctx, { user_id, store_id, start_number, end_number }) => {
    // Get all tickets for this store
    const tickets = await ctx.db.query('ticket_history')
      .filter(q => q.and(
        q.eq(q.field('user_id'), user_id),
        q.eq(q.field('store_id'), store_id)
      ))
      .collect();

    // Extract ticket numbers and parse the numeric part
    const ticketNumbers = new Set<number>();
    const ticketMap = new Map<number, string>();
    
    tickets.forEach(t => {
      // Try to extract number from various formats
      const matches = t.ticket_number.match(/T(\d+)/);
      if (matches) {
        const num = parseInt(matches[1]);
        ticketNumbers.add(num);
        ticketMap.set(num, t.ticket_number);
      }
    });

    // Find missing numbers in range
    const missing: number[] = [];
    for (let i = start_number; i <= end_number; i++) {
      if (!ticketNumbers.has(i)) {
        missing.push(i);
      }
    }

    return {
      store_id,
      range: `${start_number} - ${end_number}`,
      total_in_range: ticketNumbers.size,
      missing_count: missing.length,
      missing_numbers: missing.slice(0, 100), // Limit to first 100
      sample_existing: Array.from(ticketNumbers).slice(0, 10).sort((a, b) => a - b)
    };
  }
});