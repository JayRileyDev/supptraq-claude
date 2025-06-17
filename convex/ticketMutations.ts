import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { parseTicketsStructured } from './ticketParserFixed'
import { getUserContext } from './accessControl'

// Clean, focused ticket mutations
// Handles parsing and insertion with proper error handling

interface InsertionStats {
  total: number
  inserted: number
  failed: number
  duplicates: number
  byTable: {
    ticket_history: number
    return_tickets: number
    gift_card_tickets: number
  }
}

// Main mutation for parsing and inserting tickets
export const parseAndInsertTickets = mutation({
  args: {
    rows: v.array(v.array(v.string())),
    options: v.optional(v.object({
      batchSize: v.optional(v.number()),
      skipDuplicates: v.optional(v.boolean()),
      dryRun: v.optional(v.boolean())
    }))
  },
  handler: async (ctx, { rows, options = {} }) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const startTime = Date.now()
    const { batchSize = 100, skipDuplicates = true, dryRun = false } = options
    
    const stats: InsertionStats = {
      total: 0,
      inserted: 0,
      failed: 0,
      duplicates: 0,
      byTable: {
        ticket_history: 0,
        return_tickets: 0,
        gift_card_tickets: 0
      }
    }
    
    try {
      // Parse tickets using structured parser
      const parseResult = await parseTicketsStructured(ctx, rows)
      const { tickets, errors: parseErrors } = parseResult
      
      stats.total = tickets.length
      
      if (tickets.length === 0) {
        return {
          status: 'error',
          message: 'No valid tickets found in CSV data',
          stats,
          errors: parseErrors
        }
      }
      
      // Check for duplicates if requested
      let ticketsToInsert = tickets
      if (skipDuplicates && !dryRun) {
        const existingTickets = new Set<string>()
        
        // Sample check - only check first 50 tickets for performance
        const sampleTickets = tickets.slice(0, 50).map((t: any) => t.ticket_number)
        for (const ticketNumber of sampleTickets) {
          const existing = await ctx.db.query('ticket_history')
            .filter(q => q.eq(q.field('ticket_number'), ticketNumber))
            .first()
          if (existing) {
            existingTickets.add(ticketNumber)
          }
        }
        
        // Filter out confirmed duplicates
        ticketsToInsert = tickets.filter((t: any) => !existingTickets.has(t.ticket_number))
        stats.duplicates = tickets.length - ticketsToInsert.length
      }
      
      if (dryRun) {
        return {
          status: 'dry_run',
          message: `Would process ${ticketsToInsert.length} tickets (${stats.duplicates} duplicates skipped)`,
          stats: { ...stats, total: ticketsToInsert.length },
          sample: ticketsToInsert.slice(0, 3)
        }
      }
      
      // Insert tickets
      const insertResult = await insertTicketsBatch(ctx, ticketsToInsert, userContext, batchSize)
      
      stats.inserted = insertResult.inserted
      stats.failed = insertResult.errors.length
      stats.byTable = {
        ticket_history: insertResult.ticket_history,
        return_tickets: insertResult.return_tickets,
        gift_card_tickets: insertResult.gift_card_tickets
      }
      
      const processingTime = Date.now() - startTime
      
      return {
        status: 'success',
        message: `Successfully processed ${stats.inserted} entries from ${stats.total} tickets in ${processingTime}ms`,
        stats,
        errors: insertResult.errors.slice(0, 10), // Return first 10 errors
        timing: {
          totalTime: processingTime,
          ticketsPerSecond: Math.round((stats.inserted / processingTime) * 1000)
        }
      }
      
    } catch (error) {
      console.error('Ticket processing error:', error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Processing failed',
        stats,
        errors: [{ error: 'Processing failed' }]
      }
    }
  }
})

// Batch insertion with proper error handling
async function insertTicketsBatch(
  ctx: any,
  tickets: any[],
  userContext: any,
  batchSize: number
): Promise<{
  inserted: number
  ticket_history: number
  return_tickets: number
  gift_card_tickets: number
  errors: any[]
}> {
  const results = {
    inserted: 0,
    ticket_history: 0,
    return_tickets: 0,
    gift_card_tickets: 0,
    errors: [] as any[]
  }
  
  // Prepare entries for each table
  const ticketHistoryEntries: any[] = []
  const returnTicketEntries: any[] = []
  const giftCardEntries: any[] = []
  
  // Process each ticket and categorize items
  for (const ticket of tickets) {
    try {
      // Check if this is a gift card only ticket (no items, but has transaction_total)
      if (ticket.items.length === 0 && ticket.transaction_total && ticket.transaction_total > 0) {
        giftCardEntries.push({
          ticket_number: ticket.ticket_number,
          store_id: ticket.store_id,
          sale_date: ticket.sale_date,
          sales_rep: ticket.sales_rep,
          giftcard_amount: ticket.transaction_total,
          product_name: 'Gift Card Purchase',
          orgId: userContext.orgId,
          franchiseId: userContext.franchiseId
        })
        continue
      }
      
      // Process regular items
      for (const item of ticket.items) {
        const baseEntry = {
          ticket_number: ticket.ticket_number,
          store_id: ticket.store_id,
          sale_date: ticket.sale_date,
          sales_rep: ticket.sales_rep,
          transaction_total: ticket.transaction_total || 0, // Ensure 0 instead of undefined
          gross_profit: ticket.gross_profit,
          item_number: item.item_number,
          product_name: item.product_name,
          qty_sold: item.qty_sold, // Keep actual value (positive or negative)
          selling_unit: item.selling_unit,
          orgId: userContext.orgId,
          franchiseId: userContext.franchiseId
        }
        
        // Categorize by qty_sold sign - items go to ONLY ONE table
        if (item.qty_sold > 0) {
          ticketHistoryEntries.push(baseEntry)
        } else if (item.qty_sold < 0) {
          // For returns, store the negative quantity as-is
          returnTicketEntries.push(baseEntry)
        }
      }
      
    } catch (error) {
      results.errors.push({
        ticket: ticket.ticket_number,
        error: error instanceof Error ? error.message : 'Processing failed'
      })
    }
  }
  
  // Insert in batches with error handling
  if (ticketHistoryEntries.length > 0) {
    try {
      // Process in smaller batches to avoid timeouts
      for (let i = 0; i < ticketHistoryEntries.length; i += batchSize) {
        const batch = ticketHistoryEntries.slice(i, i + batchSize)
        await Promise.all(batch.map(entry => ctx.db.insert('ticket_history', entry)))
        results.ticket_history += batch.length
      }
      console.log(`✅ Inserted ${results.ticket_history} ticket_history entries`)
    } catch (error) {
      console.error('❌ ticket_history insertion failed:', error)
      results.errors.push({ table: 'ticket_history', error: 'Bulk insert failed' })
    }
  }
  
  if (returnTicketEntries.length > 0) {
    try {
      for (let i = 0; i < returnTicketEntries.length; i += batchSize) {
        const batch = returnTicketEntries.slice(i, i + batchSize)
        await Promise.all(batch.map(entry => ctx.db.insert('return_tickets', entry)))
        results.return_tickets += batch.length
      }
      console.log(`✅ Inserted ${results.return_tickets} return_tickets entries`)
    } catch (error) {
      console.error('❌ return_tickets insertion failed:', error)
      results.errors.push({ table: 'return_tickets', error: 'Bulk insert failed' })
    }
  }
  
  if (giftCardEntries.length > 0) {
    try {
      for (let i = 0; i < giftCardEntries.length; i += batchSize) {
        const batch = giftCardEntries.slice(i, i + batchSize)
        await Promise.all(batch.map(entry => ctx.db.insert('gift_card_tickets', entry)))
        results.gift_card_tickets += batch.length
      }
      console.log(`✅ Inserted ${results.gift_card_tickets} gift_card_tickets entries`)
    } catch (error) {
      console.error('❌ gift_card_tickets insertion failed:', error)
      results.errors.push({ table: 'gift_card_tickets', error: 'Bulk insert failed' })
    }
  }
  
  results.inserted = results.ticket_history + results.return_tickets + results.gift_card_tickets
  return results
}

// Query to get recent tickets for validation
export const getRecentTickets = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, { limit = 10 }) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const recentTickets = await ctx.db
      .query('ticket_history')
      .filter(q => q.eq(q.field('franchiseId'), userContext.franchiseId))
      .order('desc')
      .take(limit)
    
    return recentTickets.map(ticket => ({
      ticket_number: ticket.ticket_number,
      store_id: ticket.store_id,
      sale_date: ticket.sale_date,
      sales_rep: ticket.sales_rep,
      transaction_total: ticket.transaction_total,
      item_number: ticket.item_number,
      product_name: ticket.product_name,
      qty_sold: ticket.qty_sold
    }))
  }
})

// Clean up duplicate tickets
export const cleanupDuplicateTickets = mutation({
  args: {
    dryRun: v.optional(v.boolean())
  },
  handler: async (ctx, { dryRun = true }) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const duplicates: string[] = []
    const seen = new Map<string, string>()
    
    // Find duplicates in ticket_history
    const tickets = await ctx.db
      .query('ticket_history')
      .filter(q => q.eq(q.field('franchiseId'), userContext.franchiseId))
      .take(1000) // Limit for performance
    
    for (const ticket of tickets) {
      const key = `${ticket.ticket_number}-${ticket.item_number}`
      if (seen.has(key)) {
        duplicates.push(ticket._id)
      } else {
        seen.set(key, ticket._id)
      }
    }
    
    if (!dryRun && duplicates.length > 0) {
      for (const id of duplicates) {
        await ctx.db.delete(id as any)
      }
    }
    
    return {
      found: duplicates.length,
      deleted: dryRun ? 0 : duplicates.length,
      dryRun
    }
  }
})

// Create ticket upload record
export const createTicketUploadRecord = mutation({
  args: {
    upload_name: v.string(),
    total_tickets: v.number(),
    total_entries: v.number(),
    stores_affected: v.array(v.string()),
    status: v.string()
  },
  handler: async (ctx, args) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const uploadId = await ctx.db.insert('ticket_uploads', {
      user_id: userContext.userId, // Keep for backward compatibility with schema
      orgId: userContext.orgId,
      franchiseId: userContext.franchiseId,
      upload_name: args.upload_name,
      total_tickets: args.total_tickets,
      total_entries: args.total_entries,
      stores_affected: args.stores_affected,
      upload_date: new Date().toISOString(),
      status: args.status
    })
    
    return uploadId
  }
})