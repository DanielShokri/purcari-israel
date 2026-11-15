/**
 * Post-build SEO step. Runs after `vite build` (see package.json "build").
 *
 * The storefront is a client-rendered SPA, so crawlers that don't run JS only ever see the
 * generic shell. This script takes dist/index.html as a template and writes one HTML file per
 * route with the real <title>, description, canonical, Open Graph tags and JSON-LD already in
 * the <head>, plus a small crawlable body. React replaces the body on load, and react-helmet-async
 * replaces the head tags (they carry data-rh="true"), so the client behaviour is unchanged.
 *
 * It also generates sitemap.xml, robots.txt and a real 404.html.
 * With a root 404.html present, Pages stops serving index.html (200) for unknown paths.
 *
 * Static page copy below mirrors the <SEO> props in pages/*Page.tsx. Keep them in sync.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConvexHttpClient } from 'convex/browser';
import { buildProductSchema } from '../utils/productSchema';
import { FREE_SHIPPING_THRESHOLD } from '../utils/policy';
import { productPath } from '../utils/productPath';
import { IMAGE_WIDTHS, imageSources, optimizedPath, storageIdOf } from '../utils/imageUrl';
import { optimizeImages, type OptimizedImage } from './optimize-images';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const SITE_URL = (process.env.SITE_URL || 'https://purcari.co.il').replace(/\/$/, '');
const SITE_NAME = 'Purcari Israel';
const DEFAULT_DESCRIPTION =
  'יינות פרימיום מבית יקב פורקארי (Purcari) - מסורת של איכות מאז 1827. משלוחים לכל הארץ.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;

interface RouteMeta {
  path: string; // URL path, '/' for home
  file?: string; // output file under dist/, defaults to `<path>.html` (`index.html` for '/')
  title?: string;
  description?: string;
  indexable: boolean;
  inSitemap: boolean;
  lastmod?: string; // ISO date; set by hand on static pages when their copy changes
  schema?: object[];
  ogType?: 'website' | 'product';
  ogImage?: string;
  preloadImage?: { href: string; srcset?: string; sizes?: string }; // LCP hint, added to <head>
  body?: string; // crawlable HTML placed inside #root until React mounts
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// JSON inside <script> must not be able to close the tag.
const jsonLd = (data: object[]) =>
  JSON.stringify(data.length === 1 ? data[0] : data).replace(/</g, '\\u003c');

const abs = (url: string) => (url.startsWith('/') ? `${SITE_URL}${url}` : url);

const trimDesc = (s: string, max = 160) => {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
};

const STATIC_ROUTES: RouteMeta[] = [
  {
    path: '/',
    ogImage: `${SITE_URL}/images/og-home.jpg`,
    title: 'דף הבית',
    description:
      'ברוכים הבאים לפורקארי ישראל - חנות היין המובילה ליינות פרימיום ממולדובה. גלו את מגוון היינות האדומים, הלבנים והמבעבעים שלנו.',
    indexable: true,
    inSitemap: true,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+972-50-948-0040',
          contactType: 'customer service',
          areaServed: 'IL',
          availableLanguage: ['Hebrew', 'English'],
        },
        sameAs: ['https://www.facebook.com/purcariisrael', 'https://www.instagram.com/purcariisrael'],
      },
    ],
  },
  {
    path: '/about',
    ogImage: `${SITE_URL}/images/og-about.jpg`,
    lastmod: '2026-01-31',
    title: 'אודותינו',
    description:
      'גלו את הסיפור המרתק של יקב פורקרי - מסורת של ייצור יין מאז 1827. המסע שלנו ממולדובה לישראל והמחויבות שלנו לאיכות ללא פשרות.',
    indexable: true,
    inSitemap: true,
  },
  {
    path: '/contact',
    lastmod: '2026-01-31',
    title: 'צור קשר',
    description:
      'צריכים עזרה בבחירת היין המושלם? רוצים לדעת עוד על המשלוחים שלנו? אנחנו כאן לכל שאלה. צרו קשר עם צוות פורקארי ישראל.',
    indexable: true,
    inSitemap: true,
  },
  {
    path: '/shipping',
    lastmod: '2026-02-22',
    title: 'מדיניות משלוחים',
    description: `מידע על משלוחים וזמני אספקה בפורקארי ישראל. משלוח חינם בהזמנה מעל ₪${FREE_SHIPPING_THRESHOLD}.`,
    indexable: true,
    inSitemap: true,
  },
  {
    path: '/terms',
    lastmod: '2026-01-31',
    title: 'תנאי שימוש',
    description: 'תנאי השימוש באתר פורקארי ישראל. קראו בעיון את התנאים לפני הרכישה.',
    indexable: true,
    inSitemap: true,
  },
  {
    path: '/privacy',
    lastmod: '2026-01-31',
    title: 'מדיניות פרטיות',
    description: 'מדיניות הפרטיות של פורקארי ישראל. כיצד אנו אוספים, משתמשים ומגנים על המידע שלכם.',
    indexable: true,
    inSitemap: true,
  },
  // Private, per-user pages: shells only, never indexed.
  { path: '/checkout', title: 'תשלום', indexable: false, inSitemap: false },
  { path: '/login', title: 'התחברות', indexable: false, inSitemap: false },
  { path: '/dashboard', title: 'האזור האישי', indexable: false, inSitemap: false },
  { path: '/order-confirmation', title: 'אישור הזמנה', indexable: false, inSitemap: false },
];

interface Product {
  _id: string;
  slug?: string;
  productName: string;
  productNameHe?: string;
  description?: string;
  descriptionHe?: string;
  shortDescriptionHe?: string;
  price: number;
  salePrice?: number;
  onSale?: boolean;
  quantityInStock: number;
  sku: string;
  featuredImage?: string;
  images?: string[];
  status?: 'draft' | 'active' | 'hidden' | 'discontinued';
  updatedAt?: string;
  wineType?: 'Red' | 'White' | 'Rosé' | 'Sparkling';
  region?: string;
  vintage?: number;
  volume?: string;
  grapeVariety?: string;
  alcoholContent?: number;
  servingTemperature?: string;
  tastingNotes?: string;
  isFeatured?: boolean;
  relatedProducts?: string[];
}

const WINE_TYPE_HE: Record<string, string> = {
  Red: 'יין אדום',
  White: 'יין לבן',
  'Rosé': 'יין רוזה',
  Sparkling: 'יין מבעבע',
};

const nameOf = (p: Product) => p.productNameHe || p.productName;
const priceOf = (p: Product) => (p.onSale && p.salePrice ? p.salePrice : p.price);
const fmtPrice = (n: number) => `₪${Number.isInteger(n) ? n : n.toFixed(2)}`;
const imageOf = (p: Product) => {
  const img = p.featuredImage || p.images?.[0];
  return img ? abs(img) : undefined;
};

// Filled by optimizeImages() in main(); empty means every image falls back to its original URL.
let OPTIMIZED = new Map<string, OptimizedImage>();

/** Optimised WebP for shells at `width`, with height scaled from the original aspect ratio. */
function shellImage(p: Product, width: number): { src: string; srcset?: string; w?: number; h?: number } | undefined {
  const original = imageOf(p);
  if (!original) return undefined;
  const id = storageIdOf(original);
  const dims = id ? OPTIMIZED.get(id) : undefined;
  if (!id || !dims) return { src: original };
  const sources = imageSources(original);
  const variant = IMAGE_WIDTHS.find((w) => w >= width) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  return {
    src: optimizedPath(id, variant), // same-origin, so keep it relative (works on staging and prod)
    srcset: sources.srcSet,
    w: width,
    h: Math.round((width * dims.h) / dims.w),
  };
}

/** 1200x630 JPEG for og:image and JSON-LD, or the original URL when not optimised. */
function socialImage(p: Product): string | undefined {
  const original = imageOf(p);
  const id = storageIdOf(original);
  return id && OPTIMIZED.has(id) ? abs(optimizedPath(id, 'og')) : original;
}

const imgTag = (p: Product, width: number, extra = '') => {
  const i = shellImage(p, width);
  if (!i) return '';
  const size = i.w && i.h ? ` width="${i.w}" height="${i.h}"` : '';
  return `<img src="${esc(i.src)}"${i.srcset ? ` srcset="${esc(i.srcset)}" sizes="${width}px"` : ''} alt="${esc(nameOf(p))}"${size}${extra} />`;
};

function productItem(p: Product): string {
  return `<li><a href="${esc(productPath(p))}">${imgTag(p, 200, ' loading="lazy"')}<span>${esc(nameOf(p))}</span></a> <span>${fmtPrice(priceOf(p))}</span></li>`;
}

async function loadEnvFile(file: string) {
  try {
    const text = await readFile(file, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* optional */
  }
}

async function fetchProducts(): Promise<Product[]> {
  const url = process.env.VITE_CONVEX_URL;
  if (!url) {
    throw new Error('VITE_CONVEX_URL is not set, cannot read products for prerender/sitemap.');
  }
  const client = new ConvexHttpClient(url);
  const all = (await client.query('products:list' as never, { limit: 5000 } as never)) as Product[];
  return all.filter((p) => !p.status || p.status === 'active');
}

function productRoute(p: Product, byId: Map<string, Product>): RouteMeta {
  const name = p.productNameHe || p.productName;
  const url = `${SITE_URL}${productPath(p)}`;
  const desc = p.descriptionHe || p.description || p.shortDescriptionHe;
  const price = p.onSale && p.salePrice ? p.salePrice : p.price;
  return {
    path: productPath(p),
    title: name,
    description: desc ? trimDesc(desc) : undefined,
    indexable: true,
    inSitemap: true,
    ogType: 'product',
    ogImage: socialImage(p),
    preloadImage: (() => {
      const i = shellImage(p, 800);
      return i && i.srcset ? { href: i.src, srcset: i.srcset, sizes: '(min-width: 768px) 40vw, 90vw' /* keep identical to the gallery's sizes in pages/ProductPage.tsx */ } : undefined;
    })(),
    schema: [
      buildProductSchema({
        siteUrl: SITE_URL,
        id: p._id,
        slug: p.slug,
        name,
        image: socialImage(p),
        description: desc,
        sku: p.sku,
        price,
        inStock: Number(p.quantityInStock) > 0,
        wineType: p.wineType,
        region: p.region,
        vintage: p.vintage,
        volume: p.volume,
        grapeVariety: p.grapeVariety,
        alcoholContent: p.alcoholContent,
      }),
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'דף הבית', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'חנות', item: `${SITE_URL}/products` },
          { '@type': 'ListItem', position: 3, name, item: url },
        ],
      },
    ],
    body: productBody(p, byId),
  };
}

function productBody(p: Product, byId: Map<string, Product>): string {
  const name = nameOf(p);
  const desc = p.descriptionHe || p.description || p.shortDescriptionHe;
  const inStock = Number(p.quantityInStock) > 0;
  const facts = [
    p.wineType ? ['סוג', WINE_TYPE_HE[p.wineType] || p.wineType] : null,
    p.grapeVariety ? ['זן ענבים', p.grapeVariety] : null,
    p.region ? ['אזור', p.region] : null,
    p.vintage ? ['בציר', String(p.vintage)] : null,
    p.volume ? ['נפח', p.volume] : null,
    p.alcoholContent ? ['אחוז אלכוהול', `${p.alcoholContent}%`] : null,
    p.servingTemperature ? ['טמפרטורת הגשה', p.servingTemperature] : null,
  ].filter((x): x is string[] => x !== null);
  const related = (p.relatedProducts || [])
    .map((id) => byId.get(id))
    .filter((r): r is Product => !!r)
    .slice(0, 4);
  return [
    '<main>',
    '<nav aria-label="breadcrumb"><a href="/">דף הבית</a> / <a href="/products">חנות</a></nav>',
    `<h1>${esc(name)}</h1>`,
    imgTag(p, 800),
    `<p>${fmtPrice(priceOf(p))} · ${inStock ? 'במלאי' : 'אזל מהמלאי'}</p>`,
    desc ? `<p>${esc(trimDesc(desc, 600))}</p>` : '',
    facts.length ? `<ul>${facts.map(([k, v]) => `<li>${esc(k)}: ${esc(v)}</li>`).join('')}</ul>` : '',
    p.tastingNotes ? `<h2>הערות טעימה</h2><p>${esc(trimDesc(p.tastingNotes, 600))}</p>` : '',
    related.length ? `<h2>יינות נוספים</h2><ul>${related.map(productItem).join('')}</ul>` : '',
    '<p><a href="/products">חנות היינות</a></p>',
    '</main>',
  ].join('');
}

function shopRoute(products: Product[]): RouteMeta {
  const links = products.map(productItem).join('');
  return {
    path: '/products',
    ogImage: `${SITE_URL}/images/og-home.jpg`,
    title: 'חנות - הכל',
    description: 'צפו בקטלוג היינות המלא של פורקארי ישראל. הכל - יינות איכותיים ממולדובה במחירים מעולים.',
    indexable: true,
    inSitemap: true,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'דף הבית', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'חנות', item: `${SITE_URL}/products` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}${productPath(p)}`,
          name: nameOf(p),
        })),
      },
    ],
    body: `<main><nav aria-label="breadcrumb"><a href="/">דף הבית</a></nav><h1>היינות שלנו</h1><p>קטלוג היינות המלא של פורקארי ישראל: יינות אדומים, לבנים, רוזה ומבעבעים ממולדובה.</p><ul>${links}</ul></main>`,
  };
}

function homeRoute(products: Product[]): RouteMeta {
  const base = STATIC_ROUTES.find((r) => r.path === '/')!;
  const featured = [...products].sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured)).slice(0, 12);
  return {
    ...base,
    preloadImage: {
      href: '/images/hero-1600.webp',
      srcset: '/images/hero-800.webp 800w, /images/hero-1600.webp 1600w',
      sizes: '100vw',
    },
    schema: [
      ...(base.schema || []),
      { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, inLanguage: 'he-IL' },
    ],
    body: `<main><h1>פורקארי ישראל – יינות פרימיום ממולדובה</h1><p>${esc(base.description || DEFAULT_DESCRIPTION)}</p><h2>היינות שלנו</h2><ul>${featured.map(productItem).join('')}</ul><p><a href="/products">לכל היינות בחנות</a></p><nav><a href="/about">אודות</a> · <a href="/shipping">משלוחים</a> · <a href="/contact">צור קשר</a></nav></main>`,
  };
}

function render(template: string, r: RouteMeta, notFound = false): string {
  const fullTitle = r.title ? `${r.title} | ${SITE_NAME}` : SITE_NAME;
  const description = r.description || DEFAULT_DESCRIPTION;
  const canonical = r.path === '/' ? SITE_URL : `${SITE_URL}${r.path}`;
  const image = r.ogImage || DEFAULT_OG_IMAGE;

  // data-rh="true" lets react-helmet-async remove and replace these once the app mounts.
  const tags = [
    `<meta name="description" content="${esc(description)}" data-rh="true" />`,
    r.indexable
      ? `<link rel="canonical" href="${esc(canonical)}" data-rh="true" />`
      : `<meta name="robots" content="noindex, nofollow" data-rh="true" />`,
    `<meta property="og:type" content="${r.ogType || 'website'}" data-rh="true" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" data-rh="true" />`,
    `<meta property="og:description" content="${esc(description)}" data-rh="true" />`,
    `<meta property="og:image" content="${esc(image)}" data-rh="true" />`,
    `<meta property="og:url" content="${esc(canonical)}" data-rh="true" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" data-rh="true" />`,
    `<meta property="og:locale" content="he_IL" data-rh="true" />`,
    `<meta name="twitter:card" content="summary_large_image" data-rh="true" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" data-rh="true" />`,
    `<meta name="twitter:description" content="${esc(description)}" data-rh="true" />`,
    `<meta name="twitter:image" content="${esc(image)}" data-rh="true" />`,
    ...(r.schema ? [`<script type="application/ld+json" data-rh="true">${jsonLd(r.schema)}</script>`] : []),
  ].join('\n    ');

  const body = r.body ?? (r.indexable || notFound ? `<main><h1>${esc(r.title || SITE_NAME)}</h1><p>${esc(description)}</p></main>` : '');

  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`);
  if (html === template && !/<title>/.test(template)) throw new Error('dist/index.html has no <title>');
  const preload = r.preloadImage
    ? `    <link rel="preload" as="image" href="${esc(r.preloadImage.href)}"${r.preloadImage.srcset ? ` imagesrcset="${esc(r.preloadImage.srcset)}" imagesizes="${esc(r.preloadImage.sizes || '100vw')}"` : ''} fetchpriority="high" />\n`
    : '';
  html = html.replace('</head>', `${preload}    ${tags}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  if (!html.includes(`<div id="root">${body}`)) throw new Error('Could not locate #root in dist/index.html');
  return html;
}

async function writeRoute(template: string, r: RouteMeta) {
  // `about.html`, not `about/index.html`: Pages serves the former at `/about` (matching our
  // canonicals and sitemap) while the latter 308-redirects `/about` to `/about/`.
  const rel = r.file ?? (r.path === '/' ? 'index.html' : `${r.path.replace(/^\//, '')}.html`);
  const file = path.join(DIST, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, render(template, r));
}

function sitemapXml(routes: RouteMeta[], products: Product[]): string {
  const toIso = (d?: string) => (d && !Number.isNaN(Date.parse(d)) ? new Date(d).toISOString() : undefined);
  const productTimes = products.map((p) => Date.parse(p.updatedAt ?? '')).filter((t) => !Number.isNaN(t));
  // Catalogue pages change whenever any product does.
  const newestProduct = productTimes.length ? new Date(Math.max(...productTimes)).toISOString() : undefined;
  const lastmod = new Map<string, string | undefined>(products.map((p) => [productPath(p), toIso(p.updatedAt)]));
  lastmod.set('/', newestProduct);
  lastmod.set('/products', newestProduct);
  const urls = routes
    .filter((r) => r.inSitemap)
    .map((r) => {
      const loc = r.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${r.path}`;
      const iso = lastmod.get(r.path) ?? toIso(r.lastmod);
      return `  <url>\n    <loc>${esc(loc)}</loc>${iso ? `\n    <lastmod>${iso}</lastmod>` : ''}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  await loadEnvFile(path.join(ROOT, '.env.local'));
  await loadEnvFile(path.join(ROOT, '.env'));

  const template = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const products = await fetchProducts();
  OPTIMIZED = await optimizeImages(products.map(imageOf), DIST).catch((err) => {
    console.warn('optimize-images failed, using original image URLs:', err);
    return new Map<string, OptimizedImage>();
  });

  const byId = new Map(products.map((p) => [p._id, p]));
  const routes = [homeRoute(products), shopRoute(products),
    ...STATIC_ROUTES.filter((r) => r.path !== '/'), ...products.map((p) => productRoute(p, byId))];

  for (const r of routes) await writeRoute(template, r);

  // Real 404: served with HTTP 404 by Cloudflare Pages for any path with no file or redirect.
  await writeFile(
    path.join(DIST, '404.html'),
    render(template, {
      path: '/404',
      title: 'הדף לא נמצא',
      description: 'מצטערים, הדף שחיפשת לא נמצא. חזרו לדף הבית או גלו את היינות שלנו.',
      indexable: false,
      inSitemap: false,
      body: '<main><h1>הדף לא נמצא</h1><p><a href="/">חזרה לדף הבית</a> · <a href="/products">היינות שלנו</a></p></main>',
    }, true)
  );

  await writeFile(path.join(DIST, 'sitemap.xml'), sitemapXml(routes, products));

  await writeFile(
    path.join(DIST, 'robots.txt'),
    // No Disallow for private routes: crawlers must be able to fetch them to see the noindex
    // (meta tag in the shell and the X-Robots-Tag header in public/_headers).
    ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n')
  );

  // Deliberately no _redirects: Cloudflare Pages applies 200 rewrites before static files
  // and turns them into 308s, which broke prerendered product pages and dropped
  // /order-confirmation/:id. Paths with no file (new products, order ids, junk URLs) fall
  // through to 404.html. That is the full app shell, so the client router still renders the
  // right page; only the HTTP status is 404 for those paths.

  const indexable = routes.filter((r) => r.inSitemap).length;
  console.log(`prerender: ${routes.length} pages written (${products.length} products), ${indexable} URLs in sitemap.xml, 404.html, robots.txt`);
}

main().catch((err) => {
  console.error('prerender failed:', err);
  process.exit(1);
});
