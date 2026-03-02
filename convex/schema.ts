import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Exercises (new adaptive engine) ──────────────────────────────
  // One document per exercise instance. No `mode` field — mode→type
  // mapping is deterministic in the app:
  //   Quick: srs, cloze, word_builder, pattern_drill, speed_translation
  //   Standard: Quick + error_hunt, conversation
  //   Deep: Standard + reflection
  exercises: defineTable({
    date: v.string(), // YYYY-MM-DD
    type: v.string(), // srs|cloze|word_builder|pattern_drill|speed_translation|error_hunt|conversation|reflection
    order: v.number(), // sequence within the day
    content: v.any(), // type-specific payload (see templates.json)
    skillId: v.optional(v.string()), // which milestone skill this targets
    difficulty: v.optional(v.string()), // A1/A2/B1/B2
    completed: v.boolean(), // user has done this exercise
    result: v.optional(v.any()), // score/answers after completion
    source: v.optional(v.string()), // "batch" | "nightly"
  })
    .index("by_date", ["date"])
    .index("by_date_type", ["date", "type"]),

  // ── Sessions (enhanced with exercise tracking) ───────────────────
  sessions: defineTable({
    lessonId: v.optional(v.id("lessons")), // backcompat with old lesson-based sessions
    date: v.string(),
    duration: v.number(), // seconds
    type: v.union(
      v.literal("lesson"),
      v.literal("quick_practice"),
      v.literal("free_talk"),
      v.literal("speaking_practice")
    ),
    mode: v.optional(v.string()), // quick|standard|deep (new adaptive engine)
    exercisesCompleted: v.optional(v.number()),
    exercisesTotal: v.optional(v.number()),
    // Warmup results (legacy)
    cardsReviewed: v.number(),
    cardsCorrect: v.number(),
    // Conversation results
    topic: v.optional(v.string()),
    errors: v.array(
      v.object({
        original: v.string(),
        corrected: v.string(),
        explanation: v.optional(v.string()),
        category: v.optional(v.string()), // grammar/vocab/preposition/construction
        skillId: v.optional(v.string()),
      })
    ),
    newPhrases: v.array(v.string()),
    phrasesUsed: v.array(v.string()),
    rating: v.optional(v.number()), // 1-5
    reflection: v.optional(v.string()), // "What was hardest?"
    reflectionAnswer: v.optional(v.string()),
  }).index("by_date", ["date"]),

  // ── SRS Cards (enhanced with skill tracking) ─────────────────────
  cards: defineTable({
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
    // SRS fields (SM-2)
    ease: v.number(), // default 2.5
    interval: v.number(), // days
    repetitions: v.number(),
    nextReview: v.string(), // YYYY-MM-DD
    lastQuality: v.optional(v.number()), // 1-5
    lastReviewed: v.optional(v.string()),
    // New: milestone integration
    skillId: v.optional(v.string()), // ties card to milestone skill
    errorCategory: v.optional(v.string()), // grammar/vocab/preposition/construction
  })
    .index("by_next_review", ["nextReview"])
    .index("by_tag", ["tag"]),

  // ── Milestones (read replica from quark.db) ──────────────────────
  milestones: defineTable({
    skillId: v.string(),
    name: v.string(),
    level: v.string(),
    category: v.string(),
    rating: v.number(),
    lastAssessed: v.optional(v.string()),
    active: v.boolean(),
    updatedAt: v.number(), // epoch ms for sync tracking
  })
    .index("by_skill", ["skillId"])
    .index("by_level", ["level"])
    .index("by_category", ["category"]),

  // ── Lessons (legacy — kept for backward compat, removed in Phase 6)
  lessons: defineTable({
    date: v.string(),
    topic: v.string(),
    question: v.string(),
    grammarFocus: v.optional(v.string()),
    targetPhrases: v.array(
      v.object({
        it: v.string(),
        en: v.string(),
        example: v.optional(v.string()),
      })
    ),
    level: v.string(),
    type: v.union(
      v.literal("daily"),
      v.literal("tutor_prep"),
      v.literal("grammar"),
      v.literal("free"),
      v.literal("weekly_review"),
      v.literal("weekend")
    ),
    weekSummary: v.optional(
      v.object({
        topicsCount: v.number(),
        errorsCount: v.number(),
        newPhrasesCount: v.number(),
        sessionsCount: v.number(),
        totalMinutes: v.number(),
      })
    ),
    resources: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("podcast"),
            v.literal("video"),
            v.literal("article")
          ),
          title: v.string(),
          url: v.string(),
          description: v.optional(v.string()),
          level: v.optional(v.string()),
        })
      )
    ),
  }).index("by_date", ["date"]),
});
