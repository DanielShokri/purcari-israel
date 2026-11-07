# Auth audit & fix plan (Convex Auth + admin/regular user)

## Context
Audit of `convex/auth.ts`, `authHelpers.ts`, `users.ts`, orders/payments, and admin/storefront auth hooks.
Cross-checked with Convex Auth docs (labs.convex.dev/auth/authz: `getAuthUserId` is the supported backend API; users/authSessions tables; custom fields via schema).
Installed `@convex-dev/auth` 0.0.96 = latest on npm.

## Findings (by severity)

### High (security)
1. **`orders.listByCustomer`** (convex/orders.ts) – unauthenticated query by arbitrary email → anyone can read any customer's orders (PII, address, phone). Fix: derive identity from `getAuthUserId`, ignore/verify email.
2. **`orders.getPublic`** – returns full order (incl. address/payment) to anyone with an ID. Document says ID is a capability, but Convex IDs are guessable-ish/leak via URLs; restrict fields or require owner/admin (guest checkout needs a token).
3. **`orders.create`** – no auth; trusts client `customerId`, `total`, `discount`, item `price`. Fix: take customerId from `getAuthUserId`, recompute prices/totals server-side from products + coupon/cart rules.
4. **`icreditHelpers.getPaymentByOrderId`**, **`orderItems.listByOrder`** – public queries exposing payment transactions / order items by ID. Fix: owner-or-admin check (or make internal).
5. **`icredit.createPaymentPage`** (action) – no auth; anyone can trigger payment page for any order. Fix: owner check via `ctx.auth` + internal query.
6. **iCredit IPN endpoints** (`http.ts`) – GET fallback accepted, token verification only `if ipnToken && stored` (skipped when absent → forged IPN could pass if attacker knows ids). Make token/signature mandatory; drop GET or require same check; stop logging full bodies.
7. **Role escalation guards missing** in `users.update/updateRole/updateStatus/remove`: admin can demote/delete self or last admin → lockout; `update` also allows changing email (can hijack/duplicate account linking). Add self/last-admin guards; drop email edit or sync authAccounts.
8. **`users.remove`** does not delete `authAccounts`/`authSessions` for the user (orphans; deleted user keeps valid refresh sessions → `getAuthUserId` returns dangling id). Delete them (and sessions' refresh tokens/verification codes).

### Medium
9. **`requireAdmin` ignores `status`** – suspended/inactive admins & users keep access; also `getAuthUserId` callers (cart, profile, notifications) never check `status`. Add `requireActiveUser`.
10. **`editor` role** exists in schema but is never honoured anywhere (only `admin`). Decide: remove or implement `requireRole`.
11. **`requireAdmin(ctx: any)` / `adminQuery` use `any`** – violates repo strict-typing rule; type with `QueryCtx|MutationCtx`, return `Doc<"users">`; `getCurrentAdmin` unused by admin app (uses `users.get`).
12. **Admin client `useAdminAuth`**: `isAuthenticated = currentUser !== null` is `true` while query is `undefined` (loading) → flash/false auth state. Use `useConvexAuth()` + `currentUser === undefined` loading handling. Also `users.get` returns full user doc incl. cart to client – fine for self, but strip internals.
13. **`createOrUpdateUserProfile`/`updateProfile`** – no validation (phone format, name regex used only at sign-up; `updateProfile` spreads `args` incl. undefined). Validate server-side.
14. **Sign-up flow is two-step & non-atomic** (`signIn` then `createUserProfile`): phone lost if second call fails. Pass `phone` in signIn params (already read in `profile()`).
15. **Weak password policy**: min 4 chars (auth.ts). Raise to ≥8; no email verification configured for Password (accounts unverified; docs recommend verify for linking safety). Consider rate limiting.
16. **`createOrUpdateUser` callback**: `existingUserId` path skips updating profile (Google name/image never refreshed) and no email-collision handling for `users.create` admin-created users (admin-created users have no authAccount → can't sign in; Google sign-in with same email will create a duplicate rather than link, or link silently depending on verified email). Test and handle.

### Low
17. `auth.config.ts`: `domain: process.env.CONVEX_SITE_URL` – OK per docs; verify env set on prod deployment.
18. `users.listAll` cursor is returned but never consumed (no pagination); `address` arg in `users.update` is not in schema → patches nonexistent field (runtime error).
19. `migrateAnalytics`, `seed` are internal – OK. `.env.local` holds JWT_PRIVATE_KEY; confirm it's gitignored.
20. Notifications/cart/userAddresses: ownership checks present (OK; to re-verify addresses/notifications `markAsRead` ownership).

### Verified OK
All `products/categories/coupons/cartRules/systemAnnouncements/activities/admin` mutations & admin queries use `adminMutation/adminQuery`. Cart functions use `getAuthUserId`.

## Approach
Tight, backwards-compatible hardening in `convex/` first (highest risk = order/payment data exposure), then client hooks. No schema migration required except optional.

## Files to modify
convex/authHelpers.ts, auth.ts, users.ts, orders.ts, orderItems.ts, icredit.ts, icreditHelpers.ts, http.ts; apps/admin/hooks/useAdminAuth.ts, apps/admin/components/Layout.tsx; apps/storefront/hooks/useAuth.ts, hooks/usePaymentProcessing.ts, pages/DashboardPage.tsx, OrderConfirmationPage.tsx.

## Reuse
`requireAdmin`, `adminQuery/adminMutation` (authHelpers.ts), `getAuthUserId` (@convex-dev/auth/server).

## Steps
- [x] Typed helpers: `requireUser`, `requireActiveUser`, `requireAdmin` (status check, Doc return)
- [x] Lock down orders.listByCustomer/getPublic/create, orderItems.listByOrder, getPaymentByOrderId (owner-or-admin); update storefront callers
- [x] Auth-gate createPaymentPage; harden IPN verification
- [x] users.remove cleans authAccounts/authSessions; guards for self/last-admin; remove email/address from `update`
- [x] Decide `editor` role fate
- [x] Fix admin `isAuthenticated` loading bug; atomic signup with phone; stronger password
- [ ] Profile validation server-side

## Verification
`pnpm type-check`, `pnpm build`; `npx convex dev` typecheck; manual: viewer cannot call admin functions or read others' orders (via `npx convex run` with/without auth); suspended user blocked; admin cannot demote self; Google + password sign-in same email.

## Open questions
Guest checkout supported? (affects order access model); keep `editor` role?

## Decisions (from user)
- Guests allowed → orders get an unguessable `accessToken` (new optional schema field); `getPublic`, payment lookup, `createPaymentPage` accept owner OR admin OR matching token. `listByCustomer` becomes auth-only (own orders via `getAuthUserId`).
- Remove `editor` role: narrow schema union to admin/viewer after confirming no existing `editor` docs (migrate to viewer first), update `users.*` validators and `@shared/types`.
