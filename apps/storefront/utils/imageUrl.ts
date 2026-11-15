/**
 * Maps a Convex storage image URL to the optimised copies that scripts/optimize-images.ts
 * writes into dist/img/ at build time. Pure string logic so the client and the prerender
 * script share it. URLs that are not Convex storage URLs (pasted by an admin) pass through.
 */

export const STORAGE_ID_RE = /\/api\/storage\/([A-Za-z0-9-]+)/;
export const IMAGE_WIDTHS = [400, 800, 1200] as const;

export const storageIdOf = (url?: string | null): string | undefined => url?.match(STORAGE_ID_RE)?.[1];

export const optimizedPath = (id: string, variant: number | 'og') =>
  variant === 'og' ? `/img/${id}-og.jpg` : `/img/${id}-${variant}.webp`;

export interface ImageSources {
  src: string;
  srcSet?: string;
}

/** `src` is the middle width; `srcSet` lists every width. Unknown URLs get `src` only. */
export function imageSources(url: string, widths: readonly number[] = IMAGE_WIDTHS): ImageSources {
  const id = storageIdOf(url);
  if (!id) return { src: url };
  const sorted = [...widths].sort((a, b) => a - b);
  return {
    src: optimizedPath(id, sorted[Math.floor((sorted.length - 1) / 2)]),
    srcSet: sorted.map((w) => `${optimizedPath(id, w)} ${w}w`).join(', '),
  };
}
