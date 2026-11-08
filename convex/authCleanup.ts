import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * @convex-dev/auth only cleans up lazily, so abandoned sign-ins leak rows.
 * This batched mutation sweeps the auth tables; a daily cron repeats it until done.
 */

// An OAuth verifier lives ~2 minutes (OAUTH_SIGN_IN_EXPIRATION_MS). Anything
// older than this window was abandoned mid-flow.
const VERIFIER_MAX_AGE_MS = 1000 * 60 * 15;

export const pruneAuth = internalMutation({
  args: { batchSize: v.optional(v.number()) },
  returns: v.object({
    refreshTokens: v.number(),
    verificationCodes: v.number(),
    sessions: v.number(),
    verifiers: v.number(),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 200;
    const now = Date.now();

    // 1. Expired refresh tokens (one per token refresh - the fastest growing table)
    let refreshTokens = 0;
    const tokens = await ctx.db.query("authRefreshTokens").take(batchSize);
    for (const token of tokens) {
      if (token.expirationTime < now) {
        await ctx.db.delete(token._id);
        refreshTokens++;
      }
    }

    // 2. Expired verification codes (OAuth exchange codes, OTP, magic links)
    let verificationCodes = 0;
    const codes = await ctx.db.query("authVerificationCodes").take(batchSize);
    for (const code of codes) {
      if (code.expirationTime < now) {
        await ctx.db.delete(code._id);
        verificationCodes++;
      }
    }

    // 3. Expired sessions (small table - safe to scan)
    let sessions = 0;
    for (const session of await ctx.db.query("authSessions").collect()) {
      if (session.expirationTime < now) {
        await ctx.db.delete(session._id);
        sessions++;
      }
    }

    // 4. Orphaned OAuth verifiers (user clicked "Continue with Google" and bailed)
    let verifiers = 0;
    const cutoff = now - VERIFIER_MAX_AGE_MS;
    for (const verifier of await ctx.db.query("authVerifiers").collect()) {
      if (verifier._creationTime < cutoff) {
        await ctx.db.delete(verifier._id);
        verifiers++;
      }
    }

    return {
      refreshTokens,
      verificationCodes,
      sessions,
      verifiers,
    };
  },
});
