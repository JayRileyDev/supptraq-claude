import { query } from "./_generated/server";
import { v } from "convex/values";
import { getUserContext } from "./accessControl";
import { 
  getAllTicketData, 
  applyFilters, 
  calculateSalesMetrics,
  type FilterOptions,
  type SalesMetrics
} from "./utils/dataAggregation";

// Main unified sales metrics query
// Returns pre-aggregated data to avoid 8192 item limit
export const getSalesMetrics = query({
  args: { 
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    })),
    storeId: v.optional(v.string()),
    salesRepId: v.optional(v.string()),
    includeReturns: v.optional(v.boolean()),
    includeGiftCards: v.optional(v.boolean())
  },
  handler: async (ctx, args): Promise<SalesMetrics> => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    try {
      // Get ALL ticket data from all three tables
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      
      // Apply filters
      const filters: FilterOptions = {
        dateRange: args.dateRange,
        storeId: args.storeId,
        salesRepId: args.salesRepId,
        includeReturns: args.includeReturns ?? true,
        includeGiftCards: args.includeGiftCards ?? true
      };
      
      const filteredData = applyFilters(allTicketData, filters);
      
      // Calculate and return aggregated metrics
      return calculateSalesMetrics(filteredData);
      
    } catch (error) {
      throw new Error("Failed to calculate sales metrics");
    }
  }
});

// Get filter options (stores and sales reps available)
export const getFilterOptions = query({
  args: {},
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    try {
      // Get all ticket data to extract filter options
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      
      const stores = new Set<string>();
      const salesReps = new Set<string>();
      const dates: string[] = [];
      
      allTicketData.forEach(ticket => {
        stores.add(ticket.store_id);
        if (ticket.sales_rep) {
          salesReps.add(ticket.sales_rep);
        }
        dates.push(ticket.sale_date);
      });
      
      const sortedDates = dates.sort();
      
      return {
        stores: Array.from(stores).sort(),
        salesReps: Array.from(salesReps).sort(),
        storeCount: stores.size,
        repCount: salesReps.size,
        totalLines: allTicketData.length,
        dateRange: {
          earliest: sortedDates[0] || '',
          latest: sortedDates[sortedDates.length - 1] || ''
        }
      };
      
    } catch (error) {
      throw new Error("Failed to get filter options");
    }
  }
});

// Performance alerts data - $70 avg ticket benchmark
export const getPerformanceAlertsData = query({
  args: { 
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    }))
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    try {
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      
      // Apply date filter if provided
      let filteredData = allTicketData;
      if (args.dateRange) {
        const { start, end } = args.dateRange;
        filteredData = filteredData.filter(ticket => {
          const ticketDate = new Date(ticket.sale_date);
          const startDate = new Date(start);
          const endDate = new Date(end);
          return ticketDate >= startDate && ticketDate <= endDate;
        });
      }

      // Use same precedence logic as calculateSalesMetrics
      const ticketTotals = new Map<string, number>();
      const ticketGrossProfits = new Map<string, number>();
      const salesTickets = new Set<string>();
      const returnTickets = new Set<string>();
      const giftCardsByTicket = new Map<string, number>();

      // Process sales tickets first
      filteredData.filter(line => line.ticket_type === 'sale').forEach(line => {
        const ticketNum = line.ticket_number;
        salesTickets.add(ticketNum);
        
        if (!ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
        
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      // Process return tickets (only if not in sales)
      filteredData.filter(line => line.ticket_type === 'return').forEach(line => {
        const ticketNum = line.ticket_number;
        returnTickets.add(ticketNum);
        
        if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
        
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      // Process gift cards
      filteredData.filter(line => line.ticket_type === 'gift_card').forEach(line => {
        const ticketNum = line.ticket_number;
        if (line.giftcard_amount) {
          const current = giftCardsByTicket.get(ticketNum) || 0;
          giftCardsByTicket.set(ticketNum, current + line.giftcard_amount);
        }
        
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      // Process gift card totals (only for pure gift card tickets)
      giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
        if (!salesTickets.has(ticketNum) && !returnTickets.has(ticketNum)) {
          ticketTotals.set(ticketNum, totalGiftAmount);
        }
      });

      // 1. STORES BELOW $70 AVG TICKET
      const storePerformance = new Map<string, {
        revenue: number;
        ticketCount: number;
        tickets: Set<string>;
        grossProfitSum: number;
        grossProfitCount: number;
      }>();

      // Calculate store performance using unique tickets
      filteredData.forEach(line => {
        const storeId = line.store_id;
        const ticketNum = line.ticket_number;
        
        if (!storePerformance.has(storeId)) {
          storePerformance.set(storeId, {
            revenue: 0,
            ticketCount: 0,
            tickets: new Set(),
            grossProfitSum: 0,
            grossProfitCount: 0
          });
        }
        
        const storeData = storePerformance.get(storeId)!;
        
        // Only count each ticket once per store
        if (!storeData.tickets.has(ticketNum)) {
          storeData.tickets.add(ticketNum);
          const ticketTotal = ticketTotals.get(ticketNum) || 0;
          storeData.revenue += ticketTotal;
          storeData.ticketCount++;
          
          // Add gross profit if available
          const grossProfit = ticketGrossProfits.get(ticketNum);
          if (grossProfit !== undefined) {
            storeData.grossProfitSum += grossProfit;
            storeData.grossProfitCount++;
          }
        }
      });

      const underperformingStores = Array.from(storePerformance.entries())
        .map(([storeId, data]) => ({
          storeId,
          revenue: data.revenue,
          ticketCount: data.ticketCount,
          avgTicketSize: data.ticketCount > 0 ? data.revenue / data.ticketCount : 0,
          grossProfitPercent: data.grossProfitCount > 0 ? data.grossProfitSum / data.grossProfitCount : 0
        }))
        .filter(store => store.avgTicketSize < 70 && store.ticketCount > 0)
        .sort((a, b) => a.avgTicketSize - b.avgTicketSize);

      // 2. SALES REPS WITH DAYS BELOW $70 AVG TICKET
      // CRITICAL: Exclude returns from rep average ticket calculations
      const repDailyPerformance = new Map<string, Map<string, {
        revenue: number;
        ticketCount: number;
        tickets: Set<string>;
      }>>();

      // Get return ticket numbers to exclude gift cards that match returns
      const returnTicketNumbers = new Set(
        filteredData
          .filter(line => line.ticket_type === 'return')
          .map(line => line.ticket_number)
      );


      // Calculate daily performance for each rep - SALES and GIFT CARDS (excluding ANY tickets that appear in returns and ONLINE sales)
      const filteredForReps = filteredData.filter(line => {
        // CRITICAL: Exclude ONLINE sales from rep performance alerts
        if (line.sales_rep === 'ONLINE' || line.store_id === 'ONLINE') {
          return false;
        }
        
        // CRITICAL: Exclude ANY ticket number that appears in the return table
        if (returnTicketNumbers.has(line.ticket_number)) {
          return false;
        }
        
        // Include sales tickets ONLY if they have positive transaction totals (exclude mislabeled returns/voids)
        if (line.ticket_type === 'sale') {
          return (line.transaction_total || 0) > 0;
        }
        // Include gift cards with positive amounts (already filtered out return ticket numbers above)
        if (line.ticket_type === 'gift_card') {
          return (line.giftcard_amount || 0) > 0;
        }
        // Exclude everything else
        return false;
      });

      filteredForReps
        .forEach(line => {
          const salesRep = line.sales_rep;
          const ticketNum = line.ticket_number;
          const saleDate = line.sale_date.split('T')[0]; // Get date part only
          
          if (!salesRep) return;
          
          if (!repDailyPerformance.has(salesRep)) {
            repDailyPerformance.set(salesRep, new Map());
          }
          
          const repData = repDailyPerformance.get(salesRep)!;
          
          if (!repData.has(saleDate)) {
            repData.set(saleDate, {
              revenue: 0,
              ticketCount: 0,
              tickets: new Set()
            });
          }
          
          const dayData = repData.get(saleDate)!;
          
          // Only count each ticket once per rep per day
          if (!dayData.tickets.has(ticketNum)) {
            dayData.tickets.add(ticketNum);
            const ticketTotal = ticketTotals.get(ticketNum) || 0;
            
            
            dayData.revenue += ticketTotal;
            dayData.ticketCount++;
          }
        });

      const underperformingReps = Array.from(repDailyPerformance.entries())
        .map(([repName, dailyData]) => {
          // Calculate all qualifying days (2+ tickets, regardless of performance)
          const allQualifyingDays = Array.from(dailyData.entries())
            .map(([date, data]) => ({
              date,
              ticketCount: data.ticketCount,
              avgTicketSize: data.ticketCount > 0 ? data.revenue / data.ticketCount : 0,
              revenue: data.revenue
            }))
            .filter(day => {
              // Only filter for valid working days (2+ tickets)
              return day.ticketCount > 1;
            });

          // Find underperforming days within the qualifying days
          const underperformingDays = allQualifyingDays
            .filter(day => day.avgTicketSize < 70)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          const performanceRatio = allQualifyingDays.length > 0 ? 
            underperformingDays.length / allQualifyingDays.length : 0;

          return {
            repName,
            underperformingDays,
            daysBelow70: underperformingDays.length,
            totalDaysWorked: allQualifyingDays.length,
            performanceRatio,
            needsCoaching: performanceRatio > 0.5 // Over 50% of days are underperforming
          };
        })
        .filter(rep => rep.daysBelow70 > 0)
        .sort((a, b) => {
          // First, sort by coaching priority (needs coaching first)
          if (a.needsCoaching && !b.needsCoaching) return -1;
          if (!a.needsCoaching && b.needsCoaching) return 1;
          
          // Then by performance ratio (worst first)
          return b.performanceRatio - a.performanceRatio;
        });

      return {
        underperformingStores: underperformingStores.slice(0, 50),
        underperformingReps: underperformingReps.slice(0, 50),
        benchmark: 70
      };
      
    } catch (error) {
      console.error("Performance alerts error:", error);
      throw new Error("Failed to get performance alerts data");
    }
  }
});

// Export data for PDF reports - single day for coaching
export const getRepDayExportData = query({
  args: {
    repName: v.string(),
    date: v.string() // Single date in YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    try {
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      
      // Filter for specific rep and exact date - ALL tickets for export
      const repDayData = allTicketData.filter(ticket => 
        ticket.sales_rep === args.repName &&
        ticket.sale_date.startsWith(args.date) // Date starts with YYYY-MM-DD
      );

      // Get all return ticket numbers to exclude from performance calculations
      const returnTicketNumbers = new Set(
        repDayData
          .filter(ticket => ticket.ticket_type === 'return')
          .map(ticket => ticket.ticket_number)
      );

      // Filter to SALES and GIFT CARDS for performance calculation (exclude returns and negative/zero sales)
      const salesAndGiftCardData = repDayData.filter(ticket => {
        // CRITICAL: Exclude ANY ticket number that appears in the return table
        if (returnTicketNumbers.has(ticket.ticket_number)) {
          return false;
        }
        
        // Include sales tickets ONLY if they have positive transaction totals
        if (ticket.ticket_type === 'sale') {
          return (ticket.transaction_total || 0) > 0;
        }
        // Include gift cards with positive amounts (already filtered out return ticket numbers above)
        if (ticket.ticket_type === 'gift_card') {
          return (ticket.giftcard_amount || 0) > 0;
        }
        return false;
      });
      
      // Use same precedence logic for accurate ticket totals
      const ticketTotals = new Map<string, number>();
      const ticketGrossProfits = new Map<string, number>();
      const salesTickets = new Set<string>();
      const returnTickets = new Set<string>();
      const giftCardsByTicket = new Map<string, number>();

      // Process sales tickets first
      salesAndGiftCardData.filter(line => line.ticket_type === 'sale').forEach(line => {
        const ticketNum = line.ticket_number;
        salesTickets.add(ticketNum);
        if (!ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      // Process gift cards - exclude those that match return ticket numbers
      salesAndGiftCardData.filter(line => line.ticket_type === 'gift_card').forEach(line => {
        const ticketNum = line.ticket_number;
        
        // Skip gift cards that match return ticket numbers
        if (returnTicketNumbers.has(ticketNum)) {
          return;
        }
        
        if (line.giftcard_amount) {
          const current = giftCardsByTicket.get(ticketNum) || 0;
          giftCardsByTicket.set(ticketNum, current + line.giftcard_amount);
        }
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      // Add gift card totals (only for pure gift card tickets that don't match returns)
      giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
        if (!salesTickets.has(ticketNum)) {
          ticketTotals.set(ticketNum, totalGiftAmount);
        }
      });
      
      // Group by ticket for export
      const ticketGroups = new Map<string, any[]>();
      repDayData.forEach(line => {
        const ticketNum = line.ticket_number;
        if (!ticketGroups.has(ticketNum)) {
          ticketGroups.set(ticketNum, []);
        }
        ticketGroups.get(ticketNum)!.push(line);
      });
      
      const exportTickets = Array.from(ticketGroups.entries()).map(([ticketNumber, lines]) => {
        const firstLine = lines[0];
        const ticketTotal = ticketTotals.get(ticketNumber) || 0;
        const grossProfit = ticketGrossProfits.get(ticketNumber) || 0;
        
        return {
          ticketNumber,
          saleDate: firstLine.sale_date,
          storeId: firstLine.store_id,
          transactionTotal: ticketTotal,
          grossProfitPercent: grossProfit,
          lineItems: lines.map(line => ({
            item_number: line.item_number || '',
            product_name: line.product_name || '',
            qty_sold: line.qty_sold || 0,
            selling_unit: line.selling_unit || 0,
            gross_profit: line.gross_profit || 0
          }))
        };
      });

      // Calculate day metrics
      const totalRevenue = Array.from(ticketTotals.values()).reduce((sum, val) => sum + val, 0);
      const ticketCount = ticketTotals.size;
      const avgTicketSize = ticketCount > 0 ? totalRevenue / ticketCount : 0;
      
      return {
        repName: args.repName,
        date: args.date,
        avgTicketSize,
        totalRevenue,
        ticketCount,
        tickets: exportTickets,
        benchmark: 70,
        isUnderperforming: avgTicketSize < 70
      };
      
    } catch (error) {
      console.error("Rep day export error:", error);
      throw new Error("Failed to get rep day export data");
    }
  }
});

// Get leaderboard data for top performers
export const getLeaderboardData = query({
  args: { 
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    }))
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    try {
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      
      // Apply date filter if provided
      let filteredData = allTicketData;
      if (args.dateRange) {
        const { start, end } = args.dateRange;
        filteredData = filteredData.filter(ticket => {
          const ticketDate = new Date(ticket.sale_date);
          const startDate = new Date(start);
          const endDate = new Date(end);
          return ticketDate >= startDate && ticketDate <= endDate;
        });
      }

      // Use same precedence logic for ticket calculations
      const ticketTotals = new Map<string, number>();
      const ticketGrossProfits = new Map<string, number>();
      const salesTickets = new Set<string>();
      const returnTickets = new Set<string>();
      const giftCardsByTicket = new Map<string, number>();

      // Process sales tickets first
      filteredData.filter(line => line.ticket_type === 'sale').forEach(line => {
        const ticketNum = line.ticket_number;
        salesTickets.add(ticketNum);
        
        if (!ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
        
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      // Process returns and gift cards with same logic as other queries
      filteredData.filter(line => line.ticket_type === 'return').forEach(line => {
        const ticketNum = line.ticket_number;
        returnTickets.add(ticketNum);
        
        if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
        
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      filteredData.filter(line => line.ticket_type === 'gift_card').forEach(line => {
        const ticketNum = line.ticket_number;
        if (line.giftcard_amount) {
          const current = giftCardsByTicket.get(ticketNum) || 0;
          giftCardsByTicket.set(ticketNum, current + line.giftcard_amount);
        }
        
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      // Process gift card totals
      giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
        if (!salesTickets.has(ticketNum) && !returnTickets.has(ticketNum)) {
          ticketTotals.set(ticketNum, totalGiftAmount);
        }
      });

      // Calculate store performance
      const storePerformance = new Map<string, {
        revenue: number;
        ticketCount: number;
        tickets: Set<string>;
        grossProfitSum: number;
        grossProfitCount: number;
        itemsSold: number;
        returnTickets: Set<string>;
      }>();

      filteredData.forEach(line => {
        const storeId = line.store_id;
        const ticketNum = line.ticket_number;
        
        if (!storePerformance.has(storeId)) {
          storePerformance.set(storeId, {
            revenue: 0,
            ticketCount: 0,
            tickets: new Set(),
            grossProfitSum: 0,
            grossProfitCount: 0,
            itemsSold: 0,
            returnTickets: new Set()
          });
        }
        
        const storeData = storePerformance.get(storeId)!;
        
        // Count items sold
        if (line.qty_sold) {
          storeData.itemsSold += line.qty_sold;
        }
        
        // Track return tickets
        if (line.ticket_type === 'return') {
          storeData.returnTickets.add(ticketNum);
        }
        
        // Only count each ticket once per store for revenue/tickets
        if (!storeData.tickets.has(ticketNum)) {
          storeData.tickets.add(ticketNum);
          const ticketTotal = ticketTotals.get(ticketNum) || 0;
          storeData.revenue += ticketTotal;
          storeData.ticketCount++;
          
          const grossProfit = ticketGrossProfits.get(ticketNum);
          if (grossProfit !== undefined) {
            storeData.grossProfitSum += grossProfit;
            storeData.grossProfitCount++;
          }
        }
      });

      // Calculate rep performance - EXCLUDE returns and $0 transactions like performance alerts
      const repPerformance = new Map<string, {
        revenue: number;
        ticketCount: number;
        tickets: Set<string>;
        grossProfitSum: number;
        grossProfitCount: number;
        itemsSold: number;
        stores: Set<string>;
      }>();

      // Get return ticket numbers to exclude gift cards that match returns
      const returnTicketNumbers = new Set(
        filteredData
          .filter(line => line.ticket_type === 'return')
          .map(line => line.ticket_number)
      );

      // Filter for reps - EXCLUDE returns, $0 transactions, and ONLINE sales
      const filteredForReps = filteredData.filter(line => {
        // CRITICAL: Exclude ONLINE sales from rep calculations
        if (line.sales_rep === 'ONLINE' || line.store_id === 'ONLINE') {
          return false;
        }
        
        // CRITICAL: Exclude ANY ticket number that appears in the return table
        if (returnTicketNumbers.has(line.ticket_number)) {
          return false;
        }
        
        // Include sales tickets ONLY if they have positive transaction totals
        if (line.ticket_type === 'sale') {
          return (line.transaction_total || 0) > 0;
        }
        // Include gift cards with positive amounts (already filtered out return ticket numbers above)
        if (line.ticket_type === 'gift_card') {
          return (line.giftcard_amount || 0) > 0;
        }
        // Exclude everything else
        return false;
      });

      filteredForReps.forEach(line => {
        const salesRep = line.sales_rep;
        if (!salesRep) return;
        
        const ticketNum = line.ticket_number;
        
        if (!repPerformance.has(salesRep)) {
          repPerformance.set(salesRep, {
            revenue: 0,
            ticketCount: 0,
            tickets: new Set(),
            grossProfitSum: 0,
            grossProfitCount: 0,
            itemsSold: 0,
            stores: new Set()
          });
        }
        
        const repData = repPerformance.get(salesRep)!;
        
        // Track stores worked at
        repData.stores.add(line.store_id);
        
        // Count items sold
        if (line.qty_sold) {
          repData.itemsSold += line.qty_sold;
        }
        
        // Only count each ticket once per rep
        if (!repData.tickets.has(ticketNum)) {
          repData.tickets.add(ticketNum);
          const ticketTotal = ticketTotals.get(ticketNum) || 0;
          repData.revenue += ticketTotal;
          repData.ticketCount++;
          
          const grossProfit = ticketGrossProfits.get(ticketNum);
          if (grossProfit !== undefined) {
            repData.grossProfitSum += grossProfit;
            repData.grossProfitCount++;
          }
        }
      });

      // Create leaderboards
      const storeLeaderboards = {
        avgTicketSize: Array.from(storePerformance.entries())
          .map(([storeId, data]) => ({
            storeId,
            avgTicketSize: data.ticketCount > 0 ? data.revenue / data.ticketCount : 0,
            revenue: data.revenue,
            ticketCount: data.ticketCount
          }))
          .filter(store => store.ticketCount > 0)
          .sort((a, b) => b.avgTicketSize - a.avgTicketSize)
          .slice(0, 5),
          
        grossProfit: Array.from(storePerformance.entries())
          .map(([storeId, data]) => ({
            storeId,
            grossProfitPercent: data.grossProfitCount > 0 ? data.grossProfitSum / data.grossProfitCount : 0,
            revenue: data.revenue,
            ticketCount: data.ticketCount
          }))
          .filter(store => store.ticketCount > 0)
          .sort((a, b) => b.grossProfitPercent - a.grossProfitPercent)
          .slice(0, 5),
          
        totalRevenue: Array.from(storePerformance.entries())
          .map(([storeId, data]) => ({
            storeId,
            revenue: data.revenue,
            ticketCount: data.ticketCount,
            avgTicketSize: data.ticketCount > 0 ? data.revenue / data.ticketCount : 0
          }))
          .filter(store => store.ticketCount > 0)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      };

      const repLeaderboards = {
        avgTicketSize: Array.from(repPerformance.entries())
          .map(([repName, data]) => ({
            repName,
            avgTicketSize: data.ticketCount > 0 ? data.revenue / data.ticketCount : 0,
            revenue: data.revenue,
            ticketCount: data.ticketCount,
            storeCount: data.stores.size
          }))
          .filter(rep => rep.ticketCount > 0)
          .sort((a, b) => b.avgTicketSize - a.avgTicketSize)
          .slice(0, 5),
          
        grossProfit: Array.from(repPerformance.entries())
          .map(([repName, data]) => ({
            repName,
            grossProfitPercent: data.grossProfitCount > 0 ? data.grossProfitSum / data.grossProfitCount : 0,
            revenue: data.revenue,
            ticketCount: data.ticketCount,
            storeCount: data.stores.size
          }))
          .filter(rep => rep.ticketCount > 0)
          .sort((a, b) => b.grossProfitPercent - a.grossProfitPercent)
          .slice(0, 5),
          
        totalRevenue: Array.from(repPerformance.entries())
          .map(([repName, data]) => ({
            repName,
            revenue: data.revenue,
            ticketCount: data.ticketCount,
            avgTicketSize: data.ticketCount > 0 ? data.revenue / data.ticketCount : 0,
            storeCount: data.stores.size
          }))
          .filter(rep => rep.ticketCount > 0)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      };

      return {
        stores: storeLeaderboards,
        reps: repLeaderboards
      };
      
    } catch (error) {
      console.error("Leaderboard data error:", error);
      throw new Error("Failed to get leaderboard data");
    }
  }
});

// Get detailed store performance data for table
export const getStorePerformanceData = query({
  args: { 
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    }))
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    try {
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      
      // Apply date filter if provided
      let filteredData = allTicketData;
      if (args.dateRange) {
        const { start, end } = args.dateRange;
        filteredData = filteredData.filter(ticket => {
          const ticketDate = new Date(ticket.sale_date);
          const startDate = new Date(start);
          const endDate = new Date(end);
          return ticketDate >= startDate && ticketDate <= endDate;
        });
      }

      // Use same precedence logic
      const ticketTotals = new Map<string, number>();
      const ticketGrossProfits = new Map<string, number>();
      const salesTickets = new Set<string>();
      const returnTickets = new Set<string>();
      const giftCardsByTicket = new Map<string, number>();

      // Process with same logic as other queries
      filteredData.filter(line => line.ticket_type === 'sale').forEach(line => {
        const ticketNum = line.ticket_number;
        salesTickets.add(ticketNum);
        if (!ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      filteredData.filter(line => line.ticket_type === 'return').forEach(line => {
        const ticketNum = line.ticket_number;
        returnTickets.add(ticketNum);
        if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      filteredData.filter(line => line.ticket_type === 'gift_card').forEach(line => {
        const ticketNum = line.ticket_number;
        if (line.giftcard_amount) {
          const current = giftCardsByTicket.get(ticketNum) || 0;
          giftCardsByTicket.set(ticketNum, current + line.giftcard_amount);
        }
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
        if (!salesTickets.has(ticketNum) && !returnTickets.has(ticketNum)) {
          ticketTotals.set(ticketNum, totalGiftAmount);
        }
      });

      // Calculate detailed store performance
      const storePerformance = new Map<string, {
        revenue: number;
        ticketCount: number;
        tickets: Set<string>;
        grossProfitSum: number;
        grossProfitCount: number;
        itemsSold: number;
        returnTickets: Set<string>;
        salesTickets: Set<string>;
        dailyRevenue: Map<string, number>;
      }>();

      filteredData.forEach(line => {
        const storeId = line.store_id;
        const ticketNum = line.ticket_number;
        const saleDate = line.sale_date.split('T')[0];
        
        if (!storePerformance.has(storeId)) {
          storePerformance.set(storeId, {
            revenue: 0,
            ticketCount: 0,
            tickets: new Set(),
            grossProfitSum: 0,
            grossProfitCount: 0,
            itemsSold: 0,
            returnTickets: new Set(),
            salesTickets: new Set(),
            dailyRevenue: new Map()
          });
        }
        
        const storeData = storePerformance.get(storeId)!;
        
        // Count items sold
        if (line.qty_sold) {
          storeData.itemsSold += line.qty_sold;
        }
        
        // Track ticket types
        if (line.ticket_type === 'return') {
          storeData.returnTickets.add(ticketNum);
        } else if (line.ticket_type === 'sale') {
          storeData.salesTickets.add(ticketNum);
        }
        
        // Only count each ticket once per store
        if (!storeData.tickets.has(ticketNum)) {
          storeData.tickets.add(ticketNum);
          const ticketTotal = ticketTotals.get(ticketNum) || 0;
          storeData.revenue += ticketTotal;
          storeData.ticketCount++;
          
          // Track daily revenue for consistency score
          const currentDaily = storeData.dailyRevenue.get(saleDate) || 0;
          storeData.dailyRevenue.set(saleDate, currentDaily + ticketTotal);
          
          const grossProfit = ticketGrossProfits.get(ticketNum);
          if (grossProfit !== undefined) {
            storeData.grossProfitSum += grossProfit;
            storeData.grossProfitCount++;
          }
        }
      });

      // Convert to final format
      const stores = Array.from(storePerformance.entries()).map(([storeId, data]) => {
        const avgTicketSize = data.ticketCount > 0 ? data.revenue / data.ticketCount : 0;
        const grossProfitPercent = data.grossProfitCount > 0 ? data.grossProfitSum / data.grossProfitCount : 0;
        const returnRate = data.salesTickets.size > 0 ? (data.returnTickets.size / data.salesTickets.size) * 100 : 0;
        
        // Calculate sales consistency score (0-100, based on daily revenue variance)
        const dailyRevenues = Array.from(data.dailyRevenue.values());
        let consistencyScore = 0;
        if (dailyRevenues.length > 1) {
          const avgDaily = dailyRevenues.reduce((sum, val) => sum + val, 0) / dailyRevenues.length;
          const variance = dailyRevenues.reduce((sum, val) => sum + Math.pow(val - avgDaily, 2), 0) / dailyRevenues.length;
          const stdDev = Math.sqrt(variance);
          const coefficientOfVariation = avgDaily > 0 ? stdDev / avgDaily : 1;
          consistencyScore = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
        } else if (dailyRevenues.length === 1) {
          consistencyScore = 100; // Perfect consistency for single day
        }
        
        return {
          storeId,
          revenue: data.revenue,
          ticketCount: data.ticketCount,
          avgTicketSize,
          grossProfitPercent,
          returnRate,
          itemsSold: data.itemsSold,
          consistencyScore
        };
      }).filter(store => store.ticketCount > 0);

      return { stores };
      
    } catch (error) {
      console.error("Store performance data error:", error);
      throw new Error("Failed to get store performance data");
    }
  }
});

// Get detailed sales rep performance data for table
export const getRepPerformanceData = query({
  args: { 
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    }))
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    try {
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      
      // Apply date filter if provided
      let filteredData = allTicketData;
      if (args.dateRange) {
        const { start, end } = args.dateRange;
        filteredData = filteredData.filter(ticket => {
          const ticketDate = new Date(ticket.sale_date);
          const startDate = new Date(start);
          const endDate = new Date(end);
          return ticketDate >= startDate && ticketDate <= endDate;
        });
      }

      // Use same precedence logic
      const ticketTotals = new Map<string, number>();
      const ticketGrossProfits = new Map<string, number>();
      const salesTickets = new Set<string>();
      const returnTickets = new Set<string>();
      const giftCardsByTicket = new Map<string, number>();

      // Process with same logic as other queries
      filteredData.filter(line => line.ticket_type === 'sale').forEach(line => {
        const ticketNum = line.ticket_number;
        salesTickets.add(ticketNum);
        if (!ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      filteredData.filter(line => line.ticket_type === 'return').forEach(line => {
        const ticketNum = line.ticket_number;
        returnTickets.add(ticketNum);
        if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      filteredData.filter(line => line.ticket_type === 'gift_card').forEach(line => {
        const ticketNum = line.ticket_number;
        if (line.giftcard_amount) {
          const current = giftCardsByTicket.get(ticketNum) || 0;
          giftCardsByTicket.set(ticketNum, current + line.giftcard_amount);
        }
        if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
          const gpStr = line.gross_profit.toString().replace('%', '');
          const gp = parseFloat(gpStr);
          if (!isNaN(gp)) {
            ticketGrossProfits.set(ticketNum, gp);
          }
        }
      });

      giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
        if (!salesTickets.has(ticketNum) && !returnTickets.has(ticketNum)) {
          ticketTotals.set(ticketNum, totalGiftAmount);
        }
      });

      // Calculate detailed rep performance - EXCLUDE returns and $0 transactions
      const repPerformance = new Map<string, {
        revenue: number;
        ticketCount: number;
        tickets: Set<string>;
        grossProfitSum: number;
        grossProfitCount: number;
        itemsSold: number;
        returnTickets: Set<string>;
        salesTickets: Set<string>;
        stores: Set<string>;
      }>();

      // Get return ticket numbers to exclude gift cards that match returns
      const returnTicketNumbers = new Set(
        filteredData
          .filter(line => line.ticket_type === 'return')
          .map(line => line.ticket_number)
      );

      // Filter for reps - EXCLUDE returns, $0 transactions, and ONLINE sales
      const filteredForReps = filteredData.filter(line => {
        // CRITICAL: Exclude ONLINE sales from rep calculations
        if (line.sales_rep === 'ONLINE' || line.store_id === 'ONLINE') {
          return false;
        }
        
        // CRITICAL: Exclude ANY ticket number that appears in the return table
        if (returnTicketNumbers.has(line.ticket_number)) {
          return false;
        }
        
        // Include sales tickets ONLY if they have positive transaction totals
        if (line.ticket_type === 'sale') {
          return (line.transaction_total || 0) > 0;
        }
        // Include gift cards with positive amounts (already filtered out return ticket numbers above)
        if (line.ticket_type === 'gift_card') {
          return (line.giftcard_amount || 0) > 0;
        }
        // Exclude everything else
        return false;
      });

      // Track return data separately for return rate calculation
      const returnData = new Map<string, Set<string>>();
      filteredData.forEach(line => {
        if (line.ticket_type === 'return' && line.sales_rep) {
          if (!returnData.has(line.sales_rep)) {
            returnData.set(line.sales_rep, new Set());
          }
          returnData.get(line.sales_rep)!.add(line.ticket_number);
        }
      });

      filteredForReps.forEach(line => {
        const salesRep = line.sales_rep;
        if (!salesRep) return;
        
        const ticketNum = line.ticket_number;
        
        if (!repPerformance.has(salesRep)) {
          repPerformance.set(salesRep, {
            revenue: 0,
            ticketCount: 0,
            tickets: new Set(),
            grossProfitSum: 0,
            grossProfitCount: 0,
            itemsSold: 0,
            returnTickets: new Set(),
            salesTickets: new Set(),
            stores: new Set()
          });
        }
        
        const repData = repPerformance.get(salesRep)!;
        
        // Track stores worked at
        repData.stores.add(line.store_id);
        
        // Count items sold
        if (line.qty_sold) {
          repData.itemsSold += line.qty_sold;
        }
        
        // Track sale tickets for return rate calculation
        if (line.ticket_type === 'sale') {
          repData.salesTickets.add(ticketNum);
        }
        
        // Only count each ticket once per rep
        if (!repData.tickets.has(ticketNum)) {
          repData.tickets.add(ticketNum);
          const ticketTotal = ticketTotals.get(ticketNum) || 0;
          repData.revenue += ticketTotal;
          repData.ticketCount++;
          
          const grossProfit = ticketGrossProfits.get(ticketNum);
          if (grossProfit !== undefined) {
            repData.grossProfitSum += grossProfit;
            repData.grossProfitCount++;
          }
        }
      });

      // Add return ticket data for return rate calculation
      returnData.forEach((tickets, repName) => {
        if (repPerformance.has(repName)) {
          repPerformance.get(repName)!.returnTickets = tickets;
        }
      });

      // Convert to final format
      const reps = Array.from(repPerformance.entries()).map(([repName, data]) => {
        const avgTicketSize = data.ticketCount > 0 ? data.revenue / data.ticketCount : 0;
        const grossProfitPercent = data.grossProfitCount > 0 ? data.grossProfitSum / data.grossProfitCount : 0;
        const returnRate = data.salesTickets.size > 0 ? (data.returnTickets.size / data.salesTickets.size) * 100 : 0;
        
        return {
          repName,
          storesWorked: Array.from(data.stores).sort().join(', '),
          storeCount: data.stores.size,
          revenue: data.revenue,
          ticketCount: data.ticketCount,
          avgTicketSize,
          grossProfitPercent,
          returnRate,
          itemsSold: data.itemsSold
        };
      }).filter(rep => rep.ticketCount > 0);

      return { reps };
      
    } catch (error) {
      console.error("Rep performance data error:", error);
      throw new Error("Failed to get rep performance data");
    }
  }
});

// Get rep performance by store for scheduling optimization
export const getSchedulingOptimizerData = query({
  args: { 
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    })),
    minTickets: v.optional(v.number()) // Minimum tickets to be considered
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    try {
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      const minTicketThreshold = args.minTickets || 5; // Default: rep must have 5+ tickets at a store
      
      // Apply date filter if provided
      let filteredData = allTicketData;
      if (args.dateRange) {
        const { start, end } = args.dateRange;
        filteredData = filteredData.filter(ticket => {
          const ticketDate = new Date(ticket.sale_date);
          const startDate = new Date(start);
          const endDate = new Date(end);
          return ticketDate >= startDate && ticketDate <= endDate;
        });
      }

      // Use same precedence logic for ticket calculations
      const ticketTotals = new Map<string, number>();
      const salesTickets = new Set<string>();
      const returnTickets = new Set<string>();
      const giftCardsByTicket = new Map<string, number>();

      // Process sales tickets first
      filteredData.filter(line => line.ticket_type === 'sale').forEach(line => {
        const ticketNum = line.ticket_number;
        salesTickets.add(ticketNum);
        if (!ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
      });

      // Process returns
      filteredData.filter(line => line.ticket_type === 'return').forEach(line => {
        const ticketNum = line.ticket_number;
        returnTickets.add(ticketNum);
        if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
        }
      });

      // Process gift cards
      filteredData.filter(line => line.ticket_type === 'gift_card').forEach(line => {
        const ticketNum = line.ticket_number;
        if (line.giftcard_amount) {
          const current = giftCardsByTicket.get(ticketNum) || 0;
          giftCardsByTicket.set(ticketNum, current + line.giftcard_amount);
        }
      });

      giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
        if (!salesTickets.has(ticketNum) && !returnTickets.has(ticketNum)) {
          ticketTotals.set(ticketNum, totalGiftAmount);
        }
      });

      // Get return ticket numbers to exclude
      const returnTicketNumbers = new Set(
        filteredData
          .filter(line => line.ticket_type === 'return')
          .map(line => line.ticket_number)
      );

      // Filter for scheduling - EXCLUDE returns, $0 transactions, and ONLINE sales
      const filteredForScheduling = filteredData.filter(line => {
        // CRITICAL: Exclude ONLINE sales from scheduling calculations
        if (line.sales_rep === 'ONLINE' || line.store_id === 'ONLINE') {
          return false;
        }
        
        // Exclude ANY ticket number that appears in the return table
        if (returnTicketNumbers.has(line.ticket_number)) {
          return false;
        }
        
        // Include sales tickets ONLY if they have positive transaction totals
        if (line.ticket_type === 'sale') {
          return (line.transaction_total || 0) > 0;
        }
        // Include gift cards with positive amounts
        if (line.ticket_type === 'gift_card') {
          return (line.giftcard_amount || 0) > 0;
        }
        return false;
      });

      // Build rep performance by store
      const repStorePerformance = new Map<string, Map<string, {
        revenue: number;
        ticketCount: number;
        tickets: Set<string>;
      }>>();

      filteredForScheduling.forEach(line => {
        const salesRep = line.sales_rep;
        const storeId = line.store_id;
        const ticketNum = line.ticket_number;
        
        if (!salesRep || !storeId) return;
        
        if (!repStorePerformance.has(salesRep)) {
          repStorePerformance.set(salesRep, new Map());
        }
        
        const repData = repStorePerformance.get(salesRep)!;
        
        if (!repData.has(storeId)) {
          repData.set(storeId, {
            revenue: 0,
            ticketCount: 0,
            tickets: new Set()
          });
        }
        
        const storeData = repData.get(storeId)!;
        
        // Only count each ticket once per rep-store combination
        if (!storeData.tickets.has(ticketNum)) {
          storeData.tickets.add(ticketNum);
          const ticketTotal = ticketTotals.get(ticketNum) || 0;
          storeData.revenue += ticketTotal;
          storeData.ticketCount++;
        }
      });

      // Convert to store-centric view with rep rankings
      const storeOptimization = new Map<string, {
        storeId: string;
        topReps: {
          repName: string;
          avgTicketValue: number;
          totalRevenue: number;
          ticketCount: number;
          rank: number;
        }[];
      }>();

      // Get all unique stores
      const allStores = new Set<string>();
      repStorePerformance.forEach(repStores => {
        repStores.forEach((_, storeId) => {
          allStores.add(storeId);
        });
      });

      // For each store, rank reps by average ticket value
      allStores.forEach(storeId => {
        const repsAtStore: {
          repName: string;
          avgTicketValue: number;
          totalRevenue: number;
          ticketCount: number;
        }[] = [];

        repStorePerformance.forEach((repStores, repName) => {
          if (repStores.has(storeId)) {
            const storeData = repStores.get(storeId)!;
            if (storeData.ticketCount >= minTicketThreshold) {
              repsAtStore.push({
                repName,
                avgTicketValue: storeData.revenue / storeData.ticketCount,
                totalRevenue: storeData.revenue,
                ticketCount: storeData.ticketCount
              });
            }
          }
        });

        // Sort by average ticket value (descending)
        repsAtStore.sort((a, b) => b.avgTicketValue - a.avgTicketValue);

        // Add rankings
        const rankedReps = repsAtStore.map((rep, index) => ({
          ...rep,
          rank: index + 1
        }));

        if (rankedReps.length > 0) {
          storeOptimization.set(storeId, {
            storeId,
            topReps: rankedReps.slice(0, 10) // Top 10 reps per store
          });
        }
      });

      // Convert to array and sort by number of qualified reps
      const stores = Array.from(storeOptimization.values())
        .sort((a, b) => b.topReps.length - a.topReps.length);

      // Calculate overall rep rankings across all stores
      const overallRepPerformance = new Map<string, {
        totalRevenue: number;
        totalTickets: number;
        storeCount: number;
      }>();

      repStorePerformance.forEach((repStores, repName) => {
        let totalRevenue = 0;
        let totalTickets = 0;
        let storeCount = 0;

        repStores.forEach(storeData => {
          if (storeData.ticketCount >= minTicketThreshold) {
            totalRevenue += storeData.revenue;
            totalTickets += storeData.ticketCount;
            storeCount++;
          }
        });

        if (storeCount > 0) {
          overallRepPerformance.set(repName, {
            totalRevenue,
            totalTickets,
            storeCount
          });
        }
      });

      const topOverallReps = Array.from(overallRepPerformance.entries())
        .map(([repName, data]) => ({
          repName,
          avgTicketValue: data.totalRevenue / data.totalTickets,
          totalRevenue: data.totalRevenue,
          ticketCount: data.totalTickets,
          storeCount: data.storeCount
        }))
        .sort((a, b) => b.avgTicketValue - a.avgTicketValue)
        .slice(0, 10);

      return {
        stores,
        topOverallReps,
        totalStores: stores.length,
        totalReps: overallRepPerformance.size
      };
      
    } catch (error) {
      console.error("Scheduling optimizer error:", error);
      throw new Error("Failed to get scheduling optimizer data");
    }
  }
});

// Get daily rep performance report
export const getDailyRepReport = query({
  args: { 
    date: v.string() // YYYY-MM-DD format
  },
  handler: async (ctx, { date }) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    try {
      // Parse the date and create start/end of day boundaries
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      console.log(`Getting daily report for ${date}, UTC range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

      // Get ALL ticket data from all three tables (same as other calculations)
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      
      // Filter by date range
      const dateFilteredData = allTicketData.filter(ticket => {
        const ticketDate = new Date(ticket.sale_date);
        return ticketDate >= startOfDay && ticketDate <= endOfDay;
      });

      console.log(`Found ${dateFilteredData.length} total lines for ${date}`);

      // Apply same filtering logic as dataAggregation.ts
      const validTickets = dateFilteredData.filter(ticket => {
        // Filter out ONLINE store
        if (ticket.store_id === "ONLINE") return false;
        
        // Filter out AB-EA2 store
        if (ticket.store_id === "AB-EA2") return false;
        
        return true;
      });

      console.log(`After filtering: ${validTickets.length} valid ticket lines`);

      // Use same precedence logic as calculateSalesMetrics
      const ticketTotals = new Map<string, number>();
      const ticketReps = new Map<string, string>();
      const ticketStores = new Map<string, string>();
      const salesTickets = new Set<string>();
      const returnTickets = new Set<string>();
      const giftCardsByTicket = new Map<string, number>();

      // First pass: process sales tickets
      validTickets.filter(line => line.ticket_type === 'sale').forEach(line => {
        const ticketNum = line.ticket_number;
        const storeId = line.store_id;
        const salesRep = line.sales_rep || "Unknown Rep";
        
        // Skip EA2 related rep calculations (case insensitive and includes variations)
        const repUpper = salesRep.toUpperCase();
        if (repUpper.includes("EA2") || repUpper === "ONLINE") {
          console.log(`Skipping sales rep: ${salesRep} (${repUpper})`);
          return;
        }
        
        salesTickets.add(ticketNum);
        
        // Set transaction total once per ticket (sales take precedence)
        if (!ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
          ticketReps.set(ticketNum, salesRep);
          ticketStores.set(ticketNum, storeId);
        }
      });

      // Second pass: process return tickets (only if not already in sales)
      validTickets.filter(line => line.ticket_type === 'return').forEach(line => {
        const ticketNum = line.ticket_number;
        const storeId = line.store_id;
        const salesRep = line.sales_rep || "Unknown Rep";
        
        // Skip EA2 related rep calculations
        const repUpper = salesRep.toUpperCase();
        if (repUpper.includes("EA2") || repUpper === "ONLINE") {
          console.log(`Skipping return rep: ${salesRep} (${repUpper})`);
          return;
        }
        
        returnTickets.add(ticketNum);
        
        // Only set transaction total if ticket doesn't exist in sales
        if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum) && line.transaction_total) {
          ticketTotals.set(ticketNum, line.transaction_total);
          ticketReps.set(ticketNum, salesRep);
          ticketStores.set(ticketNum, storeId);
        }
      });

      // Third pass: process gift cards, group by ticket
      validTickets.filter(line => line.ticket_type === 'gift_card').forEach(line => {
        const ticketNum = line.ticket_number;
        const storeId = line.store_id;
        const salesRep = line.sales_rep || "Unknown Rep";
        
        // Skip EA2 related rep calculations
        const repUpper = salesRep.toUpperCase();
        if (repUpper.includes("EA2") || repUpper === "ONLINE") {
          console.log(`Skipping gift card rep: ${salesRep} (${repUpper})`);
          return;
        }
        
        // Group gift cards by ticket
        if (line.giftcard_amount) {
          const current = giftCardsByTicket.get(ticketNum) || 0;
          giftCardsByTicket.set(ticketNum, current + line.giftcard_amount);
        }
        
        // Set rep and store info for gift card tickets (if not already set)
        if (!ticketReps.has(ticketNum)) {
          ticketReps.set(ticketNum, salesRep);
          ticketStores.set(ticketNum, storeId);
        }
      });

      // Fourth pass: process gift card totals (only for pure gift card tickets)
      giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
        if (!salesTickets.has(ticketNum) && !returnTickets.has(ticketNum)) {
          // Pure gift card ticket - use gift card amount as transaction total
          ticketTotals.set(ticketNum, totalGiftAmount);
          console.log(`Added pure gift card ticket ${ticketNum}: $${totalGiftAmount}`);
        }
        // If ticket exists in sales or returns, don't add gift card amount
        // (transaction_total should already include gift cards)
      });

      // Group unique tickets by store and rep
      const storeRepTickets = new Map<string, Map<string, string[]>>();

      ticketTotals.forEach((total, ticketNum) => {
        const storeId = ticketStores.get(ticketNum)!;
        const salesRep = ticketReps.get(ticketNum)!;
        
        if (!storeRepTickets.has(storeId)) {
          storeRepTickets.set(storeId, new Map());
        }
        
        const repMap = storeRepTickets.get(storeId)!;
        if (!repMap.has(salesRep)) {
          repMap.set(salesRep, []);
        }
        
        repMap.get(salesRep)!.push(ticketNum);
      });

      // Calculate performance metrics for each rep at each store
      const stores: any[] = [];

      for (const [storeId, repMap] of storeRepTickets) {
        const reps: any[] = [];
        let storeTicketSum = 0;
        let storeTotalTickets = 0;

        for (const [repName, ticketNumbers] of repMap) {
          // Calculate total revenue from unique tickets
          const totalRevenue = ticketNumbers.reduce((sum, ticketNum) => {
            return sum + (ticketTotals.get(ticketNum) || 0);
          }, 0);
          
          const totalTickets = ticketNumbers.length;
          
          // CRITICAL: Skip reps with only 1 ticket (likely a return)
          if (totalTickets <= 1) {
            console.log(`Skipping rep ${repName} with only ${totalTickets} ticket(s) - likely return`);
            continue;
          }
          
          const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

          // Calculate sale tier breakdowns based on unique tickets
          let tier1Count = 0; // $125-198
          let tier2Count = 0; // $199-298
          let tier3Count = 0; // $299+

          ticketNumbers.forEach(ticketNum => {
            const ticketValue = ticketTotals.get(ticketNum) || 0;
            if (ticketValue >= 125 && ticketValue <= 198) {
              tier1Count++;
            } else if (ticketValue >= 199 && ticketValue <= 298) {
              tier2Count++;
            } else if (ticketValue >= 299) {
              tier3Count++;
            }
          });

          reps.push({
            repName,
            avgTicket,
            totalTickets,
            tier1Count,
            tier2Count,
            tier3Count
          });

          storeTicketSum += totalRevenue;
          storeTotalTickets += totalTickets;
        }

        // Sort reps by average ticket descending
        reps.sort((a, b) => b.avgTicket - a.avgTicket);

        const storeAvgTicket = storeTotalTickets > 0 ? storeTicketSum / storeTotalTickets : 0;

        stores.push({
          storeId,
          reps,
          totalReps: reps.length,
          storeAvgTicket
        });
      }

      // Sort stores by storeId
      stores.sort((a, b) => a.storeId.localeCompare(b.storeId));

      const totalStores = stores.length;
      const totalReps = stores.reduce((sum, store) => sum + store.totalReps, 0);

      return {
        stores,
        totalStores,
        totalReps,
        date
      };

    } catch (error) {
      console.error("Error in getDailyRepReport:", error);
      throw new Error("Failed to get daily rep report");
    }
  }
});