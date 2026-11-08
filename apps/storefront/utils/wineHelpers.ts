/**
 * Wine type helper utilities
 * Derives wine type labels from product wineType
 */

/**
 * Returns the Hebrew label for a product wineType
 * (Red, White, Rosé, Sparkling).
 */
export const getWineTypeLabel = (wineType?: string): string => {
  const type = wineType?.toLowerCase();

  if (type?.includes('rose') || type?.includes('rosé')) return 'רוזה';
  if (type?.includes('red')) return 'יין אדום';
  if (type?.includes('white')) return 'יין לבן';
  if (type?.includes('sparkling')) return 'מבעבע';

  return 'יין';
};
