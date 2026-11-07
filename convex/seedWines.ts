import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time import of the "Purcari wines - purcari.co.il" spreadsheet into the
 * products table. Images are already hosted on Convex file storage; callers
 * pass resolved URLs (from productImages.resolveUrls), so product docs store
 * permanent Convex URLs instead of purcari.co.il links.
 *
 * Matching is by SKU (barcode), which the sheet guarantees unique. Existing
 * products with the same SKU are updated in place, not duplicated.
 *
 * wineType mapping (schema enum only allows Red/White/Rosé/Sparkling):
 *   ברנדי / orange / still "יבש" rows -> no wineType (schema field is optional)
 * Category mapping uses the sheet's Categories column (comma separated).
 */

const CATEGORY_SLUGS: Record<string, string> = {
  "אדום": "red-wines",
  "לבן": "white-wines",
  "רוזה": "rose-wines",
  "יינות מבעבעים": "sparkling-wines",
  "ברנדי": "brandy",
};

/** Strip undefined values so Convex optional fields are omitted, not set to null. */
function cleanUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out as T;
}

function wineTypeFrom(type: string, categories: string): string | undefined {
  if (type.includes("מבעבע")) return "Sparkling";
  if (type.includes("רוזה")) return "Rosé";
  if (categories.includes("סדרת Nocturne") && categories.includes("רוזה")) return "Rosé";
  if (categories.includes("אדום") || type.includes("אדום")) return "Red";
  if (categories.includes("לבן") || type.includes("לבן")) return "White";
  if (type.includes("קינוח") && type.includes("אדום")) return "Red";
  return undefined; // brandy, plain "יבש", orange wine
}

const wineRecord = v.object({
  name: v.string(),
  sku: v.string(),
  categories: v.string(),
  price: v.number(),
  regularPrice: v.nullable(v.number()),
  onSale: v.boolean(),
  inStock: v.boolean(),
  volume: v.string(),
  type: v.string(),
  alcohol: v.string(),
  servingTemp: v.string(),
  grape: v.string(),
  description: v.string(),
  rating: v.number(),
  reviews: v.number(),
  imageUrl: v.string(),
  imageUrls: v.array(v.string()), // resolved Convex storage URLs (first = featured)
});

export const importWines = internalMutation({
  args: {
    wines: v.array(wineRecord),
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    created: v.number(),
    updated: v.number(),
    skipped: v.number(),
    details: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const created: number[] = [];
    const updated: number[] = [];
    const skipped: string[] = [];
    const details: string[] = [];
    const now = new Date().toISOString();

    for (const [i, w] of args.wines.entries()) {
      // Resolve category: first known slug from the comma-separated list
      let categoryId = undefined as undefined | Awaited<ReturnType<typeof lookupCategory>>;
      async function lookupCategory(slug: string) {
        return await ctx.db
          .query("categories")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();
      }
      for (const raw of w.categories.split(",")) {
        const cat = raw.trim();
        const slug = CATEGORY_SLUGS[cat];
        if (slug) {
          const found = await lookupCategory(slug);
          if (found) categoryId = found;
          break;
        }
      }
      if (!categoryId) {
        const fallback = await lookupCategory("wines");
        categoryId = fallback;
      }
      if (!categoryId) {
        skipped.push(`${w.name}: no category`);
        continue;
      }

      const wineType = wineTypeFrom(w.type, w.categories);

      // Alcohol "40%" -> 40; missing -> undefined
      const alcoholMatch = w.alcohol.match(/(\d+(?:\.\d+)?)/);
      const alcoholContent = alcoholMatch ? parseFloat(alcoholMatch[1]) : undefined;

      // Sheet semantics:
      //   "Price (₪)"         = the price customers actually pay (discounted)
      //   "Regular price (₪)" = the crossed-out original
      // In our schema `price` is the base price and `salePrice` the discounted one,
      // so a discounted row becomes price=regular, salePrice=paying price.
      const isDiscounted =
        w.onSale && w.regularPrice !== null && w.regularPrice > w.price;
      const basePrice = isDiscounted ? (w.regularPrice as number) : w.price;

      const doc = cleanUndefined({
        productName: w.name,
        // The sheet has no Hebrew name column - left empty on purpose.
        price: basePrice,
        salePrice: isDiscounted ? w.price : undefined,
        onSale: isDiscounted,
        quantityInStock: w.inStock ? 50 : 0,
        stockStatus: w.inStock ? ("in_stock" as const) : ("out_of_stock" as const),
        sku: w.sku,
        category: categoryId._id,
        description: undefined,
        descriptionHe: w.description,
        shortDescriptionHe: w.description.split("\n")[0].slice(0, 150),
        wineType: wineType as "Red" | "White" | "Rosé" | "Sparkling" | undefined,
        volume: w.volume,
        alcoholContent,
        grapeVariety: w.grape || undefined,
        servingTemperature: w.servingTemp || undefined,
        featuredImage: w.imageUrls[0] ?? undefined,
        images: w.imageUrls.length > 1 ? w.imageUrls : undefined,
        status: "active" as const,
        updatedAt: now,
      });

      // products table has no sku index in the current schema - scan and match.
      // (36 products is tiny; adding a by_sku index is a schema change we can
      // make later if this table grows.)
      const all = await ctx.db.query("products").collect();
      const existingDoc = all.find((p) => p.sku === w.sku);

      if (args.dryRun) {
        details.push(`${existingDoc ? "update" : "create"}: ${w.name} (${w.sku}) cat=${categoryId.slug} type=${wineType ?? "none"}`);
        continue;
      }

      if (existingDoc) {
        await ctx.db.patch(existingDoc._id, doc);
        updated.push(i);
      } else {
        await ctx.db.insert("products", {
          ...doc,
          createdAt: now,
        });
        created.push(i);
      }
    }

    return {
      created: created.length,
      updated: updated.length,
      skipped: skipped.length,
      details: args.dryRun ? details : skipped,
    };
  },
});

/** Create the standard category hierarchy if missing (idempotent). */
export const ensureCategories = internalMutation({
  args: {},
  returns: v.array(v.object({ slug: v.string(), id: v.id("categories") })),
  handler: async (ctx) => {
    const hierarchy = [
      { name: "Wines", nameHe: "יינות", slug: "wines", parent: null as string | null },
      { name: "Red Wines", nameHe: "יינות אדומים", slug: "red-wines", parent: "wines" },
      { name: "White Wines", nameHe: "יינות לבנים", slug: "white-wines", parent: "wines" },
      { name: "Rosé Wines", nameHe: "יינות רוזה", slug: "rose-wines", parent: "wines" },
      { name: "Sparkling Wines", nameHe: "יינות מבעבעים", slug: "sparkling-wines", parent: "wines" },
      { name: "Brandy", nameHe: "ברנדי", slug: "brandy", parent: null },
    ];
    const ids: Record<string, ReturnType<typeof Object>> = {};
    const out: Array<{ slug: string; id: any }> = [];
    for (const c of hierarchy) {
      let existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", c.slug))
        .unique();
      if (!existing) {
        const parentId = c.parent ? ids[c.parent] : undefined;
        const now = new Date().toISOString();
        const id = await ctx.db.insert("categories", {
          name: c.name,
          nameHe: c.nameHe,
          slug: c.slug,
          parentId,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
        ids[c.slug] = id;
        out.push({ slug: c.slug, id });
      } else {
        ids[c.slug] = existing._id;
        out.push({ slug: c.slug, id: existing._id });
      }
    }
    return out;
  },
});

/** Optional cleanup: hide the old dev seed products that are superseded. */
export const hideByNames = internalMutation({
  args: { names: v.array(v.string()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    let n = 0;
    for (const name of args.names) {
      const doc = await ctx.db
        .query("products")
        .withSearchIndex("search_en", (q) => q.search("productName", name))
        .filter((q) => q.eq(q.field("productName"), name))
        .unique();
      if (doc) {
        await ctx.db.patch(doc._id, { status: "hidden", updatedAt: new Date().toISOString() });
        n++;
      }
    }
    return n;
  },
});
