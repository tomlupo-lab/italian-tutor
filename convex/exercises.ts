import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { EXERCISE_TEMPLATES } from "./exerciseTemplatesData";
import {
  pickFallbackTemplates,
  type SharedExerciseTemplate,
} from "./sharedExercisePool";

// Warsaw timezone helper
function warsawToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function stableShuffle<T>(items: T[], seed: string): T[] {
  return items
    .map((item, index) => ({ item, sort: stableHash(`${seed}:${index}`) }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item);
}

function isoDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

function variantFamilyKey(variantKey?: string): string | null {
  if (!variantKey) return null;
  const prefixes = ["pattern-", "cloze-", "translation-", "error-", "conversation-", "reflection-", "srs-", "wb-"];
  for (const prefix of prefixes) {
    if (!variantKey.startsWith(prefix)) continue;
    const tail = variantKey.slice(prefix.length);
    if (tail.startsWith("fallback-")) return `${prefix}fallback`;
    const segment = tail.split("-")[0];
    return `${prefix}${segment || "generic"}`;
  }
  return variantKey;
}

async function recentTemplateHistory(ctx: any, days = 7) {
  const from = isoDateDaysAgo(days);
  const rows = await ctx.db
    .query("exercises")
    .withIndex("by_date", (q) => q.gte("date", from))
    .collect();

  const recentVariantKeys = rows
    .map((row: any) => row.variantKey)
    .filter((value: string | undefined): value is string => Boolean(value))
    .slice(-40);

  const recentFamilies = recentVariantKeys
    .map((variantKey: string) => variantFamilyKey(variantKey))
    .filter((value: string | null): value is string => Boolean(value));

  const recentOriginMissionIds = rows
    .map((row: any) => row.missionId)
    .filter((value: string | undefined): value is string => Boolean(value))
    .slice(-24);

  return {
    recentVariantKeys,
    recentFamilies,
    recentOriginMissionIds,
  };
}

function srsFromCard(card: {
  _id: string;
  it: string;
  en: string;
  example?: string;
  tag?: string;
  level?: string;
  direction: "it_to_en" | "en_to_it";
}) {
  return {
    _id: `card-${card._id}`,
    date: warsawToday(),
    type: "srs",
    order: 0,
    content: {
      front: card.it,
      back: card.en,
      example: card.example ?? card.it,
      tag: card.tag,
      level: card.level,
      direction: card.direction,
    },
    skillId: "vocab_core",
    difficulty: card.level ?? "A1",
    completed: false,
    source: "seed" as const,
  };
}

async function buildSharedPracticeSet(
  ctx: any,
  args: {
    count: number;
    level: string;
    types?: string[];
    patternFocus?: string;
    tags?: string[];
    errorFocus?: string[];
    includeSrs?: boolean;
    seed: string;
  }
) {
  const desiredTypes = args.types?.filter((type) => type !== "srs") ?? [];
  const cards = await ctx.db.query("cards").collect();
  const recentHistory = await recentTemplateHistory(ctx);

  const pool = EXERCISE_TEMPLATES.map((template) => ({
    ...template,
    originMissionId: template.missionId ?? null,
  })) as SharedExerciseTemplate[];
  const selectedTemplates = pickFallbackTemplates(pool, {
    level: args.level,
    types: desiredTypes.length > 0 ? desiredTypes : undefined,
    skillIds: args.patternFocus === "conversation_repair" ? ["speaking_fluency", "task_completion"] : undefined,
    patternFocus: args.patternFocus,
    tags: args.tags,
    errorFocus: args.errorFocus,
    recentVariantKeys: recentHistory.recentVariantKeys,
    recentFamilies: recentHistory.recentFamilies,
    recentOriginMissionIds: recentHistory.recentOriginMissionIds,
    limit: args.includeSrs ? Math.max(0, args.count - 1) : args.count,
    seed: args.seed,
  });

  const exercises = selectedTemplates.map((template, index) => ({
    _id: `template:${template.variantKey}:${index}`,
    date: warsawToday(),
    type: template.type,
    order: index,
    content: template.content,
    skillId: template.skillId ?? undefined,
    tier:
      template.tier === "quick" ? "bronze" : template.tier === "standard" ? "silver" : template.tier === "deep" ? "gold" : template.tier,
    variantKey: template.variantKey,
    difficulty: template.level,
    completed: false,
    source: "seed" as const,
  }));

  if (!args.includeSrs) return exercises.slice(0, args.count);

  const relevantCards = stableShuffle(
    cards.filter(
      (card) =>
        card.direction === "it_to_en" &&
        card.level === args.level &&
        (!args.tags || args.tags.length === 0 || args.tags.includes(card.tag ?? "")) &&
        card.source !== "recovery"
    ),
    `${args.seed}:cards`
  );

  if (relevantCards.length === 0) return exercises.slice(0, args.count);

  const srsExercise = srsFromCard(relevantCards[0]);
  return [srsExercise, ...exercises].slice(0, args.count).map((exercise, index) => ({
    ...exercise,
    order: index,
  }));
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
    level: v.optional(v.string()),
    patternFocus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return buildSharedPracticeSet(ctx, {
      count: args.limit ?? 5,
      level: args.level ?? "A1",
      types: args.types,
      patternFocus: args.patternFocus ?? undefined,
      includeSrs: !args.types || args.types.includes("srs"),
      seed: `query:${args.level ?? "A1"}:${(args.types ?? []).join(",")}:${args.patternFocus ?? "none"}`,
    });
  },
});

export const generatePracticeSet = mutation({
  args: {
    count: v.optional(v.number()),
    level: v.optional(v.string()),
    types: v.optional(v.array(v.string())),
    patternFocus: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    errorFocus: v.optional(v.array(v.string())),
    includeSrs: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return buildSharedPracticeSet(ctx, {
      count: args.count ?? 5,
      level: args.level ?? "A1",
      types: args.types,
      patternFocus: args.patternFocus ?? undefined,
      tags: args.tags ?? undefined,
      errorFocus: args.errorFocus ?? undefined,
      includeSrs: args.includeSrs ?? false,
      seed: `mutation:${args.level ?? "A1"}:${(args.types ?? []).join(",")}:${args.patternFocus ?? "none"}:${(args.tags ?? []).join(",")}:${(args.errorFocus ?? []).join(",")}`,
    });
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
          v.union(v.literal("bronze"), v.literal("silver"), v.literal("gold"))
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
