import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

const PER_EMAIL_PER_HOUR = 3;
const GLOBAL_PER_HOUR = 30;

/** Public contact form. Stores the message, then emails it to the shop. Rate limited since it is unauthenticated. */
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const subject = args.subject.replace(/[\r\n]+/g, " ").trim();
    const message = args.message.trim();

    if (name.length < 2 || name.length > 100) throw new ConvexError("שם לא תקין");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw new ConvexError("כתובת אימייל לא תקינה");
    if (subject.length < 2 || subject.length > 150) throw new ConvexError("נושא הפנייה לא תקין");
    if (message.length < 10 || message.length > 5000) throw new ConvexError("ההודעה חייבת להכיל בין 10 ל-5000 תווים");

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await ctx.db
      .query("contactMessages")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", since))
      .collect();
    if (recent.length >= GLOBAL_PER_HOUR || recent.filter((m) => m.email === email).length >= PER_EMAIL_PER_HOUR) {
      throw new ConvexError("נשלחו יותר מדי פניות. נסו שוב מאוחר יותר.");
    }

    await ctx.db.insert("contactMessages", { name, email, subject, message, createdAt: new Date().toISOString() });
    await ctx.scheduler.runAfter(0, internal.email.sendContactNotification, { name, email, subject, message });
  },
});
