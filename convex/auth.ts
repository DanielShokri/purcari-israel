import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { DataModel } from "./_generated/dataModel";



const emailSchema = z.string().min(1, "אימייל הוא שדה חובה").email("כתובת אימייל לא תקינה");

const passwordSchema = z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים");

// Full name: at least 3 chars + space + at least 3 chars (e.g., "John Doe", "ישראל ישראלי")
const fullNameRegex = /^\S{3,}\s+\S{3,}$/;
const nameSchema = z.string()
  .min(7, "השם המלא חייב להכיל שם פרטי ושם משפחה")
  .regex(fullNameRegex, "השם המלא חייב להכיל שם פרטי (לפחות 3 תווים), רווח ושם משפחה (לפחות 3 תווים)");

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password<DataModel>({
      validatePasswordRequirements: (password: string) => {
        const result = passwordSchema.safeParse(password);
        if (!result.success) {
          throw new ConvexError(result.error.message);
        }
      },
      profile(params) {
        const email = params.email as string;
        const name = (params.name as string) || "";
        const phone = (params.phone as string) || "";

        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          throw new ConvexError("כתובת אימייל לא תקינה");
        }

        if (name && name.length > 0) {
          const nameResult = nameSchema.safeParse(name);
          if (!nameResult.success) {
            throw new ConvexError(nameResult.error.message);
          }
        }

        return {
          email: emailResult.data,
          name: name || email.split("@")[0],
          phone: phone || undefined,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const now = new Date().toISOString();
      return await ctx.db.insert("users", {
        ...args.profile,
        role: "viewer",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    },
  },
});
