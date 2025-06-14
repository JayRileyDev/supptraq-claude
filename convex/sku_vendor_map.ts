import { query } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

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
    const skuEntries = await ctx.db.query('sku_vendor_map')
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