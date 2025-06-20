import type { Doc } from "../_generated/dataModel";
import { isBoxQtyItem } from "../sku_vendor_map";

// Constants
const HEALTHY_BUFFER = 2;
const OVERSTOCK_BUFFER = 3;
const DEFAULT_REORDER = 2;
const BOX_QTY_SIZE = 12; // 12 units = 1 box for box qty items
const MAX_INT = 2147483647;

// Types
export interface InventoryLineInput {
  store_id: string;
  item_number: string;
  product_name: string;
  qty_sold: number;
  qty_on_hand: number;
}

export interface SKUMapEntry {
  item_number: string;
  product_name: string;
  primary_vendor: string;
  retail_price: number;
}

export interface InventoryLineInsert extends InventoryLineInput {
  upload_id: string;
  user_id: string;
  transfer_in_qty: number;
  transfer_out_qty: number;
  suggested_reorder_qty: number;
  flag_transfer: boolean;
  flag_reorder: boolean;
  box_qty: boolean;
  primary_vendor: string;
}

export interface TransferLogInsert {
  upload_id: string;
  user_id: string;
  from_store_id: string;
  to_store_id: string;
  item_number: string;
  product_name: string;
  qty: number;
  primary_vendor: string;
  box_qty?: boolean;
}

export interface OptimizeInventoryResult {
  inventory: InventoryLineInsert[];
  transfers: TransferLogInsert[];
}

/**
 * Main inventory optimization logic for multi-store franchise.
 * Follows real-world best practices for completeness, transfer, and reorder.
 * 
 * BOX QTY LOGIC:
 * - Box qty items are identified by retail price between $1.99 and $7.99 from Sku_Map.csv
 * - 12 units = 1 box for all box qty items
 * 
 * BOX QTY ORDERING RULES:
 * - All ordering logic applies at the box level (ordering 24 units = 2 boxes)
 * - Examples:
 *   - qty_sold=0, qty_on_hand=0 → order 24 units (2 boxes)
 *   - qty_sold=12, qty_on_hand=12 → order 12 units (1 box)
 * - Always order in multiples of 12
 * 
 * BOX QTY TRANSFER RULES:
 * - Transfer OUT only if:
 *   - Store has >24 units on hand
 *   - Store sold <12 units  
 *   - qty_on_hand is divisible by 12
 * - Transfer IN only if:
 *   - Store's (qty_sold - qty_on_hand) ≥ 24
 * - Always transfer in multiples of 12
 */
export function optimizeInventory({
  inventoryLines,
  skuMap,
  upload_id,
  user_id,
  globalPrimaryVendor
}: {
  inventoryLines: InventoryLineInput[];
  skuMap: Record<string, SKUMapEntry>;
  upload_id: string;
  user_id: string;
  globalPrimaryVendor: string;
}): OptimizeInventoryResult {
  // --- 1. Normalize and Build Initial Maps ---
  const allStores = new Set<string>();
  const allItems = new Set<string>();
  const storeItemMap = new Map<string, Map<string, InventoryLineInput>>();

  // Normalize and collect all stores/items
  for (const line of inventoryLines) {
    const item_number = line.item_number.trim().toUpperCase();
    const store_id = line.store_id.trim();
    allStores.add(store_id);
    allItems.add(item_number);
    if (!storeItemMap.has(store_id)) storeItemMap.set(store_id, new Map());
    // Clamp negative qty_on_hand to 0
    storeItemMap.get(store_id)!.set(item_number, {
      ...line,
      item_number,
      store_id,
      qty_on_hand: Math.max(0, line.qty_on_hand),
      qty_sold: Math.max(0, line.qty_sold)
    });
  }

  // --- 1. Inventory Completeness ---
  // Ensure every store has every item
  for (const store_id of allStores) {
    const itemMap = storeItemMap.get(store_id)!;
    for (const item_number of allItems) {
      if (!itemMap.has(item_number)) {
        itemMap.set(item_number, {
          store_id,
          item_number,
          product_name: skuMap[item_number]?.product_name || "",
          qty_on_hand: 0,
          qty_sold: 0
        });
      }
    }
  }

  // --- 2. Transfer Logic (Before Ordering) ---
  // For each item, classify stores and allocate transfers
  const transfers: TransferLogInsert[] = [];
  // Track projected qty_on_hand for each store/item
  const projected = new Map<string, Map<string, number>>();
  for (const store_id of allStores) {
    projected.set(store_id, new Map());
    for (const item_number of allItems) {
      projected.get(store_id)!.set(item_number, storeItemMap.get(store_id)!.get(item_number)!.qty_on_hand);
    }
  }

  for (const item_number of allItems) {
    // Gather all store states for this item
    const storeStates: {
      store_id: string;
      qty_on_hand: number;
      qty_sold: number;
      box_qty: boolean;
    }[] = [];
    for (const store_id of allStores) {
      const line = storeItemMap.get(store_id)!.get(item_number)!;
      const box_qty = isBoxQtyItem(item_number);
      storeStates.push({
        store_id,
        qty_on_hand: projected.get(store_id)!.get(item_number)!,
        qty_sold: line.qty_sold,
        box_qty
      });
    }
    // Classify
    const understocked: typeof storeStates = [];
    const overstocked: typeof storeStates = [];
    for (const s of storeStates) {
      if (s.qty_on_hand < s.qty_sold) understocked.push(s);
      else if (s.qty_on_hand > s.qty_sold + OVERSTOCK_BUFFER) overstocked.push(s);
    }
    // Transfer from overstocked to understocked with strict box qty rules
    for (const recipient of understocked) {
      let needed = recipient.qty_sold - recipient.qty_on_hand;
      if (needed <= 0) continue;
      
      if (recipient.box_qty) {
        // Box qty transfer rules for recipients:
        // Only allow a store to receive a transfer if qty_sold - qty_on_hand >= 24
        if (needed < 24) continue;
      }
      
      for (const donor of overstocked) {
        if (needed <= 0) break;
        let donorAvailable = donor.qty_on_hand - (donor.qty_sold + OVERSTOCK_BUFFER);
        if (donorAvailable <= 0) continue;
        
        let transferQty = 0;
        
        if (recipient.box_qty) {
          // Box qty transfer rules for donors:
          // Only allow transfer OUT if:
          // 1. Store has more than 24 units on hand
          // 2. Store sold fewer than 12 units
          // 3. qty_on_hand is divisible by 12
          if (donor.qty_on_hand <= 24 || 
              donor.qty_sold >= 12 || 
              donor.qty_on_hand % 12 !== 0) {
            continue;
          }
          
          // Only transfer full boxes (multiples of 12)
          const maxBoxesNeeded = Math.floor(needed / BOX_QTY_SIZE);
          const maxBoxesAvailable = Math.floor(donorAvailable / BOX_QTY_SIZE);
          const boxesToTransfer = Math.min(maxBoxesNeeded, maxBoxesAvailable);
          
          if (boxesToTransfer <= 0) continue;
          transferQty = boxesToTransfer * BOX_QTY_SIZE;
        } else {
          // Regular item transfer logic
          transferQty = Math.min(needed, donorAvailable);
        }
        
        if (transferQty <= 0) continue;
        
        // Log transfer
        transfers.push({
          upload_id,
          user_id,
          from_store_id: donor.store_id,
          to_store_id: recipient.store_id,
          item_number,
          product_name: skuMap[item_number]?.product_name || "",
          qty: transferQty,
          primary_vendor: skuMap[item_number]?.primary_vendor || globalPrimaryVendor,
          box_qty: recipient.box_qty
        });
        
        // Update projections
        projected.get(donor.store_id)!.set(item_number, projected.get(donor.store_id)!.get(item_number)! - transferQty);
        projected.get(recipient.store_id)!.set(item_number, projected.get(recipient.store_id)!.get(item_number)! + transferQty);
        donor.qty_on_hand -= transferQty;
        recipient.qty_on_hand += transferQty;
        needed -= transferQty;
      }
    }
  }

  // --- 3. Ordering Logic (After Transfers) ---
  const inventory: InventoryLineInsert[] = [];
  for (const store_id of allStores) {
    for (const item_number of allItems) {
      const line = storeItemMap.get(store_id)!.get(item_number)!;
      const box_qty = isBoxQtyItem(item_number);
      const projected_on_hand = projected.get(store_id)!.get(item_number)!;
      const healthy_level = line.qty_sold + HEALTHY_BUFFER;
      let suggested_reorder_qty = 0;
      let flag_reorder = false;
      let flag_transfer = false;
      // Find transfer_in_qty and transfer_out_qty for this store/item
      const transfer_in_qty = transfers
        .filter(t => t.to_store_id === store_id && t.item_number === item_number)
        .reduce((sum, t) => sum + t.qty, 0);
      const transfer_out_qty = transfers
        .filter(t => t.from_store_id === store_id && t.item_number === item_number)
        .reduce((sum, t) => sum + t.qty, 0);
      // --- Reorder Logic ---
      if (box_qty) {
        // Box qty ordering logic - work at box level (12 units = 1 box)
        const qtySoldBoxes = Math.ceil(line.qty_sold / BOX_QTY_SIZE);
        const projectedOnHandBoxes = Math.floor(projected_on_hand / BOX_QTY_SIZE);
        const healthyLevelBoxes = qtySoldBoxes + Math.ceil(HEALTHY_BUFFER / BOX_QTY_SIZE);
        
        // Special case: if qty_sold = 0 and qty_on_hand = 0, order 24 (2 boxes)
        if (line.qty_sold === 0 && projected_on_hand === 0) {
          suggested_reorder_qty = 24; // 2 boxes
          flag_reorder = true;
        }
        // Example: if qty_sold = 12 and qty_on_hand = 12, order 12 (1 box)
        else if (projectedOnHandBoxes < qtySoldBoxes) {
          const boxesNeeded = qtySoldBoxes - projectedOnHandBoxes + 1; // +1 for buffer
          suggested_reorder_qty = boxesNeeded * BOX_QTY_SIZE;
          flag_reorder = true;
        }
        // If projected on hand is exactly what we need, no reorder
        else if (projectedOnHandBoxes >= healthyLevelBoxes) {
          suggested_reorder_qty = 0;
        }
        // Otherwise order to reach healthy level
        else {
          const boxesNeeded = healthyLevelBoxes - projectedOnHandBoxes;
          suggested_reorder_qty = boxesNeeded * BOX_QTY_SIZE;
          flag_reorder = true;
        }
        
        // Always order in multiples of 12 for box qty items
        suggested_reorder_qty = Math.ceil(suggested_reorder_qty / BOX_QTY_SIZE) * BOX_QTY_SIZE;
      } else {
        // Regular item ordering logic
        if (projected_on_hand === healthy_level) {
          // Healthy, no reorder
          suggested_reorder_qty = 0;
        } else if (projected_on_hand < line.qty_sold) {
          // Still understocked after transfers
          suggested_reorder_qty = healthy_level - projected_on_hand;
          flag_reorder = true;
        }
        // Special cases for regular items
        if (line.qty_sold === 1 && projected_on_hand === 1) {
          suggested_reorder_qty = 1;
          flag_reorder = true;
        }
        if (line.qty_sold === 0 && projected_on_hand === 0) {
          suggested_reorder_qty = DEFAULT_REORDER;
          flag_reorder = true;
        }
        // --- On-Hand Order Model (Image: "Order at least 50% more if on-hand is low") ---
        if (line.qty_on_hand > 0 && projected_on_hand < healthy_level) {
          // If on-hand is positive but not healthy, order at least 50% more
          suggested_reorder_qty = Math.max(suggested_reorder_qty, Math.ceil(line.qty_on_hand * 0.5));
          if (suggested_reorder_qty > 0) flag_reorder = true;
        }
        // --- Cap reorder ---
        suggested_reorder_qty = Math.max(0, Math.min(suggested_reorder_qty, healthy_level - projected_on_hand, MAX_INT));
      }
      // --- Transfer flag ---
      flag_transfer = transfer_in_qty > 0;
      // --- Move It! (Slim Down) ---
      // Already handled: overstocked stores send to understocked stores until both are healthy.
      // If you want to be more aggressive in slow months, add a parameter for month and adjust OVERSTOCK_BUFFER.
      // --- Double Dip / Look to the Future ---
      // Not directly codable here, but logic is extensible: you could add future sales/marketing data to increase reorder qty.
      // --- Compose inventory line ---
      inventory.push({
        ...line,
        upload_id,
        user_id,
        transfer_in_qty,
        transfer_out_qty,
        suggested_reorder_qty,
        flag_transfer,
        flag_reorder,
        box_qty,
        primary_vendor: skuMap[item_number]?.primary_vendor || globalPrimaryVendor
      });
    }
  }

  return { inventory, transfers };
} 