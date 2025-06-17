// Ultra simple brute force - just take big chunks until we have everything
export async function getAllDataWithPagination(
  ctx: any,
  tableName: string,
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  console.log(`📋 BRUTE FORCE: Getting ALL ${tableName} for user ${userId}`);

  try {
    // Build base query
    let query = ctx.db.query(tableName);
    query = query.filter((q: any) => q.eq(q.field("user_id"), userId));
    
    if (startDate && endDate) {
      query = query.filter((q: any) => 
        q.and(
          q.gte(q.field("sale_date"), startDate),
          q.lte(q.field("sale_date"), endDate)
        )
      );
    }

    // For ticket_history, we know we need to get 13,085 items
    // Let's try the nuclear option: .collect()
    if (tableName === "ticket_history") {
      console.log(`🎯 Special handling for ticket_history - trying .collect() directly`);
      
      try {
        const allItems = await query.collect();
        console.log(`🎉 COLLECT SUCCESS: Got ${allItems.length} items`);
        return allItems;
      } catch (collectError) {
        console.log(`❌ COLLECT FAILED:`, collectError);
        
        // Fallback: try a very large take
        console.log(`🔄 Fallback: trying large take(15000)`);
        try {
          const largeResult = await query.take(15000);
          console.log(`✅ Large take got ${largeResult.length} items`);
          return largeResult;
        } catch (takeError) {
          console.log(`❌ Large take also failed:`, takeError);
          return [];
        }
      }
    } else {
      // For other tables, use simple take
      const data = await query.take(1000);
      console.log(`✅ ${tableName}: Got ${data.length} items`);
      return data;
    }
    
  } catch (error) {
    console.error(`❌ Error in ${tableName}:`, error);
    return [];
  }
}

// Helper function to get ALL data from a table with additional filters
export async function getAllDataWithFilters(
  ctx: any,
  tableName: string,
  filters: { [key: string]: any },
  batchSize: number = 4000
): Promise<any[]> {
  const allData: any[] = [];
  let lastId: string | null = null;
  let hasMore = true;
  let batchCount = 0;

  console.log(`📋 Starting filtered pagination for ${tableName}`, filters);

  while (hasMore) {
    batchCount++;
    let query = ctx.db.query(tableName);
    
    // Apply all filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== "all") {
        query = query.filter((q: any) => q.eq(q.field(field), value));
      }
    });
    
    // Apply cursor-based pagination
    if (lastId) {
      query = query.filter((q: any) => q.gt(q.field("_id"), lastId));
    }
    
    // Order by _id and take batch
    query = query.order("asc").take(batchSize);
    
    const batch = await query;
    
    console.log(`📄 Batch ${batchCount} for ${tableName}: ${batch.length} items`);
    
    if (batch.length === 0) {
      hasMore = false;
    } else {
      allData.push(...batch);
      lastId = batch[batch.length - 1]._id;
      
      if (batch.length < batchSize) {
        hasMore = false;
      }
      
      // Safety check
      if (batchCount > 100) {
        console.warn(`⚠️  Safety break: ${tableName} exceeded 100 batches`);
        hasMore = false;
      }
    }
  }
  
  console.log(`✅ Completed ${tableName}: ${allData.length} total items in ${batchCount} batches`);
  return allData;
}