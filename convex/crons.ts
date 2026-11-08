// @ts-nocheck
// Convex type instantiation depth issues

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "prune analytics events",
  { hourUTC: 2, minuteUTC: 0 },
  internal.analytics.events.pruneOldEvents
);

// @convex-dev/auth only deletes refresh tokens, sessions and OAuth verifiers
// lazily, so abandoned sign-ins leak rows. Sweep them once a day.
crons.daily(
  "prune expired auth records",
  { hourUTC: 2, minuteUTC: 30 },
  internal.authCleanup.pruneAuth
);

crons.hourly(
  "expire unpaid orders",
  { minuteUTC: 15 },
  internal.orders.expireStalePendingOrders
);

export default crons;
