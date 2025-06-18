import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(), // e.g. "Supplement King"
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_created_by", ["createdBy"]),

  franchises: defineTable({
    name: v.string(), // e.g. "Trevor Murphy Group"
    franchiseId: v.string(), // e.g. "trevor-murphy-sk"
    orgId: v.id("organizations"), // belongs to Supplement King
    ownerId: v.optional(v.id("users")), // franchise owner
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise_id", ["franchiseId"])
    .index("by_owner", ["ownerId"]),

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(),
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
    role: v.optional(v.union(v.literal("owner"), v.literal("member"))),
    allowedPages: v.optional(v.array(v.string())), // for members only
    createdAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_role", ["role"]),

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
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
    primary_vendor: v.string(),
    window_start: v.string(),
    window_end: v.string(),
  })
      .index("by_user", ["user_id"])
      .index("by_org", ["orgId"])
      .index("by_franchise", ["franchiseId"])
      .index("by_vendor", ["primary_vendor"]),

  ticket_uploads: defineTable({
    user_id: v.string(),
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
    upload_name: v.string(),
    total_tickets: v.number(),
    total_entries: v.number(),
    stores_affected: v.array(v.string()),
    upload_date: v.string(),
    status: v.string(), // "success", "partial", "failed"
  })
      .index("by_user", ["user_id"])
      .index("by_org", ["orgId"])
      .index("by_franchise", ["franchiseId"])
      .index("by_date", ["upload_date"]),

  dashboard_metrics_cache: defineTable({
    user_id: v.string(),
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
    date_range: v.number(), // 7, 30, 60, 90 days
    metrics: v.object({
      avgTicketSize: v.number(),
      totalSalesReps: v.number(),
      totalStores: v.number(),
      grossProfitPercent: v.number(),
      totalSales: v.number(),
      totalTickets: v.number(),
      underperformingStores: v.number(),
      underperformingReps: v.number(),
    }),
    salesTrend: v.array(v.object({
      date: v.string(),
      sales: v.number(),
      transactions: v.number(),
    })),
    storePerformance: v.array(v.object({
      storeId: v.string(),
      totalSales: v.number(),
      ticketCount: v.number(),
      avgTicketSize: v.number(),
      isUnderperforming: v.boolean(),
    })),
    repPerformance: v.array(v.object({
      repName: v.string(),
      totalSales: v.number(),
      ticketCount: v.number(),
      avgTicketSize: v.number(),
      storeCount: v.number(),
      isUnderperforming: v.boolean(),
    })),
    last_updated: v.string(),
    data_hash: v.string(), // Hash of data to detect changes
  })
      .index("by_user_range", ["user_id", "date_range"])
      .index("by_user", ["user_id"])
      .index("by_org", ["orgId"])
      .index("by_franchise", ["franchiseId"]),


  inventory_lines: defineTable({
    upload_id: v.string(),
    user_id: v.string(),
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
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
      .index("by_store_item", ["store_id", "item_number"])
      .index("by_user_id", ["user_id"])
      .index("by_user_store", ["user_id", "store_id"])
      .index("by_org", ["orgId"])
      .index("by_franchise", ["franchiseId"])
      .index("by_franchise_store", ["franchiseId", "store_id"]),

  transfer_logs: defineTable({
    upload_id: v.string(),
    user_id: v.string(),
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
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
      .index("by_to_store", ["to_store_id"])
      .index("by_org", ["orgId"])
      .index("by_franchise", ["franchiseId"]),

  vendors: defineTable({
    vendor_code: v.string(),
    name: v.string(),
    orgId: v.optional(v.id("organizations")), // shared across org
  })
    .index("by_vendor_code", ["vendor_code"])
    .index("by_org", ["orgId"]),

  sales_reps: defineTable({
    user: v.any(),
    rep_name: v.any(),
    store_id: v.any(),
    orgId: v.optional(v.id("organizations")), // shared across org
  })
    .index("by_user", ["user"])
    .index("by_store_id", ["store_id"])
    .index("by_org", ["orgId"]),

  sku_vendor_map: defineTable({
    item_number: v.any(),
    description: v.any(),
    brand: v.any(),
    vendor: v.any(),
    retail_price: v.any(),
    orgId: v.optional(v.id("organizations")), // shared across org
  })
    .index("by_item_number", ["item_number"])
    .index("by_vendor", ["vendor"])
    .index("by_org", ["orgId"]),

  brands: defineTable({
    brand_code: v.string(),
    name: v.string(),
    orgId: v.optional(v.id("organizations")), // shared across org
  })
    .index("by_brand_code", ["brand_code"])
    .index("by_org", ["orgId"]),

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
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
  })
    .index('by_ticket_number', ['ticket_number'])
    .index('by_store_id', ['store_id'])
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_store", ["franchiseId", "store_id"]),
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
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
  })
    .index('by_ticket_number', ['ticket_number'])
    .index('by_store_id', ['store_id'])
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_store", ["franchiseId", "store_id"]),
  gift_card_tickets: defineTable({
    ticket_number: v.string(),
    store_id: v.string(),
    sale_date: v.string(), // ISO string
    sales_rep: v.optional(v.string()),
    giftcard_amount: v.optional(v.number()),
    product_name: v.optional(v.string()),
    gross_profit: v.optional(v.string()),
    user_id: v.string(),
    orgId: v.optional(v.id("organizations")),
    franchiseId: v.optional(v.id("franchises")),
  })
    .index('by_ticket_number', ['ticket_number'])
    .index('by_store_id', ['store_id'])
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_store", ["franchiseId", "store_id"]),
});
