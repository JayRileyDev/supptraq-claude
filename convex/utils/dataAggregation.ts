import type { DatabaseReader } from "../_generated/server";

// Types for unified ticket data
export interface UnifiedTicketLine {
  ticket_number: string;
  store_id: string;
  sale_date: string;
  sales_rep?: string;
  transaction_total?: number;
  gross_profit?: string;
  item_number?: string;
  product_name?: string;
  qty_sold?: number;
  selling_unit?: string;
  giftcard_amount?: number;
  ticket_type: 'sale' | 'return' | 'gift_card';
}

// Aggregated metrics response
export interface SalesMetrics {
  totalSales: number;
  ticketCount: number;
  avgTicketValue: number;
  grossProfitPercent: number;
  itemsSold: number;
  returnRate: number;
  giftCardUsage: number;
  salesConsistency: number;
  
  // Breakdown data
  uniqueTickets: number;
  totalReturnValue: number;
  totalGiftCardValue: number;
  totalLines: number;
  
  // Filter options
  stores: string[];
  salesReps: string[];
  dateRange: {
    earliest: string;
    latest: string;
  };
}

export interface FilterOptions {
  dateRange?: { start: string; end: string };
  storeId?: string;
  salesRepId?: string;
  includeReturns?: boolean;
  includeGiftCards?: boolean;
}

// Get all ticket data from the three tables safely
export async function getAllTicketData(
  db: DatabaseReader,
  userId: string
): Promise<UnifiedTicketLine[]> {
  const allData: UnifiedTicketLine[] = [];
  
  try {
    // Fetch from ticket_history - try collect first, fallback to take
    try {
      const tickets = await db
        .query("ticket_history")
        .filter((q: any) => q.eq(q.field("user_id"), userId))
        .collect();
      
      tickets.forEach((ticket: any) => {
        allData.push({
          ...ticket,
          ticket_type: 'sale'
        });
      });
    } catch (collectError) {
      // Fallback to take with large limit
      const tickets = await db
        .query("ticket_history")
        .filter((q: any) => q.eq(q.field("user_id"), userId))
        .take(10000);
      
      tickets.forEach((ticket: any) => {
        allData.push({
          ...ticket,
          ticket_type: 'sale'
        });
      });
    }
    
    // Fetch from return_tickets
    try {
      const returns = await db
        .query("return_tickets")
        .filter((q: any) => q.eq(q.field("user_id"), userId))
        .collect();
      
      returns.forEach((ticket: any) => {
        allData.push({
          ...ticket,
          ticket_type: 'return'
        });
      });
    } catch (collectError) {
      const returns = await db
        .query("return_tickets")
        .filter((q: any) => q.eq(q.field("user_id"), userId))
        .take(2000);
      
      returns.forEach((ticket: any) => {
        allData.push({
          ...ticket,
          ticket_type: 'return'
        });
      });
    }
    
    // Fetch from gift_card_tickets
    try {
      const giftCards = await db
        .query("gift_card_tickets")
        .filter((q: any) => q.eq(q.field("user_id"), userId))
        .collect();
      
      giftCards.forEach((ticket: any) => {
        allData.push({
          ...ticket,
          ticket_type: 'gift_card'
        });
      });
    } catch (collectError) {
      const giftCards = await db
        .query("gift_card_tickets")
        .filter((q: any) => q.eq(q.field("user_id"), userId))
        .take(1000);
      
      giftCards.forEach((ticket: any) => {
        allData.push({
          ...ticket,
          ticket_type: 'gift_card'
        });
      });
    }
    
    return allData;
  } catch (error) {
    // Return empty array if everything fails
    return [];
  }
}

// Apply filters to unified ticket data
export function applyFilters(
  data: UnifiedTicketLine[],
  filters: FilterOptions
): UnifiedTicketLine[] {
  let filtered = [...data];
  
  // Date range filter
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter(ticket => {
      // Convert dates to Date objects for proper comparison
      const ticketDate = new Date(ticket.sale_date);
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      return ticketDate >= startDate && ticketDate <= endDate;
    });
  }
  
  // Store filter
  if (filters.storeId && filters.storeId !== "all") {
    filtered = filtered.filter(ticket => ticket.store_id === filters.storeId);
  }
  
  // Sales rep filter
  if (filters.salesRepId && filters.salesRepId !== "all") {
    filtered = filtered.filter(ticket => ticket.sales_rep === filters.salesRepId);
  }
  
  // Include/exclude returns
  if (!filters.includeReturns) {
    filtered = filtered.filter(ticket => ticket.ticket_type !== 'return');
  }
  
  // Include/exclude gift cards
  if (!filters.includeGiftCards) {
    filtered = filtered.filter(ticket => ticket.ticket_type !== 'gift_card');
  }
  
  return filtered;
}

// Calculate comprehensive sales metrics from filtered data
export function calculateSalesMetrics(data: UnifiedTicketLine[]): SalesMetrics {
  const ticketTotals = new Map<string, number>();
  const ticketTypes = new Map<string, string>();
  const ticketGrossProfits = new Map<string, number>(); // Track gross profit per unique ticket
  const uniqueTickets = new Set<string>();
  const stores = new Set<string>();
  const salesReps = new Set<string>();
  const dates: string[] = [];
  
  let totalReturnValue = 0;
  let totalGiftCardValue = 0;
  let itemsSold = 0;
  
  // Separate processing by ticket type (same logic as getTicketStats)
  const salesTickets = new Set<string>();
  const returnTickets = new Set<string>();
  const giftCardsByTicket = new Map<string, number>();
  
  // First pass: collect sales tickets and their totals
  data.filter(line => line.ticket_type === 'sale').forEach(line => {
    const ticketNum = line.ticket_number;
    uniqueTickets.add(ticketNum);
    salesTickets.add(ticketNum);
    stores.add(line.store_id);
    if (line.sales_rep) salesReps.add(line.sales_rep);
    dates.push(line.sale_date);
    
    // Set transaction total once per ticket (sales take precedence)
    if (!ticketTotals.has(ticketNum) && line.transaction_total) {
      ticketTotals.set(ticketNum, line.transaction_total);
    }
    
    // Set gross profit once per ticket
    if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
      const gpStr = line.gross_profit.toString().replace('%', '');
      const gp = parseFloat(gpStr);
      if (!isNaN(gp)) {
        ticketGrossProfits.set(ticketNum, gp);
      }
    }
    
    // Items sold (from line items)
    if (line.qty_sold) {
      itemsSold += line.qty_sold;
    }
  });
  
  // Second pass: process return tickets (only if not already in sales)
  data.filter(line => line.ticket_type === 'return').forEach(line => {
    const ticketNum = line.ticket_number;
    uniqueTickets.add(ticketNum);
    returnTickets.add(ticketNum);
    stores.add(line.store_id);
    if (line.sales_rep) salesReps.add(line.sales_rep);
    dates.push(line.sale_date);
    
    // Only set transaction total if ticket doesn't exist in sales
    if (!salesTickets.has(ticketNum) && !ticketTotals.has(ticketNum) && line.transaction_total) {
      ticketTotals.set(ticketNum, line.transaction_total);
    }
    
    // Set gross profit once per ticket (only if not already set by sales)
    if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
      const gpStr = line.gross_profit.toString().replace('%', '');
      const gp = parseFloat(gpStr);
      if (!isNaN(gp)) {
        ticketGrossProfits.set(ticketNum, gp);
      }
    }
    
    // Track return values
    if (line.transaction_total) {
      totalReturnValue += line.transaction_total;
    }
    
    // Items sold (from line items)
    if (line.qty_sold) {
      itemsSold += line.qty_sold;
    }
  });
  
  // Third pass: process gift cards, group by ticket
  data.filter(line => line.ticket_type === 'gift_card').forEach(line => {
    const ticketNum = line.ticket_number;
    uniqueTickets.add(ticketNum);
    stores.add(line.store_id);
    if (line.sales_rep) salesReps.add(line.sales_rep);
    dates.push(line.sale_date);
    
    // Group gift cards by ticket
    if (line.giftcard_amount) {
      const current = giftCardsByTicket.get(ticketNum) || 0;
      giftCardsByTicket.set(ticketNum, current + line.giftcard_amount);
      totalGiftCardValue += line.giftcard_amount;
    }
    
    // Set gross profit once per ticket (only if not already set)
    if (line.gross_profit && !ticketGrossProfits.has(ticketNum)) {
      const gpStr = line.gross_profit.toString().replace('%', '');
      const gp = parseFloat(gpStr);
      if (!isNaN(gp)) {
        ticketGrossProfits.set(ticketNum, gp);
      }
    }
  });
  
  // Fourth pass: process gift card totals (only for pure gift card tickets)
  giftCardsByTicket.forEach((totalGiftAmount, ticketNum) => {
    if (!salesTickets.has(ticketNum) && !returnTickets.has(ticketNum)) {
      // Pure gift card ticket - use gift card amount as transaction total
      ticketTotals.set(ticketNum, totalGiftAmount);
    }
    // If ticket exists in sales or returns, don't add gift card amount
    // (transaction_total should already include gift cards)
  });
  
  // Calculate totals
  const totalSales = Array.from(ticketTotals.values()).reduce((sum, val) => sum + val, 0);
  const ticketCount = uniqueTickets.size;
  const avgTicketValue = ticketCount > 0 ? totalSales / ticketCount : 0;
  
  // Calculate gross profit percentage (same logic as getTicketStats)
  let totalGrossProfit = 0;
  ticketGrossProfits.forEach(gp => {
    totalGrossProfit += gp;
  });
  const grossProfitPercent = uniqueTickets.size > 0 ? totalGrossProfit / uniqueTickets.size : 0;
  
  // Return rate calculation (count return-only tickets)
  const returnOnlyTickets = Array.from(returnTickets).filter(ticketNum => !salesTickets.has(ticketNum)).length;
  const returnRate = ticketCount > 0 ? (returnOnlyTickets / ticketCount) * 100 : 0;
  
  // Gift card usage rate (count pure gift card tickets)
  const pureGiftCardTickets = Array.from(giftCardsByTicket.keys()).filter(ticketNum => 
    !salesTickets.has(ticketNum) && !returnTickets.has(ticketNum)
  ).length;
  const giftCardUsage = ticketCount > 0 ? (pureGiftCardTickets / ticketCount) * 100 : 0;
  
  // Sales consistency (coefficient of variation of daily sales)
  // Process each unique ticket once to avoid double-counting
  const dailySales = new Map<string, number>();
  const processedTickets = new Set<string>();
  
  data.forEach(line => {
    const ticketNum = line.ticket_number;
    
    // Only process each ticket once
    if (!processedTickets.has(ticketNum)) {
      processedTickets.add(ticketNum);
      
      const date = line.sale_date.split('T')[0]; // Get date part only
      const current = dailySales.get(date) || 0;
      
      // Use the ticket total we already calculated
      const ticketTotal = ticketTotals.get(ticketNum) || 0;
      dailySales.set(date, current + ticketTotal);
    }
  });
  
  const dailySalesValues = Array.from(dailySales.values());
  const avgDailySales = dailySalesValues.reduce((sum, val) => sum + val, 0) / dailySalesValues.length;
  const variance = dailySalesValues.reduce((sum, val) => sum + Math.pow(val - avgDailySales, 2), 0) / dailySalesValues.length;
  const stdDev = Math.sqrt(variance);
  const salesConsistency = avgDailySales > 0 ? 100 - ((stdDev / avgDailySales) * 100) : 0;
  
  // Date range
  const sortedDates = dates.sort();
  
  return {
    totalSales,
    ticketCount,
    avgTicketValue,
    grossProfitPercent,
    itemsSold,
    returnRate,
    giftCardUsage,
    salesConsistency: Math.max(0, salesConsistency),
    
    uniqueTickets: uniqueTickets.size,
    totalReturnValue,
    totalGiftCardValue,
    totalLines: data.length,
    
    stores: Array.from(stores).sort(),
    salesReps: Array.from(salesReps).sort(),
    dateRange: {
      earliest: sortedDates[0] || '',
      latest: sortedDates[sortedDates.length - 1] || ''
    }
  };
}