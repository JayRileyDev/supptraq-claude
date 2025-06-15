import { query } from "./_generated/server";
import { v } from "convex/values";

export const getSalesData = query({
  args: { 
    userId: v.string(),
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    })),
    storeId: v.optional(v.string()),
    salesRep: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Set default date range to last 30 days
    const endDate = args.dateRange?.end ? new Date(args.dateRange.end) : new Date();
    const startDate = args.dateRange?.start ? new Date(args.dateRange.start) : new Date();
    if (!args.dateRange?.start) {
      startDate.setDate(startDate.getDate() - 30);
    }

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime());
    const previousStartDate = new Date(startDate.getTime() - periodLength);

    let salesQuery = ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), startDate.toISOString()),
          q.lte(q.field("sale_date"), endDate.toISOString())
        )
      );

    let previousSalesQuery = ctx.db
      .query("ticket_history")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), previousStartDate.toISOString()),
          q.lte(q.field("sale_date"), previousEndDate.toISOString())
        )
      );

    // MAJOR OPTIMIZATION: Add store/rep filters to query instead of post-processing
    if (args.storeId && args.storeId !== "all") {
      salesQuery = salesQuery.filter((q) => q.eq(q.field("store_id"), args.storeId));
      previousSalesQuery = previousSalesQuery.filter((q) => q.eq(q.field("store_id"), args.storeId));
    }

    if (args.salesRep && args.salesRep !== "all") {
      salesQuery = salesQuery.filter((q) => q.eq(q.field("sales_rep"), args.salesRep));
      previousSalesQuery = previousSalesQuery.filter((q) => q.eq(q.field("sales_rep"), args.salesRep));
    }

    // MAJOR OPTIMIZATION: Limit data fetch
    let salesData = await salesQuery.take(1000); // Limit for performance
    let previousSalesData = await previousSalesQuery.take(1000);

    // Get returns and gift cards with limits
    let returnsQuery = ctx.db
      .query("return_tickets")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), startDate.toISOString()),
          q.lte(q.field("sale_date"), endDate.toISOString())
        )
      );

    let giftCardsQuery = ctx.db
      .query("gift_card_tickets")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.gte(q.field("sale_date"), startDate.toISOString()),
          q.lte(q.field("sale_date"), endDate.toISOString())
        )
      );

    // Apply same filters to returns/gift cards
    if (args.storeId && args.storeId !== "all") {
      returnsQuery = returnsQuery.filter((q) => q.eq(q.field("store_id"), args.storeId));
      giftCardsQuery = giftCardsQuery.filter((q) => q.eq(q.field("store_id"), args.storeId));
    }

    if (args.salesRep && args.salesRep !== "all") {
      returnsQuery = returnsQuery.filter((q) => q.eq(q.field("sales_rep"), args.salesRep));
      giftCardsQuery = giftCardsQuery.filter((q) => q.eq(q.field("sales_rep"), args.salesRep));
    }

    const returns = await returnsQuery.take(500);
    const giftCards = await giftCardsQuery.take(500);

    // Calculate metrics
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.transaction_total || 0), 0);
    const totalTransactions = salesData.length;
    const avgTicketSize = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalReturns = returns.reduce((sum, ret) => sum + (ret.transaction_total || 0), 0);
    const returnRate = totalRevenue > 0 ? (totalReturns / totalRevenue) * 100 : 0;

    // Calculate previous period metrics for comparison
    const previousTotalRevenue = previousSalesData.reduce((sum, sale) => sum + (sale.transaction_total || 0), 0);
    const previousTotalTransactions = previousSalesData.length;
    const previousAvgTicketSize = previousTotalTransactions > 0 ? previousTotalRevenue / previousTotalTransactions : 0;

    // Calculate percentage changes
    const revenueChange = previousTotalRevenue > 0 ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue * 100).toFixed(1) : null;
    const transactionChange = previousTotalTransactions > 0 ? ((totalTransactions - previousTotalTransactions) / previousTotalTransactions * 100).toFixed(1) : null;
    const avgTicketChange = previousAvgTicketSize > 0 ? ((avgTicketSize - previousAvgTicketSize) / previousAvgTicketSize * 100).toFixed(1) : null;

    // Daily sales trend
    const dailySales = new Map();
    salesData.forEach(sale => {
      const date = sale.sale_date.split('T')[0];
      if (!dailySales.has(date)) {
        dailySales.set(date, { date, revenue: 0, transactions: 0 });
      }
      const day = dailySales.get(date);
      day.revenue += sale.transaction_total || 0;
      day.transactions += 1;
    });

    const salesTrend = Array.from(dailySales.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Top products
    const productSales = new Map();
    salesData.forEach(sale => {
      if (sale.product_name && sale.item_number) {
        const key = `${sale.item_number}-${sale.product_name}`;
        if (!productSales.has(key)) {
          productSales.set(key, {
            itemNumber: sale.item_number,
            productName: sale.product_name,
            totalRevenue: 0,
            totalQty: 0,
            transactions: 0
          });
        }
        const product = productSales.get(key);
        product.totalRevenue += sale.transaction_total || 0;
        product.totalQty += sale.qty_sold || 0;
        product.transactions += 1;
      }
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Store performance
    const storePerformance = new Map();
    salesData.forEach(sale => {
      if (!storePerformance.has(sale.store_id)) {
        storePerformance.set(sale.store_id, {
          storeId: sale.store_id,
          revenue: 0,
          transactions: 0
        });
      }
      const store = storePerformance.get(sale.store_id);
      store.revenue += sale.transaction_total || 0;
      store.transactions += 1;
    });

    const storeStats = Array.from(storePerformance.values())
      .sort((a, b) => b.revenue - a.revenue);

    return {
      metrics: {
        totalRevenue,
        totalTransactions,
        avgTicketSize,
        returnRate,
        giftCardSales: giftCards.reduce((sum, gc) => sum + (gc.giftcard_amount || 0), 0),
        revenueChange,
        transactionChange,
        avgTicketChange,
        revenueChangeType: revenueChange !== null ? (parseFloat(revenueChange) >= 0 ? "positive" : "negative") : null,
        transactionChangeType: transactionChange !== null ? (parseFloat(transactionChange) >= 0 ? "positive" : "negative") : null,
        avgTicketChangeType: avgTicketChange !== null ? (parseFloat(avgTicketChange) >= 0 ? "positive" : "negative") : null
      },
      salesTrend,
      topProducts,
      storeStats,
      recentTransactions: salesData.slice(0, 20).sort((a, b) => 
        new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
      )
    };
  },
});

export const getSalesFilters = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // MAJOR OPTIMIZATION: Limit data fetch for filter generation
    const sales = await ctx.db
      .query("ticket_history")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .take(1000); // Only need sample of data to get filters

    const stores = [...new Set(sales.map(sale => sale.store_id))].sort();
    const salesReps = [...new Set(sales.map(sale => sale.sales_rep).filter(Boolean))].sort();

    return {
      stores,
      salesReps
    };
  },
});