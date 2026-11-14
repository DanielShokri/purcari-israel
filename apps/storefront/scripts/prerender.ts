/**
 * Post-build SEO step. Runs after `vite build` (see package.json "build").
 *
 * The storefront is a client-rendered SPA, so crawlers that don't run JS only ever see the
 * generic shell. This script takes dist/index.html as a template and writes one HTML file per
 * route with the real <title>, description, canonical, Open Graph tags and JSON-LD already in
 * the <head>, plus a small crawlable body. React replaces the body on load, and react-helmet-async
 * replaces the head tags (they carry data-rh="true"), so the client behaviour is unchanged.
 *
 * It also generates sitemap.xml, robots.txt, a real 404.html and Cloudflare Pages `_redirects`.
 * With a root 404.html present, Pages stops serving index.html (200) for unknown paths.
 *
 * Static page copy below mirrors the <SEO> props in pages/*Page.tsx. Keep them in sync.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConvexHttpClient } from 'convex/browser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const SITE_URL = (process.env.SITE_URL || 'https://purcari.co.il').replace(/\/$/, '');
const SITE_NAME = 'Purcari Israel';
const DEFAULT_DESCRIPTION =
  'יינות פרימיום מבית יקב פורקארי (Purcari) - מסורת של איכות מאז 1827. משלוחים לכל הארץ.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;

interface RouteMeta {
  path: string; // URL path, '/' for home
  title?: string;
  description?: string;
  indexable: boolean;
  inSitemap: boolean;
  schema?: object[];
  ogType?: 'website' | 'product';
  ogImage?: string;
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
      },
    ],
  },
  {
    path: '/about',
    title: 'אודותינו',
    description:
      'גלו את הסיפור המרתק של יקב פורקרי - מסורת של ייצור יין מאז 1827. המסע שלנו ממולדובה לישראל והמחויבות שלנו לאיכות ללא פשרות.',
    indexable: true,
    inSitemap: true,
  },
  {
    path: '/contact',
    title: 'צור קשר',
    description:
      'צריכים עזרה בבחירת היין המושלם? רוצים לדעת עוד על המשלוחים שלנו? אנחנו כאן לכל שאלה. צרו קשר עם צוות פורקארי ישראל.',
    indexable: true,
    inSitemap: true,
  },
  {
    path: '/shipping',
    title: 'מדיניות משלוחים',
    description: 'מידע על משלוחים וזמני אספקה בפורקארי ישראל. משלוח חינם בהזמנה מעל ₪300.',
    indexable: true,
    inSitemap: true,
  },
  {
    path: '/terms',
    title: 'תנאי שימוש',
    description: 'תנאי השימוש באתר פורקארי ישראל. קראו בעיון את התנאים לפני הרכישה.',
    indexable: true,
    inSitemap: true,
  },
  {
    path: '/privacy',
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
  // Generic shell for /product/* ids that were added after this build (see _redirects).
  { path: '/product', title: 'מוצר', indexable: false, inSitemap: false },
];

interface Product {
  _id: string;
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

function productRoute(p: Product): RouteMeta {
  const name = p.productNameHe || p.productName;
  const url = `${SITE_URL}/product/${p._id}`;
  const image = p.featuredImage || p.images?.[0];
  const desc = p.descriptionHe || p.description || p.shortDescriptionHe;
  const price = p.onSale && p.salePrice ? p.salePrice : p.price;
  return {
    path: `/product/${p._id}`,
    title: name,
    description: desc ? trimDesc(desc) : undefined,
    indexable: true,
    inSitemap: true,
    ogType: 'product',
    ogImage: image ? abs(image) : undefined,
    schema: [
      {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name,
        ...(image ? { image: [abs(image)] } : {}),
        ...(desc ? { description: desc } : {}),
        sku: p.sku,
        brand: { '@type': 'Brand', name: 'Purcari' },
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'ILS',
          price,
          availability:
            Number(p.quantityInStock) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      },
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
    body: `<main><h1>${esc(name)}</h1>${desc ? `<p>${esc(trimDesc(desc, 400))}</p>` : ''}<p><a href="/products">חנות היינות</a></p></main>`,
  };
}

function shopRoute(products: Product[]): RouteMeta {
  const links = products
    .map((p) => `<li><a href="/product/${esc(p._id)}">${esc(p.productNameHe || p.productName)}</a></li>`)
    .join('');
  return {
    path: '/products',
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
    ],
    body: `<main><h1>היינות שלנו</h1><ul>${links}</ul></main>`,
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
  html = html.replace('</head>', `    ${tags}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  if (!html.includes(`<div id="root">${body}`)) throw new Error('Could not locate #root in dist/index.html');
  return html;
}

async function writeRoute(template: string, r: RouteMeta) {
  const file = r.path === '/' ? path.join(DIST, 'index.html') : path.join(DIST, r.path, 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, render(template, r));
}

function sitemapXml(routes: RouteMeta[], products: Product[]): string {
  const lastmod = new Map(products.map((p) => [`/product/${p._id}`, p.updatedAt]));
  const urls = routes
    .filter((r) => r.inSitemap)
    .map((r) => {
      const loc = r.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${r.path}`;
      const lm = lastmod.get(r.path);
      const iso = lm && !Number.isNaN(Date.parse(lm)) ? new Date(lm).toISOString() : undefined;
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

  const routes = [...STATIC_ROUTES.filter((r) => r.path === '/'), shopRoute(products),
    ...STATIC_ROUTES.filter((r) => r.path !== '/'), ...products.map(productRoute)];

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
    ['User-agent: *', 'Allow: /', 'Disallow: /checkout', 'Disallow: /login', 'Disallow: /dashboard',
      'Disallow: /order-confirmation', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n')
  );

  // Dynamic ids that cannot be prerendered. Pages serves a real static file first, so
  // prerendered products win and only products added after this build hit the noindex shell.
  await writeFile(
    path.join(DIST, '_redirects'),
    ['/order-confirmation/*  /order-confirmation/index.html  200', '/product/*  /product/index.html  200', ''].join('\n')
  );

  const indexable = routes.filter((r) => r.inSitemap).length;
  console.log(`prerender: ${routes.length} pages written (${products.length} products), ${indexable} URLs in sitemap.xml, 404.html, robots.txt, _redirects`);
}

main().catch((err) => {
  console.error('prerender failed:', err);
  process.exit(1);
});
