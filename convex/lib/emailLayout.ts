/**
 * Shared look for every Purcari email: dark header with the logo, a content area, and a
 * dark footer with social links. Tables + inline styles only (email clients ignore the rest),
 * RTL throughout. Templates pass `rows` (<tr> elements) to `emailLayout`.
 */

// Storefront palette (apps/storefront/index.css): primary #1a1a1a, secondary #8c2438, accent #d4af37.
export const INK = "#1a1a1a";
export const BRAND = "#8c2438";
export const GOLD = "#d4af37";
export const FONT = "'Noto Sans Hebrew','Heebo',Arial,Helvetica,sans-serif";

export const SOCIAL = [
  { name: "Facebook", href: "https://www.facebook.com/purcariwines/", icon: "facebook.png" },
  { name: "Instagram", href: "https://www.instagram.com/purcari_israel/", icon: "instagram.png" },
];

export const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const money = (n: number): string => `₪${Number(n).toLocaleString("he-IL", { maximumFractionDigits: 2 })}`;

/** Public base URL serving /email/logo.png and the social icons. Dev sets EMAIL_ASSETS_URL (localhost is unreachable for mail clients). */
export function getAssetsUrl(): string {
  return (process.env.EMAIL_ASSETS_URL || process.env.STOREFRONT_URL || "https://purcari-storefront.pages.dev").replace(/\/$/, "");
}

/** Plain-text version of the social footer, appended to every text body. */
export const socialText = (): string => SOCIAL.map((x) => `${x.name}: ${x.href}`).join("\n");

// Content building blocks (each returns a <tr> row for `emailLayout`).

export const headingRow = (title: string, intro?: string): string =>
  `<tr><td style="padding:32px 28px 8px;text-align:right"><h1 style="margin:0 0 8px;font-size:24px;color:${BRAND}">${title}</h1>${
    intro ? `<p style="margin:0;font-size:16px;line-height:1.6;color:#444">${intro}</p>` : ""
  }</td></tr>`;

export const sectionRow = (title: string, bodyHtml: string): string =>
  `<tr><td style="padding:24px 28px 0;text-align:right"><h3 style="margin:0 0 6px;font-size:16px;color:${BRAND}">${esc(title)}</h3><div style="font-size:15px;line-height:1.6;color:#444">${bodyHtml}</div></td></tr>`;

export const paragraphRow = (html: string): string =>
  `<tr><td style="padding:16px 28px 0;text-align:right;font-size:15px;line-height:1.7;color:#444">${html}</td></tr>`;

export const buttonRow = (href: string, label: string): string =>
  `<tr><td align="right" style="padding:24px 28px 0"><a href="${esc(href)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:15px;font-weight:bold">${esc(label)}</a></td></tr>`;

export const codeRow = (code: string): string =>
  `<tr><td align="center" style="padding:24px 28px 0"><div dir="ltr" style="display:inline-block;background:#f4f1ee;border:2px solid ${GOLD};border-radius:6px;padding:14px 28px;font-size:30px;font-weight:bold;letter-spacing:8px;color:${INK}">${esc(code)}</div></td></tr>`;

export function emailLayout(opts: { title: string; rows: string; assetsUrl?: string }): string {
  const base = (opts.assetsUrl ?? getAssetsUrl()).replace(/\/$/, "");

  const logo = `<img src="${esc(base)}/email/logo.png" alt="PURCARI" width="150" height="79" style="display:block;margin:0 auto;width:150px;height:auto;border:0;color:#ffffff;font-size:26px;letter-spacing:4px">`;

  const social = SOCIAL.map(
    (x) =>
      `<a href="${esc(x.href)}" style="display:inline-block;margin:0 5px;text-decoration:none"><img src="${esc(base)}/email/${x.icon}" alt="${x.name}" width="40" height="40" style="display:block;width:40px;height:40px;border:0;color:#ffffff;font-size:12px"></a>`
  ).join("");

  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body dir="rtl" style="margin:0;padding:0;background:#f4f1ee;font-family:${FONT};color:${INK};direction:rtl;text-align:right">
<table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ee;direction:rtl"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" dir="rtl" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;direction:rtl;border-radius:6px;overflow:hidden">
<tr><td align="center" bgcolor="${INK}" style="background:${INK};padding:28px 24px;border-bottom:4px solid ${BRAND}">${logo}</td></tr>
${opts.rows}
<tr><td style="height:32px;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td align="center" bgcolor="${INK}" style="background:${INK};padding:28px 24px;border-top:4px solid ${BRAND};text-align:center">
<div style="font-size:16px;font-weight:bold;color:${GOLD};margin-bottom:14px">עקבו אחרינו</div>
<div style="font-size:0">${social}</div>
<div style="margin-top:20px;font-size:12px;line-height:1.7;color:#a3a3a3">אזהרה: צריכה מופרזת של אלכוהול מסכנת חיים ומזיקה לבריאות.<br>&copy; ${new Date().getFullYear()} Purcari Israel. כל הזכויות שמורות.</div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
