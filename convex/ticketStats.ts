import { query } from './_generated/server';
import { v } from 'convex/values';

interface AggregatedTicketStats {
  totalTickets: number;
  totalTransactionAmount: number;
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
    
    // Execute queries
    const [ticketHistory, returnTickets, giftCards] = await Promise.all([
      ticketHistoryQuery.collect(),
      returnTicketsQuery.collect(),
      giftCardQuery.collect()
    ]);
    
    // Use the same deduplication strategy as your old code: ticket_number + item_number
    const deduped = new Map<string, {
      ticket_number: string;
      transaction_total: number;
      gross_profit_percent: number;
      type: 'sale' | 'return' | 'gift_card';
    }>();
    
    // Track which tickets have been inserted (like insertedTicketNumbers in old code)
    const insertedTicketNumbers = new Set<string>();
    
    // Process sales - use ticket+item deduplication like your old code
    ticketHistory.forEach(ticket => {
      const key = `${ticket.ticket_number}-${ticket.item_number || 'NO-ITEM'}`;
      if (!deduped.has(key)) {
        deduped.set(key, {
          ticket_number: ticket.ticket_number,
          transaction_total: ticket.transaction_total || 0,
          gross_profit_percent: ticket.gross_profit ? parseFloat(ticket.gross_profit) : 0,
          type: 'sale'
        });
        insertedTicketNumbers.add(ticket.ticket_number);
      }
    });
    
    // Process returns - use ticket+item deduplication
    returnTickets.forEach(ticket => {
      const key = `${ticket.ticket_number}-${ticket.item_number || 'NO-ITEM'}`;
      if (!deduped.has(key)) {
        deduped.set(key, {
          ticket_number: ticket.ticket_number,
          transaction_total: ticket.transaction_total || 0,
          gross_profit_percent: ticket.gross_profit ? parseFloat(ticket.gross_profit) : 0,
          type: 'return'
        });
        insertedTicketNumbers.add(ticket.ticket_number);
      }
    });
    
    // Process gift cards - these get counted as separate tickets like in your old code
    giftCards.forEach(ticket => {
      const key = `${ticket.ticket_number}-GIFT-CARD`;
      if (!deduped.has(key)) {
        deduped.set(key, {
          ticket_number: ticket.ticket_number,
          transaction_total: ticket.giftcard_amount || 0,
          gross_profit_percent: 0,
          type: 'gift_card'
        });
        insertedTicketNumbers.add(ticket.ticket_number);
      }
    });
    
    // Now aggregate by unique ticket numbers (like your old code)
    const uniqueTickets = new Map<string, {
      transaction_total: number;
      gross_profit_percent: number;
      type: 'sale' | 'return' | 'gift_card';
    }>();
    
    // For each unique ticket number, find the best transaction_total
    insertedTicketNumbers.forEach(ticketNumber => {
      let bestTransactionTotal = 0;
      let bestGrossProfitPercent = 0;
      let bestType: 'sale' | 'return' | 'gift_card' = 'sale';
      let highestTotal = 0;
      let found = false;
      
      // Find the entry with the highest transaction_total for this ticket
      deduped.forEach((entry, key) => {
        if (entry.ticket_number === ticketNumber) {
          if (Math.abs(entry.transaction_total) > Math.abs(highestTotal)) {
            bestTransactionTotal = entry.transaction_total;
            bestGrossProfitPercent = entry.gross_profit_percent;
            bestType = entry.type;
            highestTotal = entry.transaction_total;
            found = true;
          }
        }
      });
      
      if (found) {
        uniqueTickets.set(ticketNumber, {
          transaction_total: bestTransactionTotal,
          gross_profit_percent: bestGrossProfitPercent,
          type: bestType
        });
      }
    });
    
    // Calculate totals using unique tickets (like your old approach)
    let totalTransactionAmount = 0;
    let totalGrossProfitPercent = 0;
    let grossProfitCount = 0;
    let salesCount = 0;
    let returnsCount = 0;
    let giftCardsCount = 0;
    
    uniqueTickets.forEach((data) => {
      totalTransactionAmount += data.transaction_total;
      
      if (data.gross_profit_percent > 0) {
        totalGrossProfitPercent += data.gross_profit_percent;
        grossProfitCount++;
      }
      
      if (data.type === 'sale') salesCount++;
      else if (data.type === 'return') returnsCount++;
      else if (data.type === 'gift_card') giftCardsCount++;
    });
    
    return {
      totalTickets: insertedTicketNumbers.size,  // Count unique ticket numbers like your old code
      totalTransactionAmount: Math.round(totalTransactionAmount * 100) / 100,
      averageGrossProfitPercent: grossProfitCount > 0 ? Math.round((totalGrossProfitPercent / grossProfitCount) * 100) / 100 : 0,
      breakdown: {
        sales: salesCount,
        returns: returnsCount,
        giftCards: giftCardsCount
      }
    };
  },
});