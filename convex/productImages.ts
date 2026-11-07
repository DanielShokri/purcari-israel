import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Product image storage helper.
 *
 * Uploads a binary image into Convex file storage and records a mapping from a
 * short key to its storage id, so product docs can reference images without
 * depending on an external host (purcari.co.il).
 *
 * Flow (per image):
 *  1. generateUploadUrl (internal action -> ctx.storage.generateUploadUrl)
 *  2. POST the file bytes to that URL -> { storageId }
 *  3. persist { filename -> storageId } in the productImages table
 */

export const uploadImage = internalAction({
  args: {
    key: v.string(), // unique lookup key, e.g. "wines/01_divin_bardar_silver"
    bytesB64: v.string(), // base64-encoded image bytes
    contentType: v.string(),
    sourceUrl: v.optional(v.string()),
  },
  returns: v.object({ storageId: v.id("_storage"), url: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    // atob/btoa are available in the Convex JS runtime (no Node Buffer there)
    const bin = atob(args.bytesB64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: args.contentType });
    const storageId = await ctx.storage.store(blob);
    await ctx.runMutation(internal.productImages.recordImage, {
      key: args.key,
      storageId,
      sourceUrl: args.sourceUrl,
    });
    const url = await ctx.storage.getUrl(storageId);
    return { storageId, url };
  },
});

/**
 * Same as uploadImage but pulls the bytes server-side from a public URL.
 * Used by the spreadsheet import so large images never travel through CLI args.
 */
export const uploadFromUrl = internalAction({
  args: {
    key: v.string(),
    sourceUrl: v.string(),
  },
  returns: v.object({
    key: v.string(),
    storageId: v.id("_storage"),
    url: v.union(v.string(), v.null()),
    bytes: v.number(),
  }),
  handler: async (ctx, args) => {
    const res = await fetch(args.sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PurcariImport/1.0)" },
    });
    if (!res.ok) throw new Error(`fetch ${args.sourceUrl} -> HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: contentType });
    const storageId = await ctx.storage.store(blob);
    await ctx.runMutation(internal.productImages.recordImage, {
      key: args.key,
      storageId,
      sourceUrl: args.sourceUrl,
    });
    const url = await ctx.storage.getUrl(storageId);
    return { key: args.key, storageId, url, bytes: buf.byteLength };
  },
});

/** Persist the key->storageId mapping (called right after storeImage). */
export const recordImage = internalMutation({
  args: {
    key: v.string(),
    storageId: v.id("_storage"),
    sourceUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("productImages")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      if (existing.storageId !== args.storageId) {
        await ctx.storage.delete(existing.storageId);
      }
      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        sourceUrl: args.sourceUrl,
      });
    } else {
      await ctx.db.insert("productImages", {
        key: args.key,
        storageId: args.storageId,
        sourceUrl: args.sourceUrl,
      });
    }
    return null;
  },
});

/** Resolve storage ids -> permanent /api/storage URLs for N keys. */
export const resolveUrls = internalMutation({
  args: { keys: v.array(v.string()) },
  returns: v.array(v.nullable(v.string())),
  handler: async (ctx, args) => {
    const urls = [];
    for (const key of args.keys) {
      const rec = await ctx.db
        .query("productImages")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (!rec) {
        urls.push(null);
        continue;
      }
      const url = await ctx.storage.getUrl(rec.storageId);
      urls.push(url);
    }
    return urls;
  },
});
