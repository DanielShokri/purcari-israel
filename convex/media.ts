import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { adminMutation } from "./authHelpers";

/**
 * Browser-facing image upload flow for the admin panel:
 *
 * 1. Client calls `media.generateUploadUrl` (admin-only) -> one-time POST URL.
 * 2. Client POSTs the raw File directly to that URL (never passes through a server).
 * 3. On success the endpoint responds with `{ storageId }`.
 * 4. Client calls `media.recordUploadedImage` -> file is registered in the
 *    `productImages` table and the permanent storage URL is returned for
 *    saving into `products.featuredImage`.
 */

/** One-time upload endpoint for a direct browser -> Convex storage POST. */
export const generateUploadUrl = adminMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Register an uploaded storage id and resolve its permanent URL. */
export const recordUploadedImage = adminMutation({
  args: {
    storageId: v.id("_storage"),
    // Optional stable key; defaults to a generated products/ key
    key: v.optional(v.string()),
  },
  returns: v.object({
    key: v.string(),
    storageId: v.id("_storage"),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const metadata = await ctx.storage.getMetadata(args.storageId);
    if (!metadata) {
      throw new ConvexError("הקובץ לא נמצא באחסון");
    }
    if (!metadata.contentType || !metadata.contentType.startsWith("image/")) {
      throw new ConvexError("ניתן להעלות קבצי תמונה בלבד");
    }

    const key = args.key ?? `products/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    const existing = await ctx.db
      .query("productImages")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (existing) {
      if (existing.storageId !== args.storageId) {
        await ctx.storage.delete(existing.storageId);
      }
      await ctx.db.patch(existing._id, { storageId: args.storageId });
    } else {
      await ctx.db.insert("productImages", {
        key,
        storageId: args.storageId,
      });
    }

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new ConvexError("הקובץ הועלה אך הכתובת לא נפתרה");
    }
    return { key, storageId: args.storageId, url };
  },
});

/** Best-effort cleanup: delete a productImages record and its blob by URL fragment. */
export const deleteImageByUrl = adminMutation({
  args: { url: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Storage URLs end with the storage id: /files/<id> or /api/<id>
    const match = String(args.url).match(/([a-z0-9]{30,})(?:\?.*)?$/i);
    if (!match) return null;

    const docs = await ctx.db.query("productImages").collect();
    for (const doc of docs) {
      const docUrl = await ctx.storage.getUrl(doc.storageId);
      if (docUrl === args.url) {
        await ctx.storage.delete(doc.storageId);
        await ctx.db.delete(doc._id);
        return null;
      }
    }
    return null;
  },
});
