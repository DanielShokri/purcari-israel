/**
 * Build-time product image optimisation. Convex serves the originals as large PNGs with
 * `cache-control: private`, so Cloudflare cannot cache them. For every product image this
 * downloads the original once and writes, under dist/img/:
 *   <storageId>-400.webp / -800.webp / -1200.webp   responsive sizes for the app and shells
 *   <storageId>-og.jpg                              1200x630 JPEG for og:image and JSON-LD
 *   manifest.json                                   { <storageId>: { w, h } } original size
 * Failures only log a warning: callers fall back to the original URL, so the build never breaks.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { IMAGE_WIDTHS, storageIdOf } from '../utils/imageUrl';

export interface OptimizedImage {
  w: number;
  h: number;
}

const CONCURRENCY = 4;

async function optimizeOne(id: string, url: string, outDir: string): Promise<OptimizedImage> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) throw new Error('unreadable image');

  const writes = IMAGE_WIDTHS.map((width) =>
    sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(outDir, `${id}-${width}.webp`))
  );
  writes.push(
    sharp(input)
      .rotate()
      .resize({ width: 1200, height: 630, fit: 'contain', background: '#ffffff' })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(outDir, `${id}-og.jpg`))
  );
  await Promise.all(writes);
  return { w: meta.width, h: meta.height };
}

export async function optimizeImages(
  imageUrls: (string | undefined)[],
  distDir: string
): Promise<Map<string, OptimizedImage>> {
  const outDir = path.join(distDir, 'img');
  await mkdir(outDir, { recursive: true });

  const jobs = new Map<string, string>();
  for (const url of imageUrls) {
    const id = storageIdOf(url);
    if (url && id && !jobs.has(id)) jobs.set(id, url);
  }

  const result = new Map<string, OptimizedImage>();
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const [id, url] = job;
        try {
          result.set(id, await optimizeOne(id, url, outDir));
        } catch (err) {
          console.warn(`optimize-images: skipped ${id}: ${(err as Error).message}`);
        }
      }
    })
  );

  await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(Object.fromEntries(result)));
  console.log(`optimize-images: ${result.size}/${jobs.size} images -> dist/img/`);
  return result;
}
