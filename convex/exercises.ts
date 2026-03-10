import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Warsaw timezone helper
function warsawToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

const QUICK_TYPES = new Set(["srs"]);
const STANDARD_TYPES = new Set([
  "cloze",
  "word_builder",
  "pattern_drill",
  "speed_translation",
  "error_hunt",
]);
const DEEP_TYPES = new Set(["conversation", "reflection"]);

function summarizeInventory(exercises: Array<{ type: string; completed: boolean; source?: string }>) {
  let quickReady = 0;
  let standardReady = 0;
  let deepReady = 0;
  let recoveryReady = 0;
  let quickTotal = 0;
  let standardTotal = 0;
  let deepTotal = 0;

  for (const ex of exercises) {
    if (ex.source === "recovery" && !ex.completed) recoveryReady++;
    if (QUICK_TYPES.has(ex.type)) {
      quickTotal++;
      if (!ex.completed) quickReady++;
      continue;
    }
    if (STANDARD_TYPES.has(ex.type)) {
      standardTotal++;
      if (!ex.completed) standardReady++;
      continue;
    }
    if (DEEP_TYPES.has(ex.type)) {
      deepTotal++;
      if (!ex.completed) deepReady++;
    }
  }

  const totalReady = quickReady + standardReady + deepReady;
  const totalExisting = quickTotal + standardTotal + deepTotal;
  const status =
    totalReady > 0
      ? "ready"
      : recoveryReady > 0
        ? "recovery_only"
        : totalExisting > 0
          ? "replay_only"
          : "empty";

  return {
    status,
    counts: {
      quickReady,
      standardReady,
      deepReady,
      recoveryReady,
      totalReady,
      quickTotal,
      standardTotal,
      deepTotal,
      totalExisting,
    },
  };
}

// Get all exercises for a date (app filters by mode→type mapping client-side)
export const getByDate = query({
  args: { date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const date = args.date ?? warsawToday();
    return await ctx.db
      .query("exercises")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();
  },
});

// Get exercise summary per date in a range (for calendar view)
export const getDateSummaries = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_date", (q) => q.gte("date", args.from).lte("date", args.to))
      .collect();

    // Group by date
    const byDate: Record<string, { total: number; completed: number; types: Set<string> }> = {};
    for (const ex of exercises) {
      if (!byDate[ex.date]) byDate[ex.date] = { total: 0, completed: 0, types: new Set() };
      byDate[ex.date].total++;
      byDate[ex.date].types.add(ex.type);
      if (ex.completed) byDate[ex.date].completed++;
    }

    return Object.entries(byDate).map(([date, info]) => ({
      date,
      total: info.total,
      completed: info.completed,
      types: Array.from(info.types),
    }));
  },
});

// Get inventory readiness for continuous mission learning.
export const getInventoryStatus = query({
  args: {
    date: v.optional(v.string()),
    missionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = args.date ?? warsawToday();
    let exercises = await ctx.db
      .query("exercises")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();

    if (args.missionId) {
      exercises = exercises.filter((ex) => ex.missionId === args.missionId);
    }

    const summary = summarizeInventory(exercises);

    return {
      date,
      missionId: args.missionId ?? null,
      status: summary.status,
      counts: summary.counts,
    };
  },
});

export const getByMission = query({
  args: { missionId: v.string() },
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_mission_tier", (q) => q.eq("missionId", args.missionId))
      .collect();

    return exercises.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.order - b.order;
    });
  },
});

export const getMissionInventoryStatus = query({
  args: { missionId: v.string() },
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_mission_tier", (q) => q.eq("missionId", args.missionId))
      .collect();

    const summary = summarizeInventory(exercises);

    return {
      missionId: args.missionId,
      status: summary.status,
      counts: summary.counts,
    };
  },
});

// Get random exercises for practice (pulls from existing exercise inventory)
// Prioritizes uncompleted, then completed for replay
export const getForPractice = query({
  args: {
    limit: v.optional(v.number()),
    types: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const allowedTypes = args.types ? new Set(args.types) : null;

    // Get recent exercises (last 200)
    const all = await ctx.db
      .query("exercises")
      .withIndex("by_date")
      .order("desc")
      .take(200);

    // Filter by type if specified, exclude conversation/reflection (interactive)
    const skip = new Set(["conversation", "reflection", "srs"]);
    const filtered = all.filter(
      (ex) => !skip.has(ex.type) && (!allowedTypes || allowedTypes.has(ex.type)),
    );

    // Prioritize uncompleted, then shuffle completed for replay
    const uncompleted = filtered.filter((ex) => !ex.completed);
    const completed = filtered.filter((ex) => ex.completed);

    // Simple shuffle using random sort
    const shuffleArray = <T>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const pool = [...shuffleArray(uncompleted), ...shuffleArray(completed)];
    return pool.slice(0, limit);
  },
});

// Mark an exercise as completed with result
export const markComplete = mutation({
  args: {
    exerciseId: v.id("exercises"),
    result: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) throw new Error("Exercise not found");
    await ctx.db.patch(args.exerciseId, {
      completed: true,
      result: args.result,
    });
  },
});

// Bulk create exercises (for Marco content ingestion)
// Deduplicates by (date, type, order) — skips if already exists
export const bulkCreate = mutation({
  args: {
    exercises: v.array(
      v.object({
        date: v.string(),
        type: v.string(),
        order: v.number(),
        content: v.any(),
        skillId: v.optional(v.string()),
        missionId: v.optional(v.string()),
        checkpointId: v.optional(v.string()),
        tier: v.optional(
          v.union(v.literal("quick"), v.literal("standard"), v.literal("deep"))
        ),
        generationReason: v.optional(v.string()),
        variantKey: v.optional(v.string()),
        staleAfter: v.optional(v.string()),
        difficulty: v.optional(v.string()),
        source: v.optional(
          v.union(
            v.literal("seed"),
            v.literal("mission_topup"),
            v.literal("recovery"),
            v.literal("ad_hoc"),
            v.literal("conversation_variant")
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;

    for (const exercise of args.exercises) {
      // Check for existing exercise with same date + type + order
      const existing = await ctx.db
        .query("exercises")
        .withIndex("by_date_type", (q) =>
          q.eq("date", exercise.date).eq("type", exercise.type)
        )
        .filter((q) => q.eq(q.field("order"), exercise.order))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("exercises", {
        ...exercise,
        completed: false,
      });
      inserted++;
    }

    return { inserted, skipped };
  },
});
