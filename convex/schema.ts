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
    isStoreOps: v.optional(v.boolean()), // true for store operations accounts
    createdAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_role", ["role"])
    .index("by_store_ops", ["isStoreOps"]),

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

  // Store Operations Portal Tables
  
  // Store profile information (operational info)
  store_profiles: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    store_name: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    wifi_password: v.optional(v.string()),
    lockbox_code: v.optional(v.string()),
    landlord_name: v.optional(v.string()),
    landlord_phone: v.optional(v.string()),
    landlord_email: v.optional(v.string()),
    store_lead: v.optional(v.string()),
    district_manager: v.optional(v.string()),
    regional_manager: v.optional(v.string()),
    pos_credentials: v.optional(v.object({
      username: v.optional(v.string()),
      password: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
    other_info: v.optional(v.any()), // JSON for flexible additional info
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_org_franchise", ["orgId", "franchiseId"]),

  // Rep averages tracking
  rep_averages: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    month: v.string(), // "2024-01"
    rep_name: v.string(),
    daily_averages: v.array(v.object({
      date: v.number(), // day of month 1-31
      amount: v.optional(v.number()),
      shifts: v.optional(v.number()),
    })),
    monthly_average: v.optional(v.number()),
    monthly_shifts: v.optional(v.number()),
    commission_level: v.optional(v.union(
      v.literal(125),
      v.literal(199),
      v.literal(299)
    )),
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_month", ["franchiseId", "month"])
    .index("by_franchise_rep", ["franchiseId", "rep_name"]),

  // Daily checklist
  daily_checklists: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    week_start: v.string(), // "2024-01-01" (Monday)
    tasks: v.array(v.object({
      task_name: v.string(),
      task_category: v.optional(v.string()),
      is_required: v.boolean(),
      monday: v.optional(v.string()), // staff initials
      tuesday: v.optional(v.string()),
      wednesday: v.optional(v.string()),
      thursday: v.optional(v.string()),
      friday: v.optional(v.string()),
      saturday: v.optional(v.string()),
      sunday: v.optional(v.string()),
    })),
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_week", ["franchiseId", "week_start"]),

  // Store Lead checklist
  sl_checklists: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    week_start: v.string(), // "2024-01-01" (Monday)
    tasks: v.array(v.object({
      task_name: v.string(),
      task_category: v.optional(v.string()),
      monday: v.optional(v.string()), // staff initials
      tuesday: v.optional(v.string()),
      wednesday: v.optional(v.string()),
      thursday: v.optional(v.string()),
      friday: v.optional(v.string()),
      saturday: v.optional(v.string()),
      sunday: v.optional(v.string()),
    })),
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_week", ["franchiseId", "week_start"]),

  // District Lead checklist
  dl_checklists: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    month: v.string(), // "2024-01"
    categories: v.array(v.object({
      category_name: v.string(), // "Housekeeping", "Finance", "Ops", "Marketing"
      tasks: v.array(v.object({
        task_name: v.string(),
        completed_dates: v.array(v.object({
          date: v.string(),
          completed_by: v.string(),
        })),
      })),
    })),
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_month", ["franchiseId", "month"]),

  // Returns tracking
  returns: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    staff_member: v.string(),
    customer_name: v.optional(v.string()),
    customer_phone: v.optional(v.string()),
    vendor: v.string(),
    product_name: v.string(),
    size: v.optional(v.string()),
    quantity: v.optional(v.number()),
    expiry_date: v.optional(v.string()),
    lot_number: v.optional(v.string()),
    reason_for_return: v.string(),
    date_submitted: v.string(),
    last_follow_up: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_status", ["status"])
    .index("by_franchise_status", ["franchiseId", "status"]),

  // Callback list
  callbacks: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    date_requested: v.string(),
    staff_member: v.string(),
    item_requested: v.string(),
    flavor: v.optional(v.string()),
    size_servings: v.optional(v.string()),
    quantity: v.optional(v.number()),
    customer_name: v.string(),
    customer_phone: v.string(),
    prepaid: v.boolean(),
    transfer_location: v.optional(v.string()),
    call_date: v.optional(v.string()),
    called_by: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("no_answer"),
      v.literal("voicemail"),
      v.literal("contacted"),
      v.literal("in_transfer"),
      v.literal("important"),
      v.literal("completed")
    ),
    comments: v.optional(v.string()),
    created_at: v.number(),
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_status", ["status"])
    .index("by_franchise_status", ["franchiseId", "status"]),

  // Close-dated inventory
  close_dated_inventory: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    product_name: v.string(),
    flavor: v.optional(v.string()),
    size: v.optional(v.string()),
    quantity: v.number(),
    expiry_date: v.string(), // "2024-01-31"
    days_until_expiry: v.number(), // calculated field
    created_at: v.number(),
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_expiry", ["expiry_date"])
    .index("by_franchise_expiry", ["franchiseId", "expiry_date"]),

  // Tablet counts
  tablet_counts: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    brand_name: v.string(),
    last_counted_date: v.optional(v.string()),
    last_counted_by: v.optional(v.string()),
    count: v.optional(v.number()),
    location: v.optional(v.string()), // "Main Wall", "SK Merch", etc.
    notes: v.optional(v.string()),
    priority: v.boolean(),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_brand", ["franchiseId", "brand_name"]),

  // Cleaning logs
  cleaning_logs: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    area_name: v.string(),
    area_category: v.string(), // "Lifestyle", "Mass Gainer", "Main Wall", "Other"
    last_cleaned_date: v.optional(v.string()),
    cleaned_by: v.optional(v.string()),
    next_due_date: v.optional(v.string()),
    is_completed: v.boolean(),
    notes: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_category", ["franchiseId", "area_category"]),

  // Ordering budgets
  ordering_budgets: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    vendor_name: v.string(),
    month: v.string(), // "2024-01"
    amount_spent: v.number(),
    notes: v.optional(v.string()),
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_month", ["franchiseId", "month"])
    .index("by_franchise_vendor_month", ["franchiseId", "vendor_name", "month"]),

  // Budget targets
  budget_targets: defineTable({
    orgId: v.id("organizations"),
    franchiseId: v.id("franchises"),
    vendor_name: v.string(),
    monthly_budget: v.number(),
    minimum_inventory_target: v.optional(v.number()),
    notes: v.optional(v.string()),
    updated_by: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_franchise", ["franchiseId"])
    .index("by_franchise_vendor", ["franchiseId", "vendor_name"]),
});
