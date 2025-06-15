import { query } from './_generated/server';
import { v } from 'convex/values';

interface AggregatedTicketStats {
  totalTickets: number;
  totalTransactionAmount: number;
  totalQtySold: number;
  averageGrossProfitPercent: number;
  breakdown: {
    sales: number;
    returns: number;
    giftCards: number;
  };
}

export const getTicketStats = query({
  args: {
    user_id: v.optional(v.string()),
    store_id: v.optional(v.string()),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string())
  },
  handler: async (ctx, { user_id, store_id, start_date, end_date }): Promise<AggregatedTicketStats> => {
    // Build base queries with filters
    let ticketHistoryQuery = ctx.db.query('ticket_history');
    let returnTicketsQuery = ctx.db.query('return_tickets');
    let giftCardQuery = ctx.db.query('gift_card_tickets');
    
    // Apply filters
    if (user_id) {
      ticketHistoryQuery = ticketHistoryQuery.filter(q => q.eq(q.field('user_id'), user_id));
      returnTicketsQuery = returnTicketsQuery.filter(q => q.eq(q.field('user_id'), user_id));
      giftCardQuery = giftCardQuery.filter(q => q.eq(q.field('user_id'), user_id));
    }
    
    if (store_id) {
      ticketHistoryQuery = ticketHistoryQuery.filter(q => q.eq(q.field('store_id'), store_id));
      returnTicketsQuery = returnTicketsQuery.filter(q => q.eq(q.field('store_id'), store_id));
      giftCardQuery = giftCardQuery.filter(q => q.eq(q.field('store_id'), store_id));
    }
    
    if (start_date) {
      ticketHistoryQuery = ticketHistoryQuery.filter(q => q.gte(q.field('sale_date'), start_date));
      returnTicketsQuery = returnTicketsQuery.filter(q => q.gte(q.field('sale_date'), start_date));
      giftCardQuery = giftCardQuery.filter(q => q.gte(q.field('sale_date'), start_date));
    }
    
    if (end_date) {
      ticketHistoryQuery = ticketHistoryQuery.filter(q => q.lte(q.field('sale_date'), end_date));
      returnTicketsQuery = returnTicketsQuery.filter(q => q.lte(q.field('sale_date'), end_date));
      giftCardQuery = giftCardQuery.filter(q => q.lte(q.field('sale_date'), end_date));
    }
    
    // Execute queries with smart limits based on date range
    const dateRangeDays = start_date && end_date ? 
      Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)) : 
      null;
    
    // Dynamic limits based on expected data size
    const baseLimit = dateRangeDays ? Math.min(50000, dateRangeDays * 100) : 25000;
    const returnLimit = Math.min(baseLimit / 2, 15000);
    const giftCardLimit = Math.min(baseLimit / 4, 8000);
    
    const [ticketHistory, returnTickets, giftCards] = await Promise.all([
      ticketHistoryQuery.order('desc').take(baseLimit),
      returnTicketsQuery.order('desc').take(returnLimit),
      giftCardQuery.order('desc').take(giftCardLimit)
    ]);
    
    // Collect ALL unique ticket numbers across all tables
    const allTicketNumbers = new Set<string>();
    const ticketTotals = new Map<string, number>();
    
    // Count lines/records in each table and calculate totals
    let totalTransactionAmount = 0;
    
    // Process sales tickets - collect unique ticket numbers and their totals
    const salesTickets = new Set<string>();
    ticketHistory.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      allTicketNumbers.add(ticketNum);
      salesTickets.add(ticketNum);
      
      // Use transaction_total from ticket (should be same for all items in ticket)
      // IMPORTANT: Only set the transaction total ONCE per ticket to avoid any duplication
      if (!ticketTotals.has(ticketNum)) {
        const total = ticket.transaction_total || 0;
        ticketTotals.set(ticketNum, total);
      }
      // If ticket already exists, verify the transaction total is consistent (for debugging)
      else {
        const existing = ticketTotals.get(ticketNum) || 0;
        const current = ticket.transaction_total || 0;
        if (Math.abs(existing - current) > 0.01) {
          console.log(`⚠️  Inconsistent transaction total for ticket ${ticketNum}: ${existing} vs ${current}`);
        }
      }
    });
    
    // Process return tickets - collect unique ticket numbers  
    // IMPORTANT: Only use return ticket transaction_total if ticket doesn't exist in sales
    returnTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      allTicketNumbers.add(ticketNum);
      
      // ONLY add transaction total if this ticket doesn't exist in sales table
      // This prevents double-counting when same ticket has both sales and returns
      if (!salesTickets.has(ticketNum)) {
        if (!ticketTotals.has(ticketNum)) {
          const total = ticket.transaction_total || 0;
          ticketTotals.set(ticketNum, total);
        }
      }
      // If ticket exists in sales, we already have its transaction_total from sales table
    });
    
    // Process gift card tickets - collect unique ticket numbers
    const returnTicketSet = new Set(returnTickets.map(t => t.ticket_number));
    
    // Group gift cards by ticket number to get total per ticket
    const giftCardsByTicket = new Map<string, number>();
    giftCards.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      const giftAmount = ticket.giftcard_amount || 0;
      const current = giftCardsByTicket.get(ticketNum) || 0;
      giftCardsByTicket.set(ticketNum, current + giftAmount);
    });
    
    // Process each unique gift card ticket
    giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
      allTicketNumbers.add(ticketNum);
      
      if (salesTickets.has(ticketNum)) {
        // Ticket exists in sales - DON'T add gift card amount
        // The transaction_total from ticket_history should already include gift cards
        // Do nothing - just track the ticket number but don't add to transaction totals
      } else if (returnTicketSet.has(ticketNum)) {
        // Ticket exists in returns - DON'T add gift card amount
        // The transaction_total from return_tickets should already include gift cards
        // Do nothing - the return table's transaction total is already set
      } else {
        // Pure gift card ticket (no sales or returns) - use total gift card amount as transaction total
        ticketTotals.set(ticketNum, totalGiftAmount);
        console.log(`📌 Gift card only ticket: ${ticketNum}, amount: $${totalGiftAmount}`);
      }
    });
    
    // Calculate total transaction amount from unique tickets
    let salesTicketTotal = 0;
    let returnOnlyTicketTotal = 0;
    let giftCardOnlyTicketTotal = 0;
    let giftCardOnlyTicketCount = 0;
    
    ticketTotals.forEach((total, ticketNum) => {
      totalTransactionAmount += total;
      
      if (salesTickets.has(ticketNum)) {
        salesTicketTotal += total;
      } else if (returnTicketSet.has(ticketNum)) {
        returnOnlyTicketTotal += total;
      } else {
        giftCardOnlyTicketTotal += total;
        giftCardOnlyTicketCount++;
      }
    });
    
    console.log(`💰 Transaction Total Breakdown:`);
    console.log(`  Sales tickets: $${salesTicketTotal.toFixed(2)}`);
    console.log(`  Return only tickets: $${returnOnlyTicketTotal.toFixed(2)}`);
    console.log(`  Gift card only tickets: ${giftCardOnlyTicketCount} tickets, $${giftCardOnlyTicketTotal.toFixed(2)}`);
    console.log(`  TOTAL: $${totalTransactionAmount.toFixed(2)}`);
    
    
    // Calculate total quantity sold (including returns as negative)
    let totalQtySold = 0;
    
    // Add quantities from sales (should be positive)
    ticketHistory.forEach(ticket => {
      totalQtySold += ticket.qty_sold || 0;
    });
    
    // Add quantities from returns (should be negative) 
    returnTickets.forEach(ticket => {
      totalQtySold += ticket.qty_sold || 0;
    });
    
    // Calculate gross profit per unique ticket from ALL tables
    let totalGrossProfit = 0;
    const ticketGrossProfitMap = new Map<string, number>();
    
    // Collect gross profit from sales tickets (one per unique ticket)
    ticketHistory.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticket.gross_profit !== undefined && ticket.gross_profit !== null && !ticketGrossProfitMap.has(ticketNum)) {
        const gp = parseFloat(ticket.gross_profit);
        if (!isNaN(gp)) {
          ticketGrossProfitMap.set(ticketNum, gp);
        }
      }
    });
    
    // Collect gross profit from return tickets (only if not already in sales)
    returnTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticket.gross_profit !== undefined && ticket.gross_profit !== null && !ticketGrossProfitMap.has(ticketNum)) {
        const gp = parseFloat(ticket.gross_profit);
        if (!isNaN(gp)) {
          ticketGrossProfitMap.set(ticketNum, gp);
        }
      }
    });
    
    // Collect gross profit from gift card tickets (only if not already captured)
    giftCards.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticket.gross_profit !== undefined && ticket.gross_profit !== null && !ticketGrossProfitMap.has(ticketNum)) {
        const gp = parseFloat(ticket.gross_profit);
        if (!isNaN(gp)) {
          ticketGrossProfitMap.set(ticketNum, gp);
        }
      }
    });
    
    // Sum all unique ticket gross profits
    let negativeCount = 0;
    let zeroCount = 0;
    let positiveCount = 0;
    let negativeSum = 0;
    let positiveSum = 0;
    
    ticketGrossProfitMap.forEach(gp => {
      totalGrossProfit += gp;
      if (gp < 0) {
        negativeCount++;
        negativeSum += gp;
      } else if (gp === 0) {
        zeroCount++;
      } else {
        positiveCount++;
        positiveSum += gp;
      }
    });
    
    console.log(`🔍 GP Breakdown: ${ticketGrossProfitMap.size} tickets with GP data out of ${allTicketNumbers.size} total`);
    console.log(`  Negative: ${negativeCount} tickets, sum: ${negativeSum.toFixed(2)}%`);
    console.log(`  Zero: ${zeroCount} tickets`);
    console.log(`  Positive: ${positiveCount} tickets, sum: ${positiveSum.toFixed(2)}%`);
    console.log(`  Total sum: ${totalGrossProfit.toFixed(2)}%`);
    console.log(`  Average: ${(totalGrossProfit / allTicketNumbers.size).toFixed(2)}%`);
    
    
    return {
      totalTickets: allTicketNumbers.size, // Count unique ticket numbers across ALL tables
      totalTransactionAmount: Math.round(totalTransactionAmount * 100) / 100,
      totalQtySold: totalQtySold,
      averageGrossProfitPercent: allTicketNumbers.size > 0 ? 
        Math.round((totalGrossProfit / allTicketNumbers.size) * 100) / 100 : 0,
      breakdown: {
        sales: ticketHistory.length,      // Number of lines in ticket_history table
        returns: returnTickets.length,    // Number of lines in return_tickets table  
        giftCards: giftCards.length       // Number of lines in gift_card_tickets table
      }
    };
  },
});