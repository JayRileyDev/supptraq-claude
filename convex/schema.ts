import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  subscriptions: defineTable({
    userId: v.optional(v.string()),
    polarId: v.optional(v.string()),
    polarPriceId: v.optional(v.string()),
    currency: v.optional(v.string()),
    interval: v.optional(v.string()),
    status: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    amount: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    customerCancellationReason: v.optional(v.string()),
    customerCancellationComment: v.optional(v.string()),
    metadata: v.optional(v.any()),
    customFieldData: v.optional(v.any()),
    customerId: v.optional(v.string()),
  })
      .index("userId", ["userId"])
      .index("polarId", ["polarId"]),

  webhookEvents: defineTable({
    type: v.string(),
    polarEventId: v.string(),
    createdAt: v.string(),
    modifiedAt: v.string(),
    data: v.any(),
  })
      .index("type", ["type"])
      .index("polarEventId", ["polarEventId"]),

  inventory_uploads: defineTable({
    user_id: v.string(),
    primary_vendor: v.string(),
    window_start: v.string(),
    window_end: v.string(),
  })
      .index("by_user", ["user_id"])
      .index("by_vendor", ["primary_vendor"]),

  inventory_lines: defineTable({
    upload_id: v.string(),
    user_id: v.string(),
    item_number: v.string(),
    product_name: v.string(),
    store_id: v.string(),
    qty_on_hand: v.number(),
    qty_sold: v.number(),
    primary_vendor: v.string(),
    created_at: v.optional(v.string()),
    transfer_in_qty: v.number(),
    transfer_out_qty: v.number(),
    suggested_reorder_qty: v.number(),
    flag_transfer: v.boolean(),
    flag_reorder: v.boolean(),
    box_qty: v.boolean()
  })
      .index("by_store", ["store_id"])
      .index("by_item", ["item_number"])
      .index("by_vendor", ["primary_vendor"])
      .index("by_upload", ["upload_id"])
      .index("by_store_item", ["store_id", "item_number"]),

  transfer_logs: defineTable({
    upload_id: v.string(),
    user_id: v.string(),
    item_number: v.string(),
    product_name: v.string(),
    from_store_id: v.string(),
    to_store_id: v.string(),
    qty: v.number(),
    primary_vendor: v.string(),
  })
      .index("by_upload", ["upload_id"])
      .index("by_item", ["item_number"])
      .index("by_from_store", ["from_store_id"])
      .index("by_to_store", ["to_store_id"]),

  vendors: defineTable({
    vendor_code: v.string(),
    name: v.string(),
  }).index("by_vendor_code", ["vendor_code"]),

  sales_reps: defineTable({
    user: v.any(),
    rep_name: v.any(),
    store_id: v.any(),
  }).index("by_user", ["user"]).index("by_store_id", ["store_id"]),

  sku_vendor_map: defineTable({
    item_number: v.any(),
    description: v.any(),
    brand: v.any(),
    vendor: v.any(),
    retail_price: v.any(),
  }).index("by_item_number", ["item_number"]).index("by_vendor", ["vendor"]),

  brands: defineTable({
    brand_code: v.string(),
    name: v.string(),
  }).index("by_brand_code", ["brand_code"]),

  ticket_history: defineTable({
    ticket_number: v.string(),
    store_id: v.string(),
    sale_date: v.string(), // ISO string
    sales_rep: v.optional(v.string()),
    transaction_total: v.optional(v.number()),
    gross_profit: v.optional(v.string()),
    item_number: v.optional(v.string()),
    product_name: v.optional(v.string()),
    qty_sold: v.optional(v.number()),
    selling_unit: v.optional(v.string()),
    user_id: v.string(),
  })
    .index('by_ticket_number', ['ticket_number'])
    .index('by_store_id', ['store_id']),
  return_tickets: defineTable({
    ticket_number: v.string(),
    store_id: v.string(),
    sale_date: v.string(), // ISO string
    sales_rep: v.optional(v.string()),
    transaction_total: v.optional(v.number()),
    gross_profit: v.optional(v.string()),
    item_number: v.optional(v.string()),
    product_name: v.optional(v.string()),
    qty_sold: v.optional(v.number()),
    selling_unit: v.optional(v.string()),
    user_id: v.string(),
  })
    .index('by_ticket_number', ['ticket_number'])
    .index('by_store_id', ['store_id']),
  gift_card_tickets: defineTable({
    ticket_number: v.string(),
    store_id: v.string(),
    sale_date: v.string(), // ISO string
    sales_rep: v.optional(v.string()),
    giftcard_amount: v.optional(v.number()),
    product_name: v.optional(v.string()),
    user_id: v.string(),
  })
    .index('by_ticket_number', ['ticket_number'])
    .index('by_store_id', ['store_id']),
});
