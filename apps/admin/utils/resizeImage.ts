/**
 * Downscale and re-encode an uploaded image in the browser before it goes to Convex storage.
 * Originals can be several MB; the storefront only ever shows them at most ~1200px wide.
 * Returns the original file when resizing is not worthwhile or not possible, so callers can
 * always upload whatever this returns.
 */

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 0.85;

export async function resizeImageForUpload(file: File): Promise<File> {
  // GIFs may be animated; canvas would flatten them to a single frame.
  if (file.type === 'image/gif') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
    // Keep the original if the browser can't encode WebP or the result is not smaller.
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}
