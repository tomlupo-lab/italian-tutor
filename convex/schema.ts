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
    missionId: v.optional(v.string()), // active mission context if generated for a mission
    checkpointId: v.optional(v.string()), // active checkpoint/subgoal if applicable
    tier: v.optional(
      v.union(
        v.literal("bronze"),
        v.literal("silver"),
        v.literal("gold"),
        // Backward-compatible legacy values kept until all stored exercises are migrated.
        v.literal("quick"),
        v.literal("standard"),
        v.literal("deep")
      )
    ),
    generationReason: v.optional(v.string()), // low_inventory|recovery|session_followup|mission_change
    variantKey: v.optional(v.string()), // dedupe or rotate scenario variants
    staleAfter: v.optional(v.string()), // YYYY-MM-DD soft freshness boundary
    difficulty: v.optional(v.string()), // A1/A2/B1/B2
    phase: v.optional(v.string()), // phase_1|phase_2|phase_3
    patternId: v.optional(v.string()),
    domain: v.optional(v.string()),
    completed: v.boolean(), // user has done this exercise
    result: v.optional(v.any()), // score/answers after completion
    source: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_date_type", ["date", "type"])
    .index("by_date_source", ["date", "source"])
    .index("by_mission_tier", ["missionId", "tier"]),

  // ── Sessions (enhanced with exercise tracking) ───────────────────
  sessions: defineTable({
    date: v.string(),
    clientSessionId: v.optional(v.string()),
    duration: v.number(), // seconds
    lessonId: v.optional(v.string()), // backward compatibility with older session docs
    type: v.union(
      v.literal("lesson"),
      v.literal("quick_practice"),
      v.literal("free_talk"),
      v.literal("speaking_practice")
    ),
    mode: v.optional(v.string()), // bronze|silver|gold (new adaptive engine)
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
    missionId: v.optional(v.string()),
    checkpointAwardedId: v.optional(v.string()),
    checkpointPassed: v.optional(v.boolean()),
    goldContractStatus: v.optional(
      v.union(v.literal("strong"), v.literal("partial"), v.literal("missed"))
    ),
    appliedCredits: v.optional(
      v.object({
        bronze: v.number(),
        silver: v.number(),
        gold: v.number(),
      })
    ),
    duplicatePenaltyApplied: v.optional(v.boolean()),
  })
    .index("by_date", ["date"])
    .index("by_client_session", ["clientSessionId"]),

  exerciseEvidence: defineTable({
    sessionId: v.id("sessions"),
    learnerId: v.string(),
    sessionDate: v.string(),
    missionId: v.optional(v.string()),
    exerciseId: v.string(),
    exerciseType: v.string(),
    skillKey: v.string(),
    evidenceType: v.union(
      v.literal("srs"),
      v.literal("drill"),
      v.literal("conversation"),
      v.literal("reflection")
    ),
    rawScore: v.number(), // 0..1
    weight: v.number(),
    pointsDelta: v.number(),
    proficiencyDelta: v.number(), // signed delta applied from this evidence row
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_learner_skill", ["learnerId", "skillKey"])
    .index("by_learner_date", ["learnerId", "sessionDate"]),

  // ── SRS Cards (enhanced with skill tracking) ─────────────────────
  cards: defineTable({
    it: v.string(),
    en: v.string(),
    example: v.optional(v.string()),
    prompt: v.optional(v.string()),
    explanation: v.optional(v.string()),
    tag: v.optional(v.string()),
    level: v.optional(v.string()),
    phase: v.optional(v.string()),
    patternId: v.optional(v.string()),
    domain: v.optional(v.string()),
    source: v.union(
      v.literal("seed"),
      v.literal("mission_topup"),
      v.literal("recovery"),
      v.literal("manual")
    ),
    direction: v.union(v.literal("it_to_en"), v.literal("en_to_it")),
    // SRS fields (SM-2)
    ease: v.number(), // default 2.5
    interval: v.number(), // days
    repetitions: v.number(),
    nextReview: v.string(), // YYYY-MM-DD
    lastQuality: v.optional(v.number()), // 1-5
    lastReviewed: v.optional(v.string()),
    // Optional skill linkage for progression tracking
    skillId: v.optional(v.string()),
    errorCategory: v.optional(v.string()), // grammar/vocab/preposition/construction
  })
    .index("by_next_review", ["nextReview"])
    .index("by_tag", ["tag"])
    .index("by_level", ["level"])
    .index("by_it", ["it"])
    .index("by_it_direction", ["it", "direction"]),

  exerciseTemplates: defineTable({
    originMissionId: v.optional(v.string()),
    level: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2")
    ),
    type: v.string(),
    tier: v.union(
      v.literal("bronze"),
      v.literal("silver"),
      v.literal("gold"),
      v.literal("quick"),
      v.literal("standard"),
      v.literal("deep")
    ),
    order: v.number(),
    title: v.optional(v.string()),
    checkpointId: v.optional(v.string()),
    skillId: v.optional(v.string()),
    tags: v.array(v.string()),
    errorFocus: v.array(v.string()),
    phase: v.optional(v.string()),
    patternId: v.optional(v.string()),
    domain: v.optional(v.string()),
    variantKey: v.string(),
    content: v.any(),
    active: v.boolean(),
  })
    .index("by_level_type", ["level", "type"])
    .index("by_level_skill", ["level", "skillId"])
    .index("by_origin_order", ["originMissionId", "order"]),

  // ── Mission progression catalog (author-defined) ──────────────────
  missionCatalog: defineTable({
    missionId: v.string(), // stable slug-like ID
    title: v.string(),
    level: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2")
    ),
    displayLevel: v.optional(
      v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2")
      )
    ),
    order: v.number(),
    required: v.boolean(),
    summary: v.string(),
    scenario: v.string(),
    objective: v.string(),
    tags: v.array(v.string()),
    targetPatternIds: v.optional(v.array(v.string())),
    primarySkills: v.array(v.string()),
    errorFocus: v.array(v.string()),
    criticalErrorTypes: v.array(v.string()),
    exerciseTargets: v.object({
      bronzeReviews: v.number(),
      silverDrills: v.number(),
      goldConversations: v.number(),
      silverAccuracyTarget: v.number(), // percentage
      goldPhraseTarget: v.number(),
    }),
    exerciseMix: v.object({
      srs: v.number(),
      cloze: v.number(),
      wordBuilder: v.number(),
      patternDrill: v.number(),
      speedTranslation: v.number(),
      errorHunt: v.number(),
      conversation: v.number(),
      reflection: v.number(),
    }),
    passPolicy: v.object({
      minCompositeScore: v.number(), // percentage
      requireCriticalErrorsZero: v.boolean(),
      checkpoint: v.string(),
    }),
    checkpoints: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          description: v.string(),
          required: v.boolean(),
          minScore: v.number(),
        })
      )
    ),
    prerequisites: v.array(v.string()),
    active: v.boolean(),
  })
    .index("by_mission_id", ["missionId"])
    .index("by_level_order", ["level", "order"]),

  skillTaxonomy: defineTable({
    skillKey: v.string(),
    label: v.string(),
    domain: v.string(), // vocab|grammar|listening|speaking|reading|writing|pragmatics|task
    description: v.string(),
    levelBands: v.array(
      v.union(
        v.literal("A1"),
        v.literal("A2"),
        v.literal("B1"),
        v.literal("B2")
      )
    ),
    active: v.boolean(),
  }).index("by_skill_key", ["skillKey"]),

  errorTaxonomy: defineTable({
    errorKey: v.string(),
    label: v.string(),
    description: v.string(),
    category: v.string(), // lexical|grammar|syntax|pronunciation|listening|pragmatics|task
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    active: v.boolean(),
  }).index("by_error_key", ["errorKey"]),

  levelRoadmaps: defineTable({
    level: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2")
    ),
    nextLevel: v.optional(
      v.union(v.literal("A2"), v.literal("B1"), v.literal("B2"))
    ),
    missionPool: v.array(v.string()),
    requiredMissionIds: v.array(v.string()),
    minCompletedMissions: v.number(),
    minOptionalMissions: v.number(),
    skillThresholds: v.array(
      v.object({
        skillKey: v.string(),
        minPoints: v.number(),
      })
    ),
    sessionMinimums: v.object({
      bronze: v.number(),
      silver: v.number(),
      gold: v.number(),
      minutes: v.number(),
      activeDays: v.number(),
    }),
    finalCheckpointMissionId: v.optional(v.string()),
  }).index("by_level", ["level"]),

  // ── Mission progression (learner state) ───────────────────────────
  userMissionProgress: defineTable({
    learnerId: v.string(), // single-user app can default to "local"
    missionId: v.string(),
    level: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2")
    ),
    status: v.union(
      v.literal("not_started"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
    active: v.boolean(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    lastActivityDate: v.optional(v.string()),
    credits: v.object({
      bronze: v.number(),
      silver: v.number(),
      gold: v.number(),
    }),
    sessionsCompleted: v.number(),
    totalScore: v.number(),
    averageScore: v.number(),
    criticalErrorsCount: v.number(),
    skillBlockers: v.optional(
      v.array(
        v.object({
          skillKey: v.string(),
          weakEvidenceCount: v.number(),
          rollingErrorRate: v.number(),
        })
      )
    ),
    skillPoints: v.array(
      v.object({
        skillKey: v.string(),
        points: v.number(),
      })
    ),
    errorCounts: v.array(
      v.object({
        errorKey: v.string(),
        count: v.number(),
      })
    ),
    completedCheckpointIds: v.optional(v.array(v.string())),
    sessionSignatures: v.optional(
      v.array(
        v.object({
          date: v.string(),
          signature: v.string(),
          count: v.number(),
        })
      )
    ),
  })
    .index("by_learner_mission", ["learnerId", "missionId"])
    .index("by_learner_active", ["learnerId", "active"])
    .index("by_learner_level", ["learnerId", "level"]),

  userSkillProgress: defineTable({
    learnerId: v.string(),
    skillKey: v.string(),
    points: v.number(),
    proficiency: v.optional(v.number()), // 0..100
    confidence: v.optional(v.number()), // 0..1
    evidenceCount: v.optional(v.number()),
    recentWeakEvidence: v.optional(v.number()),
    recentStrongEvidence: v.optional(v.number()),
    rollingErrorRate: v.optional(v.number()), // 0..1 over recent evidence
    lastUpdated: v.number(),
  })
    .index("by_learner_skill", ["learnerId", "skillKey"])
    .index("by_learner", ["learnerId"]),

  userLevelProgress: defineTable({
    learnerId: v.string(),
    currentLevel: v.union(
      v.literal("A1"),
      v.literal("A2"),
      v.literal("B1"),
      v.literal("B2")
    ),
    unlockedLevels: v.array(
      v.union(v.literal("A1"), v.literal("A2"), v.literal("B1"), v.literal("B2"))
    ),
    tierCredits: v.object({
      bronze: v.number(),
      silver: v.number(),
      gold: v.number(),
    }),
    minutesTotal: v.number(),
    activeDates: v.array(v.string()), // YYYY-MM-DD unique
    completedMissionIds: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_learner", ["learnerId"]),

});
