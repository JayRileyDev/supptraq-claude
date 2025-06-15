import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const getDashboardOverview = query({
  args: { 
    userId: v.string(),
    dateRange: v.optional(v.number()) // days to look back, defaults to 30
  },
  handler: async (ctx, args) => {
    const dateRange = args.dateRange || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    const startDateStr = startDate.toISOString();

    // For very large date ranges, use even smaller limits
    if (dateRange > 90) {
      // Return simplified metrics for very large ranges
      const recentTickets = await ctx.db
        .query("ticket_history")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDateStr)
          )
        )
        .order("desc")
        .take(1000);

      const uniqueTickets = new Set(recentTickets.map(t => t.ticket_number));
      const totalSales = recentTickets.reduce((sum, t) => sum + (t.transaction_total || 0), 0);
      const uniqueReps = new Set(recentTickets.map(t => t.sales_rep).filter(Boolean));
      const uniqueStores = new Set(recentTickets.map(t => t.store_id).filter(Boolean));

      return {
        metrics: {
          avgTicketSize: uniqueTickets.size > 0 ? totalSales / uniqueTickets.size : 0,
          totalSalesReps: uniqueReps.size,
          totalStores: uniqueStores.size,
          grossProfitPercent: 0, // Simplified for performance
          totalSales,
          totalTickets: uniqueTickets.size,
          underperformingStores: 0,
          underperformingReps: 0
        },
        salesTrend: [],
        recentUploads: { inventory: [], tickets: [] }
      };
    }

    // Limit data for performance - dashboard overview doesn't need all data
    const maxRecords = dateRange <= 7 ? 2000 : dateRange <= 30 ? 5000 : 10000;
    
    // Get tickets with reasonable limits for dashboard performance
    const allTickets = await ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), startDateStr)
        )
      )
      .order("desc")
      .take(maxRecords);

    // Get return tickets with limits
    const returnTickets = await ctx.db
      .query("return_tickets")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), startDateStr)
        )
      )
      .order("desc")
      .take(Math.min(maxRecords / 2, 2000));

    // Get gift card tickets with limits
    const giftCardTickets = await ctx.db
      .query("gift_card_tickets")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), startDateStr)
        )
      )
      .order("desc")
      .take(Math.min(maxRecords / 4, 1000));

    // Calculate metrics using the same methodology as ticketStats.ts
    const uniqueTickets = new Set<string>();
    const uniqueSalesReps = new Set<string>();
    const uniqueStores = new Set<string>();
    const ticketTotals = new Map<string, number>();
    const ticketGrossProfitMap = new Map<string, number>();

    // Process sales tickets - collect unique ticket numbers and their totals
    const salesTickets = new Set<string>();
    allTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum) {
        uniqueTickets.add(ticketNum);
        salesTickets.add(ticketNum);
        
        // Only set transaction total once per ticket to avoid duplication
        if (!ticketTotals.has(ticketNum)) {
          const total = ticket.transaction_total || 0;
          ticketTotals.set(ticketNum, total);
        }
        
        // Collect gross profit (once per ticket)
        if (ticket.gross_profit && !ticketGrossProfitMap.has(ticketNum)) {
          const gp = parseFloat(ticket.gross_profit.toString().replace('%', ''));
          if (!isNaN(gp)) {
            ticketGrossProfitMap.set(ticketNum, gp);
          }
        }
      }
      
      // Collect unique sales reps and stores
      if (ticket.sales_rep) {
        uniqueSalesReps.add(ticket.sales_rep);
      }
      if (ticket.store_id) {
        uniqueStores.add(ticket.store_id);
      }
    });

    // Process return tickets - only add transaction total if ticket doesn't exist in sales
    const returnTicketSet = new Set<string>();
    returnTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum) {
        uniqueTickets.add(ticketNum);
        returnTicketSet.add(ticketNum);
        
        // Only add transaction total if this ticket doesn't exist in sales table
        if (!salesTickets.has(ticketNum)) {
          if (!ticketTotals.has(ticketNum)) {
            const total = ticket.transaction_total || 0;
            ticketTotals.set(ticketNum, total);
          }
          
          // Collect gross profit if not already captured
          if (ticket.gross_profit && !ticketGrossProfitMap.has(ticketNum)) {
            const gp = parseFloat(ticket.gross_profit.toString().replace('%', ''));
            if (!isNaN(gp)) {
              ticketGrossProfitMap.set(ticketNum, gp);
            }
          }
        }
      }
      
      // Collect unique sales reps and stores
      if (ticket.sales_rep) {
        uniqueSalesReps.add(ticket.sales_rep);
      }
      if (ticket.store_id) {
        uniqueStores.add(ticket.store_id);
      }
    });

    // Group gift cards by ticket number to get total per ticket
    const giftCardsByTicket = new Map<string, number>();
    giftCardTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum) {
        const giftAmount = ticket.giftcard_amount || 0;
        const current = giftCardsByTicket.get(ticketNum) || 0;
        giftCardsByTicket.set(ticketNum, current + giftAmount);
        
        // Collect unique sales reps and stores
        if (ticket.sales_rep) {
          uniqueSalesReps.add(ticket.sales_rep);
        }
        if (ticket.store_id) {
          uniqueStores.add(ticket.store_id);
        }
      }
    });

    // Process each unique gift card ticket
    giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
      uniqueTickets.add(ticketNum);
      
      if (salesTickets.has(ticketNum)) {
        // Ticket exists in sales - don't add gift card amount (already included)
      } else if (returnTicketSet.has(ticketNum)) {
        // Ticket exists in returns - don't add gift card amount (already included)
      } else {
        // Pure gift card ticket - use total gift card amount as transaction total
        ticketTotals.set(ticketNum, totalGiftAmount);
      }
    });

    // Calculate totals from unique tickets
    let totalTransactionAmount = 0;
    ticketTotals.forEach(total => {
      totalTransactionAmount += total;
    });

    // Calculate average ticket size
    const avgTicketSize = uniqueTickets.size > 0 
      ? totalTransactionAmount / uniqueTickets.size 
      : 0;

    // Calculate average gross profit percentage
    let totalGrossProfit = 0;
    ticketGrossProfitMap.forEach(gp => {
      totalGrossProfit += gp;
    });
    
    const avgGrossProfit = uniqueTickets.size > 0
      ? totalGrossProfit / uniqueTickets.size
      : 0;

    // Build efficient ticket date lookup map
    const ticketToDate = new Map<string, string>();
    
    allTickets.forEach(ticket => {
      if (ticket.ticket_number && ticket.sale_date) {
        ticketToDate.set(ticket.ticket_number, ticket.sale_date.split('T')[0]);
      }
    });
    
    returnTickets.forEach(ticket => {
      if (ticket.ticket_number && ticket.sale_date && !ticketToDate.has(ticket.ticket_number)) {
        ticketToDate.set(ticket.ticket_number, ticket.sale_date.split('T')[0]);
      }
    });
    
    giftCardTickets.forEach(ticket => {
      if (ticket.ticket_number && ticket.sale_date && !ticketToDate.has(ticket.ticket_number)) {
        ticketToDate.set(ticket.ticket_number, ticket.sale_date.split('T')[0]);
      }
    });

    // Build sales trend for last 7 days using efficient lookups
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      
      let dayRevenue = 0;
      let dayTransactions = 0;
      
      // Use efficient lookup instead of repeated finds
      ticketTotals.forEach((total, ticketNum) => {
        const ticketDate = ticketToDate.get(ticketNum);
        if (ticketDate === dayKey) {
          dayRevenue += total;
          dayTransactions++;
        }
      });
      
      salesTrend.push({
        date: dayKey,
        sales: dayRevenue,
        transactions: dayTransactions
      });
    }

    // Get recent uploads info
    const recentInventoryUploads = await ctx.db
      .query("inventory_uploads")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .order("desc")
      .take(5);

    // Get recent ticket uploads
    const recentTicketUploads = await ctx.db
      .query("ticket_uploads")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .order("desc")
      .take(5);

    // Create efficient lookup maps to avoid repeated .find() calls
    const ticketToStore = new Map<string, string>();
    const ticketToRep = new Map<string, string>();
    
    // Build lookup maps once
    allTickets.forEach(ticket => {
      if (ticket.ticket_number && ticket.store_id) {
        ticketToStore.set(ticket.ticket_number, ticket.store_id);
      }
      if (ticket.ticket_number && ticket.sales_rep) {
        ticketToRep.set(ticket.ticket_number, ticket.sales_rep);
      }
    });
    
    returnTickets.forEach(ticket => {
      if (ticket.ticket_number && ticket.store_id && !ticketToStore.has(ticket.ticket_number)) {
        ticketToStore.set(ticket.ticket_number, ticket.store_id);
      }
      if (ticket.ticket_number && ticket.sales_rep && !ticketToRep.has(ticket.ticket_number)) {
        ticketToRep.set(ticket.ticket_number, ticket.sales_rep);
      }
    });
    
    giftCardTickets.forEach(ticket => {
      if (ticket.ticket_number && ticket.store_id && !ticketToStore.has(ticket.ticket_number)) {
        ticketToStore.set(ticket.ticket_number, ticket.store_id);
      }
      if (ticket.ticket_number && ticket.sales_rep && !ticketToRep.has(ticket.ticket_number)) {
        ticketToRep.set(ticket.ticket_number, ticket.sales_rep);
      }
    });

    // Calculate stores with low average sales using efficient lookups
    const storeTickets = new Map<string, Set<string>>();
    const storeTransactionTotals = new Map<string, number>();
    
    ticketTotals.forEach((total, ticketNum) => {
      const storeId = ticketToStore.get(ticketNum);
      if (storeId) {
        if (!storeTickets.has(storeId)) {
          storeTickets.set(storeId, new Set());
          storeTransactionTotals.set(storeId, 0);
        }
        
        storeTickets.get(storeId)!.add(ticketNum);
        storeTransactionTotals.set(storeId, (storeTransactionTotals.get(storeId) || 0) + total);
      }
    });

    // Count stores with average under $70
    let underperformingStoresCount = 0;
    storeTickets.forEach((tickets, storeId) => {
      const totalSales = storeTransactionTotals.get(storeId) || 0;
      const avgSale = tickets.size > 0 ? totalSales / tickets.size : 0;
      if (avgSale < 70 && avgSale > 0) {
        underperformingStoresCount++;
      }
    });

    // Calculate sales rep performance using efficient lookups
    const repTickets = new Map<string, Set<string>>();
    const repTransactionTotals = new Map<string, number>();
    
    ticketTotals.forEach((total, ticketNum) => {
      const repName = ticketToRep.get(ticketNum);
      if (repName) {
        if (!repTickets.has(repName)) {
          repTickets.set(repName, new Set());
          repTransactionTotals.set(repName, 0);
        }
        
        repTickets.get(repName)!.add(ticketNum);
        repTransactionTotals.set(repName, (repTransactionTotals.get(repName) || 0) + total);
      }
    });

    // Count reps with average under $70
    let underperformingRepsCount = 0;
    repTickets.forEach((tickets, repName) => {
      const totalSales = repTransactionTotals.get(repName) || 0;
      const avgSale = tickets.size > 0 ? totalSales / tickets.size : 0;
      if (avgSale < 70 && avgSale > 0) {
        underperformingRepsCount++;
      }
    });

    return {
      metrics: {
        avgTicketSize,
        totalSalesReps: uniqueSalesReps.size,
        totalStores: uniqueStores.size,
        grossProfitPercent: avgGrossProfit,
        totalSales: totalTransactionAmount,
        totalTickets: uniqueTickets.size,
        underperformingStores: underperformingStoresCount,
        underperformingReps: underperformingRepsCount
      },
      salesTrend,
      recentUploads: {
        inventory: recentInventoryUploads,
        tickets: recentTicketUploads
      }
    };
  },
});

export const getStorePerformance = query({
  args: { 
    userId: v.string(),
    dateRange: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const dateRange = args.dateRange || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    const startDateStr = startDate.toISOString();

    // Limit data for performance
    const maxRecords = dateRange <= 7 ? 3000 : dateRange <= 30 ? 8000 : 15000;

    // Get tickets with limits for performance
    const [allTickets, returnTickets, giftCardTickets] = await Promise.all([
      ctx.db
        .query("ticket_history")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDateStr)
          )
        )
        .order("desc")
        .take(maxRecords),
      ctx.db
        .query("return_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDateStr)
          )
        )
        .order("desc")
        .take(Math.min(maxRecords / 2, 3000)),
      ctx.db
        .query("gift_card_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDateStr)
          )
        )
        .order("desc")
        .take(Math.min(maxRecords / 4, 1500))
    ]);

    // Use the same calculation methodology as ticketStats.ts
    const ticketTotals = new Map<string, number>();
    const salesTickets = new Set<string>();

    // Process sales tickets
    allTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum && !ticketTotals.has(ticketNum)) {
        const total = ticket.transaction_total || 0;
        ticketTotals.set(ticketNum, total);
        salesTickets.add(ticketNum);
      }
    });

    // Process return tickets
    const returnTicketSet = new Set<string>();
    returnTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum) {
        returnTicketSet.add(ticketNum);
        if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum)) {
          const total = ticket.transaction_total || 0;
          ticketTotals.set(ticketNum, total);
        }
      }
    });

    // Process gift card tickets
    const giftCardsByTicket = new Map<string, number>();
    giftCardTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum) {
        const giftAmount = ticket.giftcard_amount || 0;
        const current = giftCardsByTicket.get(ticketNum) || 0;
        giftCardsByTicket.set(ticketNum, current + giftAmount);
      }
    });

    giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
      if (!salesTickets.has(ticketNum) && !returnTicketSet.has(ticketNum)) {
        ticketTotals.set(ticketNum, totalGiftAmount);
      }
    });

    // Group by store using unique tickets
    const storeTickets = new Map<string, Set<string>>();
    const storeTransactionTotals = new Map<string, number>();
    
    ticketTotals.forEach((total, ticketNum) => {
      let storeId: string | null = null;
      
      // Find store for this ticket
      const salesTicket = allTickets.find(t => t.ticket_number === ticketNum);
      if (salesTicket?.store_id) {
        storeId = salesTicket.store_id;
      } else {
        const returnTicket = returnTickets.find(t => t.ticket_number === ticketNum);
        if (returnTicket?.store_id) {
          storeId = returnTicket.store_id;
        } else {
          const giftCardTicket = giftCardTickets.find(t => t.ticket_number === ticketNum);
          if (giftCardTicket?.store_id) {
            storeId = giftCardTicket.store_id;
          }
        }
      }
      
      if (storeId) {
        if (!storeTickets.has(storeId)) {
          storeTickets.set(storeId, new Set());
          storeTransactionTotals.set(storeId, 0);
        }
        
        storeTickets.get(storeId)!.add(ticketNum);
        storeTransactionTotals.set(storeId, (storeTransactionTotals.get(storeId) || 0) + total);
      }
    });

    // Convert to array and calculate averages
    const storePerformance = Array.from(storeTickets.entries())
      .map(([storeId, tickets]) => {
        const totalSales = storeTransactionTotals.get(storeId) || 0;
        const avgTicketSize = tickets.size > 0 ? totalSales / tickets.size : 0;
        
        return {
          storeId,
          totalSales,
          ticketCount: tickets.size,
          avgTicketSize,
          isUnderperforming: avgTicketSize < 70 && avgTicketSize > 0
        };
      })
      .filter(store => store.ticketCount > 0)
      .sort((a, b) => b.totalSales - a.totalSales);

    return {
      all: storePerformance,
      underperforming: storePerformance.filter(s => s.isUnderperforming),
      topPerformers: storePerformance.slice(0, 5)
    };
  },
});

export const getSalesRepPerformance = query({
  args: { 
    userId: v.string(),
    dateRange: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const dateRange = args.dateRange || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    const startDateStr = startDate.toISOString();

    // Limit data for performance
    const maxRecords = dateRange <= 7 ? 3000 : dateRange <= 30 ? 8000 : 15000;

    // Get tickets with limits for performance
    const [allTickets, returnTickets, giftCardTickets] = await Promise.all([
      ctx.db
        .query("ticket_history")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDateStr)
          )
        )
        .order("desc")
        .take(maxRecords),
      ctx.db
        .query("return_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDateStr)
          )
        )
        .order("desc")
        .take(Math.min(maxRecords / 2, 3000)),
      ctx.db
        .query("gift_card_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDateStr)
          )
        )
        .order("desc")
        .take(Math.min(maxRecords / 4, 1500))
    ]);

    // Use the same calculation methodology as ticketStats.ts
    const ticketTotals = new Map<string, number>();
    const salesTickets = new Set<string>();

    // Process sales tickets
    allTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum && !ticketTotals.has(ticketNum)) {
        const total = ticket.transaction_total || 0;
        ticketTotals.set(ticketNum, total);
        salesTickets.add(ticketNum);
      }
    });

    // Process return tickets
    const returnTicketSet = new Set<string>();
    returnTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum) {
        returnTicketSet.add(ticketNum);
        if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum)) {
          const total = ticket.transaction_total || 0;
          ticketTotals.set(ticketNum, total);
        }
      }
    });

    // Process gift card tickets
    const giftCardsByTicket = new Map<string, number>();
    giftCardTickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum) {
        const giftAmount = ticket.giftcard_amount || 0;
        const current = giftCardsByTicket.get(ticketNum) || 0;
        giftCardsByTicket.set(ticketNum, current + giftAmount);
      }
    });

    giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
      if (!salesTickets.has(ticketNum) && !returnTicketSet.has(ticketNum)) {
        ticketTotals.set(ticketNum, totalGiftAmount);
      }
    });

    // Group by sales rep using unique tickets
    const repTickets = new Map<string, Set<string>>();
    const repTransactionTotals = new Map<string, number>();
    const repStores = new Map<string, Set<string>>();
    
    ticketTotals.forEach((total, ticketNum) => {
      let repName: string | null = null;
      let storeId: string | null = null;
      
      // Find rep and store for this ticket
      const salesTicket = allTickets.find(t => t.ticket_number === ticketNum);
      if (salesTicket?.sales_rep) {
        repName = salesTicket.sales_rep;
        storeId = salesTicket.store_id;
      } else {
        const returnTicket = returnTickets.find(t => t.ticket_number === ticketNum);
        if (returnTicket?.sales_rep) {
          repName = returnTicket.sales_rep;
          storeId = returnTicket.store_id;
        } else {
          const giftCardTicket = giftCardTickets.find(t => t.ticket_number === ticketNum);
          if (giftCardTicket?.sales_rep) {
            repName = giftCardTicket.sales_rep;
            storeId = giftCardTicket.store_id;
          }
        }
      }
      
      if (repName) {
        if (!repTickets.has(repName)) {
          repTickets.set(repName, new Set());
          repTransactionTotals.set(repName, 0);
          repStores.set(repName, new Set());
        }
        
        repTickets.get(repName)!.add(ticketNum);
        repTransactionTotals.set(repName, (repTransactionTotals.get(repName) || 0) + total);
        
        if (storeId) {
          repStores.get(repName)!.add(storeId);
        }
      }
    });

    // Convert to array and calculate averages
    const repPerformance = Array.from(repTickets.entries())
      .map(([repName, tickets]) => {
        const totalSales = repTransactionTotals.get(repName) || 0;
        const avgTicketSize = tickets.size > 0 ? totalSales / tickets.size : 0;
        const storeCount = repStores.get(repName)?.size || 0;
        
        return {
          repName,
          totalSales,
          ticketCount: tickets.size,
          avgTicketSize,
          storeCount,
          isUnderperforming: avgTicketSize < 70 && avgTicketSize > 0
        };
      })
      .filter(rep => rep.ticketCount > 0)
      .sort((a, b) => b.totalSales - a.totalSales);

    return {
      all: repPerformance,
      underperforming: repPerformance.filter(r => r.isUnderperforming),
      topPerformers: repPerformance.slice(0, 5)
    };
  },
});

// New query for revenue by week selection
export const getRevenueByWeek = query({
  args: { 
    userId: v.string(),
    weekOffset: v.optional(v.number()) // 0 = current week, 1 = last week, etc.
  },
  handler: async (ctx, args) => {
    const weekOffset = args.weekOffset || 0;
    
    // Calculate the start and end of the selected week
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSunday = currentDayOfWeek === 0 ? 0 : currentDayOfWeek;
    
    // Get to the most recent Sunday
    const mostRecentSunday = new Date(today);
    mostRecentSunday.setDate(today.getDate() - daysToSunday);
    mostRecentSunday.setHours(0, 0, 0, 0);
    
    // Go back by weekOffset weeks
    const weekStart = new Date(mostRecentSunday);
    weekStart.setDate(weekStart.getDate() - (weekOffset * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    // Get transactions for the selected week with limits for performance
    const [tickets, giftCards, returns] = await Promise.all([
      ctx.db
        .query("ticket_history")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), weekStart.toISOString()),
            q.lt(q.field("sale_date"), weekEnd.toISOString())
          )
        )
        .order("desc")
        .take(5000),
      ctx.db
        .query("gift_card_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), weekStart.toISOString()),
            q.lt(q.field("sale_date"), weekEnd.toISOString())
          )
        )
        .order("desc")
        .take(1000),
      ctx.db
        .query("return_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), weekStart.toISOString()),
            q.lt(q.field("sale_date"), weekEnd.toISOString())
          )
        )
        .order("desc")
        .take(2000)
    ]);

    // Calculate daily revenue using the same methodology as ticketStats.ts
    const ticketTotals = new Map<string, number>();
    const salesTickets = new Set<string>();

    // Process sales tickets
    tickets.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum && !ticketTotals.has(ticketNum)) {
        const total = ticket.transaction_total || 0;
        ticketTotals.set(ticketNum, total);
        salesTickets.add(ticketNum);
      }
    });

    // Process return tickets
    const returnTicketSet = new Set<string>();
    returns.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum) {
        returnTicketSet.add(ticketNum);
        if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum)) {
          const total = ticket.transaction_total || 0;
          ticketTotals.set(ticketNum, total);
        }
      }
    });

    // Process gift card tickets
    const giftCardsByTicket = new Map<string, number>();
    giftCards.forEach(ticket => {
      const ticketNum = ticket.ticket_number;
      if (ticketNum) {
        const giftAmount = ticket.giftcard_amount || 0;
        const current = giftCardsByTicket.get(ticketNum) || 0;
        giftCardsByTicket.set(ticketNum, current + giftAmount);
      }
    });

    giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
      if (!salesTickets.has(ticketNum) && !returnTicketSet.has(ticketNum)) {
        ticketTotals.set(ticketNum, totalGiftAmount);
      }
    });

    // Group tickets by date and calculate daily revenue
    const dailyRevenue = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      let dayRevenue = 0;
      let dayTransactions = 0;
      
      // Find all tickets for this day and sum their totals (avoiding duplicates)
      ticketTotals.forEach((total, ticketNum) => {
        // Check if this ticket belongs to this day
        let ticketDate: string | null = null;
        
        const salesTicket = tickets.find(t => t.ticket_number === ticketNum);
        if (salesTicket?.sale_date.startsWith(dateStr)) {
          ticketDate = dateStr;
        } else {
          const returnTicket = returns.find(t => t.ticket_number === ticketNum);
          if (returnTicket?.sale_date.startsWith(dateStr)) {
            ticketDate = dateStr;
          } else {
            const giftCardTicket = giftCards.find(t => t.ticket_number === ticketNum);
            if (giftCardTicket?.sale_date.startsWith(dateStr)) {
              ticketDate = dateStr;
            }
          }
        }
        
        if (ticketDate === dateStr) {
          dayRevenue += total;
          dayTransactions++;
        }
      });
      
      dailyRevenue.push({
        date: dateStr,
        dayOfWeek: date.toLocaleDateString(undefined, { weekday: 'short' }),
        sales: dayRevenue,
        transactions: dayTransactions
      });
    }

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      dailyRevenue,
      totalRevenue: dailyRevenue.reduce((sum, day) => sum + day.sales, 0),
      totalTransactions: dailyRevenue.reduce((sum, day) => sum + day.transactions, 0)
    };
  },
});