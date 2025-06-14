import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { parse } from 'date-fns'
import { optimizeInventory, type InventoryLineInput, type SKUMapEntry } from './utils/inventoryOptimization'

// --- Types ---
interface CSVMetadata {
    primary_vendor: string;
    window_start: Date;
    window_end: Date;
    header_row_index: number;
    headers: string[];
    col_map: Record<string, number>;
}

// --- Helper functions ---

function findHeaderRow(rows: string[][]): { index: number, headers: string[] } | null {
    // Use exact, trimmed, lowercased matches for robustness
    const required = ['item number', 'description', 'location', 'qty sld', 'qty on hnd'];
    for (let i = 0; i < rows.length; i++) {
        const normalized = rows[i].map(cell => cell.trim().toLowerCase());
        if (required.every(col => normalized.includes(col))) {
            return { index: i, headers: rows[i] };
        }
    }
    return null;
}

function extractMetadata(rows: string[][]): CSVMetadata | null {
    let primary_vendor = null;
    let window_start = null;
    let window_end = null;
    let header_row_index = -1;
    let headers: string[] = [];
    let col_map: Record<string, number> = {};

    // Extract metadata from first 25 rows
    for (let i = 0; i < Math.min(25, rows.length); i++) {
        const line = rows[i][0];
        if (typeof line === 'string') {
            if (line.includes('Primary vendor between')) {
                const match = line.match(/between\s+([A-Z0-9\-]+)/);
                if (match) primary_vendor = match[1];
            }
            if (line.includes('Report period:')) {
                const match = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}) to (\d{1,2}\/\d{1,2}\/\d{4})/);
                if (match) {
                    window_start = parse(match[1], 'M/d/yyyy', new Date());
                    window_end = parse(match[2], 'M/d/yyyy', new Date());
                }
            }
        }
    }

    // Find header row
    const headerResult = findHeaderRow(rows);
    if (headerResult) {
        header_row_index = headerResult.index;
        headers = headerResult.headers;
        col_map = getColMap(headers);
    }

    // Return null if we don't have all required metadata
    if (!primary_vendor || !window_start || !window_end || header_row_index === -1) {
        return null;
    }

    return {
        primary_vendor,
        window_start,
        window_end,
        header_row_index,
        headers,
        col_map
    };
}

function getColMap(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    headers.forEach((h, i) => {
        const key = h.trim().toLowerCase();
        if (key === 'item number') map.item_number = i;
        if (key === 'description') map.product_name = i;
        if (key === 'location') map.store_id = i;
        if (key === 'qty sld') map.qty_sold = i;
        if (key === 'qty on hnd') map.qty_on_hand = i;
    });
    return map;
}

function isValidItemNumber(item: string) {
    // Allow any non-empty string that contains at least one alphanumeric character
    return item.trim().length > 0 && /[A-Za-z0-9]/.test(item);
}

function isSummaryRow(item: string, store: string) {
    return /totals$/i.test(item) || /totals$/i.test(store);
}

// --- Main mutation ---

export const parseAndInsertMerch = mutation({
    args: {
        user_id: v.string(),
        rows: v.array(v.array(v.any())),
        chunk_index: v.number(),
        metadata: v.optional(v.object({
            primary_vendor: v.string(),
            window_start: v.string(),
            window_end: v.string(),
            header_row_index: v.number(),
            headers: v.array(v.string()),
            col_map: v.object({
                item_number: v.number(),
                product_name: v.number(),
                store_id: v.number(),
                qty_sold: v.number(),
                qty_on_hand: v.number()
            })
        }))
    },
    handler: async (ctx, { user_id, rows, chunk_index, metadata }) => {
        let csvMetadata: CSVMetadata;
        let upload_id: string;

        // Handle first chunk
        if (chunk_index === 0) {
            const extractedMetadata = extractMetadata(rows);
            if (!extractedMetadata) {
                throw new Error('Failed to extract metadata from first chunk');
            }
            csvMetadata = extractedMetadata;

            // Create upload record
            upload_id = await ctx.db.insert('inventory_uploads', {
                user_id,
                primary_vendor: csvMetadata.primary_vendor,
                window_start: csvMetadata.window_start.toISOString(),
                window_end: csvMetadata.window_end.toISOString(),
            });
        } else {
            // Use provided metadata for subsequent chunks
            if (!metadata) {
                throw new Error('Metadata required for non-first chunks');
            }
            csvMetadata = {
                primary_vendor: metadata.primary_vendor,
                window_start: new Date(metadata.window_start),
                window_end: new Date(metadata.window_end),
                header_row_index: metadata.header_row_index,
                headers: metadata.headers,
                col_map: metadata.col_map
            };

            // Get the upload_id from the first chunk
            const upload = await ctx.db
                .query('inventory_uploads')
                .filter(q => q.eq(q.field('user_id'), user_id))
                .order('desc')
                .first();
            
            if (!upload) {
                throw new Error('No upload record found for subsequent chunk');
            }
            upload_id = upload._id;
        }

        // Process rows
        let lastItemNumber = '';
        let lastProductName = '';
        let inserted = 0, skipped = 0;
        let totalQtySold = 0, totalQtyOnHand = 0;
        const inventoryLines: InventoryLineInput[] = [];

        // For first chunk, start after header row. For subsequent chunks, start from beginning
        const startIndex = chunk_index === 0 ? csvMetadata.header_row_index + 1 : 0;

        for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            let item_number = (row[csvMetadata.col_map.item_number] || '').trim();
            let product_name = (row[csvMetadata.col_map.product_name] || '').trim();
            const store_id = (row[csvMetadata.col_map.store_id] || '').trim();

            // Carry forward logic
            if (item_number) lastItemNumber = item_number;
            else item_number = lastItemNumber;

            if (product_name) lastProductName = product_name;
            else product_name = lastProductName;

            // Skip summary/invalid rows
            if (
                !store_id ||
                !item_number ||
                !isValidItemNumber(item_number) ||
                isSummaryRow(item_number, store_id)
            ) {
                skipped++;
                continue;
            }

            const qty_sold = parseInt(row[csvMetadata.col_map.qty_sold] || '0', 10) || 0;
            const qty_on_hand = parseInt(row[csvMetadata.col_map.qty_on_hand] || '0', 10) || 0;

            totalQtySold += qty_sold;
            totalQtyOnHand += qty_on_hand;

            inventoryLines.push({
                store_id,
                item_number,
                product_name,
                qty_sold,
                qty_on_hand
            });
        }

        // Fetch SKU map for retail prices
        const skuMap: Record<string, SKUMapEntry> = {};
        const skuEntries = await ctx.db
            .query('sku_vendor_map')
            .filter(q => q.eq(q.field('vendor'), csvMetadata.primary_vendor))
            .collect();

        skuEntries.forEach(entry => {
            skuMap[entry.item_number] = {
                item_number: entry.item_number,
                product_name: entry.description,
                primary_vendor: entry.vendor,
                retail_price: entry.retail_price || 0
            };
        });

        // Optimize inventory
        const { inventory, transfers } = optimizeInventory({
            inventoryLines,
            skuMap,
            upload_id,
            user_id,
            globalPrimaryVendor: csvMetadata.primary_vendor
        });

        // Insert optimized inventory lines
        for (const line of inventory) {
            await ctx.db.insert('inventory_lines', {
                ...line,
                created_at: new Date().toISOString()
            });
            inserted++;
        }

        // Insert transfer logs
        for (const transfer of transfers) {
            await ctx.db.insert('transfer_logs', transfer);
        }

        return { 
            status: 'ok', 
            stats: { 
                inserted, 
                skipped,
                transfers: transfers.length
            },
            metadata: {
                primary_vendor: csvMetadata.primary_vendor,
                window_start: csvMetadata.window_start.toISOString(),
                window_end: csvMetadata.window_end.toISOString(),
                header_row_index: csvMetadata.header_row_index,
                headers: csvMetadata.headers,
                col_map: csvMetadata.col_map
            }
        };
    }
});
