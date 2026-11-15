/**
 * Product JSON-LD shared by the client (pages/ProductPage.tsx) and the build-time prerender
 * (scripts/prerender.ts), so crawlers and the hydrated page always see the same markup.
 * Shipping and return terms mirror pages/ShippingPage.tsx and pages/TermsPage.tsx.
 */
import { FREE_SHIPPING_THRESHOLD, RETURN_WINDOW_DAYS, SHIPPING_FEE } from './policy';

export interface ProductSchemaInput {
  siteUrl: string;
  id: string;
  name: string;
  image?: string; // absolute URL
  description?: string;
  sku: string;
  price: number;
  inStock: boolean;
  wineType?: string;
  region?: string;
  vintage?: number;
  volume?: string;
  grapeVariety?: string;
  alcoholContent?: number;
}


const property = (name: string, value: string | number) => ({ '@type': 'PropertyValue', name, value });

const shippingDetails = (fee: number, orderValue: object) => ({
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: fee, currency: 'ILS' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IL' },
  shippingConditions: { '@type': 'ShippingConditions', orderValue },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'DAY' },
  },
});

export function buildProductSchema(p: ProductSchemaInput) {
  const url = `${p.siteUrl}/product/${p.id}`;
  const extra = [
    p.wineType && property('wineType', p.wineType),
    p.region && property('region', p.region),
    p.vintage && property('vintage', p.vintage),
    p.volume && property('volume', p.volume),
    p.grapeVariety && property('grapeVariety', p.grapeVariety),
    p.alcoholContent && property('alcoholContent', `${p.alcoholContent}%`),
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: p.name,
    ...(p.image ? { image: [p.image] } : {}),
    ...(p.description ? { description: p.description } : {}),
    sku: p.sku,
    ...(/^\d{13}$/.test(p.sku) ? { gtin13: p.sku } : {}),
    brand: { '@type': 'Brand', name: 'Purcari' },
    ...(extra.length ? { additionalProperty: extra } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'ILS',
      price: p.price,
      priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Purcari Israel', url: p.siteUrl },
      shippingDetails: [
        shippingDetails(0, {
          '@type': 'PriceSpecification',
          minPrice: FREE_SHIPPING_THRESHOLD,
          priceCurrency: 'ILS',
        }),
        shippingDetails(SHIPPING_FEE, {
          '@type': 'PriceSpecification',
          maxPrice: FREE_SHIPPING_THRESHOLD,
          priceCurrency: 'ILS',
        }),
      ],
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IL',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: RETURN_WINDOW_DAYS,
        refundType: 'https://schema.org/FullRefund',
        merchantReturnLink: `${p.siteUrl}/terms`,
      },
    },
  };
}
