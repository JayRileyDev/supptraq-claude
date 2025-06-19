import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { getUserContext } from './accessControl'

// Box qty items from Sku_Map.csv (retail price between $1.99 and $7.99)
const BOX_QTY_ITEMS = new Set([
  "GHO106", "LF100-CCPA", "LF100-SMPS", "LF101-SBSR", "RC118-ILC", "1422", "1794", 
  "AB-BC", "AB-DBPB", "AB-FNB", "AB-FSC", "AB-TCW", "AL100-DRF-355ML", "AL100-OKS-355ML", 
  "AL100-PSL-355ML", "AL100-SSW-355ML", "AL100-STSR-355ML", "AL1135", "AL1136", 
  "AL119-CNC-355ML", "AL119-FCR-355ML", "AL119-MUN-355ML", "AL119-SSC-355ML", "AL1424", 
  "AL1729", "AL1730", "AL1731", "AL1807", "ALCT", "ALHSI", "ALJP", "AM1162", "AM2025CCD", 
  "AM2025CFB", "AM2025PB", "AN100", "AN101", "AN102", "ANS483695", "ANS483697", "ANS483699", 
  "AVD-007", "AVD-008", "AVD-210", "AVD-220", "AVD-230", "AVD-250", "AVD-260", "BANG-BCV", 
  "BANG-BR", "BANG-PM", "BRB-100", "BRB-101", "BRB-102", "BRB-103", "BRB-104", "BRB-105", 
  "BSN-901", "BSN-902", "BSN-903", "BSN-904", "BUB026", "BUB050", "BUB082C", "BUB083C", 
  "BUB084C", "BUB085C", "BUCK200", "BUCK201", "BUCK202", "BUCK2023", "BUCK204", "BUCK205", 
  "CBUM007", "CBUM035", "CBUM081", "CBUM097", "CBUM518", "CBUM519", "CBUM521", "CBUM522", 
  "CBUM530", "CBUM568", "CBUM599", "CEL-110347", "CEL-110349", "CEL-203", "CEL-204", 
  "CEL-205", "CEL-206", "FBP-001", "FBP-003", "FBP-010", "FBP-011", "FBP-012", "GHO428", 
  "GHO429", "GHO431", "GHO433", "GHO817", "GO4044", "GO4045", "GO4046", "GO4047", "GO4059", 
  "GO4060", "GO4061", "GO4062", "GO4063", "GO4069", "GO4073", "GO4075", "GO4098", 
  "GRENADE31000", "GRENADE31002", "GRENADE31003", "GRENADE31008", "GRENADE31009", 
  "GRENADE31010", "GRENADE31011", "GRENADE31012", "GRENADE31013", "GRENADE31016", 
  "GRENADE31061", "GRENADE31358", "GRENADE31360", "GRENADE31361", "IM000057", "IM000325", 
  "IN323", "IN390", "IN391", "IN396", "IN397", "KINGAF", "KINGCHAIN", "KINGCHAIN-100", 
  "KINGCUP-ES", "KINGCUP-GS", "KINGCUP-L2", "KINGCUP-SS", "KINGDSBAG", "KINGDSBAG-100", 
  "KINGFUNNEL", "KINGFUNNEL-L2", "KINGLANYARD", "KINGPIN", "KINGSHAKERSLEEVE", "KINGSOCKET", 
  "KINGSOCKET-ES", "KINGSOCKET-L2", "KINGSOCKET-MS", "KINGSOCKET-SS", "KINGSTICKER-ICS", 
  "KINGSTICKER-NS", "KINGSTICKER-TDS", "KINGSTICKER-VS", "KINGVITAMIN-GS", "KINGVITAMIN-L2", 
  "KSTRAWPACK", "LAB-104", "LAB-109", "LAB-110", "LAB-111", "LB-104", "LB-105", "LB-106", 
  "LB-107", "LB-115", "LEN040", "LEN041", "LEN042", "LF092", "LF093", "LF095", "LF096", 
  "LF097", "LF098", "LF099", "LF102-JLP-34G", "LF163", "LF165", "LF167", "LF218", "LF219", 
  "LF220", "LF225", "MAMATCARROT", "MP4U", "MP4U02", "MP4U03", "MP4U05", "MP4U07", "MP4U08", 
  "NP-CL-BEAN-BBQ", "NP-CL-BEAN-CR", "NP-CL-BEAN-DP", "NP-CL-BEAN-HBW", "NP-CL-BEAN-NC", 
  "NP-CL-BEAN-SCO", "NP-CL-BEAN-SPC", "NP-CL-BEAN-SV", "NU-990", "NU-991", "NUT-982", 
  "NUT-983", "NUT-992", "NUT-993", "ONE573", "ONE575", "OPT-900", "OPT-901", "OPT-902", 
  "PERFECT110", "PERFECT111", "PERFECT112", "PERFECT113", "PERFECT114", "PERFECT115", 
  "PERFECT116", "PERFECT117", "PHD001", "PHD002", "PHD003", "PHD004", "PHD041", "PRO504", 
  "PRO505", "PRO506", "PRO507", "PURITY172150", "PURITY234200", "PURITY234205", "PURITY234210", 
  "PURITY234215", "PURITY234220", "PURITY234225", "PURITY521106", "PURITY521115", "PURITY521120", 
  "PURITY521125", "PURITY521135", "PURITY521140", "PURITY521145", "PURITY521170", "PURITY521175", 
  "PURITY521180", "PURITY521185", "PURITY521190", "QC-BBQ", "QC-CH", "QC-SC", "QCK-CC", 
  "QCK-DCC", "QCK-PB", "QU0071U", "QU029U", "QU031U", "QU035U", "QU036U", "QU045", "QU046U", 
  "QU047U", "QU055U", "QU056U", "QU057U", "QU058U", "QU065", "QU066", "QU067", "QU068", 
  "QU0692U", "QU090U", "QU160", "QU161", "QU162", "QU180U", "QU181U", "QUEST-AP", "QUEST-BBM", 
  "QUEST-BC", "QUEST-CB", "QUEST-CCC", "QUEST-CCCD", "QUEST-CPB", "QUEST-DCC", "QUEST-MT", 
  "QUEST-OCC", "QUEST-PP", "QUEST-SM", "QUEST-WCR", "QUO27U", "QUO691", "RC119172", 
  "RC119174", "RC119193", "RC175997", "RC189472", "RC72450", "RC72451", "RC72453", "RC72454", 
  "RC7368", "RC7570", "RC7709", "RC7728", "RC7849", "RYSE011", "RYSE013", "RYSE089", "RYSE091", 
  "RYSE101", "RYSE102-CTL-500ML", "RYSE106", "RYSE118", "RYSE164", "RYSE165", "SIN043", 
  "SIN044", "SIN045", "SIN090", "SIN091", "SIN092", "SIN093", "SIN094", "SIN095", "SIN096", 
  "SIS001", "SIS002", "SIS003", "SIS020", "SIS021", "SKKINGWEAR400", "SMS-100", "SMS-101", 
  "SMS-102", "SMS-103", "SMS-104", "SMS-105", "SMS-106", "SMS-150", "SMS-151", "SMS-152", 
  "SMS-153", "TC305", "TC306", "TC561", "TC563", "TC565", "TC567", "TC568", "WAR-150", 
  "WAR-151", "WAR-152", "WAR-153", "WAR-154", "WAR-155", "WAR-157", "WAR-158", "WAR-159", 
  "WAR-160", "WAREHOUSE004", "WAREHOUSE015", "WAREHOUSE0892"
])

export function isBoxQtyItem(item_number: string): boolean {
  return BOX_QTY_ITEMS.has(item_number)
}

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