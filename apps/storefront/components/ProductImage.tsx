import React, { useState } from 'react';
import { IMAGE_WIDTHS, imageSources } from '../utils/imageUrl';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Widths (px) the browser may choose from. Defaults to all optimised sizes. */
  widths?: readonly number[];
  /** `sizes` attribute describing the rendered width, so the browser picks the right file. */
  sizes?: string;
  /** Above-the-fold image (LCP candidate): load eagerly with high fetch priority. */
  priority?: boolean;
}

/**
 * Product image served from the optimised WebP copies in /img (see scripts/optimize-images.ts).
 * Falls back to the original URL when no optimised copy exists, e.g. a product added after the
 * last deploy or an admin-pasted external URL.
 */
const ProductImage: React.FC<ProductImageProps> = ({ src, alt, className, widths = IMAGE_WIDTHS, sizes, priority }) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const original = src || '';
  const sources = failedSrc === original || !original ? { src: original } : imageSources(original, widths);

  // React 18 only knows the lowercase attribute, so pass it through as a plain attribute.
  const priorityAttrs = priority ? ({ fetchpriority: 'high' } as Record<string, string>) : {};

  return (
    <img
      src={sources.src || undefined}
      srcSet={sources.srcSet}
      sizes={sources.srcSet ? sizes : undefined}
      alt={alt}
      className={className}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setFailedSrc(original)}
      {...priorityAttrs}
    />
  );
};

export default ProductImage;
