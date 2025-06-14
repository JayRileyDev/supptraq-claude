import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDashboardOverview = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get inventory overview
    const inventoryLines = await ctx.db
      .query("inventory_lines")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .collect();

    // Get sales data from last 30 days and previous 30 days for comparison
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const recentSales = await ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), thirtyDaysAgo.toISOString())
        )
      )
      .collect();

    const previousSales = await ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), sixtyDaysAgo.toISOString()),
          q.lt(q.field("sale_date"), thirtyDaysAgo.toISOString())
        )
      )
      .collect();

    // Get recent transfers
    const recentTransfers = await ctx.db
      .query("transfer_logs")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .order("desc")
      .take(10);

    // Calculate metrics
    const totalInventoryValue = inventoryLines.reduce((sum, line) => 
      sum + (line.qty_on_hand * 10), 0 // Assume $10 average cost per item
    );

    const totalSales = recentSales.reduce((sum, ticket) => 
      sum + (ticket.transaction_total || 0), 0
    );

    const previousTotalSales = previousSales.reduce((sum, ticket) => 
      sum + (ticket.transaction_total || 0), 0
    );

    // Calculate percentage changes
    const salesChange = previousTotalSales > 0 
      ? ((totalSales - previousTotalSales) / previousTotalSales * 100).toFixed(1)
      : null;

    const lowStockItems = inventoryLines.filter(line => 
      line.qty_on_hand <= 5 && line.flag_reorder
    ).length;

    const transferSuggestions = inventoryLines.filter(line => 
      line.flag_transfer
    ).length;

    // Get unique stores
    const uniqueStores = new Set(inventoryLines.map(line => line.store_id));
    const activeStores = uniqueStores.size;

    // Sales trend (last 7 days)
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const daySales = recentSales.filter(ticket => {
        const saleDate = new Date(ticket.sale_date);
        return saleDate >= dayStart && saleDate <= dayEnd;
      });
      
      const dayTotal = daySales.reduce((sum, ticket) => 
        sum + (ticket.transaction_total || 0), 0
      );
      
      salesTrend.push({
        date: date.toISOString().split('T')[0],
        sales: dayTotal,
        transactions: daySales.length
      });
    }

    return {
      metrics: {
        totalSales,
        inventoryValue: totalInventoryValue,
        activeStores,
        lowStockItems,
        transferSuggestions,
        salesChange,
        salesChangeType: salesChange !== null ? (parseFloat(salesChange) >= 0 ? "positive" : "negative") : null
      },
      salesTrend,
      recentTransfers: recentTransfers.slice(0, 5),
      actionItems: {
        lowStock: inventoryLines.filter(line => 
          line.qty_on_hand <= 5 && line.flag_reorder
        ).slice(0, 5),
        transferSuggestions: inventoryLines.filter(line => 
          line.flag_transfer
        ).slice(0, 5)
      }
    };
  },
});

export const getTopPerformers = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get sales reps performance
    const salesReps = await ctx.db
      .query("sales_reps")
      .withIndex("by_user", (q) => q.eq("user", args.userId))
      .collect();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSales = await ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), thirtyDaysAgo.toISOString())
        )
      )
      .collect();

    // Calculate rep performance
    const repPerformance = salesReps.map(rep => {
      const repSales = recentSales.filter(sale => sale.sales_rep === rep.rep_name);
      const totalSales = repSales.reduce((sum, sale) => sum + (sale.transaction_total || 0), 0);
      const avgTicket = repSales.length > 0 ? totalSales / repSales.length : 0;
      
      return {
        name: rep.rep_name,
        storeId: rep.store_id,
        totalSales,
        transactions: repSales.length,
        avgTicket
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    return repPerformance.slice(0, 5);
  },
});