import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

// Generate a simple hash of the data to detect changes
function generateDataHash(
  tickets: Doc<"ticket_history">[], 
  returns: Doc<"return_tickets">[], 
  giftCards: Doc<"gift_card_tickets">[]
): string {
  const totalCount = tickets.length + returns.length + giftCards.length;
  const lastTicket = tickets[0]?._creationTime || 0;
  const lastReturn = returns[0]?._creationTime || 0;
  const lastGiftCard = giftCards[0]?._creationTime || 0;
  
  return `${totalCount}-${lastTicket}-${lastReturn}-${lastGiftCard}`;
}

// Calculate complete metrics using ALL data (similar to ticketStats methodology)
async function calculateCompleteMetrics(ctx: any, userId: string, dateRange: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  const startDateStr = startDate.toISOString();

  // Get ALL tickets for accurate calculations
  // Using .collect() here is intentional for complete metrics accuracy in the cache
  const [allTickets, returnTickets, giftCardTickets] = await Promise.all([
    ctx.db
      .query("ticket_history")
      .filter((q: any) => 
        q.and(
          q.eq(q.field("user_id"), userId),
          q.gte(q.field("sale_date"), startDateStr)
        )
      )
      .collect(),
    ctx.db
      .query("return_tickets")
      .filter((q: any) => 
        q.and(
          q.eq(q.field("user_id"), userId),
          q.gte(q.field("sale_date"), startDateStr)
        )
      )
      .collect(),
    ctx.db
      .query("gift_card_tickets")
      .filter((q: any) => 
        q.and(
          q.eq(q.field("user_id"), userId),
          q.gte(q.field("sale_date"), startDateStr)
        )
      )
      .collect()
  ]);

  // Generate hash to detect data changes
  const dataHash = generateDataHash(allTickets, returnTickets, giftCardTickets);

  // Use exact same methodology as ticketStats.ts
  const uniqueTickets = new Set<string>();
  const uniqueSalesReps = new Set<string>();
  const uniqueStores = new Set<string>();
  const ticketTotals = new Map<string, number>();
  const ticketGrossProfitMap = new Map<string, number>();

  // Process sales tickets
  const salesTickets = new Set<string>();
  allTickets.forEach((ticket: Doc<"ticket_history">) => {
    const ticketNum = ticket.ticket_number;
    if (ticketNum) {
      uniqueTickets.add(ticketNum);
      salesTickets.add(ticketNum);
      
      if (!ticketTotals.has(ticketNum)) {
        const total = ticket.transaction_total || 0;
        ticketTotals.set(ticketNum, total);
      }
      
      if (ticket.gross_profit && !ticketGrossProfitMap.has(ticketNum)) {
        const gp = parseFloat(ticket.gross_profit.toString().replace('%', ''));
        if (!isNaN(gp)) {
          ticketGrossProfitMap.set(ticketNum, gp);
        }
      }
    }
    
    if (ticket.sales_rep) uniqueSalesReps.add(ticket.sales_rep);
    if (ticket.store_id) uniqueStores.add(ticket.store_id);
  });

  // Process return tickets
  const returnTicketSet = new Set<string>();
  returnTickets.forEach((ticket: Doc<"return_tickets">) => {
    const ticketNum = ticket.ticket_number;
    if (ticketNum) {
      uniqueTickets.add(ticketNum);
      returnTicketSet.add(ticketNum);
      
      if (!salesTickets.has(ticketNum)) {
        if (!ticketTotals.has(ticketNum)) {
          const total = ticket.transaction_total || 0;
          ticketTotals.set(ticketNum, total);
        }
        
        if (ticket.gross_profit && !ticketGrossProfitMap.has(ticketNum)) {
          const gp = parseFloat(ticket.gross_profit.toString().replace('%', ''));
          if (!isNaN(gp)) {
            ticketGrossProfitMap.set(ticketNum, gp);
          }
        }
      }
    }
    
    if (ticket.sales_rep) uniqueSalesReps.add(ticket.sales_rep);
    if (ticket.store_id) uniqueStores.add(ticket.store_id);
  });

  // Process gift card tickets
  const giftCardsByTicket = new Map<string, number>();
  giftCardTickets.forEach((ticket: Doc<"gift_card_tickets">) => {
    const ticketNum = ticket.ticket_number;
    if (ticketNum) {
      const giftAmount = ticket.giftcard_amount || 0;
      const current = giftCardsByTicket.get(ticketNum) || 0;
      giftCardsByTicket.set(ticketNum, current + giftAmount);
      
      if (ticket.sales_rep) uniqueSalesReps.add(ticket.sales_rep);
      if (ticket.store_id) uniqueStores.add(ticket.store_id);
    }
  });

  giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
    uniqueTickets.add(ticketNum);
    
    if (!salesTickets.has(ticketNum) && !returnTicketSet.has(ticketNum)) {
      ticketTotals.set(ticketNum, totalGiftAmount);
    }
  });

  // Calculate totals
  let totalTransactionAmount = 0;
  ticketTotals.forEach(total => {
    totalTransactionAmount += total;
  });

  const avgTicketSize = uniqueTickets.size > 0 
    ? totalTransactionAmount / uniqueTickets.size 
    : 0;

  let totalGrossProfit = 0;
  ticketGrossProfitMap.forEach(gp => {
    totalGrossProfit += gp;
  });
  
  const avgGrossProfit = uniqueTickets.size > 0
    ? totalGrossProfit / uniqueTickets.size
    : 0;

  // Build lookup maps for performance
  const ticketToStore = new Map<string, string>();
  const ticketToRep = new Map<string, string>();
  const ticketToDate = new Map<string, string>();
  
  allTickets.forEach((ticket: Doc<"ticket_history">) => {
    if (ticket.ticket_number) {
      if (ticket.store_id) ticketToStore.set(ticket.ticket_number, ticket.store_id);
      if (ticket.sales_rep) ticketToRep.set(ticket.ticket_number, ticket.sales_rep);
      if (ticket.sale_date) ticketToDate.set(ticket.ticket_number, ticket.sale_date.split('T')[0]);
    }
  });
  
  returnTickets.forEach((ticket: Doc<"return_tickets">) => {
    if (ticket.ticket_number) {
      if (ticket.store_id && !ticketToStore.has(ticket.ticket_number)) {
        ticketToStore.set(ticket.ticket_number, ticket.store_id);
      }
      if (ticket.sales_rep && !ticketToRep.has(ticket.ticket_number)) {
        ticketToRep.set(ticket.ticket_number, ticket.sales_rep);
      }
      if (ticket.sale_date && !ticketToDate.has(ticket.ticket_number)) {
        ticketToDate.set(ticket.ticket_number, ticket.sale_date.split('T')[0]);
      }
    }
  });
  
  giftCardTickets.forEach((ticket: Doc<"gift_card_tickets">) => {
    if (ticket.ticket_number) {
      if (ticket.store_id && !ticketToStore.has(ticket.ticket_number)) {
        ticketToStore.set(ticket.ticket_number, ticket.store_id);
      }
      if (ticket.sales_rep && !ticketToRep.has(ticket.ticket_number)) {
        ticketToRep.set(ticket.ticket_number, ticket.sales_rep);
      }
      if (ticket.sale_date && !ticketToDate.has(ticket.ticket_number)) {
        ticketToDate.set(ticket.ticket_number, ticket.sale_date.split('T')[0]);
      }
    }
  });

  // Calculate store performance
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

  let underperformingStoresCount = 0;
  const storePerformance = Array.from(storeTickets.entries()).map(([storeId, tickets]) => {
    const totalSales = storeTransactionTotals.get(storeId) || 0;
    const avgTicketSize = tickets.size > 0 ? totalSales / tickets.size : 0;
    const isUnderperforming = avgTicketSize < 70 && avgTicketSize > 0;
    
    if (isUnderperforming) underperformingStoresCount++;
    
    return {
      storeId,
      totalSales,
      ticketCount: tickets.size,
      avgTicketSize,
      isUnderperforming
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  // Calculate rep performance
  const repTickets = new Map<string, Set<string>>();
  const repTransactionTotals = new Map<string, number>();
  const repStores = new Map<string, Set<string>>();
  
  ticketTotals.forEach((total, ticketNum) => {
    const repName = ticketToRep.get(ticketNum);
    const storeId = ticketToStore.get(ticketNum);
    
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

  let underperformingRepsCount = 0;
  const repPerformance = Array.from(repTickets.entries()).map(([repName, tickets]) => {
    const totalSales = repTransactionTotals.get(repName) || 0;
    const avgTicketSize = tickets.size > 0 ? totalSales / tickets.size : 0;
    const storeCount = repStores.get(repName)?.size || 0;
    const isUnderperforming = avgTicketSize < 70 && avgTicketSize > 0;
    
    if (isUnderperforming) underperformingRepsCount++;
    
    return {
      repName,
      totalSales,
      ticketCount: tickets.size,
      avgTicketSize,
      storeCount,
      isUnderperforming
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  // Calculate sales trend for last 7 days
  const salesTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayKey = date.toISOString().split('T')[0];
    
    let dayRevenue = 0;
    let dayTransactions = 0;
    
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
    storePerformance,
    repPerformance,
    dataHash
  };
}

// Internal mutation to recalculate and cache metrics
export const recalculateMetrics = internalMutation({
  args: { 
    userId: v.string(),
    dateRanges: v.optional(v.array(v.number())) // defaults to [7, 30, 60, 90]
  },
  handler: async (ctx, args) => {
    const dateRanges = args.dateRanges || [7, 30, 60, 90];
    
    console.log(`🔄 Recalculating metrics for user ${args.userId}, ranges: ${dateRanges.join(', ')}`);
    
    for (const dateRange of dateRanges) {
      try {
        const calculatedData = await calculateCompleteMetrics(ctx, args.userId, dateRange);
        
        // Check if cache exists
        const existingCache = await ctx.db
          .query("dashboard_metrics_cache")
          .withIndex("by_user_range", (q: any) => 
            q.eq("user_id", args.userId).eq("date_range", dateRange)
          )
          .first();

        const cacheData = {
          user_id: args.userId,
          date_range: dateRange,
          metrics: calculatedData.metrics,
          salesTrend: calculatedData.salesTrend,
          storePerformance: calculatedData.storePerformance,
          repPerformance: calculatedData.repPerformance,
          last_updated: new Date().toISOString(),
          data_hash: calculatedData.dataHash
        };

        if (existingCache) {
          // Update existing cache
          await ctx.db.patch(existingCache._id, cacheData);
        } else {
          // Create new cache entry
          await ctx.db.insert("dashboard_metrics_cache", cacheData);
        }
        
        console.log(`✅ Cached metrics for ${dateRange} days, hash: ${calculatedData.dataHash}`);
      } catch (error) {
        console.error(`❌ Failed to calculate metrics for ${dateRange} days:`, error);
      }
    }
  }
});

// Mutation to trigger metric recalculation (called after uploads)
export const triggerMetricsUpdate = mutation({
  args: { 
    userId: v.string(),
    dateRanges: v.optional(v.array(v.number()))
  },
  handler: async (ctx, args) => {
    // Schedule the recalculation to run asynchronously
    await ctx.scheduler.runAfter(0, internal.dashboardCache.recalculateMetrics, {
      userId: args.userId,
      dateRanges: args.dateRanges
    });
    
    return { status: "scheduled" };
  }
});

// Helper mutation to initialize cache if it doesn't exist
export const initializeCacheIfNeeded = mutation({
  args: { 
    userId: v.string(),
    dateRange: v.number()
  },
  handler: async (ctx, args) => {
    const existingCache = await ctx.db
      .query("dashboard_metrics_cache")
      .withIndex("by_user_range", (q: any) => 
        q.eq("user_id", args.userId).eq("date_range", args.dateRange)
      )
      .first();

    if (!existingCache) {
      // No cache exists, trigger creation
      await ctx.scheduler.runAfter(0, internal.dashboardCache.recalculateMetrics, {
        userId: args.userId,
        dateRanges: [args.dateRange]
      });
      
      return { status: "cache_creation_scheduled" };
    }
    
    return { status: "cache_exists" };
  }
});

// Fast query to get cached metrics
export const getCachedDashboardMetrics = query({
  args: { 
    userId: v.string(),
    dateRange: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const dateRange = args.dateRange || 30;
    
    const cachedMetrics = await ctx.db
      .query("dashboard_metrics_cache")
      .withIndex("by_user_range", (q: any) => 
        q.eq("user_id", args.userId).eq("date_range", dateRange)
      )
      .first();

    if (!cachedMetrics) {
      // No cache exists, return default (cache will be triggered by mutation)
      console.log(`⚠️ No cache found for user ${args.userId}, range ${dateRange} days`);
      
      return {
        metrics: {
          avgTicketSize: 0,
          totalSalesReps: 0,
          totalStores: 0,
          grossProfitPercent: 0,
          totalSales: 0,
          totalTickets: 0,
          underperformingStores: 0,
          underperformingReps: 0
        },
        salesTrend: [],
        storePerformance: { all: [], underperforming: [], topPerformers: [] },
        repPerformance: { all: [], underperforming: [], topPerformers: [] },
        recentUploads: { inventory: [], tickets: [] },
        cached: false,
        lastUpdated: null
      };
    }

    // Check if cache is stale (older than 1 hour for 7-day range, 6 hours for others)
    const cacheAge = Date.now() - new Date(cachedMetrics.last_updated).getTime();
    const maxAge = dateRange <= 7 ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000; // 1 or 6 hours
    
    if (cacheAge > maxAge) {
      // Cache is stale (note: refresh will be triggered by mutation if needed)
      console.log(`⚠️ Cache is stale for user ${args.userId}, age: ${Math.round(cacheAge / 60000)} minutes`);
    }

    // Get recent uploads separately (these are quick)
    const [recentInventoryUploads, recentTicketUploads] = await Promise.all([
      ctx.db
        .query("inventory_uploads")
        .filter((q: any) => q.eq(q.field("user_id"), args.userId))
        .order("desc")
        .take(5),
      ctx.db
        .query("ticket_uploads")
        .filter((q: any) => q.eq(q.field("user_id"), args.userId))
        .order("desc")
        .take(5)
    ]);

    return {
      metrics: cachedMetrics.metrics,
      salesTrend: cachedMetrics.salesTrend,
      storePerformance: {
        all: cachedMetrics.storePerformance,
        underperforming: cachedMetrics.storePerformance.filter(s => s.isUnderperforming),
        topPerformers: cachedMetrics.storePerformance.slice(0, 5)
      },
      repPerformance: {
        all: cachedMetrics.repPerformance,
        underperforming: cachedMetrics.repPerformance.filter(r => r.isUnderperforming),
        topPerformers: cachedMetrics.repPerformance.slice(0, 5)
      },
      recentUploads: {
        inventory: recentInventoryUploads,
        tickets: recentTicketUploads
      },
      cached: true,
      lastUpdated: cachedMetrics.last_updated
    };
  }
});