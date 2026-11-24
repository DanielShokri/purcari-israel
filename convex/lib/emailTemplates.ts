/** Hebrew email templates. All data is passed in; every value is HTML-escaped. */

// Storefront palette (apps/storefront/index.css): primary #1a1a1a, secondary #8c2438, accent #d4af37.
const INK = "#1a1a1a";
const BRAND = "#8c2438";
const GOLD = "#d4af37";
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
  items: { productName: string; variant?: string; quantity: number; price: number; total: number }[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  shipping: { street: string; apartment?: string; city: string; postalCode?: string };
  receiptUrl?: string;
  /** Absolute URL of the logo (light-on-transparent, shown on the dark header band). */
  logoUrl?: string;
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
  const address = [d.shipping.street, d.shipping.apartment && `דירה ${d.shipping.apartment}`, d.shipping.city, d.shipping.postalCode]
    .filter(Boolean)
    .join(", ");

  const cell = "padding:12px 8px;border-bottom:1px solid #eeeae6;font-size:15px;";
  const rows = d.items
    .map(
      (i) =>
        `<tr><td align="right" style="${cell}text-align:right">${esc(i.productName)}${i.variant ? ` <span style="color:#777">(${esc(i.variant)})</span>` : ""}</td>` +
        `<td align="center" style="${cell}text-align:center">${esc(i.quantity)}</td>` +
        `<td align="left" dir="ltr" style="${cell}text-align:left;white-space:nowrap">${money(i.total)}</td></tr>`
    )
    .join("");

  const line = (label: string, value: string, strong = false) =>
    `<tr><td align="right" style="padding:5px 8px;font-size:${strong ? 17 : 15}px;${strong ? `font-weight:bold;color:${BRAND};border-top:2px solid ${GOLD};padding-top:10px;` : "color:#444;"}text-align:right">${label}</td>` +
    `<td align="left" dir="ltr" style="padding:5px 8px;font-size:${strong ? 17 : 15}px;${strong ? `font-weight:bold;color:${BRAND};border-top:2px solid ${GOLD};padding-top:10px;` : "color:#444;"}text-align:left;white-space:nowrap">${value}</td></tr>`;

  const logo = d.logoUrl
    ? `<img src="${esc(d.logoUrl)}" alt="Purcari" width="150" style="display:block;margin:0 auto;width:150px;height:auto;border:0">`
    : `<span style="color:#fff;font-size:26px;letter-spacing:4px">PURCARI</span>`;

  const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body dir="rtl" style="margin:0;padding:0;background:#f4f1ee;font-family:${FONT};color:${INK};direction:rtl;text-align:right">
<table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ee;direction:rtl"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" dir="rtl" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;direction:rtl;border-radius:6px;overflow:hidden">
<tr><td align="center" style="background:${INK};padding:28px 24px;border-bottom:4px solid ${BRAND}">${logo}</td></tr>
<tr><td style="padding:32px 28px 8px;text-align:right">
<h1 style="margin:0 0 8px;font-size:24px;color:${BRAND}">תודה על ההזמנה, ${esc(d.customerName)}!</h1>
<p style="margin:0;font-size:16px;line-height:1.6;color:#444">התשלום התקבל, והזמנה מספר <strong style="color:${INK}">#${esc(d.orderNumber)}</strong> בטיפול.</p>
</td></tr>
<tr><td style="padding:20px 28px 0">
<table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;direction:rtl">
<tr style="background:#f4f1ee"><th align="right" style="padding:10px 8px;font-size:13px;color:#666;text-align:right">מוצר</th><th align="center" style="padding:10px 8px;font-size:13px;color:#666">כמות</th><th align="left" style="padding:10px 8px;font-size:13px;color:#666;text-align:left">סה״כ</th></tr>
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
<tr><td style="padding:32px 28px 28px;text-align:right"><div style="border-top:1px solid #eeeae6;padding-top:16px;font-size:13px;line-height:1.6;color:#777">שאלות? השיבו למייל זה או כתבו לנו ל-<a href="mailto:hello@purcari.co.il" style="color:${BRAND}">hello@purcari.co.il</a></div></td></tr>
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
    "שאלות? hello@purcari.co.il",
  ].join("\n");

  return { subject, html, text };
}
