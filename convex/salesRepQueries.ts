import { query } from "./_generated/server";
import { v } from "convex/values";

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

    // Fetch sales data
    let ticketHistory = await ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), startDate.toISOString()),
          q.lte(q.field("sale_date"), endDate.toISOString())
        )
      )
      .collect();

    // Apply store filter
    if (args.storeId && args.storeId !== "all") {
      ticketHistory = ticketHistory.filter(sale => sale.store_id === args.storeId);
    }

    // Fetch returns if included
    let returnTickets: any[] = [];
    if (includeReturns) {
      returnTickets = await ctx.db
        .query("return_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDate.toISOString()),
            q.lte(q.field("sale_date"), endDate.toISOString())
          )
        )
        .collect();

      if (args.storeId && args.storeId !== "all") {
        returnTickets = returnTickets.filter(ret => ret.store_id === args.storeId);
      }
    }

    // Fetch gift cards if included
    let giftCardTickets: any[] = [];
    if (includeGiftCards) {
      giftCardTickets = await ctx.db
        .query("gift_card_tickets")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), args.userId),
            q.gte(q.field("sale_date"), startDate.toISOString()),
            q.lte(q.field("sale_date"), endDate.toISOString())
          )
        )
        .collect();

      if (args.storeId && args.storeId !== "all") {
        giftCardTickets = giftCardTickets.filter(gc => gc.store_id === args.storeId);
      }
    }

    // Get sales rep metadata
    const salesReps = await ctx.db
      .query("sales_reps")
      .collect();

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
    ticketHistory.forEach(sale => {
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

    // Get previous period data for trends
    const previousTicketHistory = await ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), previousStartDate.toISOString()),
          q.lte(q.field("sale_date"), previousEndDate.toISOString())
        )
      )
      .collect();

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
    // Get all unique stores and reps from ticket history
    const tickets = await ctx.db
      .query("ticket_history")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .collect();

    const storeSet = new Set<string>();
    const repSet = new Set<string>();

    tickets.forEach(ticket => {
      if (ticket.store_id) storeSet.add(ticket.store_id);
      if (ticket.sales_rep) repSet.add(ticket.sales_rep);
    });

    // Get store metadata if available
    const storeList = Array.from(storeSet).sort();
    
    // Get rep metadata
    const salesReps = await ctx.db
      .query("sales_reps")
      .collect();


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

    // Get all transactions for this rep
    const transactions = await ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.eq(q.field("sales_rep"), args.repName),
          q.gte(q.field("sale_date"), startDate.toISOString()),
          q.lte(q.field("sale_date"), endDate.toISOString())
        )
      )
      .order("desc")
      .take(100);

    const returns = await ctx.db
      .query("return_tickets")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.eq(q.field("sales_rep"), args.repName),
          q.gte(q.field("sale_date"), startDate.toISOString()),
          q.lte(q.field("sale_date"), endDate.toISOString())
        )
      )
      .order("desc")
      .take(50);

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