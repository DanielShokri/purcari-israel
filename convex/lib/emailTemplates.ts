/** Hebrew email templates. All data is passed in; every value is HTML-escaped. */

const BRAND = "#722F37";

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
};

export function testEmail(): { subject: string; html: string; text: string } {
  return {
    subject: "Purcari Unosend test",
    html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2 style="color:${BRAND}">Purcari</h2><p>זהו מייל בדיקה ממערכת השליחה של Purcari.</p></div>`,
    text: "זהו מייל בדיקה ממערכת השליחה של Purcari.",
  };
}

export function orderConfirmationEmail(d: OrderConfirmationData): { subject: string; html: string; text: string } {
  const subject = `אישור הזמנה #${d.orderNumber} - Purcari`;
  const address = [d.shipping.street, d.shipping.apartment && `דירה ${d.shipping.apartment}`, d.shipping.city, d.shipping.postalCode]
    .filter(Boolean)
    .join(", ");

  const rows = d.items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(i.productName)}${i.variant ? ` (${esc(i.variant)})` : ""}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${esc(i.quantity)}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #eee;text-align:left">${money(i.total)}</td></tr>`
    )
    .join("");

  const summary = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 8px;${bold ? "font-weight:bold" : ""}">${label}</td><td style="padding:4px 8px;text-align:left;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;

  const html = `<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#f6f3f1;font-family:Arial,sans-serif;color:#222">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:24px">
<h1 style="color:${BRAND};margin-top:0">תודה על ההזמנה, ${esc(d.customerName)}!</h1>
<p>התשלום התקבל והזמנה מספר <strong>#${esc(d.orderNumber)}</strong> בטיפול.</p>
<table role="presentation" width="100%" cellspacing="0" style="border-collapse:collapse">
<tr style="background:#f6f3f1"><th style="padding:8px;text-align:right">מוצר</th><th style="padding:8px">כמות</th><th style="padding:8px;text-align:left">סה״כ</th></tr>
${rows}
</table>
<table role="presentation" width="100%" cellspacing="0" style="margin-top:12px">
${summary("סכום ביניים", money(d.subtotal))}
${d.discount ? summary("הנחה", `-${money(d.discount)}`) : ""}
${summary("משלוח", d.shippingCost ? money(d.shippingCost) : "חינם")}
${summary("סה״כ לתשלום", money(d.total), true)}
</table>
<h3 style="color:${BRAND}">כתובת למשלוח</h3>
<p>${esc(address)}</p>
${d.receiptUrl ? `<p><a href="${esc(d.receiptUrl)}" style="color:${BRAND}">צפייה בקבלה</a></p>` : ""}
<p style="color:#777;font-size:13px">שאלות? השיבו למייל זה או כתבו אלינו ל-hello@purcari.co.il</p>
</div></body></html>`;

  const text = [
    `תודה על ההזמנה, ${d.customerName}!`,
    `התשלום התקבל והזמנה מספר #${d.orderNumber} בטיפול.`,
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
