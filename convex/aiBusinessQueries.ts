import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { getUserContext } from "./accessControl";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format percentage
const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

// Get worst performing stores
export const getWorstPerformingStores = internalQuery({
  args: { 
    limit: v.optional(v.number()),
    dateRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const limit = args.limit || 5;
    const dateRange = args.dateRange || 7; // Default to 7 days
    
    // Calculate date threshold
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dateRange);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get all ticket history for the user within date range
    const tickets = await ctx.db
      .query("ticket_history")
      .withIndex("by_store_id")
      .filter((q) => 
        q.and(
          q.eq(q.field("franchiseId"), userContext.franchiseId),
          q.gte(q.field("sale_date"), startDateStr)
        )
      )
      .collect();
    
    // Group by store and calculate metrics
    const storeMetrics = new Map<string, {
      totalRevenue: number;
      ticketCount: number;
      avgTicket: number;
      grossProfit: number;
    }>();
    
    tickets.forEach(ticket => {
      const storeId = ticket.store_id;
      const current = storeMetrics.get(storeId) || {
        totalRevenue: 0,
        ticketCount: 0,
        avgTicket: 0,
        grossProfit: 0,
      };
      
      current.totalRevenue += ticket.transaction_total || 0;
      current.ticketCount += 1;
      current.grossProfit += parseFloat(ticket.gross_profit || "0");
      
      storeMetrics.set(storeId, current);
    });
    
    // Calculate averages and sort by average ticket (ascending for worst)
    const sortedStores = Array.from(storeMetrics.entries())
      .map(([storeId, metrics]) => ({
        storeId,
        ...metrics,
        avgTicket: metrics.ticketCount > 0 ? metrics.totalRevenue / metrics.ticketCount : 0,
        grossProfitPercent: metrics.totalRevenue > 0 ? metrics.grossProfit / metrics.totalRevenue : 0,
      }))
      .sort((a, b) => a.avgTicket - b.avgTicket)
      .slice(0, limit);
    
    return {
      stores: sortedStores,
      dateRange,
      franchiseAvgTicket: 85, // This would be calculated from all stores
    };
  },
});

// Get sales rep performance
export const getSalesRepPerformance = internalQuery({
  args: {
    month: v.optional(v.string()), // Format: "YYYY-MM"
    metric: v.optional(v.string()), // "avgTicket", "totalSales", "returns"
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const targetMonth = args.month || new Date().toISOString().substring(0, 7);
    const [year, month] = targetMonth.split('-');
    
    // Get all tickets for the month
    const tickets = await ctx.db
      .query("ticket_history")
      .filter((q) =>
        q.and(
          q.eq(q.field("franchiseId"), userContext.franchiseId),
          q.gte(q.field("sale_date"), `${targetMonth}-01`),
          q.lt(q.field("sale_date"), `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`)
        )
      )
      .collect();
    
    // Get return tickets
    const returns = await ctx.db
      .query("return_tickets")
      .filter((q) =>
        q.and(
          q.eq(q.field("franchiseId"), userContext.franchiseId),
          q.gte(q.field("sale_date"), `${targetMonth}-01`),
          q.lt(q.field("sale_date"), `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`)
        )
      )
      .collect();
    
    // Group by sales rep
    const repMetrics = new Map<string, {
      totalSales: number;
      ticketCount: number;
      returnCount: number;
      returnAmount: number;
      stores: Set<string>;
    }>();
    
    tickets.forEach(ticket => {
      const rep = ticket.sales_rep || "Unknown";
      const current = repMetrics.get(rep) || {
        totalSales: 0,
        ticketCount: 0,
        returnCount: 0,
        returnAmount: 0,
        stores: new Set(),
      };
      
      current.totalSales += ticket.transaction_total || 0;
      current.ticketCount += 1;
      current.stores.add(ticket.store_id);
      
      repMetrics.set(rep, current);
    });
    
    // Add return data
    returns.forEach(returnTicket => {
      const rep = returnTicket.sales_rep || "Unknown";
      const current = repMetrics.get(rep) || {
        totalSales: 0,
        ticketCount: 0,
        returnCount: 0,
        returnAmount: 0,
        stores: new Set(),
      };
      
      current.returnCount += 1;
      current.returnAmount += Math.abs(returnTicket.transaction_total || 0);
      
      repMetrics.set(rep, current);
    });
    
    // Calculate final metrics
    const repsWithMetrics = Array.from(repMetrics.entries())
      .map(([repName, metrics]) => ({
        repName,
        avgTicket: metrics.ticketCount > 0 ? metrics.totalSales / metrics.ticketCount : 0,
        totalSales: metrics.totalSales,
        ticketCount: metrics.ticketCount,
        returnRate: metrics.ticketCount > 0 ? metrics.returnCount / metrics.ticketCount : 0,
        returnAmount: metrics.returnAmount,
        storeCount: metrics.stores.size,
      }));
    
    // Sort based on requested metric
    const sortedReps = repsWithMetrics.sort((a, b) => {
      switch (args.metric) {
        case "totalSales":
          return a.totalSales - b.totalSales; // Ascending for worst
        case "returns":
          return b.returnRate - a.returnRate; // Descending for worst
        default: // avgTicket
          return a.avgTicket - b.avgTicket; // Ascending for worst
      }
    });
    
    return {
      reps: sortedReps.slice(0, 10), // Top 10 worst
      month: targetMonth,
      metric: args.metric || "avgTicket",
    };
  },
});

// Get total inventory value
export const getTotalInventoryValue = internalQuery({
  args: {
    storeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    // Get SKU vendor map for retail prices
    const skuMap = await ctx.db
      .query("sku_vendor_map")
      .collect();
    
    const priceMap = new Map(
      skuMap.map(sku => [sku.item_number, parseFloat(sku.retail_price || "0")])
    );
    
    // Query inventory lines
    let inventoryQuery = ctx.db
      .query("inventory_lines")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId));
    
    if (args.storeId) {
      inventoryQuery = inventoryQuery.filter((q) => 
        q.eq(q.field("store_id"), args.storeId)
      );
    }
    
    const inventory = await inventoryQuery.collect();
    
    // Calculate total value and group by store
    const storeValues = new Map<string, {
      totalValue: number;
      itemCount: number;
      uniqueSkus: number;
    }>();
    
    inventory.forEach(item => {
      const retailPrice = priceMap.get(item.item_number) || 0;
      const itemValue = retailPrice * item.qty_on_hand;
      
      const current = storeValues.get(item.store_id) || {
        totalValue: 0,
        itemCount: 0,
        uniqueSkus: 0,
      };
      
      current.totalValue += itemValue;
      current.itemCount += item.qty_on_hand;
      current.uniqueSkus += 1;
      
      storeValues.set(item.store_id, current);
    });
    
    const totalValue = Array.from(storeValues.values())
      .reduce((sum, store) => sum + store.totalValue, 0);
    
    return {
      totalValue,
      storeBreakdown: Array.from(storeValues.entries())
        .map(([storeId, values]) => ({
          storeId,
          ...values,
        }))
        .sort((a, b) => b.totalValue - a.totalValue),
    };
  },
});

// Get overstocked items
export const getOverstockedItems = internalQuery({
  args: {
    threshold: v.optional(v.number()), // Days of inventory
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const daysThreshold = args.threshold || 90; // Default 90 days
    
    // Get inventory and sales data
    const inventory = await ctx.db
      .query("inventory_lines")
      .withIndex("by_user_id")
      .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
      .collect();
    
    // Get last 30 days of sales
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const salesStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const sales = await ctx.db
      .query("ticket_history")
      .filter((q) =>
        q.and(
          q.eq(q.field("franchiseId"), userContext.franchiseId),
          q.gte(q.field("sale_date"), salesStartDate)
        )
      )
      .collect();
    
    // Calculate sales velocity by item
    const salesVelocity = new Map<string, number>();
    sales.forEach(sale => {
      if (sale.item_number) {
        const current = salesVelocity.get(sale.item_number) || 0;
        salesVelocity.set(sale.item_number, current + (sale.qty_sold || 0));
      }
    });
    
    // Find overstocked items
    const overstockedItems = inventory
      .filter(item => {
        const monthlySales = salesVelocity.get(item.item_number) || 0;
        const dailySales = monthlySales / 30;
        const daysOfInventory = dailySales > 0 ? item.qty_on_hand / dailySales : Infinity;
        
        return daysOfInventory > daysThreshold;
      })
      .map(item => {
        const monthlySales = salesVelocity.get(item.item_number) || 0;
        const dailySales = monthlySales / 30;
        const daysOfInventory = dailySales > 0 ? item.qty_on_hand / dailySales : Infinity;
        
        return {
          itemNumber: item.item_number,
          productName: item.product_name,
          storeId: item.store_id,
          qtyOnHand: item.qty_on_hand,
          monthlySales,
          daysOfInventory: Math.round(daysOfInventory),
          vendor: item.primary_vendor,
        };
      })
      .sort((a, b) => b.daysOfInventory - a.daysOfInventory)
      .slice(0, 20); // Top 20 most overstocked
    
    // Group by store for summary
    const storeCount = new Map<string, number>();
    overstockedItems.forEach(item => {
      storeCount.set(item.storeId, (storeCount.get(item.storeId) || 0) + 1);
    });
    
    return {
      items: overstockedItems,
      totalOverstocked: overstockedItems.length,
      storesAffected: storeCount.size,
      threshold: daysThreshold,
    };
  },
});

// Get returns analysis
export const getReturnsAnalysis = internalQuery({
  args: {
    period: v.optional(v.string()), // "lastMonth", "thisMonth", "lastWeek"
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const period = args.period || "lastMonth";
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (period) {
      case "thisMonth":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case "lastWeek":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
        break;
      default: // lastMonth
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get returns
    const returns = await ctx.db
      .query("return_tickets")
      .filter((q) =>
        q.and(
          q.eq(q.field("franchiseId"), userContext.franchiseId),
          q.gte(q.field("sale_date"), startDateStr),
          q.lte(q.field("sale_date"), endDateStr)
        )
      )
      .collect();
    
    // Get sales for comparison
    const sales = await ctx.db
      .query("ticket_history")
      .filter((q) =>
        q.and(
          q.eq(q.field("franchiseId"), userContext.franchiseId),
          q.gte(q.field("sale_date"), startDateStr),
          q.lte(q.field("sale_date"), endDateStr)
        )
      )
      .collect();
    
    // Group returns by rep
    const repReturns = new Map<string, {
      returnCount: number;
      returnAmount: number;
      items: Map<string, number>;
      stores: Set<string>;
    }>();
    
    returns.forEach(ret => {
      const rep = ret.sales_rep || "Unknown";
      const current = repReturns.get(rep) || {
        returnCount: 0,
        returnAmount: 0,
        items: new Map(),
        stores: new Set(),
      };
      
      current.returnCount += 1;
      current.returnAmount += Math.abs(ret.transaction_total || 0);
      current.stores.add(ret.store_id);
      
      if (ret.item_number) {
        current.items.set(ret.item_number, (current.items.get(ret.item_number) || 0) + 1);
      }
      
      repReturns.set(rep, current);
    });
    
    // Count sales by rep for return rate
    const repSales = new Map<string, number>();
    sales.forEach(sale => {
      const rep = sale.sales_rep || "Unknown";
      repSales.set(rep, (repSales.get(rep) || 0) + 1);
    });
    
    // Calculate metrics
    const repAnalysis = Array.from(repReturns.entries())
      .map(([repName, returnData]) => {
        const salesCount = repSales.get(repName) || 0;
        const topReturnedItem = Array.from(returnData.items.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        return {
          repName,
          returnCount: returnData.returnCount,
          returnAmount: returnData.returnAmount,
          returnRate: salesCount > 0 ? returnData.returnCount / salesCount : 0,
          salesCount,
          topReturnedItem: topReturnedItem ? topReturnedItem[0] : null,
          storeCount: returnData.stores.size,
        };
      })
      .sort((a, b) => b.returnCount - a.returnCount);
    
    return {
      topReturners: repAnalysis.slice(0, 5),
      totalReturns: returns.length,
      totalReturnAmount: returns.reduce((sum, ret) => sum + Math.abs(ret.transaction_total || 0), 0),
      period,
      dateRange: { start: startDateStr, end: endDateStr },
    };
  },
});

// Get store improvement analysis
export const getStoreImprovements = internalQuery({
  args: {
    comparisonPeriod: v.optional(v.string()), // "week", "month"
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const period = args.comparisonPeriod || "week";
    const daysInPeriod = period === "week" ? 7 : 30;
    
    const now = new Date();
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - daysInPeriod);
    
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysInPeriod);
    
    // Get sales for both periods
    const allSales = await ctx.db
      .query("ticket_history")
      .withIndex("by_store_id")
      .filter((q) =>
        q.and(
          q.eq(q.field("franchiseId"), userContext.franchiseId),
          q.gte(q.field("sale_date"), previousPeriodStart.toISOString().split('T')[0])
        )
      )
      .collect();
    
    // Split into current and previous period
    const currentPeriodStartStr = currentPeriodStart.toISOString().split('T')[0];
    
    const currentSales = allSales.filter(s => s.sale_date >= currentPeriodStartStr);
    const previousSales = allSales.filter(s => s.sale_date < currentPeriodStartStr);
    
    // Calculate metrics by store for each period
    const calculateStoreMetrics = (sales: typeof allSales) => {
      const metrics = new Map<string, {
        revenue: number;
        tickets: number;
        avgTicket: number;
      }>();
      
      sales.forEach(sale => {
        const current = metrics.get(sale.store_id) || {
          revenue: 0,
          tickets: 0,
          avgTicket: 0,
        };
        
        current.revenue += sale.transaction_total || 0;
        current.tickets += 1;
        
        metrics.set(sale.store_id, current);
      });
      
      // Calculate averages
      metrics.forEach((value, key) => {
        value.avgTicket = value.tickets > 0 ? value.revenue / value.tickets : 0;
      });
      
      return metrics;
    };
    
    const currentMetrics = calculateStoreMetrics(currentSales);
    const previousMetrics = calculateStoreMetrics(previousSales);
    
    // Calculate improvements
    const improvements = Array.from(currentMetrics.entries())
      .map(([storeId, current]) => {
        const previous = previousMetrics.get(storeId) || {
          revenue: 0,
          tickets: 0,
          avgTicket: 0,
        };
        
        const revenueChange = previous.revenue > 0 
          ? (current.revenue - previous.revenue) / previous.revenue 
          : 0;
        
        const ticketChange = previous.tickets > 0
          ? (current.tickets - previous.tickets) / previous.tickets
          : 0;
        
        const avgTicketChange = previous.avgTicket > 0
          ? (current.avgTicket - previous.avgTicket) / previous.avgTicket
          : 0;
        
        return {
          storeId,
          currentRevenue: current.revenue,
          previousRevenue: previous.revenue,
          revenueChange,
          ticketChange,
          avgTicketChange,
          improvementScore: (revenueChange + ticketChange + avgTicketChange) / 3,
        };
      })
      .filter(store => store.previousRevenue > 0) // Only include stores with previous data
      .sort((a, b) => b.improvementScore - a.improvementScore);
    
    return {
      mostImproved: improvements.slice(0, 5),
      leastImproved: improvements.slice(-5).reverse(),
      period,
      dateRange: {
        current: { start: currentPeriodStartStr, end: now.toISOString().split('T')[0] },
        previous: { start: previousPeriodStart.toISOString().split('T')[0], end: currentPeriodStartStr },
      },
    };
  },
});

// Master query to get business context for AI
export const getBusinessContext = query({
  args: {
    query: v.string(),
    dateRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const userContext = await getUserContext(ctx.auth, ctx.db);
      console.log("User context obtained successfully");
    } catch (error) {
      return {
        error: "User not authenticated or not found",
        query: args.query,
        timestamp: new Date().toISOString(),
      };
    }
    
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    // Parse the query to determine what data to fetch
    const queryLower = args.query.toLowerCase();
    
    // Determine which data to fetch based on query
    const context: any = {
      query: args.query,
      timestamp: new Date().toISOString(),
      userId: userContext.userId,
      franchiseId: userContext.franchiseId,
      orgId: userContext.orgId,
    };
    
    // Always include some basic metrics for context
    const dashboardMetrics = await ctx.db
      .query("dashboard_metrics_cache")
      .withIndex("by_user_range", (q) => 
        q.eq("user_id", userContext.userId).eq("date_range", 7)
      )
      .first();
    
    if (dashboardMetrics) {
      context.currentMetrics = {
        avgTicketSize: dashboardMetrics.metrics.avgTicketSize,
        totalStores: dashboardMetrics.metrics.totalStores,
        totalSalesReps: dashboardMetrics.metrics.totalSalesReps,
        grossProfitPercent: dashboardMetrics.metrics.grossProfitPercent,
        totalSales: dashboardMetrics.metrics.totalSales,
      };
    }
    
    // For now, we'll inline simple data fetching logic here
    // In a production app, we'd want to optimize this further
    
    // Get recent sales data for context
    const dateRange = args.dateRange || 7;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dateRange);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get recent sales data for context
    const recentTickets = await ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("franchiseId"), userContext.franchiseId),
          q.gte(q.field("sale_date"), startDateStr)
        )
      )
      .take(200);
    
    console.log("Found tickets:", recentTickets.length);
    
    // Analyze by sales rep
    const repPerformance = new Map<string, {
      revenue: number;
      tickets: number;
      grossProfit: number;
      avgTicket: number;
    }>();
    
    recentTickets.forEach(ticket => {
      const repName = ticket.sales_rep || "Unknown";
      const current = repPerformance.get(repName) || {
        revenue: 0,
        tickets: 0,
        grossProfit: 0,
        avgTicket: 0,
      };
      current.revenue += ticket.transaction_total || 0;
      current.tickets += 1;
      current.grossProfit += parseFloat(ticket.gross_profit || "0");
      repPerformance.set(repName, current);
    });
    
    // Calculate averages and sort by performance
    const repData = Array.from(repPerformance.entries())
      .map(([repName, data]) => ({
        repName,
        totalRevenue: data.revenue,
        totalTickets: data.tickets,
        totalGrossProfit: data.grossProfit,
        avgTicket: data.tickets > 0 ? data.revenue / data.tickets : 0,
        avgGrossProfit: data.tickets > 0 ? data.grossProfit / data.tickets : 0,
      }))
      .filter(rep => rep.totalTickets > 0) // Only include reps with sales
      .sort((a, b) => a.totalRevenue - b.totalRevenue); // Sort by total revenue (ascending = worst first)
    
    context.salesRepPerformance = {
      underperformingReps: repData.slice(0, 5),
      topPerformingReps: repData.slice(-5).reverse(),
      totalReps: repData.length,
      dateRange,
      summary: `Analyzed ${recentTickets.length} tickets across ${repData.length} sales reps from ${startDateStr} to ${new Date().toISOString().split('T')[0]}`,
    };
    
    // Also add store performance
    const storePerformance = new Map<string, {
      revenue: number;
      tickets: number;
      avgTicket: number;
    }>();
    
    recentTickets.forEach(ticket => {
      const current = storePerformance.get(ticket.store_id) || {
        revenue: 0,
        tickets: 0,
        avgTicket: 0,
      };
      current.revenue += ticket.transaction_total || 0;
      current.tickets += 1;
      storePerformance.set(ticket.store_id, current);
    });
    
    const storeData = Array.from(storePerformance.entries())
      .map(([storeId, data]) => ({
        storeId,
        totalRevenue: data.revenue,
        totalTickets: data.tickets,
        avgTicket: data.tickets > 0 ? data.revenue / data.tickets : 0,
      }))
      .sort((a, b) => a.avgTicket - b.avgTicket);
    
    context.storePerformance = {
      worstPerforming: storeData.slice(0, 5),
      bestPerforming: storeData.slice(-5).reverse(),
      totalStores: storeData.length,
      dateRange,
    };
    
    // Add inventory context if relevant
    if (queryLower.includes("inventory")) {
      const recentInventory = await ctx.db
        .query("inventory_lines")
        .withIndex("by_user_id")
        .filter((q) => q.eq(q.field("franchiseId"), userContext.franchiseId))
        .take(50);
      
      const totalValue = recentInventory.reduce((sum, item) => {
        // We'd need to look up retail prices, but for now use a simple estimate
        return sum + (item.qty_on_hand * 10); // Rough estimate
      }, 0);
      
      context.inventoryContext = {
        totalItems: recentInventory.length,
        estimatedValue: totalValue,
        stores: [...new Set(recentInventory.map(i => i.store_id))],
      };
    }
    
    return context;
  },
});