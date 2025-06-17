import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAllDataWithPagination } from "./utils/pagination";

// Advanced sales rep performance analytics queries
export const getRepPerformanceData = query({
  args: {
    userId: v.string(),
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    })),
    storeId: v.optional(v.string()),
    salesRep: v.optional(v.string()),
    performanceFilter: v.optional(v.string()), // "top" | "bottom" | "all"
    minTickets: v.optional(v.number()),
    includeReturns: v.optional(v.boolean()),
    includeGiftCards: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    try {
    // Set default date range to last 30 days
    const endDate = args.dateRange?.end ? new Date(args.dateRange.end) : new Date();
    const startDate = args.dateRange?.start ? new Date(args.dateRange.start) : new Date();
    if (!args.dateRange?.start) {
      startDate.setDate(startDate.getDate() - 30);
    }

    // Calculate previous period for trend analysis
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime());
    const previousStartDate = new Date(startDate.getTime() - periodLength);

    // Get all ticket types based on filters
    const includeReturns = args.includeReturns !== false;
    const includeGiftCards = args.includeGiftCards !== false;

    // Use pagination to get ALL ticket history data
    const ticketHistory = await getAllDataWithPagination(
      ctx, 
      "ticket_history", 
      args.userId, 
      startDate.toISOString(), 
      endDate.toISOString()
    );

    // Apply store filter if needed (since pagination doesn't support additional filters yet)
    const filteredTicketHistory = args.storeId && args.storeId !== "all" 
      ? ticketHistory.filter(ticket => ticket.store_id === args.storeId)
      : ticketHistory;

    // Get ALL returns data using pagination
    let returnTickets: any[] = [];
    if (includeReturns) {
      const allReturns = await getAllDataWithPagination(
        ctx, 
        "return_tickets", 
        args.userId, 
        startDate.toISOString(), 
        endDate.toISOString()
      );

      // Apply store filter if needed
      returnTickets = args.storeId && args.storeId !== "all" 
        ? allReturns.filter(ticket => ticket.store_id === args.storeId)
        : allReturns;
    }

    // Get ALL gift cards data using pagination
    let giftCardTickets: any[] = [];
    if (includeGiftCards) {
      const allGiftCards = await getAllDataWithPagination(
        ctx, 
        "gift_card_tickets", 
        args.userId, 
        startDate.toISOString(), 
        endDate.toISOString()
      );

      // Apply store filter if needed
      giftCardTickets = args.storeId && args.storeId !== "all" 
        ? allGiftCards.filter(ticket => ticket.store_id === args.storeId)
        : allGiftCards;
    }

    // MAJOR OPTIMIZATION: Limit sales rep metadata fetch
    const salesReps = await ctx.db
      .query("sales_reps")
      .filter((q) => q.eq(q.field("user"), args.userId))
      .collect(); // Get ALL data

    // Create rep lookup map
    const repMetadata = new Map();
    salesReps.forEach(rep => {
      if (rep.rep_name) {
        repMetadata.set(rep.rep_name, {
          storeId: rep.store_id
        });
      }
    });

    // Build comprehensive rep performance data
    const repPerformance = new Map();

    // Process regular sales
    filteredTicketHistory.forEach(sale => {
      if (!sale.sales_rep) return;
      
      if (!repPerformance.has(sale.sales_rep)) {
        repPerformance.set(sale.sales_rep, {
          repName: sale.sales_rep,
          metadata: repMetadata.get(sale.sales_rep) || { storeId: sale.store_id },
          revenue: 0,
          grossProfit: 0,
          ticketCount: 0,
          itemsSold: 0,
          returns: 0,
          returnCount: 0,
          giftCardRevenue: 0,
          giftCardCount: 0,
          avgTicketSize: 0,
          grossProfitMargin: 0,
          returnRate: 0,
          lastSaleDate: null,
          firstSaleDate: null,
          topProducts: new Map(),
          hourlyDistribution: new Array(24).fill(0),
          dailyTrend: new Map()
        });
      }

      const rep = repPerformance.get(sale.sales_rep);
      rep.revenue += sale.transaction_total || 0;
      rep.ticketCount += 1;
      rep.itemsSold += sale.qty_sold || 0;
      
      // Parse gross profit if it's a string percentage
      if (sale.gross_profit) {
        const gpValue = typeof sale.gross_profit === 'string' 
          ? parseFloat(sale.gross_profit.replace('%', '')) 
          : sale.gross_profit;
        rep.grossProfit += (sale.transaction_total || 0) * (gpValue / 100);
      }

      // Track first and last sale dates
      const saleDate = new Date(sale.sale_date);
      if (!rep.firstSaleDate || saleDate < new Date(rep.firstSaleDate)) {
        rep.firstSaleDate = sale.sale_date;
      }
      if (!rep.lastSaleDate || saleDate > new Date(rep.lastSaleDate)) {
        rep.lastSaleDate = sale.sale_date;
      }

      // Track hourly distribution
      rep.hourlyDistribution[saleDate.getHours()] += 1;

      // Track daily revenue trend
      const dateKey = saleDate.toISOString().split('T')[0];
      if (!rep.dailyTrend.has(dateKey)) {
        rep.dailyTrend.set(dateKey, { revenue: 0, tickets: 0 });
      }
      const dayData = rep.dailyTrend.get(dateKey);
      dayData.revenue += sale.transaction_total || 0;
      dayData.tickets += 1;

      // Track top products
      if (sale.product_name && sale.item_number) {
        const productKey = `${sale.item_number}-${sale.product_name}`;
        if (!rep.topProducts.has(productKey)) {
          rep.topProducts.set(productKey, {
            itemNumber: sale.item_number,
            productName: sale.product_name,
            revenue: 0,
            quantity: 0,
            transactions: 0
          });
        }
        const product = rep.topProducts.get(productKey);
        product.revenue += sale.transaction_total || 0;
        product.quantity += sale.qty_sold || 0;
        product.transactions += 1;
      }
    });

    // Process returns
    returnTickets.forEach(ret => {
      if (!ret.sales_rep || !repPerformance.has(ret.sales_rep)) return;
      
      const rep = repPerformance.get(ret.sales_rep);
      rep.returns += Math.abs(ret.transaction_total || 0);
      rep.returnCount += 1;
    });

    // Process gift cards
    giftCardTickets.forEach(gc => {
      if (!gc.sales_rep || !repPerformance.has(gc.sales_rep)) return;
      
      const rep = repPerformance.get(gc.sales_rep);
      rep.giftCardRevenue += gc.giftcard_amount || 0;
      rep.giftCardCount += 1;
    });

    // Calculate derived metrics and convert to array
    const repArray = Array.from(repPerformance.values()).map(rep => {
      // Calculate average ticket size
      rep.avgTicketSize = rep.ticketCount > 0 ? rep.revenue / rep.ticketCount : 0;
      
      // Calculate gross profit margin
      rep.grossProfitMargin = rep.revenue > 0 ? (rep.grossProfit / rep.revenue) * 100 : 0;
      
      // Calculate return rate
      const totalTickets = rep.ticketCount + rep.returnCount;
      rep.returnRate = totalTickets > 0 ? (rep.returnCount / totalTickets) * 100 : 0;

      // Calculate days since last sale
      rep.daysSinceLastSale = rep.lastSaleDate 
        ? Math.floor((new Date().getTime() - new Date(rep.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Convert top products to array
      rep.topProducts = Array.from(rep.topProducts.values())
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      // Convert daily trend to array
      rep.dailyTrend = Array.from(rep.dailyTrend.entries())
        .sort((a: any, b: any) => a[0].localeCompare(b[0]))
        .map((entry: any) => {
          const [date, data] = entry;
          return { date, ...data };
        });


      return rep;
    });

    // Apply performance filter
    let filteredReps = repArray;
    
    if (args.salesRep && args.salesRep !== "all") {
      filteredReps = filteredReps.filter(rep => rep.repName === args.salesRep);
    }

    if (args.minTickets !== undefined) {
      filteredReps = filteredReps.filter(rep => rep.ticketCount >= args.minTickets!);
    }

    // Sort by revenue for performance filtering
    filteredReps.sort((a, b) => b.revenue - a.revenue);

    if (args.performanceFilter === "top") {
      filteredReps = filteredReps.slice(0, 10);
    } else if (args.performanceFilter === "bottom") {
      filteredReps = filteredReps.slice(-10).reverse();
    }

    // MAJOR OPTIMIZATION: Limit previous period data fetch
    let previousQuery = ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), previousStartDate.toISOString()),
          q.lte(q.field("sale_date"), previousEndDate.toISOString())
        )
      );

    // Apply same store filter to previous period
    if (args.storeId && args.storeId !== "all") {
      previousQuery = previousQuery.filter((q) => q.eq(q.field("store_id"), args.storeId));
    }

    const previousTicketHistory = await previousQuery.take(1000); // Limit for performance

    // Calculate previous period metrics for each rep
    const previousRepData = new Map();
    previousTicketHistory.forEach(sale => {
      if (!sale.sales_rep) return;
      
      if (!previousRepData.has(sale.sales_rep)) {
        previousRepData.set(sale.sales_rep, {
          revenue: 0,
          ticketCount: 0
        });
      }
      
      const rep = previousRepData.get(sale.sales_rep);
      rep.revenue += sale.transaction_total || 0;
      rep.ticketCount += 1;
    });

    // Add trend data to current reps
    filteredReps.forEach(rep => {
      const prevData = previousRepData.get(rep.repName);
      if (prevData) {
        rep.revenueChange = prevData.revenue > 0 
          ? ((rep.revenue - prevData.revenue) / prevData.revenue * 100).toFixed(1)
          : null;
        rep.ticketChange = prevData.ticketCount > 0
          ? ((rep.ticketCount - prevData.ticketCount) / prevData.ticketCount * 100).toFixed(1)
          : null;
      }
    });

    // Calculate company-wide averages for comparison
    const companyMetrics = {
      avgRevenue: filteredReps.reduce((sum, rep) => sum + rep.revenue, 0) / filteredReps.length,
      avgTickets: filteredReps.reduce((sum, rep) => sum + rep.ticketCount, 0) / filteredReps.length,
      avgTicketSize: filteredReps.reduce((sum, rep) => sum + rep.avgTicketSize, 0) / filteredReps.length,
      avgGPMargin: filteredReps.reduce((sum, rep) => sum + rep.grossProfitMargin, 0) / filteredReps.length,
      avgReturnRate: filteredReps.reduce((sum, rep) => sum + rep.returnRate, 0) / filteredReps.length
    };

    return {
      reps: filteredReps,
      companyMetrics,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      totalReps: repArray.length,
      filteredCount: filteredReps.length
    };
    } catch (error) {
      console.error("Error in getRepPerformanceData:", error);
      return {
        reps: [],
        companyMetrics: {
          avgRevenue: 0,
          avgTickets: 0,
          avgTicketSize: 0,
          avgGPMargin: 0,
          avgReturnRate: 0
        },
        dateRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString()
        },
        totalReps: 0,
        filteredCount: 0,
        error: "Failed to load sales rep performance data"
      };
    }
  }
});

// Get unique stores and sales reps for filters
export const getRepFilters = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
    // MAJOR OPTIMIZATION: Limit ticket history for filter generation
    const tickets = await ctx.db
      .query("ticket_history")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .take(1000); // Only need sample to get unique values

    const storeSet = new Set<string>();
    const repSet = new Set<string>();

    tickets.forEach(ticket => {
      if (ticket.store_id) storeSet.add(ticket.store_id);
      if (ticket.sales_rep) repSet.add(ticket.sales_rep);
    });

    // Get store metadata if available
    const storeList = Array.from(storeSet).sort();
    
    // MAJOR OPTIMIZATION: Limit sales rep metadata fetch
    const salesReps = await ctx.db
      .query("sales_reps")
      .filter((q) => q.eq(q.field("user"), args.userId))
      .take(100); // Limit for performance


    const repList = Array.from(repSet).map(repName => ({
      name: repName,
      storeId: "Unknown"
    })).sort((a, b) => a.name.localeCompare(b.name));

    return {
      stores: storeList,
      reps: repList
    };
    } catch (error) {
      console.error("Error in getRepFilters:", error);
      return {
        stores: [],
        reps: [],
        error: "Failed to load filter options"
      };
    }
  }
});

// Get individual rep detailed performance
export const getRepDetails = query({
  args: {
    userId: v.string(),
    repName: v.string(),
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    }))
  },
  handler: async (ctx, args) => {
    try {
    const endDate = args.dateRange?.end ? new Date(args.dateRange.end) : new Date();
    const startDate = args.dateRange?.start ? new Date(args.dateRange.start) : new Date();
    if (!args.dateRange?.start) {
      startDate.setDate(startDate.getDate() - 30);
    }

    // Get all transactions for this rep using pagination
    const allTransactions = await getAllDataWithPagination(
      ctx, 
      "ticket_history", 
      args.userId, 
      startDate.toISOString(), 
      endDate.toISOString()
    );
    
    // Filter by sales rep
    const transactions = allTransactions
      .filter(t => t.sales_rep === args.repName)
      .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());

    const allReturns = await getAllDataWithPagination(
      ctx, 
      "return_tickets", 
      args.userId, 
      startDate.toISOString(), 
      endDate.toISOString()
    );
    
    // Filter by sales rep
    const returns = allReturns
      .filter(r => r.sales_rep === args.repName)
      .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());

    // Get rep metadata
    const repData = await ctx.db
      .query("sales_reps")
      .filter((q) => q.eq(q.field("rep_name"), args.repName))
      .first();

    return {
      repInfo: repData,
      recentTransactions: transactions,
      recentReturns: returns,
      transactionCount: transactions.length,
      returnCount: returns.length
    };
    } catch (error) {
      console.error("Error in getRepDetails:", error);
      return {
        repInfo: null,
        recentTransactions: [],
        recentReturns: [],
        transactionCount: 0,
        returnCount: 0,
        error: "Failed to load rep details"
      };
    }
  }
});