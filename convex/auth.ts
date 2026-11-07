import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { ConvexError } from "convex/values";
import { z } from "zod";
import type { DataModel } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";



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
      // The callback's ctx is typed as a generic data model, so index names are
      // not known to it. Re-type it to this app's data model for index safety.
      const db = ctx.db as unknown as MutationCtx["db"];
      const now = new Date().toISOString();
      const profile = args.profile;
      const email = typeof profile.email === "string" ? profile.email : undefined;
      const image = typeof profile.image === "string" ? profile.image : undefined;
      const name = typeof profile.name === "string" ? profile.name : undefined;

      // Google verifies the email it returns, so it is safe to link an OAuth
      // sign-in to an existing account with the same email. Password accounts
      // are NOT verified and are never linked automatically.
      const isVerifiedOAuth =
        args.type === "oauth" &&
        args.provider.id === "google" &&
        profile.emailVerified !== false;

      if (args.existingUserId) {
        // Returning Google user: refresh profile fields Google may have updated.
        const existing = await db.get(args.existingUserId);
        if (existing) {
          await db.patch(args.existingUserId, {
            ...(image && image !== existing.image ? { image } : {}),
            ...(!existing.name && name ? { name } : {}),
            ...(isVerifiedOAuth && !existing.emailVerificationTime
              ? { emailVerificationTime: Date.now() }
              : {}),
            updatedAt: now,
          });
        }
        return args.existingUserId;
      }

      // Link Google sign-in to an existing account with the same email instead
      // of creating a duplicate user row.
      if (isVerifiedOAuth && email) {
        const match = await db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first();
        if (match) {
          await db.patch(match._id, {
            ...(image && !match.image ? { image } : {}),
            ...(!match.name && name ? { name } : {}),
            ...(!match.emailVerificationTime ? { emailVerificationTime: Date.now() } : {}),
            updatedAt: now,
          });
          return match._id;
        }
      }

      return await db.insert("users", {
        name: name ?? email?.split("@")[0],
        email,
        image,
        phone: typeof profile.phone === "string" ? profile.phone : undefined,
        emailVerificationTime: isVerifiedOAuth ? Date.now() : undefined,
        role: "viewer",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    },
  },
});
