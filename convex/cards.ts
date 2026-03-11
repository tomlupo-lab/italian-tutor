import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const CARD_DIRECTIONS = ["it_to_en", "en_to_it"] as const;
type CardDirection = (typeof CARD_DIRECTIONS)[number];
type CardSource =
  | "seed"
  | "mission_topup"
  | "recovery"
  | "manual";
const DEFAULT_DIRECTION: CardDirection = "it_to_en";

function resolveDirection(value?: string): CardDirection {
  if (value && (CARD_DIRECTIONS as readonly string[]).includes(value)) {
    return value as CardDirection;
  }
  return DEFAULT_DIRECTION;
}

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
    quality: v.number(), // 0 (again), 2 (hard), 3 (good), 5 (easy)
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Card not found");

    const q = args.quality;
    let { ease, interval, repetitions } = card;

    if (q === 0) {
      // Again — full reset
      repetitions = 0;
      interval = 1;
    } else if (q <= 2) {
      // Hard — got it but struggled. Keep progress, shorter interval
      repetitions = Math.max(1, repetitions);
      interval = Math.max(1, Math.round(interval * 0.6));
    } else {
      // Good (3) or Easy (5) — advance normally
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = q >= 5 ? 8 : 6;
      } else {
        interval = Math.round(interval * ease * (q >= 5 ? 1.2 : 1.0));
      }
      repetitions += 1;
    }

    // Update ease factor (SM-2: floor 1.3, cap 3.0)
    ease = Math.min(3.0, Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))));

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

// Add a new card (from recovery, generated content, or manual edits)
export const add = mutation({
  args: {
    it: v.string(),
    en: v.string(),
    example: v.optional(v.string()),
    prompt: v.optional(v.string()),
    explanation: v.optional(v.string()),
    tag: v.optional(v.string()),
    level: v.optional(v.string()),
    source: v.union(
      v.literal("seed"),
      v.literal("mission_topup"),
      v.literal("recovery"),
      v.literal("manual")
    ),
    direction: v.optional(v.union(v.literal("it_to_en"), v.literal("en_to_it"))),
    skillId: v.optional(v.string()),
    errorCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = warsawToday();
    const direction = resolveDirection(args.direction);
    return await ctx.db.insert("cards", {
      ...args,
      direction,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: today,
    });
  },
});

// Bulk add cards (for seeding or recovery-derived cards)
export const bulkAdd = mutation({
  args: {
    cards: v.array(
      v.object({
        it: v.string(),
        en: v.string(),
        example: v.optional(v.string()),
        prompt: v.optional(v.string()),
        explanation: v.optional(v.string()),
        tag: v.optional(v.string()),
        level: v.optional(v.string()),
        source: v.union(
          v.literal("seed"),
          v.literal("mission_topup"),
          v.literal("recovery"),
          v.literal("manual")
        ),
        direction: v.optional(v.union(v.literal("it_to_en"), v.literal("en_to_it"))),
        skillId: v.optional(v.string()),
        errorCategory: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const today = warsawToday();
    let added = 0;
    for (const card of args.cards) {
      const direction = resolveDirection(card.direction);
      // Deduplicate by Italian text — skip if card already exists
      const existing = await ctx.db
        .query("cards")
        .withIndex("by_it_direction", (q) =>
          q.and(
            q.eq("it", card.it),
            q.eq("direction", direction)
          )
        )
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...(card.example && !existing.example ? { example: card.example } : {}),
          ...(card.prompt && !existing.prompt ? { prompt: card.prompt } : {}),
          ...(card.explanation && !existing.explanation ? { explanation: card.explanation } : {}),
          ...(card.tag && !existing.tag ? { tag: card.tag } : {}),
          ...(card.level && !existing.level ? { level: card.level } : {}),
          ...(card.errorCategory && !existing.errorCategory ? { errorCategory: card.errorCategory } : {}),
          ...(card.skillId && !existing.skillId ? { skillId: card.skillId } : {}),
        });
        continue;
      }

      await ctx.db.insert("cards", {
        ...card,
        direction,
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
    explanation: v.string(),
  },
  handler: async (ctx, args) => {
    const direction = DEFAULT_DIRECTION;
    const card = await ctx.db
      .query("cards")
      .withIndex("by_it_direction", (q) =>
        q.and(q.eq("it", args.it), q.eq("direction", direction))
      )
      .first();
    if (!card) return { updated: false };
    await ctx.db.patch(card._id, { explanation: args.explanation });
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
        source: "seed" as const,
        direction: DEFAULT_DIRECTION,
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

// Get cards with optional tag/level filters
export const getFiltered = query({
  args: {
    limit: v.optional(v.number()),
    tag: v.optional(v.string()),
    level: v.optional(v.string()),
    includeAll: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const today = warsawToday();
    const limit = args.limit ?? 50;

    let cards;

    if (args.tag) {
      cards = await ctx.db
        .query("cards")
        .withIndex("by_tag", (q) => q.eq("tag", args.tag!))
        .collect();
    } else if (args.level) {
      cards = await ctx.db
        .query("cards")
        .withIndex("by_level", (q) => q.eq("level", args.level!))
        .collect();
    } else if (!args.includeAll) {
      return await ctx.db
        .query("cards")
        .withIndex("by_next_review", (q) => q.lte("nextReview", today))
        .take(limit);
    } else {
      cards = await ctx.db.query("cards").collect();
    }

    let filtered = cards;

    if (args.level && args.tag) {
      filtered = filtered.filter((c) => c.level === args.level);
    }

    if (!args.includeAll) {
      filtered = filtered.filter((c) => c.nextReview <= today);
    }

    filtered.sort(() => Math.random() - 0.5);
    return filtered.slice(0, limit);
  },
});

// Get count of cards matching filters (for "X due / Y total" display)
export const getCount = query({
  args: {
    tag: v.optional(v.string()),
    level: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const today = warsawToday();

    let cards;

    if (args.tag) {
      cards = await ctx.db
        .query("cards")
        .withIndex("by_tag", (q) => q.eq("tag", args.tag!))
        .collect();
    } else if (args.level) {
      cards = await ctx.db
        .query("cards")
        .withIndex("by_level", (q) => q.eq("level", args.level!))
        .collect();
    } else {
      cards = await ctx.db.query("cards").collect();
    }

    if (args.level && args.tag) {
      cards = cards.filter((c) => c.level === args.level);
    }

    const due = cards.filter((c) => c.nextReview <= today).length;
    return { total: cards.length, due };
  },
});

// Get all unique tags with their card counts
export const getTags = query({
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    const tagCounts: Record<string, number> = {};
    for (const card of cards) {
      if (card.tag) {
        tagCounts[card.tag] = (tagCounts[card.tag] || 0) + 1;
      }
    }
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },
});

// Upsert a card — find by Italian text, create if missing, review if exists.
export const upsert = mutation({
  args: {
    it: v.string(),
    en: v.string(),
    example: v.optional(v.string()),
    prompt: v.optional(v.string()),
    explanation: v.optional(v.string()),
    source: v.union(
      v.literal("seed"),
      v.literal("mission_topup"),
      v.literal("recovery"),
      v.literal("manual")
    ),
    direction: v.optional(v.union(v.literal("it_to_en"), v.literal("en_to_it"))),
    tag: v.optional(v.string()),
    level: v.optional(v.string()),
    quality: v.number(), // SM-2 quality: 1 (again), 3 (good), 5 (easy)
  },
  handler: async (ctx, args) => {
    const direction = resolveDirection(args.direction);
    const existing = await ctx.db
      .query("cards")
      .withIndex("by_it_direction", (q) =>
        q.and(q.eq("it", args.it), q.eq("direction", direction))
      )
      .first();

    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

    if (existing) {
      // Review existing card with SM-2
      const q = args.quality;
      let { ease, interval, repetitions } = existing;

      if (q === 0) {
        repetitions = 0;
        interval = 1;
      } else if (q <= 2) {
        repetitions = Math.max(1, repetitions);
        interval = Math.max(1, Math.round(interval * 0.6));
      } else {
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = q >= 5 ? 8 : 6;
        } else {
          interval = Math.round(interval * ease * (q >= 5 ? 1.2 : 1.0));
        }
        repetitions += 1;
        ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
      }

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + interval);
      const nextReview = nextDate.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

      await ctx.db.patch(existing._id, {
        ease,
        interval,
        repetitions,
        nextReview,
        lastQuality: q,
        lastReviewed: today,
        ...(args.example && !existing.example ? { example: args.example } : {}),
        ...(args.prompt && !existing.prompt ? { prompt: args.prompt } : {}),
        ...(args.explanation && !existing.explanation ? { explanation: args.explanation } : {}),
        ...(args.tag && !existing.tag ? { tag: args.tag } : {}),
        ...(args.level && !existing.level ? { level: args.level } : {}),
      });
      return existing._id;
    } else {
      // Create new card with initial SM-2 values
      const q = args.quality;
      const interval = q < 3 ? 1 : q <= 3 ? 1 : 4;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + interval);
      const nextReview = nextDate.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

      return await ctx.db.insert("cards", {
        it: args.it,
        en: args.en,
        example: args.example,
        prompt: args.prompt,
        explanation: args.explanation,
        source: args.source,
        direction,
        tag: args.tag,
        level: args.level,
        ease: 2.5,
        interval,
        repetitions: q >= 3 ? 1 : 0,
        nextReview,
        lastQuality: q,
        lastReviewed: today,
      });
    }
  },
});
