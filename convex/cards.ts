import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Warsaw timezone helper
function warsawToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

// Get cards due for review (today or earlier, Warsaw timezone)
export const getDue = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const today = warsawToday();
    const limit = args.limit ?? 12;
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_next_review", (q) => q.lte("nextReview", today))
      .take(limit);
    return cards;
  },
});

// Get all cards (for stats)
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("cards").collect();
  },
});

// Review a card (SM-2 algorithm)
export const review = mutation({
  args: {
    cardId: v.id("cards"),
    quality: v.number(), // 1 (again), 3 (good), 5 (easy)
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");

    const q = args.quality;
    let { ease, interval, repetitions } = card;

    if (q < 3) {
      // Failed — reset
      repetitions = 0;
      interval = 1;
    } else {
      // Passed
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease);
      }
      repetitions += 1;
    }

    // Update ease factor
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

    const today = warsawToday();
    const nextDate = new Date(today + "T12:00:00");
    nextDate.setDate(nextDate.getDate() + interval);
    const nextReview = nextDate.toLocaleDateString("sv-SE", {
      timeZone: "Europe/Warsaw",
    });

    await ctx.db.patch(args.cardId, {
      ease,
      interval,
      repetitions,
      nextReview,
      lastQuality: q,
      lastReviewed: today,
    });
  },
});

// Add a new card (from corrections, lessons, or manual)
export const add = mutation({
  args: {
    it: v.string(),
    en: v.string(),
    example: v.optional(v.string()),
    tag: v.optional(v.string()),
    source: v.union(
      v.literal("builtin"),
      v.literal("lesson"),
      v.literal("correction"),
      v.literal("manual")
    ),
    skillId: v.optional(v.string()),
    errorCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = warsawToday();
    return await ctx.db.insert("cards", {
      ...args,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: today,
    });
  },
});

// Bulk add cards (for seeding or nightly error-derived cards)
export const bulkAdd = mutation({
  args: {
    cards: v.array(
      v.object({
        it: v.string(),
        en: v.string(),
        example: v.optional(v.string()),
        tag: v.optional(v.string()),
        source: v.union(
          v.literal("builtin"),
          v.literal("lesson"),
          v.literal("correction"),
          v.literal("manual")
        ),
        skillId: v.optional(v.string()),
        errorCategory: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const today = warsawToday();
    let added = 0;
    for (const card of args.cards) {
      // Deduplicate by Italian text — skip if card already exists
      const existing = await ctx.db
        .query("cards")
        .filter((q) => q.eq(q.field("it"), card.it))
        .first();
      if (existing) continue;

      await ctx.db.insert("cards", {
        ...card,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: today,
      });
      added++;
    }
    return { added, skipped: args.cards.length - added };
  },
});

// Update a card's explanation (used by AI enrichment)
export const updateExplanation = mutation({
  args: {
    it: v.string(),
    en: v.string(),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("cards")
      .filter((q) => q.eq(q.field("it"), args.it))
      .first();
    if (!card) return { updated: false };
    await ctx.db.patch(card._id, { en: args.en });
    return { updated: true };
  },
});

// Migrate cards from localStorage SRS data (one-time, deduplicates on it+en)
export const migrateFromLocalStorage = mutation({
  args: {
    cards: v.array(
      v.object({
        it: v.string(),
        en: v.string(),
        example: v.optional(v.string()),
        tag: v.optional(v.string()),
        ease: v.optional(v.number()),
        interval: v.optional(v.number()),
        repetitions: v.optional(v.number()),
        nextReview: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const today = warsawToday();
    let migrated = 0;
    let skipped = 0;

    for (const card of args.cards) {
      // Check for duplicate by (it, en) pair
      const existing = await ctx.db
        .query("cards")
        .filter((q) =>
          q.and(q.eq(q.field("it"), card.it), q.eq(q.field("en"), card.en))
        )
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("cards", {
        it: card.it,
        en: card.en,
        example: card.example,
        tag: card.tag,
        source: "builtin" as const,
        ease: card.ease ?? 2.5,
        interval: card.interval ?? 0,
        repetitions: card.repetitions ?? 0,
        nextReview: card.nextReview ?? today,
      });
      migrated++;
    }

    return { migrated, skipped };
  },
});
