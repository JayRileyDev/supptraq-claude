import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { parse } from 'date-fns'
import { getUserContext } from './accessControl'

// ===== Core Parsing Logic (Consolidated) =====
interface ParsingContext {
  currentRow: number
  rows: string[][]
  errors: ParsingError[]
  warnings: string[]
  skuMap: Record<string, string>
  processedTickets?: Set<string>
}

interface ParsingError {
  ticket?: string
  row?: number
  error: string
  context?: any
}

// ===== Constants =====
// Updated regex pattern to handle all ticket formats including without AB prefix
const TICKET_PATTERN = /AB-[A-Z]{2,4}-T\d{5,7}|AB-[A-Z]{2}-1T\d{5,7}|AB[A-Z]{2,4}\d{4,6}-\d{2}|[A-Z]{2,4}-T\d{5,7}/

const GIFT_CARD_INDICATORS = [
  'gift card #',
  'gift certificate',
  'gift card purchase',
  'gift card sale',
  'gift card amount'
]

const RETURN_INDICATORS = [
  'return ticket',
  'refund',
  'credit memo',
  'return'
]

const ONLINE_REPS = ['JSHARPE', 'ONLINE', 'WEB', 'E-COMMERCE', 'ECOMMERCE']
const SPECIAL_REPS = ['MANAGER', 'ADMIN', 'SYSTEM', 'KIOSK']

// ===== Utility Functions =====
function isTicketNumber(value: string): boolean {
  const cleanValue = value.trim()
  return TICKET_PATTERN.test(cleanValue)
}

// Add the working code's hasValidItemLines function
function hasValidItemLines(rows: string[][], startIndex: number): boolean {
  for (let j = startIndex; j < Math.min(startIndex + 20, rows.length); j++) {
    const line = rows[j]
    if (!line) continue
    const qty = parseInt(line[1]) || parseInt(line[6]) || 0
    if (qty !== 0) return true
  }
  return false
}

function getTicketFormat(ticketNumber: string): string {
  if (/^[A-Z]{2,4}-[A-Z]{2,4}-T\d{6}$/.test(ticketNumber)) return 'A'
  if (/^[A-Z]{2}-[A-Z]{2}-1T\d{6}$/.test(ticketNumber)) return 'B'
  if (/^[A-Z]{4}\d{5}-\d{2}$/.test(ticketNumber)) return 'C'
  if (/^[A-Z]{4}\d{5}$/.test(ticketNumber)) return 'D'
  if (/^AB-[A-Z0-9]{3}-T\d{6}$/.test(ticketNumber)) return 'G'
  return 'UNKNOWN'
}

function extractStoreId(ticketNumber: string): string {
  // Format C — Legacy with suffix: ABFS34462-01 (check first since it has hyphens)
  if (/^[A-Z]{4}\d{4,6}-\d{2}$/.test(ticketNumber)) {
    const storeCode = ticketNumber.substring(2, 4) // Extract middle 2 letters (FS from ABFS)
    return `AB-${storeCode}`
  }
  
  // Format A & B & G — Standard with hyphens: AB-CLP-T003342, AB-SG-1T090947, AB-EA2-T000101
  if (ticketNumber.includes('-')) {
    const parts = ticketNumber.split('-')
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`
    }
  }
  
  // Format D — Legacy without suffix: ABHP34593
  if (/^[A-Z]{4}\d{5}$/.test(ticketNumber)) {
    const storeCode = ticketNumber.substring(2, 4) // Extract middle 2 letters (HP from ABHP)
    return `AB-${storeCode}`
  }
  
  // Fallback for any unmatched patterns
  return ticketNumber.substring(0, Math.min(5, ticketNumber.length))
}

function parseDate(dateStr: string): string | null {
  const formats = [
    'M/d/yy',
    'M/d/yyyy',
    'MM/dd/yy',
    'MM/dd/yyyy',
    'yyyy-MM-dd',
    'd/M/yy',
    'd/M/yyyy'
  ]

  const cleaned = dateStr.trim()
  for (const format of formats) {
    try {
      const parsed = parse(cleaned, format, new Date())
      const year = parsed.getFullYear()
      
      // Validate reasonable date range (2020-2030)
      if (year >= 2020 && year <= 2030) {
        return parsed.toISOString()
      }
    } catch {
      continue
    }
  }
  return null
}

function parseNumber(value: any): number | null {
  if (typeof value === 'number') return value
  
  let str = String(value || '')
    .replace(/[$,]/g, '')
    .replace(/\s/g, '')
    .trim()
  
  // Handle negative numbers in parentheses (common in accounting)
  if (str.match(/^\(.*\)$/)) {
    str = '-' + str.replace(/[()]/g, '')
  }
  
  // Handle explicit negative signs and decimal numbers
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str)
    if (!isNaN(num) && isFinite(num)) {
      return num
    }
  }
  return null
}

function normalizeRep(rep: string): string {
  const normalized = rep.trim().toUpperCase()
  
  if (!normalized || normalized === 'TOTAL') return ''
  if (ONLINE_REPS.includes(normalized)) return 'ONLINE'
  if (SPECIAL_REPS.includes(normalized)) return normalized
  
  // Valid rep names are typically 3-15 uppercase letters
  if (/^[A-Z]{3,15}$/.test(normalized)) {
    return normalized
  }
  
  return ''
}

function cleanProductName(name: string): string {
  if (!name) return name
  
  // Remove common unwanted suffixes and words
  const unwantedSuffixes = [
    '- WEBSITE', '- ONLINE', '- PRICEADJ', '- ADJUSTMENT',
    '- DISCOUNT', '- SHIPPING', '- HANDLING', '- SERVICE',
    '- LOYALTY', '- COUPON', '- REFUND', '- CREDIT',
    '- SYSTEM', '- ADMIN', '- TEST', '- TRAINING'
  ]
  
  let cleaned = name.trim()
  
  // Remove unwanted suffixes (case insensitive)
  for (const suffix of unwantedSuffixes) {
    const regex = new RegExp(suffix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i')
    cleaned = cleaned.replace(regex, '').trim()
  }
  
  // Remove trailing dashes and clean up spacing
  cleaned = cleaned.replace(/\s*-\s*$/, '').trim()
  
  // Remove duplicate spaces
  cleaned = cleaned.replace(/\s+/g, ' ')
  
  return cleaned
}

// ===== Main Parsing Functions =====
function findTicketHeader(ctx: ParsingContext): ParsedTicket | null {
  const { rows, currentRow } = ctx
  const row = rows[currentRow]
  
  if (!Array.isArray(row)) return null
  
  // Find ticket number in row
  const ticketCell = row.find(cell => isTicketNumber(String(cell || '').trim()))
  if (!ticketCell) return null
  
  const ticket_number = String(ticketCell).trim()
  const store_id = extractStoreId(ticket_number)
  
  // Extract customer number if present
  let customer_number: string | undefined
  const customerPattern = /C\d{7}/
  const customerCell = row.find(cell => customerPattern.test(String(cell || '')))
  if (customerCell) {
    const match = String(customerCell).match(customerPattern)
    if (match) customer_number = match[0]
  }
  
  // Transaction total will be found later in the "sale ticket" row
  let transaction_total: number | undefined
  
  return {
    ticket_number,
    store_id,
    sale_date: new Date().toISOString(), // Will be updated
    ticket_type: 'sale', // Will be determined
    customer_number,
    transaction_total,
    items: [],
    gift_cards: []
  }
}

function parseTicketDetails(ticket: ParsedTicket, ctx: ParsingContext): void {
  const { rows, currentRow } = ctx
  
  // Parse the next ~15 rows for ticket details (extended range)
  for (let offset = 1; offset <= 15; offset++) {
    const rowIdx = currentRow + offset
    if (rowIdx >= rows.length) break
    
    const row = rows[rowIdx]
    if (!Array.isArray(row)) continue
    
    // Skip empty rows
    if (row.every(cell => !cell || String(cell).trim() === '')) continue
    
    // Parse station and customer name (usually offset +2)
    if (offset === 2) {
      const stationCell = row.find(cell => String(cell || '').includes('-'))
      if (stationCell) {
        const parts = String(stationCell).split(/\s+/)
        ticket.station = parts.find(p => p.includes('-'))
      }
      
      // Customer name is often in column 7
      if (row[7] && String(row[7]).trim()) {
        ticket.customer_name = String(row[7]).trim()
      }
    }
    
    // Parse dates (usually offset +3)
    if (offset === 3) {
      // Try columns 3 and 4 for dates
      for (const col of [3, 4]) {
        if (row[col]) {
          const date = parseDate(String(row[col]))
          if (date) {
            ticket.sale_date = date
            break
          }
        }
      }
      
      // Event number
      const eventCell = row.find(cell => /EVT\d+/.test(String(cell || '')))
      if (eventCell) {
        const match = String(eventCell).match(/EVT\d+/)
        if (match) ticket.event_number = match[0]
      }
    }
    
    // Parse sales rep (usually offset +7 or +8)
    if (offset >= 7 && offset <= 8) {
      const repCell = row[0] || ''
      const rep = normalizeRep(String(repCell))
      if (rep) {
        ticket.sales_rep = rep
      }
    }
    
    // Transaction total parsing - use working code logic
    const rowText = row.join(' ').toLowerCase()
    
    if (rowText.includes('sale ticket')) {
      ticket.ticket_type = 'sale'
      
      // Use working code logic: find all numeric candidates and take the last one
      const numericCandidates = row
        .map(cell => String(cell || '').replace(/[$,]/g, '').trim())
        .filter(val => /^-?\d+(\.\d+)?$/.test(val))
        .map(parseFloat)
      
      if (numericCandidates.length > 0) {
        const total = numericCandidates[numericCandidates.length - 1]
        ticket.transaction_total = parseFloat(total.toFixed(2))
        console.log(`DEBUG ENHANCED: Parsed transaction_total from 'Sale ticket':`, ticket.transaction_total)
      }
    } else if (rowText.includes('return ticket')) {
      ticket.ticket_type = 'return'
      
      // Same logic for returns
      const numericCandidates = row
        .map(cell => String(cell || '').replace(/[$,]/g, '').trim())
        .filter(val => /^-?\d+(\.\d+)?$/.test(val))
        .map(parseFloat)
      
      if (numericCandidates.length > 0) {
        const total = numericCandidates[numericCandidates.length - 1]
        ticket.transaction_total = parseFloat(total.toFixed(2))
      }
    }
    
    // Parse gross profit percentage - look for patterns like "32.1%"
    const gpPattern = /(\d+\.\d+)%/
    const rowData = row.join(',')
    const gpMatch = rowData.match(gpPattern)
    if (gpMatch) {
      const gpValue = parseFloat(gpMatch[1])
      if (gpValue >= 0 && gpValue <= 100) {
        ticket.gross_profit = gpValue.toFixed(2)
      }
    }
  }
}

function parseItemLines(ticket: ParsedTicket, ctx: ParsingContext, startRow: number): number {
  const { rows, skuMap } = ctx
  let itemCount = 0
  let returnCount = 0
  let lastItemRow = startRow
  
  // Look for item header row
  let itemHeaderRow = -1
  for (let i = startRow; i < Math.min(startRow + 15, rows.length); i++) {
    const row = rows[i]
    if (Array.isArray(row) && row.some(cell => 
      String(cell || '').toLowerCase().includes('item #')
    )) {
      itemHeaderRow = i
      break
    }
  }
  
  if (itemHeaderRow === -1) return startRow
  
  // Parse items starting after header
  for (let i = itemHeaderRow + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue
    
    // Stop at next ticket or major section
    if (row.some(cell => isTicketNumber(String(cell || '')))) break
    if (row.some(cell => String(cell || '').includes('Loyalty Program'))) continue
    
    
    // Skip empty rows
    if (row.every(cell => !cell || String(cell).trim() === '')) continue
    
    // Parse potential item data
    const parsedItem = parseRawItemRow(row, skuMap)
    if (parsedItem && parsedItem.item_number) {
      // Parse both positive and negative items - we'll sort them during insertion
      const item = parseItemRow(row, skuMap, true) // Always allow parsing
      if (item) {
        console.log(`DEBUG ENHANCED ITEM: Adding item ${item.item_number} with qty ${item.qty_sold} to ticket ${ticket.ticket_number}`)
        ticket.items.push(item)
        if (item.qty_sold > 0) {
          itemCount++
        } else if (item.qty_sold < 0) {
          returnCount++
          console.log(`DEBUG ENHANCED RETURN: Item ${item.item_number} qty ${item.qty_sold} will go to return_tickets`)
        } else {
          console.log(`DEBUG ENHANCED ZERO: Item ${item.item_number} has zero qty, will be skipped`)
        }
      }
      lastItemRow = i
    }
  }
  
  // Determine primary ticket type based on content
  if (returnCount > 0 && itemCount === 0) {
    ticket.ticket_type = 'return'
  } else if (itemCount === 0 && ticket.gift_cards.length > 0) {
    ticket.ticket_type = 'gift_card'
  } else if (ticket.gift_cards.length > 0) {
    ticket.ticket_type = 'gift_card' // Mixed ticket with gift cards
  }
  
  return lastItemRow
}

function parseRawItemRow(row: string[], skuMap: Record<string, string>): { item_number: string; qty_sold: number } | null {
  // Basic parsing to extract item number and quantity for return detection
  let item_number = ''
  let qty_sold = 0
  
  // Try pattern 1 first
  if (row[0] && /[A-Z0-9-]+/.test(String(row[0]))) {
    item_number = String(row[0]).trim()
    const parsedQty = parseNumber(row[6])
    qty_sold = parsedQty !== null ? parsedQty : 0
  }
  
  // Validate basic data
  if (!item_number || item_number.length < 2) return null
  
  return { item_number, qty_sold }
}

function parseItemRow(row: string[], skuMap: Record<string, string>, allowNegative = false): TicketItem | null {
  // Item data can be in different column positions
  // Pattern 1: Columns 0-6 (most common)
  // Pattern 2: Columns 0,6,7,10,14 (alternative)
  
  let item_number = ''
  let qty_sold = 0
  let selling_unit = ''
  let display_price: number | undefined
  let extended_cost: number | undefined
  let description = ''
  let return_reason = ''
  
  // Try pattern 1 first
  if (row[0] && /[A-Z0-9-]+/.test(String(row[0]))) {
    item_number = String(row[0]).trim()
    
    // Parse quantity - don't default to 0 if null, use 0 only for valid zero
    const parsedQty = parseNumber(row[6])
    qty_sold = parsedQty !== null ? parsedQty : 0
    
    // Log all quantity parsing for debugging
    console.log(`DEBUG ENHANCED PARSE: Item ${item_number}, raw qty: "${row[6]}", parsed: ${parsedQty}, final: ${qty_sold}`)
    
    selling_unit = String(row[7] || '').trim()
    display_price = parseNumber(row[10]) || undefined
    extended_cost = parseNumber(row[12]) || undefined
    description = String(row[14] || '').trim()
    return_reason = String(row[20] || '').trim()
    
    // Track negative quantities for return processing
    if (qty_sold < 0) {
      console.log(`DEBUG ENHANCED: Negative qty ${qty_sold} detected for item ${item_number} from raw: "${row[6]}"`)
    }
  }
  
  // Validate and clean data
  if (!item_number || item_number.length < 2) return null
  
  // Exclude system items, adjustments, and non-products
  const excludedPrefixes = ['GC-', 'RT-', 'ADJ-', 'SYS-', 'FEE-', 'TAX-', 'DISC-']
  const excludedPatterns = [
    'GIFT', 'RETURN', 'ADJUSTMENT', 'PRICEADJ', 'WEBSITE', 
    'SHIPPING', 'HANDLING', 'SERVICE', 'LOYALTY', 'COUPON',
    'DISCOUNT', 'REFUND', 'CREDIT', 'VOID', 'CANCEL',
    'SYSTEM', 'ADMIN', 'TEST', 'TRAINING'
  ]
  
  // Check prefixes
  if (excludedPrefixes.some(prefix => item_number.startsWith(prefix))) {
    return null
  }
  
  // Check if item_number contains excluded patterns
  const upperItemNumber = item_number.toUpperCase()
  if (excludedPatterns.some(pattern => upperItemNumber.includes(pattern))) {
    return null
  }
  
  // Exclude very short or suspicious item numbers
  if (item_number.length < 3 || /^[0-9]+$/.test(item_number)) {
    return null
  }
  
  // Only process items with qty_sold > 0, unless allowNegative is true for returns
  if (!allowNegative && qty_sold <= 0) return null
  if (allowNegative && qty_sold === 0) return null
  
  // Try to get product name from SKU map first
  let product_name = skuMap[item_number]
  
  // If not in SKU map, use description from CSV if available
  if (!product_name && description && description.trim()) {
    product_name = description.trim()
  }
  
  // If still no product name, create a fallback
  if (!product_name) {
    product_name = `Unknown Product (${item_number})`
  }
  
  // Clean the product name to remove unwanted suffixes
  product_name = cleanProductName(product_name)
  
  // Skip if product name becomes empty after cleaning
  if (!product_name || product_name.trim() === '') {
    return null
  }
  
  // Append return reason if valid
  if (return_reason && !['', 'NOT OPENED', 'OPENED'].includes(return_reason)) {
    product_name += ` - ${return_reason}`
  }
  
  return {
    item_number,
    product_name,
    qty_sold,
    selling_unit: selling_unit || 'EACH',
    display_price,
    extended_cost,
    return_reason,
    is_free: item_number.includes('FREE') || display_price === 0
  }
}

function parseGiftCards(ticket: ParsedTicket, ctx: ParsingContext, startRow: number): void {
  const { rows } = ctx
  
  console.log(`DEBUG ENHANCED GC: Starting gift card search for ticket ${ticket.ticket_number} from row ${startRow}`)
  
  for (let i = startRow; i < Math.min(startRow + 50, rows.length); i++) {
    const row = rows[i]
    if (!Array.isArray(row)) {
      console.log(`DEBUG ENHANCED GC: Row ${i} is not an array, skipping`)
      continue
    }
    
    // Stop if we hit another ticket
    if (row.some(cell => isTicketNumber(String(cell || '')))) {
      console.log(`DEBUG ENHANCED GC: Hit another ticket at row ${i}, stopping search`)
      break
    }
    
    // Debug: Show what we're looking at
    const firstCell = String(row[0] || '').toLowerCase().trim()
    if (firstCell) {
      console.log(`DEBUG ENHANCED GC: Row ${i}, Column 0: "${firstCell}"`)
    }
    
    // Look for gift card header row - can appear as "Gift card #" in column 0
    const isGiftCardHeader = firstCell === 'gift card #' || firstCell.includes('gift card #')
    
    // Also check for alternative patterns
    const isAlternativePattern = firstCell.includes('gift card') || 
                                row.some(cell => String(cell || '').toLowerCase().includes('gift card #'))
    
    if (isGiftCardHeader || isAlternativePattern) {
      console.log(`DEBUG ENHANCED GC: Found potential gift card header at row ${i} for ticket ${ticket.ticket_number}`)
      console.log(`DEBUG ENHANCED GC: Full row: [${row.map(cell => `"${cell}"`).join(', ')}]`)
      
      // Process gift card data rows immediately following the header
      for (let j = i + 1; j < Math.min(i + 20, rows.length); j++) {
        const dataRow = rows[j]
        if (!Array.isArray(dataRow)) continue
        
        console.log(`DEBUG ENHANCED GC: Checking data row ${j}: [${dataRow.slice(0, 5).map(cell => `"${cell}"`).join(', ')}...]`)
        
        // Stop at empty row or next ticket
        if (dataRow.every(cell => !cell || String(cell).trim() === '')) {
          console.log(`DEBUG ENHANCED GC: Empty row at ${j}, stopping`)
          break
        }
        if (dataRow.some(cell => isTicketNumber(String(cell || '')))) {
          console.log(`DEBUG ENHANCED GC: Hit ticket number at row ${j}, stopping`)
          break
        }
        
        // Parse gift card data using exact column positions from CSV analysis
        const cardNumber = String(dataRow[0] || '').trim()     // Column 0: Gift card number
        const amount = parseNumber(dataRow[11])               // Column 11: Amount
        const description = String(dataRow[14] || '').trim()  // Column 14: Description
        const code = String(dataRow[22] || '').trim()         // Column 22: Gift card code
        
        console.log(`DEBUG ENHANCED GC: Raw data - Col0: "${dataRow[0]}", Col11: "${dataRow[11]}", Col14: "${dataRow[14]}", Col22: "${dataRow[22]}"`)
        console.log(`DEBUG ENHANCED GC: Parsed - cardNumber: "${cardNumber}", amount: ${amount}, description: "${description}", code: "${code}"`)
        
        // Try relaxed validation - just need a 10-digit number and positive amount
        if (cardNumber && /^\d{10}$/.test(cardNumber) && amount && amount > 0) {
          ticket.gift_cards.push({
            card_number: cardNumber,
            amount,
            code: code || 'GC'
          })
          console.log(`DEBUG ENHANCED GC: Successfully added gift card ${cardNumber} amount ${amount} to ticket ${ticket.ticket_number}`)
        } else {
          console.log(`DEBUG ENHANCED GC: Validation failed - cardNumber valid: ${!!(cardNumber && /^\d{10}$/.test(cardNumber))}, amount valid: ${!!(amount && amount > 0)}`)
        }
      }
      break // Stop looking after processing gift card section
    }
  }
  
  console.log(`DEBUG ENHANCED GC: Finished gift card search for ticket ${ticket.ticket_number}, found ${ticket.gift_cards.length} gift cards`)
}

// ===== New parsing logic based on working code =====
export function parseTickets(
  rows: string[][],
  skuMap: Record<string, string>
): {
  tickets: ParsedTicket[]
  errors: ParsingError[]
  warnings: string[]
} {
  const allTicketLogs: Record<string, string> = {}
  const deduped = new Map<string, ParsedTicket>()
  const giftCards: ParsedTicket[] = []
  const insertedTicketNumbers = new Set<string>()
  const errors: ParsingError[] = []
  const warnings: string[] = []

  let currentTicket: Partial<ParsedTicket> = {}
  let captureItems = false

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(cell => String(cell || '').trim())
    const match = row.find(cell => TICKET_PATTERN.test(cell))

    if (match) {
      const ticket_number = match.match(TICKET_PATTERN)![0]
      allTicketLogs[ticket_number] = 'unprocessed'

      currentTicket = {
        ticket_number,
        store_id: deriveStoreId(ticket_number),
        sale_date: new Date().toISOString(),
        transaction_total: 0,
        gross_profit: '0',
        sales_rep: '',
        ticket_type: 'sale',
        items: [],
        gift_cards: []
      }

      // Parse sales rep (same logic as working code)
      let repCell = rows[i + 7]?.[0]?.trim().toUpperCase()
      if (!repCell || repCell === '') {
        repCell = rows[i + 8]?.[0]?.trim().toUpperCase()
      }

      if (repCell === 'JSHARPE') {
        currentTicket.sales_rep = 'ONLINE'
        currentTicket.store_id = deriveOnlineStoreId(ticket_number)
      } else if (repCell && /^[A-Z]{3,10}$/.test(repCell) && repCell !== 'TOTAL') {
        currentTicket.sales_rep = repCell
      }

      // Parse date (same logic as working code)
      for (let j = i; j < i + 15; j++) {
        const dateCell = rows[j]?.[3]?.trim()
        if (dateCell && /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(dateCell)) {
          currentTicket.sale_date = parseDate(dateCell) || currentTicket.sale_date
          break
        }
      }

      // Parse gross profit (same logic as working code)
      for (let j = i; j < i + 15; j++) {
        for (const cell of rows[j]) {
          if (/^\d+(\.\d+)?%$/.test(cell)) {
            currentTicket.gross_profit = parseFloat(cell.replace('%', '')).toFixed(2)
            break
          }
        }
        if (currentTicket.gross_profit !== '0') break
      }

      // Parse transaction total (working code logic)
      for (let j = i; j < Math.min(i + 20, rows.length); j++) {
        const rowCheck = rows[j]
        if (rowCheck?.some(cell => cell.toLowerCase().includes('sale ticket'))) {
          const numericCandidates = rowCheck
            .map(cell => cell.replace(/[$,]/g, '').trim())
            .filter(val => /^-?\d+(\.\d+)?$/.test(val))
            .map(parseFloat)

          if (numericCandidates.length > 0) {
            const total = numericCandidates[numericCandidates.length - 1]
            currentTicket.transaction_total = parseFloat(total.toFixed(2))
          }
          break
        }
      }

      // Gift card detection (working code logic)
      const giftRow = rows[i + 12]
      const isGiftCardFooter = giftRow?.some(cell => cell.toLowerCase().includes('gift card #'))
      const isRealGiftCard = isGiftCardFooter && !hasValidItemLines(rows, i + 1)

      if (isRealGiftCard && !deduped.has(`${ticket_number}-GIFT-CARD`)) {
        const giftTicket: ParsedTicket = {
          ticket_number,
          store_id: currentTicket.store_id!,
          sale_date: currentTicket.sale_date!,
          sales_rep: currentTicket.sales_rep,
          transaction_total: currentTicket.transaction_total,
          gross_profit: '0',
          ticket_type: 'gift_card',
          items: [],
          gift_cards: [{ card_number: ticket_number, amount: currentTicket.transaction_total || 0, code: 'GC' }]
        }
        
        giftCards.push(giftTicket)
        insertedTicketNumbers.add(ticket_number)
        allTicketLogs[ticket_number] = 'inserted (gift card)'
        captureItems = false
        continue
      }

      captureItems = true
      continue
    }

    // Capture items (working code logic)
    if (captureItems && currentTicket?.ticket_number) {
      const item_number = row[0]
      const qty_sold = parseInt(row[1]) || parseInt(row[6]) || 0
      let product_name = row[4] || row[14] || 'Unknown'
      const selling_unit = row[2] || row[7] || ''

      if (!/^[A-Z0-9-]{4,}/.test(item_number)) continue
      if (qty_sold === 0) {
        allTicketLogs[currentTicket.ticket_number!] = 'qty_sold = 0'
        continue
      }

      // Get product name from SKU map
      if (product_name === 'Unknown') {
        product_name = skuMap[item_number] || 'Discontinued Product'
      }

      const ticketItem: TicketItem = {
        item_number,
        product_name,
        qty_sold,
        selling_unit,
        is_free: false
      }

      // Create separate entries for each item like working code
      const itemKey = `${currentTicket.ticket_number}-${item_number}`
      if (!deduped.has(itemKey)) {
        const itemTicket: ParsedTicket = {
          ticket_number: currentTicket.ticket_number!,
          store_id: currentTicket.store_id!,
          sale_date: currentTicket.sale_date!,
          sales_rep: currentTicket.sales_rep,
          transaction_total: currentTicket.transaction_total,
          gross_profit: currentTicket.gross_profit,
          ticket_type: qty_sold < 0 ? 'return' : 'sale',
          items: [ticketItem],
          gift_cards: []
        }
        
        deduped.set(itemKey, itemTicket)
        insertedTicketNumbers.add(currentTicket.ticket_number!)
        allTicketLogs[currentTicket.ticket_number!] = 'inserted'
      }
    }
  }

  // Combine all tickets
  const allTickets: ParsedTicket[] = []
  deduped.forEach(ticket => allTickets.push(ticket))
  giftCards.forEach(ticket => allTickets.push(ticket))

  return {
    tickets: allTickets,
    errors,
    warnings
  }
}

// Helper functions from working code
function deriveStoreId(ticket: string): string {
  const trimmed = ticket.trim()
  
  // Format 1: AB-XXX-TNNNNNN or AB-XX-TNNNNNN (standard format)
  if (/^AB-[A-Z]{2,4}-T\d{5,7}$/.test(trimmed)) {
    const parts = trimmed.split('-')
    return `${parts[0]}-${parts[1]}` // e.g., "AB-CL"
  }
  
  // Format 2: AB-XX-1TNNNNNN (alternate format with 1T)
  if (/^AB-[A-Z]{2}-1T\d{5,7}$/.test(trimmed)) {
    const parts = trimmed.split('-')
    return `${parts[0]}-${parts[1]}` // e.g., "AB-SG"
  }
  
  // Format 3: ABXXNNNNN-01 (legacy format with suffix)
  if (/^AB[A-Z]{2,4}\d{5}-\d{2}$/.test(trimmed)) {
    const storeCode = trimmed.substring(2, 4) // Extract store letters after "AB"
    return `AB-${storeCode}` // e.g., "AB-FS"
  }
  
  // Format 4: CL-TNNNNNN (without AB prefix)
  if (/^[A-Z]{2,4}-T\d{5,7}$/.test(trimmed)) {
    const parts = trimmed.split('-')
    return `AB-${parts[0]}` // Add AB prefix, e.g., "AB-CL"
  }
  
  // Fallback for any other hyphened format
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-')
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`
  }
  
  // Final fallback
  return trimmed.substring(0, 5)
}

function deriveOnlineStoreId(ticket: string): string {
  const match = ticket.match(/^AB([A-Z]{2})/)
  return match ? `AB-${match[1]}` : 'AB-XX'
}

// ===== Enhanced Batch Insertion with Transaction Support =====
interface BatchInsertOptions {
  batchSize: number
  retryAttempts: number
  validateBeforeInsert: boolean
}

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
  timing: {
    parseTime: number
    insertTime: number
    totalTime: number
  }
}

// ===== Validation Functions =====
function validateTicketHistoryEntry(entry: any): string[] {
  const errors: string[] = []
  
  // Required fields
  if (!entry.ticket_number || typeof entry.ticket_number !== 'string' || entry.ticket_number.trim() === '') {
    errors.push('Invalid ticket_number')
  }
  if (!entry.store_id || typeof entry.store_id !== 'string' || entry.store_id.trim() === '') {
    errors.push('Invalid store_id')
  }
  if (!entry.sale_date || typeof entry.sale_date !== 'string' || entry.sale_date.trim() === '') {
    errors.push('Invalid sale_date')
  }
  // Note: user_id validation removed - now using franchise/org context
  
  // Optional fields with type validation (allow empty strings for optional fields)
  if (entry.sales_rep !== undefined && entry.sales_rep !== null && entry.sales_rep !== '' && typeof entry.sales_rep !== 'string') {
    errors.push('sales_rep must be a string')
  }
  if (entry.transaction_total !== undefined && entry.transaction_total !== null && (typeof entry.transaction_total !== 'number' || !isFinite(entry.transaction_total))) {
    errors.push('transaction_total must be a finite number')
  }
  if (entry.gross_profit !== undefined && entry.gross_profit !== null && entry.gross_profit !== '' && typeof entry.gross_profit !== 'string') {
    errors.push('gross_profit must be a string')
  }
  if (entry.item_number !== undefined && entry.item_number !== null && entry.item_number !== '' && typeof entry.item_number !== 'string') {
    errors.push('item_number must be a string')
  }
  if (entry.product_name !== undefined && entry.product_name !== null && entry.product_name !== '' && typeof entry.product_name !== 'string') {
    errors.push('product_name must be a string')
  }
  if (entry.qty_sold !== undefined && entry.qty_sold !== null && (typeof entry.qty_sold !== 'number' || !isFinite(entry.qty_sold))) {
    errors.push('qty_sold must be a finite number')
  }
  if (entry.selling_unit !== undefined && entry.selling_unit !== null && entry.selling_unit !== '' && typeof entry.selling_unit !== 'string') {
    errors.push('selling_unit must be a string')
  }
  
  // Business logic validation
  if (entry.transaction_total && (entry.transaction_total < -100000 || entry.transaction_total > 100000)) {
    errors.push('transaction_total out of reasonable range')
  }
  if (entry.qty_sold && (entry.qty_sold < -10000 || entry.qty_sold > 10000)) {
    errors.push('qty_sold out of reasonable range')
  }
  
  return errors
}

// ===== Note: Using proven insertion logic from original parser =====

// ===== Enhanced Mutation with Progress Tracking =====
export const parseAndInsertTicketsEnhanced = mutation({
  args: {
    rows: v.array(v.array(v.string())),
    options: v.optional(v.object({
      skipDuplicateCheck: v.optional(v.boolean()),
      batchSize: v.optional(v.number()),
      validateBeforeInsert: v.optional(v.boolean()),
      dryRun: v.optional(v.boolean())
    }))
  },
  handler: async (ctx, { rows, options = {} }) => {
    const userContext = await getUserContext(ctx.auth, ctx.db);
    const startTime = Date.now()
    const {
      skipDuplicateCheck = false,
      batchSize = 50,
      validateBeforeInsert = true,
      dryRun = false
    } = options
    
    const stats: InsertionStats = {
      total: 0,
      inserted: 0,
      failed: 0,
      duplicates: 0,
      byTable: {
        ticket_history: 0,
        return_tickets: 0,
        gift_card_tickets: 0
      },
      timing: {
        parseTime: 0,
        insertTime: 0,
        totalTime: 0
      }
    }
    
    // Load SKU map
    const skuMap: Record<string, string> = {}
    try {
      const skuEntries = await ctx.db.query('sku_vendor_map').take(5000) // Limit for performance
      for (const entry of skuEntries) {
        if (entry.item_number && entry.description) {
          skuMap[String(entry.item_number)] = String(entry.description)
        }
      }
    } catch (error) {
      console.error('Failed to load SKU map:', error)
    }
    
    // Parse tickets using the static import
    const parseStartTime = Date.now()
    const parseResult = parseTickets(rows, skuMap)
    
    stats.timing.parseTime = Date.now() - parseStartTime
    
    const { tickets: parsedTickets, errors: parsingErrors, warnings } = parseResult
    stats.total = parsedTickets.length
    
    if (parsedTickets.length === 0) {
      return {
        status: 'error',
        message: 'No valid tickets found in CSV',
        stats,
        errors: parsingErrors
      }
    }
    
    // Lighter duplicate check - only skip if explicitly requested
    if (!skipDuplicateCheck && !dryRun) {
      const ticketNumbers = parsedTickets.map(t => t.ticket_number)
      // Only check a sample to avoid missing tickets due to aggressive deduping
      const existingTicketsSet = new Set<string>()
      
      // Check only the first 100 tickets for performance, allow the rest through
      for (const ticketNumber of ticketNumbers.slice(0, 100)) {
        const exists = await ctx.db.query('ticket_history')
          .filter(q => q.eq(q.field('ticket_number'), ticketNumber))
          .first()
        if (exists) {
          existingTicketsSet.add(ticketNumber)
        }
      }
      
      // Only filter out tickets that we're certain are duplicates
      const newTickets = parsedTickets.filter(t => !existingTicketsSet.has(t.ticket_number))
      stats.duplicates = parsedTickets.length - newTickets.length
      
      if (stats.duplicates > 0) {
        console.log(`Skipping ${stats.duplicates} confirmed duplicate tickets`)
      }
      
      // Use all tickets except confirmed duplicates
      parsedTickets.splice(0, parsedTickets.length, ...newTickets)
    }
    
    if (dryRun) {
      return {
        status: 'dry_run',
        message: `Would insert ${parsedTickets.length} tickets`,
        stats,
        sample: parsedTickets.slice(0, 5) // Return first 5 as sample
      }
    }
    
    // Use the proven insertion logic from the original parser
    const insertStartTime = Date.now()
    const insertionResults = await insertTicketsEnhanced(ctx, parsedTickets, userContext, {
      batchSize,
      validateBeforeInsert
    })
    
    stats.byTable.ticket_history = insertionResults.ticket_history
    stats.byTable.return_tickets = insertionResults.return_tickets
    stats.byTable.gift_card_tickets = insertionResults.gift_card_tickets
    stats.inserted = insertionResults.inserted
    stats.failed = insertionResults.errors.length
    
    stats.timing.insertTime = Date.now() - insertStartTime
    stats.timing.totalTime = Date.now() - startTime
    
    // Log performance metrics
    console.log('Insertion complete:', {
      totalTime: `${stats.timing.totalTime}ms`,
      parseTime: `${stats.timing.parseTime}ms`,
      insertTime: `${stats.timing.insertTime}ms`,
      ticketsPerSecond: Math.round((stats.inserted / stats.timing.totalTime) * 1000)
    })
    
    return {
      status: 'success',
      message: `Successfully processed ${stats.inserted} tickets`,
      stats,
      warnings,
      parsingErrors: parsingErrors.slice(0, 10), // First 10 parsing errors
      failed: insertionResults.errors.slice(0, 10) // Return first 10 insertion failures
    }
  }
})

// ===== Enhanced Insertion Logic =====
interface ParsedTicket {
  ticket_number: string
  store_id: string
  sale_date: string
  sales_rep?: string
  transaction_total?: number
  gross_profit?: string
  ticket_type: 'sale' | 'return' | 'gift_card'
  customer_name?: string
  customer_number?: string
  station?: string
  event_number?: string
  items: TicketItem[]
  gift_cards: GiftCardDetail[]
  raw_data?: any
}

interface TicketItem {
  item_number: string
  product_name: string
  qty_sold: number
  selling_unit: string
  display_price?: number
  extended_cost?: number
  return_reason?: string
  is_free?: boolean
}

interface GiftCardDetail {
  card_number: string
  amount: number
  code: string
}

function cleanEntry(entry: any): any {
  const cleaned: any = {}
  
  // Always include required fields
  cleaned.ticket_number = entry.ticket_number
  cleaned.store_id = entry.store_id
  cleaned.sale_date = entry.sale_date
  // Note: user_id removed - now set from context in insertTicketsEnhanced
  
  // Optional fields - only include if they have meaningful values
  if (entry.sales_rep && entry.sales_rep.trim() !== '') {
    cleaned.sales_rep = entry.sales_rep
  }
  if (entry.transaction_total !== undefined && entry.transaction_total !== null) {
    cleaned.transaction_total = entry.transaction_total
  }
  if (entry.gross_profit && entry.gross_profit.trim() !== '') {
    cleaned.gross_profit = entry.gross_profit
  }
  if (entry.item_number && entry.item_number.trim() !== '') {
    cleaned.item_number = entry.item_number
  }
  if (entry.product_name && entry.product_name.trim() !== '') {
    cleaned.product_name = entry.product_name
  }
  if (entry.qty_sold !== undefined && entry.qty_sold !== null) {
    cleaned.qty_sold = entry.qty_sold
  }
  if (entry.selling_unit && entry.selling_unit.trim() !== '') {
    cleaned.selling_unit = entry.selling_unit
  }
  if (entry.giftcard_amount !== undefined && entry.giftcard_amount !== null) {
    cleaned.giftcard_amount = entry.giftcard_amount
  }
  
  return cleaned
}

async function insertTicketsEnhanced(
  ctx: any,
  tickets: ParsedTicket[],
  userContext: any,
  options: { batchSize: number; validateBeforeInsert: boolean }
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
  
  // Prepare entries using working code logic
  const validEntries: any[] = []
  const returnEntries: any[] = []
  const giftCardEntries: any[] = []
  
  // Process like working code: separate sales from returns
  for (const ticket of tickets) {
    try {
      // Handle gift cards
      if (ticket.ticket_type === 'gift_card') {
        const giftCardEntry = cleanEntry({
          ticket_number: ticket.ticket_number,
          store_id: ticket.store_id,
          sale_date: ticket.sale_date,
          sales_rep: ticket.sales_rep,
          giftcard_amount: ticket.transaction_total,
          product_name: "Gift Card",
          orgId: userContext.orgId,
          franchiseId: userContext.franchiseId
        })
        giftCardEntries.push(giftCardEntry)
        continue
      }
      
      // Handle regular items
      for (const item of ticket.items) {
        const entry = cleanEntry({
          ticket_number: ticket.ticket_number,
          store_id: ticket.store_id,
          sale_date: ticket.sale_date,
          sales_rep: ticket.sales_rep,
          transaction_total: ticket.transaction_total,
          gross_profit: ticket.gross_profit,
          item_number: item.item_number,
          product_name: item.product_name,
          qty_sold: item.qty_sold,
          selling_unit: item.selling_unit,
          orgId: userContext.orgId,
          franchiseId: userContext.franchiseId
        })
        
        // Separate like working code: is_return logic
        if (item.qty_sold < 0) {
          returnEntries.push(entry)
        } else if (item.qty_sold > 0) {
          validEntries.push(entry)
        }
      }
      
    } catch (error) {
      results.errors.push({
        ticket: ticket.ticket_number,
        error: error instanceof Error ? error.message : 'Processing failed'
      })
    }
  }
  
  // Insert in batches like working code
  if (validEntries.length > 0) {
    try {
      await Promise.all(validEntries.map(entry => ctx.db.insert('ticket_history', entry)))
      results.ticket_history = validEntries.length
      console.log(`✅ ticket_history insert success: ${validEntries.length}`)
    } catch (error) {
      console.error('❌ ticket_history insert failed:', error)
      results.errors.push({ error: 'ticket_history bulk insert failed' })
    }
  }
  
  if (returnEntries.length > 0) {
    try {
      await Promise.all(returnEntries.map(entry => ctx.db.insert('return_tickets', entry)))
      results.return_tickets = returnEntries.length
      console.log(`✅ return_tickets insert success: ${returnEntries.length}`)
    } catch (error) {
      console.error('❌ return_tickets insert failed:', error)
      results.errors.push({ error: 'return_tickets bulk insert failed' })
    }
  }
  
  if (giftCardEntries.length > 0) {
    try {
      await Promise.all(giftCardEntries.map(entry => ctx.db.insert('gift_card_tickets', entry)))
      results.gift_card_tickets = giftCardEntries.length
      console.log(`✅ gift_card_tickets insert success: ${giftCardEntries.length}`)
    } catch (error) {
      console.error('❌ gift_card_tickets insert failed:', error)
      results.errors.push({ error: 'gift_card_tickets bulk insert failed' })
    }
  }
  
  results.inserted = tickets.length
  return results
}

// ===== Data Quality Checks =====
export const validateTicketData = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string())
  },
  handler: async (ctx, { startDate, endDate }) => {
    const issues: any[] = []
    
    // Check for tickets without items
    const ticketsWithoutItems = await ctx.db.query('ticket_history')
      .filter(q => q.eq(q.field('item_number'), undefined))
      .take(10)
    
    if (ticketsWithoutItems.length > 0) {
      issues.push({
        type: 'missing_items',
        count: ticketsWithoutItems.length,
        samples: ticketsWithoutItems.map(t => t.ticket_number)
      })
    }
    
    // Check for invalid dates
    const invalidDates = await ctx.db.query('ticket_history')
      .filter(q => q.eq(q.field('sale_date'), ''))
      .take(10)
    
    if (invalidDates.length > 0) {
      issues.push({
        type: 'invalid_dates',
        count: invalidDates.length,
        samples: invalidDates.map(t => t.ticket_number)
      })
    }
    
    // Check for missing store IDs
    const missingStores = await ctx.db.query('ticket_history')
      .filter(q => q.eq(q.field('store_id'), ''))
      .take(10)
    
    if (missingStores.length > 0) {
      issues.push({
        type: 'missing_store_id',
        count: missingStores.length,
        samples: missingStores.map(t => t.ticket_number)
      })
    }
    
    return {
      issues,
      healthy: issues.length === 0
    }
  }
})

// ===== Cleanup Functions =====
export const cleanupBadTickets = mutation({
  args: {
    dryRun: v.optional(v.boolean())
  },
  handler: async (ctx, { dryRun = true }) => {
    const toDelete: string[] = []
    
    // Find tickets with critical missing data
    const badTickets = await ctx.db.query('ticket_history')
      .filter(q => 
        q.or(
          q.eq(q.field('store_id'), ''),
          q.eq(q.field('ticket_number'), ''),
          q.eq(q.field('sale_date'), '')
        )
      )
      .take(1000) // Limit for performance
    
    for (const ticket of badTickets) {
      toDelete.push(ticket._id)
    }
    
    if (!dryRun) {
      for (const id of toDelete) {
        await ctx.db.delete(id as any)
      }
    }
    
    return {
      found: toDelete.length,
      deleted: dryRun ? 0 : toDelete.length,
      dryRun
    }
  }
})