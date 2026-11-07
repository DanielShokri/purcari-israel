import { internalMutation } from "./_generated/server";

export const migrateTimestamps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("analyticsEvents").collect();
    let updated = 0;
    for (const event of events) {
      if (typeof event.timestamp === "string") {
        await ctx.db.patch(event._id, {
          timestamp: Number(event.timestamp),
        });
        updated++;
      }
    }
    return { updated };
  },
});
