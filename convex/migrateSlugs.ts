import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { slugify } from "./slugHelpers";

/**
 * One-off backfill: give every product without a slug one derived from its English name
 * (falling back to the SKU, then "product"). Existing slugs are never changed, so it is safe
 * to run repeatedly. Use `dryRun: true` to see the id -> slug map without writing.
 *
 *   npx convex run migrateSlugs:backfillProductSlugs '{"dryRun": true}'
 *   npx convex run migrateSlugs:backfillProductSlugs
 */
export const backfillProductSlugs = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  returns: v.object({
    assigned: v.array(v.object({ id: v.string(), name: v.string(), slug: v.string() })),
    alreadyHadSlug: v.number(),
    dryRun: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect();
    const taken = new Set(products.map((p) => p.slug).filter((s): s is string => !!s));
    const assigned: { id: string; name: string; slug: string }[] = [];

    for (const p of products) {
      if (p.slug) continue;
      const root = slugify(p.productName) || slugify(p.sku) || "product";
      let slug = root;
      for (let n = 2; taken.has(slug); n++) slug = `${root}-${n}`;
      taken.add(slug);
      assigned.push({ id: p._id, name: p.productName, slug });
      if (!args.dryRun) await ctx.db.patch(p._id, { slug });
    }

    return {
      assigned,
      alreadyHadSlug: products.length - assigned.length,
      dryRun: !!args.dryRun,
    };
  },
});
