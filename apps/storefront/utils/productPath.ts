/**
 * Storefront path for a product: `/product/<slug>` once it has a slug, otherwise the id so links
 * keep working for a product that predates the slug backfill. Every place that builds a product
 * URL (links, canonicals, JSON-LD, sitemap) goes through here.
 */
export const productPath = (p: { _id: string; slug?: string | null }): string =>
  `/product/${p.slug || p._id}`;
