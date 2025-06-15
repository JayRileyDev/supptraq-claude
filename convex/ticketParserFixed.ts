import { mutation } from './_generated/server'
import { v } from 'convex/values'

// Fixed parser based on exact CSV structure specifications
// Uses precise column mapping and row relationships

interface ParsedTicket {
  ticket_number: string
  store_id: string
  sale_date: string
  sales_rep?: string
  transaction_total?: number
  gross_profit?: string
  items: ParsedItem[]
  gift_cards: ParsedGiftCard[]
}

interface ParsedItem {
  item_number: string
  product_name: string
  qty_sold: number
  selling_unit: string
}

interface ParsedGiftCard {
  amount: number
  product_name: string
}

// Ticket number patterns
const TICKET_PATTERNS = [
  /^AB-[A-Z]{2,4}-T\d{5,7}$/,     // AB-XX-TNNNNNN
  /^AB-[A-Z]{1,3}\d{1}-T\d{5,7}$/, // AB-XX#-TNNNNNN (store code with digit)
  /^AB-[A-Z]{2}-1T\d{5,7}$/,      // AB-XX-1TNNNNNN  
  /^AB[A-Z]{2,4}\d{4,6}-\d{2}$/,  // ABXXNNNN-01 (fixed: 4-6 digits instead of exactly 5)
  /^[A-Z]{2,4}-T\d{5,7}$/         // CL-TNNNNNN (without AB prefix)
]

function isTicketNumber(value: string): boolean {
  if (!value) return false
  const trimmed = value.trim()
  
  
  return TICKET_PATTERNS.some(pattern => pattern.test(trimmed))
}

function extractStoreId(ticketNumber: string): string {
  const trimmed = ticketNumber.trim()
  
  // Format 1: AB-XXX-TNNNNNN or AB-XX-TNNNNNN
  if (/^AB-[A-Z]{2,4}-T\d{5,7}$/.test(trimmed)) {
    const parts = trimmed.split('-')
    return `${parts[0]}-${parts[1]}`
  }
  
  // Format 2: AB-XX#-TNNNNNN (store code with digit)
  if (/^AB-[A-Z]{1,3}\d{1}-T\d{5,7}$/.test(trimmed)) {
    const parts = trimmed.split('-')
    return `${parts[0]}-${parts[1]}`
  }
  
  // Format 3: AB-XX-1TNNNNNN
  if (/^AB-[A-Z]{2}-1T\d{5,7}$/.test(trimmed)) {
    const parts = trimmed.split('-')
    return `${parts[0]}-${parts[1]}`
  }
  
  // Format 4: ABXXNNNN-01 (variable digit length)
  if (/^AB[A-Z]{2,4}\d{4,6}-\d{2}$/.test(trimmed)) {
    const storeCode = trimmed.substring(2, 4) // Always extract 2 chars after AB
    return `AB-${storeCode}`
  }
  
  // Format 5: CL-TNNNNNN (without AB prefix)
  if (/^[A-Z]{2,4}-T\d{5,7}$/.test(trimmed)) {
    const parts = trimmed.split('-')
    return `AB-${parts[0]}` // Add AB prefix to store code
  }
  
  return trimmed.substring(0, 5)
}

function parseDate(dateStr: string): string {
  try {
    const parts = dateStr.split('/')
    if (parts.length !== 3) return new Date().toISOString()
    
    let month = parseInt(parts[0])
    let day = parseInt(parts[1])
    let year = parseInt(parts[2])
    
    if (year < 100) {
      year += year < 50 ? 2000 : 1900
    }
    
    const date = new Date(year, month - 1, day)
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function parseNumber(value: any): number | null {
  if (typeof value === 'number') return value
  
  const str = String(value || '')
    .replace(/[$,]/g, '')
    .trim()
  
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

function getCellText(row: string[], colIndex: number): string {
  return String(row[colIndex] || '').trim()
}

function getMergedText(row: string[], startCol: number, endCol: number): string {
  const texts: string[] = []
  for (let i = startCol; i <= endCol; i++) {
    const text = getCellText(row, i)
    if (text) texts.push(text)
  }
  return texts.join(' ').trim()
}

// Main parsing function based on exact CSV structure
export async function parseTicketsStructured(
  ctx: any, 
  rows: string[][], 
  dynamicProductNames: Record<string, string> = {}
): Promise<{
  tickets: ParsedTicket[]
  errors: string[]
  dynamicProductNames: Record<string, string>
}> {
  const tickets: ParsedTicket[] = []
  const errors: string[] = []
  
  // Fetch SKU vendor map for product name lookups
  const skuEntries = await ctx.db.query('sku_vendor_map').collect()
  const skuMap: Record<string, string> = {}
  
  skuEntries.forEach((entry: any) => {
    if (entry.item_number && entry.description) {
      skuMap[entry.item_number.trim().toUpperCase()] = entry.description.trim()
    }
  })
  
  
  // Dynamic product name mapping is now passed in from previous chunks
  // This allows product names found in early chunks to be used in later chunks
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue
    
    // Look for ticket number in columns A-B (merged)
    const ticketText = getMergedText(row, 0, 1)
    
    if (isTicketNumber(ticketText)) {
      
      try {
        // Don't assume rigid structure - just start parsing metadata after ticket number
        let ticketRowIndex = i + 1
        
        const ticket: ParsedTicket = {
          ticket_number: ticketText,
          store_id: extractStoreId(ticketText),
          sale_date: new Date().toISOString(),
          items: [],
          gift_cards: []
        }
        
        // Parse metadata by scanning flexibly through ticket section
        for (let j = i + 1; j < Math.min(i + 30, rows.length); j++) {
          const metaRow = rows[j] || []
          const firstCol = getCellText(metaRow, 0)
          
          // Stop if we hit the next ticket
          if (j > i + 1 && isTicketNumber(firstCol)) {
            break
          }
          
          // Parse sale date from any row that looks like a date
          if (!ticket.sale_date || ticket.sale_date === new Date().toISOString()) {
            if (firstCol && /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(firstCol)) {
              ticket.sale_date = parseDate(firstCol)
              
              // Try to get gross profit from same row
              // For ONLINE tickets (JSHARPE), gross profit is in column S (index 18)
              // For other tickets, gross profit is in column R (index 17)
              let grossProfitText = getCellText(metaRow, 17) // Default: column R
              if (!grossProfitText || !grossProfitText.endsWith('%')) {
                grossProfitText = getCellText(metaRow, 18) // Try column S for ONLINE tickets
              }
              
              if (grossProfitText && grossProfitText.endsWith('%')) {
                const gp = parseFloat(grossProfitText.replace('%', ''))
                if (!isNaN(gp)) {
                  ticket.gross_profit = gp.toFixed(1)
                }
              }
            }
          }
          
          const firstColUpper = firstCol.toUpperCase()
          
          // Parse transaction total from "Sale ticket" row
          if (firstColUpper.includes('SALE') && firstColUpper.includes('TICKET')) {
            let total = parseNumber(getCellText(metaRow, 19)) // Column T
            if (total === null) {
              total = parseNumber(getCellText(metaRow, 20)) // Column U
            }
            if (total !== null) {
              ticket.transaction_total = total
            }
          }
          
          // Parse sales rep from any valid name
          if (!ticket.sales_rep && firstColUpper && 
              /^[A-Z]{3,15}$/.test(firstColUpper) && 
              !['TICKET', 'SALE', 'ITEM'].includes(firstColUpper) &&
              !firstColUpper.match(/^\d+$/)) {
            ticket.sales_rep = firstColUpper === 'JSHARPE' ? 'ONLINE' : firstColUpper
          }
        }
        
        // Look for gift cards anywhere in the ticket section (simple search for "Gift card #")
        for (let j = i + 1; j < rows.length; j++) {
          const giftRow = rows[j] || []
          const giftText = getMergedText(giftRow, 0, 1)
          
          // Stop at next ticket
          if (j > i + 1 && isTicketNumber(giftText)) {
            // Stop at next ticket
            break
          }
          
          // Look for "Gift card #" text (case insensitive)
          if (giftText.toLowerCase().includes('gift card #')) {
            // Parse multiple gift card rows that follow
            for (let k = j + 1; k < Math.min(j + 20, rows.length); k++) {
              const dataRow = rows[k] || []
              const giftNumber = getCellText(dataRow, 0) // Gift card number in column A
              
              // Stop if we hit the next ticket or item section
              if (giftNumber.toLowerCase().includes('item #') || 
                  (giftNumber && isTicketNumber(giftNumber))) {
                break
              }
              
              // Skip empty rows but continue looking for more gift cards
              if (!giftNumber) {
                continue
              }
              
              // Only process if it looks like a gift card number (digits)
              if (/^\d{5,}/.test(giftNumber)) {
                const giftAmount = parseNumber(getCellText(dataRow, 11)) // Column L (index 11)
                const giftDescription = getCellText(dataRow, 14) || 'Gift Card' // Column O
                
                if (giftAmount && giftAmount > 0) {
                  ticket.gift_cards.push({
                    amount: giftAmount,
                    product_name: giftDescription || 'Gift Card'
                  })
                  // Added gift card
                }
              }
            }
            break // Don't look for more gift card sections
          }
        }
        
        // FLEXIBLE ITEM PARSING: Scan all rows until next ticket, no structure assumptions
        for (let j = i + 1; j < rows.length; j++) {
          const itemRow = rows[j] || []
          const itemText = getCellText(itemRow, 0).trim()
          
          // Stop at next ticket number
          if (isTicketNumber(itemText)) {
            break
          }
          
          // Skip empty rows
          if (!itemText) {
            continue
          }
          
          // Look for valid item numbers with minimal assumptions
          if (/^[A-Z0-9-]{4,}/.test(itemText)) {
            // Parse quantity like working code: check both column 1 and column 6
            const qtyText1 = getCellText(itemRow, 1) // Column B
            const qtyText6 = getCellText(itemRow, 6) // Column G
            const qty = parseNumber(qtyText1) || parseNumber(qtyText6) || 0
            
            // Skip zero quantity items (like working code)
            if (qty === 0) {
              continue
            }
            
            // Parse product name with priority system
            let productName = getCellText(itemRow, 4) || getCellText(itemRow, 14) || ''
            const skuKey = itemText.trim().toUpperCase()
            
            // First priority: Use SKU map if available
            if (skuMap[skuKey]) {
              productName = skuMap[skuKey]
              dynamicProductNames[skuKey] = productName
            } 
            // Second priority: Use previously found product name for this item
            else if (dynamicProductNames[skuKey]) {
              productName = dynamicProductNames[skuKey]
            }
            // Third priority: Use CSV product name if it's valid
            else if (productName && 
                     !productName.includes('Description') && 
                     !productName.includes('____') && 
                     productName !== 'Unknown' &&
                     productName.trim().length > 0) {
              productName = productName.trim()
              dynamicProductNames[skuKey] = productName
            } 
            // Fallback: Use item number
            else {
              productName = `Product ${itemText}`
            }
            
            const sellingUnit = getCellText(itemRow, 2) || getCellText(itemRow, 7) || 'EACH'
            
            ticket.items.push({
              item_number: itemText,
              product_name: productName.trim(),
              qty_sold: qty,
              selling_unit: sellingUnit
            })
          }
        }
        
        
        
        // Always add ticket (even if no items - might have gift cards or be data issue)
        tickets.push(ticket)
        
      } catch (error) {
        const errorMsg = `Error parsing ticket ${ticketText}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
  }
  
  return { tickets, errors, dynamicProductNames }
}

// Updated mutation using the structured parser
// Separate parsing mutation (no insertion)
export const parseTicketsOnly = mutation({
  args: {
    user_id: v.string(),
    rows: v.array(v.array(v.string())),
    dynamicProductNames: v.optional(v.record(v.string(), v.string()))
  },
  handler: async (ctx, { user_id, rows, dynamicProductNames = {} }) => {
    try {
      // Parse all tickets but don't insert anything
      const parseResult = await parseTicketsStructured(ctx, rows, dynamicProductNames)
      const { tickets, errors: parseErrors, dynamicProductNames: updatedProductNames } = parseResult
      
      // Convert parsed tickets to flat entries for insertion
      const allEntries: any[] = []
      
      tickets.forEach(ticket => {
        // Add gift card entries
        ticket.gift_cards.forEach(giftCard => {
          allEntries.push({
            type: 'gift_card',
            ticket_number: ticket.ticket_number,
            store_id: ticket.store_id,
            sale_date: ticket.sale_date,
            sales_rep: ticket.sales_rep,
            giftcard_amount: giftCard.amount,
            product_name: giftCard.product_name,
            gross_profit: ticket.gross_profit,
            user_id
          })
        })
        
        // Add item entries
        ticket.items.forEach(item => {
          const baseEntry = {
            type: item.qty_sold > 0 ? 'sale' : 'return',
            ticket_number: ticket.ticket_number,
            store_id: ticket.store_id,
            sale_date: ticket.sale_date,
            sales_rep: ticket.sales_rep,
            transaction_total: ticket.transaction_total || 0,
            gross_profit: ticket.gross_profit,
            item_number: item.item_number,
            product_name: item.product_name,
            qty_sold: item.qty_sold,
            selling_unit: item.selling_unit,
            user_id
          }
          allEntries.push(baseEntry)
        })
      })
      
      return {
        status: 'success',
        totalTickets: tickets.length,
        totalEntries: allEntries.length,
        entries: allEntries,
        errors: parseErrors,
        // Only return new product names found in this chunk (limit size)
        newProductNames: Object.keys(updatedProductNames).length > Object.keys(dynamicProductNames).length 
          ? Object.fromEntries(
              Object.entries(updatedProductNames).filter(([key]) => 
                !dynamicProductNames.hasOwnProperty(key)
              )
            )
          : {}
      }
      
    } catch (error) {
      console.error('Ticket parsing error:', error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Parsing failed',
        errors: [{ error: 'Parsing failed' }]
      }
    }
  }
})

// Batch insertion mutation
export const insertTicketsBatch = mutation({
  args: {
    entries: v.array(v.any()),
    batchInfo: v.object({
      batchNumber: v.number(),
      totalBatches: v.number()
    })
  },
  handler: async (ctx, { entries, batchInfo }) => {
    const stats = {
      inserted: 0,
      failed: 0,
      byTable: {
        ticket_history: 0,
        return_tickets: 0,
        gift_card_tickets: 0
      }
    }
    const errors: any[] = []
    
    for (const entry of entries) {
      try {
        if (entry.type === 'gift_card') {
          await ctx.db.insert('gift_card_tickets', {
            ticket_number: entry.ticket_number,
            store_id: entry.store_id,
            sale_date: entry.sale_date,
            sales_rep: entry.sales_rep,
            giftcard_amount: entry.giftcard_amount,
            product_name: entry.product_name,
            gross_profit: entry.gross_profit,
            user_id: entry.user_id
          })
          stats.byTable.gift_card_tickets++
        } else if (entry.type === 'sale') {
          await ctx.db.insert('ticket_history', {
            ticket_number: entry.ticket_number,
            store_id: entry.store_id,
            sale_date: entry.sale_date,
            sales_rep: entry.sales_rep,
            transaction_total: entry.transaction_total,
            gross_profit: entry.gross_profit,
            item_number: entry.item_number,
            product_name: entry.product_name,
            qty_sold: entry.qty_sold,
            selling_unit: entry.selling_unit,
            user_id: entry.user_id
          })
          stats.byTable.ticket_history++
        } else if (entry.type === 'return') {
          await ctx.db.insert('return_tickets', {
            ticket_number: entry.ticket_number,
            store_id: entry.store_id,
            sale_date: entry.sale_date,
            sales_rep: entry.sales_rep,
            transaction_total: entry.transaction_total,
            gross_profit: entry.gross_profit,
            item_number: entry.item_number,
            product_name: entry.product_name,
            qty_sold: entry.qty_sold,
            selling_unit: entry.selling_unit,
            user_id: entry.user_id
          })
          stats.byTable.return_tickets++
        }
        stats.inserted++
      } catch (error) {
        errors.push({
          ticket: entry.ticket_number,
          item: entry.item_number || 'gift_card',
          error: error instanceof Error ? error.message : 'Insert failed'
        })
        stats.failed++
      }
    }
    
    return {
      status: 'success',
      batchInfo,
      stats,
      errors
    }
  }
})

// Insert parsed tickets with proper categorization and detailed debugging
async function insertTicketsStructured(
  ctx: any,
  tickets: ParsedTicket[],
  user_id: string
): Promise<{
  inserted: number
  byTable: { ticket_history: number; return_tickets: number; gift_card_tickets: number }
  errors: any[]
}> {
  const results = {
    inserted: 0,
    byTable: {
      ticket_history: 0,
      return_tickets: 0,
      gift_card_tickets: 0
    },
    errors: [] as any[]
  }
  
  let ticketsWithNoData = 0
  let itemsSkipped = 0
  let giftCardsSkipped = 0
  
  console.log(`🔍 DEBUG: Starting insertion of ${tickets.length} parsed tickets`)
  
  for (const ticket of tickets) {
    let ticketHasInsertions = false
    let ticketItemCount = 0
    let ticketGiftCardCount = 0
    
    try {
      // Insert gift cards
      for (const giftCard of ticket.gift_cards) {
        try {
          await ctx.db.insert('gift_card_tickets', {
            ticket_number: ticket.ticket_number,
            store_id: ticket.store_id,
            sale_date: ticket.sale_date,
            sales_rep: ticket.sales_rep,
            giftcard_amount: giftCard.amount,
            product_name: giftCard.product_name,
            user_id
          })
          results.byTable.gift_card_tickets++
          results.inserted++
          ticketHasInsertions = true
          ticketGiftCardCount++
        } catch (giftCardError) {
          console.log(`❌ GIFT CARD INSERT FAILED: ${ticket.ticket_number} - $${giftCard.amount}`)
          console.log(`   Error: ${giftCardError instanceof Error ? giftCardError.message : 'Unknown error'}`)
          giftCardsSkipped++
        }
      }
      
      // Insert items
      for (const item of ticket.items) {
        try {
          const baseEntry = {
            ticket_number: ticket.ticket_number,
            store_id: ticket.store_id,
            sale_date: ticket.sale_date,
            sales_rep: ticket.sales_rep,
            transaction_total: ticket.transaction_total || 0,
            gross_profit: ticket.gross_profit,
            item_number: item.item_number,
            product_name: item.product_name,
            qty_sold: item.qty_sold,
            selling_unit: item.selling_unit,
            user_id
          }
          
          // Insert into appropriate table based on quantity (including zero qty items)
          if (item.qty_sold > 0) {
            await ctx.db.insert('ticket_history', baseEntry)
            results.byTable.ticket_history++
            ticketHasInsertions = true
            ticketItemCount++
          } else if (item.qty_sold < 0) {
            await ctx.db.insert('return_tickets', baseEntry)
            results.byTable.return_tickets++
            ticketHasInsertions = true
            ticketItemCount++
          } else if (item.qty_sold === 0) {
            // Insert zero quantity items into ticket_history (they still count as items)
            await ctx.db.insert('ticket_history', baseEntry)
            results.byTable.ticket_history++
            ticketHasInsertions = true
            ticketItemCount++
            console.log(`📝 ZERO QTY ITEM INSERTED: ${ticket.ticket_number} - ${item.item_number}`)
          }
          
          results.inserted++
        } catch (itemError) {
          console.log(`❌ ITEM INSERT FAILED: ${ticket.ticket_number} - ${item.item_number}`)
          console.log(`   Item: qty=${item.qty_sold}, product="${item.product_name}"`)
          console.log(`   Error: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
          itemsSkipped++
        }
      }
      
      // Log tickets that were parsed but have no data inserted
      if (!ticketHasInsertions) {
        console.log(`🚫 TICKET PARSED BUT NOT INSERTED: ${ticket.ticket_number}`)
        console.log(`   Items: ${ticket.items.length}, Gift Cards: ${ticket.gift_cards.length}`)
        console.log(`   Store: ${ticket.store_id}, Sales Rep: ${ticket.sales_rep || 'none'}`)
        
        // Extra debug for specific problematic tickets
        if (ticket.ticket_number === 'AB-SA-1T051707' || ticket.ticket_number === 'AB-HP-T002300') {
          console.log(`   🔍 DETAILED DEBUG for ${ticket.ticket_number}:`)
          console.log(`   Transaction Total: ${ticket.transaction_total}`)
          console.log(`   Items found:`)
          ticket.items.forEach((item, idx) => {
            console.log(`     ${idx + 1}: "${item.item_number}" qty=${item.qty_sold} name="${item.product_name}"`)
          })
          console.log(`   Gift cards found:`)
          ticket.gift_cards.forEach((gc, idx) => {
            console.log(`     ${idx + 1}: $${gc.amount} "${gc.product_name}"`)
          })
        }
        
        ticketsWithNoData++
      } else if (ticketItemCount > 0 || ticketGiftCardCount > 0) {
        // Only log successful tickets occasionally to avoid spam
        if (results.byTable.ticket_history % 1000 === 0) {
          console.log(`✅ Ticket ${ticket.ticket_number}: ${ticketItemCount} items, ${ticketGiftCardCount} gift cards inserted`)
        }
      }
      
    } catch (error) {
      console.log(`❌ TICKET PROCESSING FAILED: ${ticket.ticket_number}`)
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      results.errors.push({
        ticket: ticket.ticket_number,
        error: error instanceof Error ? error.message : 'Insert failed'
      })
    }
  }
  
  // Summary logging
  console.log(`\n📊 INSERTION DEBUG SUMMARY:`)
  console.log(`   Tickets parsed: ${tickets.length}`)
  console.log(`   Tickets with no insertions: ${ticketsWithNoData}`)
  console.log(`   Items skipped/failed: ${itemsSkipped}`)
  console.log(`   Gift cards skipped/failed: ${giftCardsSkipped}`)
  console.log(`   Successful insertions: ${results.inserted}`)
  console.log(`   - Sales: ${results.byTable.ticket_history}`)
  console.log(`   - Returns: ${results.byTable.return_tickets}`)
  console.log(`   - Gift Cards: ${results.byTable.gift_card_tickets}`)
  console.log(`   Total errors: ${results.errors.length}\n`)
  
  return results
}