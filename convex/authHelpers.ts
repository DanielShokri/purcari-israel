import { query, mutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import { type Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

type AuthCtx = QueryCtx | MutationCtx;
type User = Doc<"users">;

/** Return the signed-in user, or throw when the session/user is absent. */
export const requireUser = async (ctx: AuthCtx): Promise<User> => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("דורש התחברות");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError("המשתמש לא נמצא");
  }
  return user;
};

/** Return a signed-in, active user. Suspended and inactive accounts cannot act. */
export const requireActiveUser = async (ctx: AuthCtx): Promise<User> => {
  const user = await requireUser(ctx);
  if (user.status !== "active") {
    throw new ConvexError("החשבון אינו פעיל");
  }
  return user;
};

/** Return an active administrator, or throw when the caller is not one. */
export const requireAdmin = async (ctx: AuthCtx): Promise<User> => {
  const user = await requireActiveUser(ctx);
  if (user.role !== "admin") {
    throw new ConvexError("גישה נדחתה - דרושות הרשאות מנהל");
  }
  return user;
};

/** Check the current session without exposing inactive or non-admin users. */
export const getCurrentAdmin = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await requireAdmin(ctx);
    } catch {
      return null;
    }
  },
});

/** Define an admin-only mutation with a typed Convex context. */
export function adminMutation<Args extends Record<string, any>, Return>(config: {
  args: { [K in keyof Args]: any };
  returns?: any;
  handler: (ctx: any, args: Args) => Promise<Return>;
}) {
  return mutation({
    args: config.args as any,
    ...(config.returns ? { returns: config.returns } : {}),
    handler: async (ctx, args) => {
      await requireAdmin(ctx);
      return config.handler(ctx, args as Args);
    },
  } as any);
}

/** Define an admin-only query with a typed Convex context. */
export function adminQuery<Args extends Record<string, any>, Return>(config: {
  args: { [K in keyof Args]: any };
  handler: (ctx: any, args: Args) => Promise<Return>;
}) {
  return query({
    args: config.args as any,
    handler: async (ctx, args) => {
      await requireAdmin(ctx);
      return config.handler(ctx, args as Args);
    },
  } as any);
}
