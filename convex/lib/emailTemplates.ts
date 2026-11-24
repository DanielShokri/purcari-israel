/** Hebrew email templates. All data is passed in; every value is HTML-escaped. Layout lives in emailLayout.ts. */
import {
  BRAND,
  GOLD,
  INK,
  buttonRow,
  codeRow,
  emailLayout,
  esc,
  headingRow,
  money,
  paragraphRow,
  sectionRow,
  socialText,
} from "./emailLayout";

type Email = { subject: string; html: string; text: string };

export type OrderEmailData = {
  orderNumber: number | string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: { productName: string; variant?: string; quantity: number; price: number; total: number; image?: string }[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  shipping: { street: string; apartment?: string; city: string; postalCode?: string };
  receiptUrl?: string;
};

const addressOf = (s: OrderEmailData["shipping"]): string =>
  [s.street, s.apartment && `דירה ${s.apartment}`, s.city, s.postalCode].filter(Boolean).join(", ");

const itemsText = (d: OrderEmailData): string[] => [
  ...d.items.map((i) => `- ${i.productName}${i.variant ? ` (${i.variant})` : ""} x${i.quantity} - ${money(i.total)}`),
  "",
  `סכום ביניים: ${money(d.subtotal)}`,
  ...(d.discount ? [`הנחה: -${money(d.discount)}`] : []),
  `משלוח: ${d.shippingCost ? money(d.shippingCost) : "חינם"}`,
  `סה״כ: ${money(d.total)}`,
];

/** "Order summary": product images, quantities, and the totals block. Shared by all order emails. */
function orderSummaryRow(d: OrderEmailData): string {
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

  return `<tr><td style="padding:20px 28px 0;text-align:right">
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
</td></tr>`;
}

export function testEmail(): Email {
  return {
    subject: "Purcari Unosend test",
    html: emailLayout({
      title: "Purcari Unosend test",
      rows: headingRow("מייל בדיקה", "זהו מייל בדיקה ממערכת השליחה של Purcari."),
    }),
    text: "זהו מייל בדיקה ממערכת השליחה של Purcari.",
  };
}

export function orderConfirmationEmail(d: OrderEmailData): Email {
  const subject = `אישור הזמנה #${d.orderNumber} - Purcari`;
  const rows = [
    headingRow(
      `תודה על ההזמנה, ${esc(d.customerName)}!`,
      `התשלום התקבל, והזמנה מספר <strong style="color:${INK}">#${esc(d.orderNumber)}</strong> בטיפול.`
    ),
    orderSummaryRow(d),
    sectionRow("כתובת למשלוח", `${esc(d.customerName)}<br>${esc(addressOf(d.shipping))}`),
    d.receiptUrl ? buttonRow(d.receiptUrl, "צפייה בקבלה") : "",
  ].join("\n");

  const text = [
    `תודה על ההזמנה, ${d.customerName}!`,
    `התשלום התקבל, והזמנה מספר #${d.orderNumber} בטיפול.`,
    "",
    ...itemsText(d),
    "",
    `כתובת למשלוח: ${addressOf(d.shipping)}`,
    ...(d.receiptUrl ? ["", `קבלה: ${d.receiptUrl}`] : []),
    "",
    socialText(),
  ].join("\n");

  return { subject, html: emailLayout({ title: subject, rows }), text };
}

/** Sent when a paid order is cancelled. */
export function orderCancelledEmail(d: OrderEmailData): Email {
  const subject = `ההזמנה #${d.orderNumber} בוטלה - Purcari`;
  const rows = [
    headingRow(
      "ההזמנה בוטלה",
      `שלום ${esc(d.customerName)}, הזמנה מספר <strong style="color:${INK}">#${esc(d.orderNumber)}</strong> בוטלה.`
    ),
    paragraphRow("התשלום שבוצע עבור ההזמנה יוחזר לאמצעי התשלום שבו שילמתם."),
    orderSummaryRow(d),
    paragraphRow("לשאלות על הביטול או ההחזר אפשר לפנות אלינו דרך עמוד צור קשר באתר."),
  ].join("\n");

  const text = [
    `שלום ${d.customerName},`,
    `הזמנה מספר #${d.orderNumber} בוטלה.`,
    "התשלום שבוצע עבור ההזמנה יוחזר לאמצעי התשלום שבו שילמתם.",
    "",
    ...itemsText(d),
    "",
    "לשאלות אפשר לפנות אלינו דרך עמוד צור קשר באתר.",
    "",
    socialText(),
  ].join("\n");

  return { subject, html: emailLayout({ title: subject, rows }), text };
}

/** Internal notification to the shop when a payment is confirmed. */
export function adminNewOrderEmail(d: OrderEmailData): Email {
  const subject = `הזמנה חדשה #${d.orderNumber} - ${money(d.total)}`;
  const contactParts = [d.customerName, d.customerEmail, d.customerPhone].filter(Boolean) as string[];
  const rows = [
    headingRow("התקבלה הזמנה חדשה", `הזמנה <strong style="color:${INK}">#${esc(d.orderNumber)}</strong> שולמה ומחכה לטיפול.`),
    sectionRow("פרטי הלקוח", contactParts.map((x) => esc(x)).join("<br>")),
    sectionRow("כתובת למשלוח", esc(addressOf(d.shipping))),
    orderSummaryRow(d),
  ].join("\n");

  const text = [
    `התקבלה הזמנה חדשה #${d.orderNumber}`,
    "",
    contactParts.join(" | "),
    `כתובת למשלוח: ${addressOf(d.shipping)}`,
    "",
    ...itemsText(d),
  ].join("\n");

  return { subject, html: emailLayout({ title: subject, rows }), text };
}

export function welcomeEmail(d: { name: string; shopUrl: string }): Email {
  const subject = "ברוכים הבאים ל-Purcari";
  const rows = [
    headingRow(`ברוכים הבאים, ${esc(d.name)}!`, "החשבון שלכם נוצר בהצלחה."),
    paragraphRow("עכשיו אפשר לעקוב אחרי ההזמנות, לשמור כתובות למשלוח ולהזמין מהר יותר בפעם הבאה."),
    buttonRow(d.shopUrl, "לחנות"),
  ].join("\n");

  const text = [`ברוכים הבאים, ${d.name}!`, "החשבון שלכם נוצר בהצלחה.", "", `לחנות: ${d.shopUrl}`, "", socialText()].join("\n");
  return { subject, html: emailLayout({ title: subject, rows }), text };
}

export function passwordResetEmail(d: { code: string; minutes: number }): Email {
  const subject = "קוד לאיפוס סיסמה - Purcari";
  const rows = [
    headingRow("איפוס סיסמה", "קיבלנו בקשה לאיפוס הסיסמה בחשבון שלכם. הקוד שלכם:"),
    codeRow(d.code),
    paragraphRow(`הקוד תקף ל-${d.minutes} דקות. אם לא ביקשתם לאפס את הסיסמה, אפשר להתעלם מהמייל.`),
  ].join("\n");

  const text = [
    "איפוס סיסמה",
    `הקוד שלכם: ${d.code}`,
    `הקוד תקף ל-${d.minutes} דקות. אם לא ביקשתם לאפס את הסיסמה, אפשר להתעלם מהמייל.`,
  ].join("\n");
  return { subject, html: emailLayout({ title: subject, rows }), text };
}

/** Internal notification for a message sent through the contact form. */
export function contactNotificationEmail(d: { name: string; email: string; subject: string; message: string }): Email {
  const subject = `פנייה חדשה: ${d.subject}`.replace(/[\r\n]+/g, " ");
  const rows = [
    headingRow("פנייה חדשה מהאתר"),
    sectionRow("שולח", `${esc(d.name)}<br><a href="mailto:${esc(d.email)}" style="color:${BRAND}">${esc(d.email)}</a>`),
    sectionRow("נושא", esc(d.subject)),
    sectionRow("הודעה", esc(d.message).replace(/\r?\n/g, "<br>")),
    paragraphRow("אפשר להשיב ישירות למייל זה, התשובה תגיע ללקוח."),
  ].join("\n");

  const text = ["פנייה חדשה מהאתר", `שולח: ${d.name} <${d.email}>`, `נושא: ${d.subject}`, "", d.message].join("\n");
  return { subject, html: emailLayout({ title: subject, rows }), text };
}
