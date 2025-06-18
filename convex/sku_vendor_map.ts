import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { getUserContext } from './accessControl'

interface SkuEntry {
  _id: Id<'sku_vendor_map'>
  item_number: string
  description: string
  brand: string
  vendor: string
  retail_price: number
}

export const list = query({
  handler: async (ctx) => {
    const userContext = await getUserContext(ctx.auth, ctx.db)
    if (!userContext) {
      return {}
    }
    const { orgId } = userContext
    
    const skuEntries = await ctx.db.query('sku_vendor_map')
      .withIndex('by_org', q => q.eq('orgId', orgId))
      .take(1000)
    
    const skuMap: Record<string, string> = {}
    
    for (const entry of skuEntries) {
      if (entry.item_number && entry.description) {
        skuMap[entry.item_number] = entry.description
      }
    }
    
    return skuMap
  }
})

export const uploadSkuVendorMap = mutation({
  args: {
    rows: v.array(v.array(v.string()))
  },
  handler: async (ctx, { rows }) => {
    const userContext = await getUserContext(ctx.auth, ctx.db)
    if (!userContext) {
      throw new Error("No active organization or franchise")
    }
    const { orgId } = userContext
    let inserted = 0
    let skipped = 0
    let errors: string[] = []

    // Skip header row (item_number,description,vendor,retail_price,brand)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      
      if (!row || row.length < 5) {
        skipped++
        continue
      }

      const [item_number, description, vendor, retail_price_str, brand] = row
      
      if (!item_number?.trim() || !description?.trim()) {
        skipped++
        continue
      }

      const retail_price = parseFloat(retail_price_str) || 0

      try {
        await ctx.db.insert('sku_vendor_map', {
          item_number: item_number.trim(),
          description: description.trim(),
          vendor: vendor?.trim() || '',
          brand: brand?.trim() || '',
          retail_price,
          orgId
        })
        inserted++
      } catch (error) {
        errors.push(`Failed to insert ${item_number}: ${error}`)
        skipped++
      }
    }

    return {
      status: 'success',
      stats: { inserted, skipped, errors: errors.length },
      errors: errors.slice(0, 10) // Return first 10 errors
    }
  }
}) 