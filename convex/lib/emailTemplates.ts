/** Hebrew email templates. All data is passed in; every value is HTML-escaped. */

// Storefront palette (apps/storefront/index.css): primary #1a1a1a, secondary #8c2438, accent #d4af37.
const INK = "#1a1a1a";
const BRAND = "#8c2438";
const GOLD = "#d4af37";
const SOCIAL = [
  { name: "Facebook", href: "https://www.facebook.com/purcariwines/", icon: "facebook.png" },
  { name: "Instagram", href: "https://www.instagram.com/purcari_israel/", icon: "instagram.png" },
];
const FONT = "'Noto Sans Hebrew','Heebo',Arial,Helvetica,sans-serif";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const money = (n: number): string => `₪${Number(n).toLocaleString("he-IL", { maximumFractionDigits: 2 })}`;

export type OrderConfirmationData = {
  orderNumber: number | string;
  customerName: string;
  items: { productName: string; variant?: string; quantity: number; price: number; total: number; image?: string }[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  shipping: { street: string; apartment?: string; city: string; postalCode?: string };
  receiptUrl?: string;
  /** Public base URL that serves /email/logo.png and the social icons (the storefront). */
  assetsUrl: string;
};

export function testEmail(): { subject: string; html: string; text: string } {
  return {
    subject: "Purcari Unosend test",
    html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2 style="color:${BRAND};margin:0">Purcari</h2><p>זהו מייל בדיקה ממערכת השליחה של Purcari.</p></div>`,
    text: "זהו מייל בדיקה ממערכת השליחה של Purcari.",
  };
}

export function orderConfirmationEmail(d: OrderConfirmationData): { subject: string; html: string; text: string } {
  const subject = `אישור הזמנה #${d.orderNumber} - Purcari`;
  const base = d.assetsUrl.replace(/\/$/, "");
  const address = [d.shipping.street, d.shipping.apartment && `דירה ${d.shipping.apartment}`, d.shipping.city, d.shipping.postalCode]
    .filter(Boolean)
    .join(", ");

  const rows = d.items
    .map((i) => {
      const img = i.image
        ? `<img src="${esc(i.image)}" alt="${esc(i.productName)}" width="96" height="96" style="display:block;width:96px;height:96px;object-fit:contain;border:0;color:#999;font-size:11px">`
        : "";
      const meta = (label: string, value: string) =>
        `<tr><td align="right" style="padding:2px 0;font-size:14px;color:#777;width:56px;text-align:right">${label}</td><td align="right" style="padding:2px 0;font-size:14px;color:${INK};text-align:right">${value}</td></tr>`;
      return `<tr>
<td width="96" valign="top" align="right" style="padding:16px 0;border-bottom:1px solid #eeeae6;width:96px"><div style="width:96px;height:96px;background:#f4f1ee;border-radius:4px">${img}</div></td>
<td valign="top" align="right" style="padding:16px 16px 16px 0;border-bottom:1px solid #eeeae6;text-align:right">
<div style="font-size:16px;font-weight:bold;color:${INK};line-height:1.4;margin-bottom:6px">${esc(i.productName)}</div>
<table role="presentation" dir="rtl" cellspacing="0" cellpadding="0" style="direction:rtl">
${i.variant ? meta("נפח", esc(i.variant)) : ""}${meta("כמות", esc(i.quantity))}${meta("מחיר", `<span dir="ltr">${money(i.total)}</span>`)}
</table></td></tr>`;
    })
    .join("");

  const strongCss = `font-weight:bold;color:${BRAND};border-top:2px solid ${GOLD};padding-top:10px;`;
  const line = (label: string, value: string, strong = false) =>
    `<tr><td align="right" style="padding:5px 0;font-size:${strong ? 17 : 15}px;${strong ? strongCss : "color:#444;"}text-align:right">${label}</td>` +
    `<td align="left" dir="ltr" style="padding:5px 0;font-size:${strong ? 17 : 15}px;${strong ? strongCss : "color:#444;"}text-align:left;white-space:nowrap">${value}</td></tr>`;

  const logo = `<img src="${esc(base)}/email/logo.png" alt="PURCARI" width="150" height="79" style="display:block;margin:0 auto;width:150px;height:auto;border:0;color:#ffffff;font-size:26px;letter-spacing:4px">`;

  const social = SOCIAL.map(
    (x) =>
      `<a href="${esc(x.href)}" style="display:inline-block;margin:0 5px;text-decoration:none"><img src="${esc(base)}/email/${x.icon}" alt="${x.name}" width="40" height="40" style="display:block;width:40px;height:40px;border:0;color:#ffffff;font-size:12px"></a>`
  ).join("");

  const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body dir="rtl" style="margin:0;padding:0;background:#f4f1ee;font-family:${FONT};color:${INK};direction:rtl;text-align:right">
<table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ee;direction:rtl"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" dir="rtl" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;direction:rtl;border-radius:6px;overflow:hidden">
<tr><td align="center" bgcolor="${INK}" style="background:${INK};padding:28px 24px;border-bottom:4px solid ${BRAND}">${logo}</td></tr>
<tr><td style="padding:32px 28px 8px;text-align:right">
<h1 style="margin:0 0 8px;font-size:24px;color:${BRAND}">תודה על ההזמנה, ${esc(d.customerName)}!</h1>
<p style="margin:0;font-size:16px;line-height:1.6;color:#444">התשלום התקבל, והזמנה מספר <strong style="color:${INK}">#${esc(d.orderNumber)}</strong> בטיפול.</p>
</td></tr>
<tr><td style="padding:20px 28px 0;text-align:right">
<h2 style="margin:0 0 4px;font-size:20px;color:${INK}">סיכום הזמנה</h2>
<table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;direction:rtl">
${rows}
</table>
<table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;direction:rtl">
${line("סכום ביניים", money(d.subtotal))}
${d.discount ? line("הנחה", `-${money(d.discount)}`) : ""}
${line("משלוח", d.shippingCost ? money(d.shippingCost) : "חינם")}
${line("סה״כ לתשלום", money(d.total), true)}
</table>
</td></tr>
<tr><td style="padding:24px 28px 0;text-align:right">
<h3 style="margin:0 0 6px;font-size:16px;color:${BRAND}">כתובת למשלוח</h3>
<p style="margin:0;font-size:15px;line-height:1.6;color:#444">${esc(d.customerName)}<br>${esc(address)}</p>
</td></tr>
${d.receiptUrl ? `<tr><td align="right" style="padding:24px 28px 0"><a href="${esc(d.receiptUrl)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:15px;font-weight:bold">צפייה בקבלה</a></td></tr>` : ""}
<tr><td style="height:32px;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td align="center" bgcolor="${INK}" style="background:${INK};padding:28px 24px;border-top:4px solid ${BRAND};text-align:center">
<div style="font-size:16px;font-weight:bold;color:${GOLD};margin-bottom:14px">עקבו אחרינו</div>
<div style="font-size:0">${social}</div>
<div style="margin-top:20px;font-size:12px;line-height:1.7;color:#a3a3a3">אזהרה: צריכה מופרזת של אלכוהול מסכנת חיים ומזיקה לבריאות.<br>&copy; ${new Date().getFullYear()} Purcari Israel. כל הזכויות שמורות.</div>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    `תודה על ההזמנה, ${d.customerName}!`,
    `התשלום התקבל, והזמנה מספר #${d.orderNumber} בטיפול.`,
    "",
    ...d.items.map((i) => `- ${i.productName}${i.variant ? ` (${i.variant})` : ""} x${i.quantity} - ${money(i.total)}`),
    "",
    `סכום ביניים: ${money(d.subtotal)}`,
    ...(d.discount ? [`הנחה: -${money(d.discount)}`] : []),
    `משלוח: ${d.shippingCost ? money(d.shippingCost) : "חינם"}`,
    `סה״כ לתשלום: ${money(d.total)}`,
    "",
    `כתובת למשלוח: ${address}`,
    ...(d.receiptUrl ? ["", `קבלה: ${d.receiptUrl}`] : []),
    "",
    ...SOCIAL.map((x) => `${x.name}: ${x.href}`),
  ].join("\n");

  return { subject, html, text };
}
