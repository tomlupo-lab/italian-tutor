import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all milestones (for progress dashboard)
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("milestones").collect();
  },
});

// Get milestones by level
export const getByLevel = query({
  args: { level: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("milestones")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .collect();
  },
});

// Bulk upsert milestones (for nightly sync from quark.db)
// Updates existing by skillId, inserts new ones
export const bulkUpsert = mutation({
  args: {
    milestones: v.array(
      v.object({
        skillId: v.string(),
        name: v.string(),
        level: v.string(),
        category: v.string(),
        rating: v.number(),
        lastAssessed: v.optional(v.string()),
        active: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let updated = 0;
    let inserted = 0;

    for (const milestone of args.milestones) {
      const existing = await ctx.db
        .query("milestones")
        .withIndex("by_skill", (q) => q.eq("skillId", milestone.skillId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...milestone,
          updatedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert("milestones", {
          ...milestone,
          updatedAt: now,
        });
        inserted++;
      }
    }

    return { updated, inserted };
  },
});
