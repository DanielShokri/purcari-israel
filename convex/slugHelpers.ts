import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Turn a product name into a URL slug: lowercase ASCII words joined by single dashes.
 * "DIVIN BARDAR SILVER XO 7 YEARS" -> "divin-bardar-silver-xo-7-years". Returns "" when
 * nothing usable remains (for example a Hebrew-only name), so callers can fall back.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (é -> e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** `base`, or `base-2`, `base-3`... the first one no other product uses. */
export async function uniqueSlug(
  ctx: QueryCtx | MutationCtx,
  base: string,
  excludeId?: Id<"products">
): Promise<string> {
  const root = base || "product";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const taken = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .first();
    if (!taken || taken._id === excludeId) return candidate;
  }
}
