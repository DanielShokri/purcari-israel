/**
 * Shared Unosend sender. Server-side only: call from Convex actions, never from the SPAs.
 * The API key is read from the Convex env var UNOSEND_API_KEY.
 */

// Docs (docs.unosend.co) are inconsistent: the API reference uses /emails, the quickstart /v1/emails.
// Default follows the reference; override with UNOSEND_API_URL (e.g. https://api.unosend.co/v1) if the test send 404s.
const UNOSEND_API_URL = process.env.UNOSEND_API_URL ?? "https://api.unosend.co";

export const EMAIL_FROM = "Purcari <hello@purcari.co.il>";
export const EMAIL_REPLY_TO = "hello@purcari.co.il";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Defaults to hello@purcari.co.il. Unosend supports a single reply-to address. */
  replyTo?: string;
};

/** Sends one email through Unosend and returns the Unosend email id. Throws on any failure. */
export async function sendEmail(input: SendEmailInput): Promise<string> {
  const apiKey = process.env.UNOSEND_API_KEY;
  if (!apiKey) {
    throw new Error("UNOSEND_API_KEY is not set in the Convex environment");
  }

  const response = await fetch(`${UNOSEND_API_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo ?? EMAIL_REPLY_TO,
    }),
  });

  const raw = await response.text();
  let body: any = null;
  try {
    body = JSON.parse(raw);
  } catch {
    // non-JSON body handled below
  }

  // Unosend can answer HTTP 200 with a failure in the body, so check `success` too.
  if (!response.ok || !body || body.success === false) {
    const reason = body?.error?.message ?? body?.error ?? body?.message ?? raw.slice(0, 300);
    throw new Error(`Unosend send failed (HTTP ${response.status}): ${typeof reason === "string" ? reason : JSON.stringify(reason)}`);
  }

  const id = body.data?.id ?? body.id;
  if (!id) {
    throw new Error(`Unosend responded without an email id: ${raw.slice(0, 300)}`);
  }
  return String(id);
}
