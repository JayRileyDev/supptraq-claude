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

// Complete sales data type that includes all component data
export interface CompleteSalesData {
  // Core metrics for UnifiedMetricCards
  metrics: SalesMetrics;
  
  // Filter options for dropdown filters
  filterOptions: {
    stores: string[];
    salesReps: string[];
    storeCount: number;
    repCount: number;
    totalLines: number;
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
  
  // Leaderboard data
  leaderboards: {
    stores: {
      avgTicketSize: Array<{
        storeId: string;
        avgTicketSize: number;
        revenue: number;
        ticketCount: number;
      }>;
      grossProfit: Array<{
        storeId: string;
        grossProfitPercent: number;
        revenue: number;
        ticketCount: number;
      }>;
      totalRevenue: Array<{
        storeId: string;
        revenue: number;
        ticketCount: number;
        avgTicketSize: number;
      }>;
    };
    reps: {
      avgTicketSize: Array<{
        repName: string;
        avgTicketSize: number;
        revenue: number;
        ticketCount: number;
        storeCount: number;
      }>;
      grossProfit: Array<{
        repName: string;
        grossProfitPercent: number;
        revenue: number;
        ticketCount: number;
        storeCount: number;
      }>;
      totalRevenue: Array<{
        repName: string;
        revenue: number;
        ticketCount: number;
        avgTicketSize: number;
        storeCount: number;
      }>;
    };
  };
  
  // Performance alerts data
  performanceAlerts: {
    underperformingStores: Array<{
      storeId: string;
      revenue: number;
      ticketCount: number;
      avgTicketSize: number;
      grossProfitPercent: number;
    }>;
    underperformingReps: Array<{
      repName: string;
      underperformingDays: Array<{
        date: string;
        ticketCount: number;
        avgTicketSize: number;
        revenue: number;
      }>;
      daysBelow70: number;
      totalDaysWorked: number;
      performanceRatio: number;
      needsCoaching: boolean;
    }>;
    benchmark: number;
  };
  
  // Store performance table data
  storePerformance: {
    stores: Array<{
      storeId: string;
      revenue: number;
      ticketCount: number;
      avgTicketSize: number;
      grossProfitPercent: number;
      returnRate: number;
      itemsSold: number;
      consistencyScore: number;
    }>;
  };
  
  // Rep performance table data
  repPerformance: {
    reps: Array<{
      repName: string;
      storesWorked: string;
      storeCount: number;
      revenue: number;
      ticketCount: number;
      avgTicketSize: number;
      grossProfitPercent: number;
      returnRate: number;
      itemsSold: number;
    }>;
  };
  
  // Scheduling optimizer data
  schedulingData: {
    stores: Array<{
      storeId: string;
      topReps: Array<{
        repName: string;
        avgTicketValue: number;
        totalRevenue: number;
        ticketCount: number;
        rank: number;
      }>;
    }>;
    topOverallReps: Array<{
      repName: string;
      avgTicketValue: number;
      totalRevenue: number;
      ticketCount: number;
      storeCount: number;
    }>;
    totalStores: number;
    totalReps: number;
  };
}

// Main unified query that fetches and processes ALL data once
export const getCompleteSalesData = query({
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
  handler: async (ctx, args): Promise<CompleteSalesData> => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    
    try {
      // Get ALL ticket data from all three tables ONCE
      const allTicketData = await getAllTicketData(ctx.db, userContext.franchiseId);
      
      // Apply filters ONCE
      const filters: FilterOptions = {
        dateRange: args.dateRange,
        storeId: args.storeId,
        salesRepId: args.salesRepId,
        includeReturns: args.includeReturns ?? true,
        includeGiftCards: args.includeGiftCards ?? true
      };
      
      const filteredData = applyFilters(allTicketData, filters);
      
      // Calculate core metrics ONCE
      const metrics = calculateSalesMetrics(filteredData);
      
      // Calculate filter options ONCE
      const filterOptions = calculateFilterOptions(allTicketData);
      
      // Process all ticket totals and mappings ONCE using shared logic
      const processedTickets = processTicketData(filteredData);
      
      // Calculate all component data using the processed tickets
      const leaderboards = calculateLeaderboards(filteredData, processedTickets);
      const performanceAlerts = calculatePerformanceAlerts(filteredData, processedTickets, args.dateRange);
      const storePerformance = calculateStorePerformance(filteredData, processedTickets);
      const repPerformance = calculateRepPerformance(filteredData, processedTickets);
      const schedulingData = calculateSchedulingData(filteredData, processedTickets);
      
      return {
        metrics,
        filterOptions,
        leaderboards,
        performanceAlerts,
        storePerformance,
        repPerformance,
        schedulingData
      };
      
    } catch (error) {
      console.error("Complete sales data error:", error);
      throw new Error("Failed to get complete sales data");
    }
  }
});

// Shared ticket processing logic (used by all calculations)
function processTicketData(filteredData: any[]) {
  const ticketTotals = new Map<string, number>();
  const ticketGrossProfits = new Map<string, number>();
  const salesTickets = new Set<string>();
  const returnTickets = new Set<string>();
  const giftCardsByTicket = new Map<string, number>();

  // Process sales tickets first (highest precedence)
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

  // Process return tickets (second precedence)
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

  // Process gift cards (third precedence)
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

  // Process gift card totals (lowest precedence)
  giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
    if (!salesTickets.has(ticketNum) && !returnTickets.has(ticketNum)) {
      ticketTotals.set(ticketNum, totalGiftAmount);
    }
  });

  return {
    ticketTotals,
    ticketGrossProfits,
    salesTickets,
    returnTickets,
    giftCardsByTicket
  };
}

// Calculate filter options
function calculateFilterOptions(allTicketData: any[]) {
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
}

// All the calculation functions below use the same logic as salesUnified.ts 
// but operate on the shared processed ticket data instead of reprocessing

function calculateLeaderboards(filteredData: any[], processedTickets: any) {
  const { ticketTotals, ticketGrossProfits, salesTickets, returnTickets } = processedTickets;
  
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

  // Calculate rep performance - EXCLUDE returns and $0 transactions
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

  // Filter for reps - EXCLUDE returns, $0 transactions, ONLINE sales, and AB-EA2 store
  const filteredForReps = filteredData.filter(line => {
    // CRITICAL: Exclude ONLINE sales from rep calculations
    if (line.sales_rep === 'ONLINE' || line.store_id === 'ONLINE') {
      return false;
    }
    
    // CRITICAL: Exclude AB-EA2 store from rep calculations
    if (line.store_id === 'AB-EA2') {
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
}

// Performance alerts calculation (same logic as salesUnified.ts)
function calculatePerformanceAlerts(filteredData: any[], processedTickets: any, dateRange?: any) {
  const { ticketTotals, ticketGrossProfits } = processedTickets;
  
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
  // (Same complex logic as salesUnified.ts - abbreviated for space)
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

  // Filter for reps - exclude ONLINE, AB-EA2, and return tickets
  const filteredForReps = filteredData.filter(line => {
    if (line.sales_rep === 'ONLINE' || line.store_id === 'ONLINE') {
      return false;
    }
    
    // CRITICAL: Exclude AB-EA2 store from rep calculations
    if (line.store_id === 'AB-EA2') {
      return false;
    }
    
    if (returnTicketNumbers.has(line.ticket_number)) {
      return false;
    }
    
    if (line.ticket_type === 'sale') {
      return (line.transaction_total || 0) > 0;
    }
    if (line.ticket_type === 'gift_card') {
      return (line.giftcard_amount || 0) > 0;
    }
    return false;
  });

  filteredForReps.forEach(line => {
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
}

// Store performance calculation (same logic as salesUnified.ts)
function calculateStorePerformance(filteredData: any[], processedTickets: any) {
  const { ticketTotals, ticketGrossProfits, salesTickets, returnTickets } = processedTickets;
  
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
}

// Rep performance calculation (same logic as salesUnified.ts)
function calculateRepPerformance(filteredData: any[], processedTickets: any) {
  const { ticketTotals, ticketGrossProfits } = processedTickets;
  
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

  // Filter for reps - EXCLUDE returns, $0 transactions, ONLINE sales, and AB-EA2 store
  const filteredForReps = filteredData.filter(line => {
    // CRITICAL: Exclude ONLINE sales from rep calculations
    if (line.sales_rep === 'ONLINE' || line.store_id === 'ONLINE') {
      return false;
    }
    
    // CRITICAL: Exclude AB-EA2 store from rep calculations
    if (line.store_id === 'AB-EA2') {
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
}

// Scheduling data calculation (same logic as salesUnified.ts but abbreviated)
function calculateSchedulingData(filteredData: any[], processedTickets: any, minTickets: number = 5) {
  const { ticketTotals } = processedTickets;
  
  // Get return ticket numbers to exclude
  const returnTicketNumbers = new Set(
    filteredData
      .filter(line => line.ticket_type === 'return')
      .map(line => line.ticket_number)
  );

  // Filter for scheduling - EXCLUDE returns, $0 transactions, ONLINE sales, and AB-EA2 store
  const filteredForScheduling = filteredData.filter(line => {
    if (line.sales_rep === 'ONLINE' || line.store_id === 'ONLINE') {
      return false;
    }
    
    // CRITICAL: Exclude AB-EA2 store from scheduling calculations
    if (line.store_id === 'AB-EA2') {
      return false;
    }
    
    if (returnTicketNumbers.has(line.ticket_number)) {
      return false;
    }
    
    if (line.ticket_type === 'sale') {
      return (line.transaction_total || 0) > 0;
    }
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
        if (storeData.ticketCount >= minTickets) {
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
      if (storeData.ticketCount >= minTickets) {
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
}