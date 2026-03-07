import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Warsaw timezone helper
function warsawToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

// Save a completed session (idempotent: rejects duplicate date+mode)
export const save = mutation({
  args: {
    date: v.string(),
    clientSessionId: v.optional(v.string()),
    duration: v.number(),
    type: v.union(
      v.literal("lesson"),
      v.literal("quick_practice"),
      v.literal("free_talk"),
      v.literal("speaking_practice")
    ),
    mode: v.optional(v.string()),
    exercisesCompleted: v.optional(v.number()),
    exercisesTotal: v.optional(v.number()),
    cardsReviewed: v.number(),
    cardsCorrect: v.number(),
    topic: v.optional(v.string()),
    errors: v.array(
      v.object({
        original: v.string(),
        corrected: v.string(),
        explanation: v.optional(v.string()),
        category: v.optional(v.string()),
        skillId: v.optional(v.string()),
      })
    ),
    newPhrases: v.array(v.string()),
    phrasesUsed: v.array(v.string()),
    rating: v.optional(v.number()),
    reflection: v.optional(v.string()),
    reflectionAnswer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Idempotency only by explicit clientSessionId.
    if (args.clientSessionId) {
      const existing = await ctx.db
        .query("sessions")
        .withIndex("by_client_session", (q) => q.eq("clientSessionId", args.clientSessionId))
        .first();
      if (existing) {
        return { status: "duplicate", existingId: existing._id };
      }
    }

    const id = await ctx.db.insert("sessions", args);
    return { status: "created", id };
  },
});

export const attachMissionOutcome = mutation({
  args: {
    sessionId: v.id("sessions"),
    missionId: v.string(),
    checkpointAwardedId: v.optional(v.string()),
    duplicatePenaltyApplied: v.boolean(),
    appliedCredits: v.object({
      bronze: v.number(),
      silver: v.number(),
      gold: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.sessionId);
    if (!existing) return { status: "missing" as const };
    await ctx.db.patch(args.sessionId, {
      missionId: args.missionId,
      checkpointAwardedId: args.checkpointAwardedId,
      duplicatePenaltyApplied: args.duplicatePenaltyApplied,
      appliedCredits: args.appliedCredits,
    });
    return { status: "updated" as const };
  },
});

// Get recent sessions (for stats)
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_date")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

// Get sessions for a date range (for Marco's nightly analysis)
export const getByDateRange = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_date", (q) => q.gte("date", args.from).lte("date", args.to))
      .collect();
  },
});

// Count sessions per mode (for mode completion stats)
export const getModeCounts = query({
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_date")
      .order("desc")
      .take(500);

    const counts: Record<string, number> = { quick: 0, standard: 0, deep: 0 };
    for (const s of sessions) {
      if (s.mode && s.mode in counts) {
        counts[s.mode]++;
      }
    }
    return counts;
  },
});

// Get stats summary (uses indexed queries, Warsaw timezone)
export const getStats = query({
  handler: async (ctx) => {
    const today = warsawToday();

    // Use indexed queries instead of full .collect()
    const recentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_date")
      .order("desc")
      .take(200);

    const totalSessions = recentSessions.length;
    const totalMinutes = Math.round(
      recentSessions.reduce((sum, s) => sum + s.duration, 0) / 60
    );

    const dueCards = await ctx.db
      .query("cards")
      .withIndex("by_next_review", (q) => q.lte("nextReview", today))
      .collect();
    const totalCards = dueCards.length;
    const allCards = await ctx.db.query("cards").collect();
    const masteredCards = allCards.filter(
      (c) => c.interval >= 21 && c.lastQuality && c.lastQuality >= 3
    ).length;

    // Streak calculation
    const allExercises = await ctx.db
      .query("exercises")
      .withIndex("by_date")
      .order("desc")
      .take(200);

    // Dates that had content
    const contentDates = new Set(allExercises.map((e) => e.date));
    const sessionDates = new Set(recentSessions.map((s) => s.date));

    let streak = 0;
    const todayDate = new Date(today + "T12:00:00");
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toLocaleDateString("sv-SE", {
        timeZone: "Europe/Warsaw",
      });

      if (sessionDates.has(dateStr)) {
        streak++;
      } else if (contentDates.has(dateStr) && dateStr < today) {
        // Had content but didn't do it — streak broken
        break;
      }
      // No content for this day (weekend/rest) — skip, don't break
    }

    return {
      totalSessions,
      totalMinutes,
      totalCards: allCards.length,
      dueCards: totalCards,
      masteredCards,
      streak,
    };
  },
});
