import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  ERROR_TAXONOMY,
  LEVEL_ROADMAPS,
  MISSIONS,
  SKILL_TAXONOMY,
  type CefrLevel,
  type MissionCheckpoint,
} from "./progressionCatalog";

function mergeCounterList(
  current: Array<{ key: string; count: number }>,
  delta: Array<{ key: string; count: number }>
): Array<{ key: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of current) map.set(item.key, (map.get(item.key) ?? 0) + item.count);
  for (const item of delta) map.set(item.key, (map.get(item.key) ?? 0) + item.count);
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function toPairs(input: Array<{ skillKey?: string; errorKey?: string; points?: number; count?: number }>) {
  return input
    .map((x) => {
      if (x.skillKey) return { key: x.skillKey, count: x.points ?? 0 };
      if (x.errorKey) return { key: x.errorKey, count: x.count ?? 0 };
      return null;
    })
    .filter((x): x is { key: string; count: number } => x !== null);
}

async function getOrCreateLevelProgress(ctx: any, learnerId: string) {
  const existing = await ctx.db
    .query("userLevelProgress")
    .withIndex("by_learner", (q: any) => q.eq("learnerId", learnerId))
    .first();
  if (existing) return existing;

  const id = await ctx.db.insert("userLevelProgress", {
    learnerId,
    currentLevel: "A1",
    unlockedLevels: ["A1"],
    tierCredits: { bronze: 0, silver: 0, gold: 0 },
    minutesTotal: 0,
    activeDates: [],
    completedMissionIds: [],
    updatedAt: Date.now(),
  });

  const created = await ctx.db.get(id);
  if (!created) throw new Error("Failed to create level progress");
  return created;
}

function levelRank(level: CefrLevel): number {
  if (level === "A1") return 1;
  if (level === "A2") return 2;
  if (level === "B1") return 3;
  return 4;
}

function defaultMissionCheckpoints(mission: {
  missionId: string;
  objective: string;
  passPolicy: { minCompositeScore: number; checkpoint: string };
}): MissionCheckpoint[] {
  return [
    {
      id: `${mission.missionId}:briefing`,
      title: "Mission Briefing",
      description: "Establish context and confirm constraints before acting.",
      required: true,
      minScore: Math.max(55, mission.passPolicy.minCompositeScore - 20),
    },
    {
      id: `${mission.missionId}:execution`,
      title: "Core Execution",
      description: mission.objective,
      required: true,
      minScore: Math.max(60, mission.passPolicy.minCompositeScore - 15),
    },
    {
      id: `${mission.missionId}:recovery`,
      title: "Recovery Under Pressure",
      description: "Handle an unexpected problem without switching language.",
      required: false,
      minScore: Math.max(60, mission.passPolicy.minCompositeScore - 15),
    },
    {
      id: `${mission.missionId}:finale`,
      title: "Final Checkpoint",
      description: mission.passPolicy.checkpoint,
      required: true,
      minScore: mission.passPolicy.minCompositeScore,
    },
  ];
}

export const seedCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    let missionsInserted = 0;
    let missionsUpdated = 0;
    let skillsInserted = 0;
    let skillsUpdated = 0;
    let errorsInserted = 0;
    let errorsUpdated = 0;
    let roadmapsInserted = 0;
    let roadmapsUpdated = 0;

    for (const mission of MISSIONS) {
      const payload = {
        ...mission,
        checkpoints: mission.checkpoints ?? defaultMissionCheckpoints(mission),
      };
      const existing = await ctx.db
        .query("missionCatalog")
        .withIndex("by_mission_id", (q) => q.eq("missionId", mission.missionId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, payload);
        missionsUpdated++;
      } else {
        await ctx.db.insert("missionCatalog", payload);
        missionsInserted++;
      }
    }

    for (const skill of SKILL_TAXONOMY) {
      const existing = await ctx.db
        .query("skillTaxonomy")
        .withIndex("by_skill_key", (q) => q.eq("skillKey", skill.skillKey))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, skill);
        skillsUpdated++;
      } else {
        await ctx.db.insert("skillTaxonomy", skill);
        skillsInserted++;
      }
    }

    for (const error of ERROR_TAXONOMY) {
      const existing = await ctx.db
        .query("errorTaxonomy")
        .withIndex("by_error_key", (q) => q.eq("errorKey", error.errorKey))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, error);
        errorsUpdated++;
      } else {
        await ctx.db.insert("errorTaxonomy", error);
        errorsInserted++;
      }
    }

    for (const roadmap of LEVEL_ROADMAPS) {
      const existing = await ctx.db
        .query("levelRoadmaps")
        .withIndex("by_level", (q) => q.eq("level", roadmap.level))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, roadmap);
        roadmapsUpdated++;
      } else {
        await ctx.db.insert("levelRoadmaps", roadmap);
        roadmapsInserted++;
      }
    }

    return {
      missions: { inserted: missionsInserted, updated: missionsUpdated, total: MISSIONS.length },
      skills: { inserted: skillsInserted, updated: skillsUpdated, total: SKILL_TAXONOMY.length },
      errors: { inserted: errorsInserted, updated: errorsUpdated, total: ERROR_TAXONOMY.length },
      roadmaps: { inserted: roadmapsInserted, updated: roadmapsUpdated, total: LEVEL_ROADMAPS.length },
    };
  },
});

export const listCatalog = query({
  args: {
    level: v.optional(v.union(v.literal("A1"), v.literal("A2"), v.literal("B1"), v.literal("B2"))),
  },
  handler: async (ctx, args) => {
    let missions = await ctx.db.query("missionCatalog").collect();
    missions = missions.filter((m) => m.active);
    if (args.level) missions = missions.filter((m) => m.level === args.level);
    missions.sort((a, b) => a.order - b.order);

    const skills = (await ctx.db.query("skillTaxonomy").collect()).filter((s) => s.active);
    const errors = (await ctx.db.query("errorTaxonomy").collect()).filter((e) => e.active);
    const roadmaps = await ctx.db.query("levelRoadmaps").collect();

    return {
      missions,
      skills,
      errors,
      roadmaps: roadmaps.sort((a, b) => levelRank(a.level as CefrLevel) - levelRank(b.level as CefrLevel)),
    };
  },
});

export const getRoadmap = query({
  args: {
    level: v.union(v.literal("A1"), v.literal("A2"), v.literal("B1"), v.literal("B2")),
  },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db
      .query("levelRoadmaps")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .first();

    const missions = await ctx.db
      .query("missionCatalog")
      .withIndex("by_level_order", (q) => q.eq("level", args.level))
      .collect();

    return {
      roadmap,
      missions: missions.filter((m) => m.active).sort((a, b) => a.order - b.order),
    };
  },
});

export const setActiveMission = mutation({
  args: {
    learnerId: v.optional(v.string()),
    missionId: v.string(),
  },
  handler: async (ctx, args) => {
    const learnerId = args.learnerId ?? "local";
    const mission = await ctx.db
      .query("missionCatalog")
      .withIndex("by_mission_id", (q) => q.eq("missionId", args.missionId))
      .first();
    if (!mission) throw new Error("Mission not found");

    const existing = await ctx.db
      .query("userMissionProgress")
      .withIndex("by_learner_mission", (q) => q.eq("learnerId", learnerId).eq("missionId", args.missionId))
      .first();

    const activeRows = await ctx.db
      .query("userMissionProgress")
      .withIndex("by_learner_active", (q) => q.eq("learnerId", learnerId).eq("active", true))
      .collect();

    for (const row of activeRows) {
      await ctx.db.patch(row._id, {
        active: false,
        status: row.status === "completed" ? "completed" : "paused",
      });
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        active: true,
        status: existing.status === "completed" ? "completed" : "active",
        startedAt: existing.startedAt ?? Date.now(),
        credits: existing.credits ?? { bronze: 0, silver: 0, gold: 0 },
        sessionsCompleted: existing.sessionsCompleted ?? 0,
        totalScore: existing.totalScore ?? 0,
        averageScore: existing.averageScore ?? 0,
        criticalErrorsCount: existing.criticalErrorsCount ?? 0,
        skillPoints: existing.skillPoints ?? [],
        errorCounts: existing.errorCounts ?? [],
        completedCheckpointIds: existing.completedCheckpointIds ?? [],
        sessionSignatures: existing.sessionSignatures ?? [],
      });
      return { status: "updated" as const };
    }

    await ctx.db.insert("userMissionProgress", {
      learnerId,
      missionId: args.missionId,
      level: mission.level,
      status: "active",
      active: true,
      startedAt: Date.now(),
      credits: { bronze: 0, silver: 0, gold: 0 },
      sessionsCompleted: 0,
      totalScore: 0,
      averageScore: 0,
      criticalErrorsCount: 0,
      skillPoints: [],
      errorCounts: [],
      completedCheckpointIds: [],
      sessionSignatures: [],
    });

    return { status: "created" as const };
  },
});

export const getLearnerProgress = query({
  args: {
    learnerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const learnerId = args.learnerId ?? "local";

    const missions = await ctx.db
      .query("userMissionProgress")
      .withIndex("by_learner_level", (q) => q.eq("learnerId", learnerId))
      .collect();

    const skills = await ctx.db
      .query("userSkillProgress")
      .withIndex("by_learner", (q) => q.eq("learnerId", learnerId))
      .collect();

    const level = await ctx.db
      .query("userLevelProgress")
      .withIndex("by_learner", (q) => q.eq("learnerId", learnerId))
      .first();

    return {
      level,
      skills,
      missions: missions.sort((a, b) => {
        if (a.active && !b.active) return -1;
        if (!a.active && b.active) return 1;
        return a.missionId.localeCompare(b.missionId);
      }),
    };
  },
});

export const getActiveMission = query({
  args: {
    learnerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const learnerId = args.learnerId ?? "local";
    const active = await ctx.db
      .query("userMissionProgress")
      .withIndex("by_learner_active", (q) => q.eq("learnerId", learnerId).eq("active", true))
      .first();
    if (!active) return null;

    const mission = await ctx.db
      .query("missionCatalog")
      .withIndex("by_mission_id", (q) => q.eq("missionId", active.missionId))
      .first();

    return {
      missionId: active.missionId,
      level: active.level,
      status: active.status,
      title: mission?.title ?? active.missionId,
      summary: mission?.summary ?? "",
    };
  },
});

export const recordLessonCompletion = mutation({
  args: {
    learnerId: v.optional(v.string()),
    missionId: v.optional(v.string()),
    sessionDate: v.string(),
    scorePercent: v.number(),
    bronzeCredit: v.number(),
    silverCredit: v.number(),
    goldCredit: v.number(),
    minutes: v.number(),
    sessionSignature: v.optional(v.string()),
    criticalErrors: v.optional(v.number()),
    confidenceWeight: v.optional(v.number()),
    skillDeltas: v.optional(
      v.array(
        v.object({
          skillKey: v.string(),
          points: v.number(),
        })
      )
    ),
    errorDeltas: v.optional(
      v.array(
        v.object({
          errorKey: v.string(),
          count: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const learnerId = args.learnerId ?? "local";
    const criticalErrors = args.criticalErrors ?? 0;
    const confidence = Math.max(0, Math.min(1, args.confidenceWeight ?? 1));

    let missionProgress = args.missionId
      ? await ctx.db
          .query("userMissionProgress")
          .withIndex("by_learner_mission", (q) => q.eq("learnerId", learnerId).eq("missionId", args.missionId!))
          .first()
      : null;

    if (!missionProgress) {
      missionProgress = await ctx.db
        .query("userMissionProgress")
        .withIndex("by_learner_active", (q) => q.eq("learnerId", learnerId).eq("active", true))
        .first();
    }

    if (!missionProgress) {
      throw new Error("No active mission. Set one before recording lessons.");
    }

    const missionRow = await ctx.db
      .query("missionCatalog")
      .withIndex("by_mission_id", (q) => q.eq("missionId", missionProgress.missionId))
      .first();

    if (!missionRow) throw new Error("Mission catalog entry missing");

    const mission = {
      ...missionRow,
      checkpoints: missionRow.checkpoints ?? defaultMissionCheckpoints(missionRow),
    };

    const baseCredits = missionProgress.credits ?? { bronze: 0, silver: 0, gold: 0 };
    const qualityMultiplier =
      args.scorePercent >= mission.passPolicy.minCompositeScore
        ? 1
        : args.scorePercent >= Math.max(55, mission.passPolicy.minCompositeScore - 10)
          ? 0.7
          : 0.4;
    const currentSignatures = missionProgress.sessionSignatures ?? [];
    const signature = args.sessionSignature ?? "unknown";
    const sigIdx = currentSignatures.findIndex(
      (row) => row.date === args.sessionDate && row.signature === signature
    );
    const duplicateSameDay = sigIdx >= 0 && currentSignatures[sigIdx].count > 0;
    const antiFarmMultiplier = duplicateSameDay ? 0.35 : 1;
    const creditMultiplier = qualityMultiplier * antiFarmMultiplier;
    const appliedBronzeCredit =
      args.bronzeCredit > 0 ? Math.max(0, Math.round(args.bronzeCredit * creditMultiplier)) : 0;
    const appliedSilverCredit =
      args.silverCredit > 0 ? Math.max(0, Math.round(args.silverCredit * creditMultiplier)) : 0;
    const appliedGoldCredit =
      args.goldCredit > 0 ? Math.max(0, Math.round(args.goldCredit * creditMultiplier)) : 0;
    const nextCredits = {
      bronze: baseCredits.bronze + appliedBronzeCredit,
      silver: baseCredits.silver + appliedSilverCredit,
      gold: baseCredits.gold + appliedGoldCredit,
    };

    const nextSessions = (missionProgress.sessionsCompleted ?? 0) + 1;
    const nextTotalScore = (missionProgress.totalScore ?? 0) + args.scorePercent;
    const nextAverage = nextSessions > 0 ? Math.round((nextTotalScore / nextSessions) * 10) / 10 : 0;

    const currentSkillPairs = (missionProgress.skillPoints ?? []).map((x) => ({ key: x.skillKey, count: x.points }));
    const deltaSkillPairs = toPairs((args.skillDeltas ?? []).map((x) => ({ skillKey: x.skillKey, points: x.points })));
    const mergedSkillPairs = mergeCounterList(currentSkillPairs, deltaSkillPairs).map((x) => ({
      skillKey: x.key,
      points: x.count,
    }));

    const currentErrorPairs = (missionProgress.errorCounts ?? []).map((x) => ({ key: x.errorKey, count: x.count }));
    const deltaErrorPairs = toPairs((args.errorDeltas ?? []).map((x) => ({ errorKey: x.errorKey, count: x.count })));
    const mergedErrorPairs = mergeCounterList(currentErrorPairs, deltaErrorPairs).map((x) => ({
      errorKey: x.key,
      count: x.count,
    }));

    const completedCheckpointIds = missionProgress.completedCheckpointIds ?? [];
    let nextCompletedCheckpointIds = completedCheckpointIds;
    let checkpointAwardedId: string | null = null;
    const nextCheckpoint = mission.checkpoints.find((cp) => !completedCheckpointIds.includes(cp.id));
    if (
      nextCheckpoint &&
      !duplicateSameDay &&
      args.scorePercent >= nextCheckpoint.minScore
    ) {
      nextCompletedCheckpointIds = [...completedCheckpointIds, nextCheckpoint.id];
      checkpointAwardedId = nextCheckpoint.id;
    }
    const requiredCheckpointIds = mission.checkpoints.filter((cp) => cp.required).map((cp) => cp.id);
    const checkpointsDone =
      requiredCheckpointIds.length === 0 ||
      requiredCheckpointIds.every((id) => nextCompletedCheckpointIds.includes(id));

    const nextSessionSignatures =
      sigIdx >= 0
        ? currentSignatures.map((row, i) =>
            i === sigIdx ? { ...row, count: row.count + 1 } : row
          )
        : [...currentSignatures, { date: args.sessionDate, signature, count: 1 }];

    const nextCriticalErrors = criticalErrors;

    const missionCompleted =
      nextCredits.bronze >= mission.exerciseTargets.bronzeReviews &&
      nextCredits.silver >= mission.exerciseTargets.silverDrills &&
      nextCredits.gold >= mission.exerciseTargets.goldConversations &&
      checkpointsDone &&
      nextAverage >= mission.passPolicy.minCompositeScore &&
      (!mission.passPolicy.requireCriticalErrorsZero || nextCriticalErrors === 0);

    await ctx.db.patch(missionProgress._id, {
      status: missionCompleted ? "completed" : "active",
      active: missionCompleted ? false : true,
      completedAt: missionCompleted ? Date.now() : missionProgress.completedAt,
      lastActivityDate: args.sessionDate,
      credits: nextCredits,
      sessionsCompleted: nextSessions,
      totalScore: nextTotalScore,
      averageScore: nextAverage,
      criticalErrorsCount: nextCriticalErrors,
      skillPoints: mergedSkillPairs,
      errorCounts: mergedErrorPairs,
      completedCheckpointIds: nextCompletedCheckpointIds,
      sessionSignatures: nextSessionSignatures.slice(-40),
    });

    for (const delta of args.skillDeltas ?? []) {
      const weightedDelta = Math.round(delta.points * confidence);
      if (weightedDelta === 0) continue;

      const current = await ctx.db
        .query("userSkillProgress")
        .withIndex("by_learner_skill", (q) => q.eq("learnerId", learnerId).eq("skillKey", delta.skillKey))
        .first();

      if (current) {
        const nextPoints = current.points + weightedDelta;
        await ctx.db.patch(current._id, {
          points: nextPoints,
          confidence: Math.max(current.confidence, confidence),
          lastUpdated: Date.now(),
        });
      } else {
        await ctx.db.insert("userSkillProgress", {
          learnerId,
          skillKey: delta.skillKey,
          points: weightedDelta,
          confidence,
          lastUpdated: Date.now(),
        });
      }
    }

    const levelState = await getOrCreateLevelProgress(ctx, learnerId);
    const activeDates = levelState.activeDates.includes(args.sessionDate)
      ? levelState.activeDates
      : [...levelState.activeDates, args.sessionDate];

    const completedMissionIds = missionCompleted && !levelState.completedMissionIds.includes(mission.missionId)
      ? [...levelState.completedMissionIds, mission.missionId]
      : levelState.completedMissionIds;

    await ctx.db.patch(levelState._id, {
      tierCredits: {
        bronze: levelState.tierCredits.bronze + appliedBronzeCredit,
        silver: levelState.tierCredits.silver + appliedSilverCredit,
        gold: levelState.tierCredits.gold + appliedGoldCredit,
      },
      minutesTotal: levelState.minutesTotal + args.minutes,
      activeDates,
      completedMissionIds,
      updatedAt: Date.now(),
    });

    const freshLevel = (await ctx.db.get(levelState._id)) ?? levelState;
    const roadmap = await ctx.db
      .query("levelRoadmaps")
      .withIndex("by_level", (q) => q.eq("level", freshLevel.currentLevel))
      .first();

    let unlockedNextLevel = false;
    if (roadmap?.nextLevel) {
      const completedSet = new Set(freshLevel.completedMissionIds);
      const requiredDone = roadmap.requiredMissionIds.every((id) => completedSet.has(id));
      const completedInPool = roadmap.missionPool.filter((id) => completedSet.has(id));
      const optionalDone = completedInPool.filter((id) => !roadmap.requiredMissionIds.includes(id)).length;

      const skillRows = await ctx.db
        .query("userSkillProgress")
        .withIndex("by_learner", (q) => q.eq("learnerId", learnerId))
        .collect();
      const skillMap = new Map(skillRows.map((x) => [x.skillKey, x.points] as const));
      const skillsDone = roadmap.skillThresholds.every((rule) => (skillMap.get(rule.skillKey) ?? 0) >= rule.minPoints);

      const sessionsDone =
        freshLevel.tierCredits.bronze >= roadmap.sessionMinimums.bronze &&
        freshLevel.tierCredits.silver >= roadmap.sessionMinimums.silver &&
        freshLevel.tierCredits.gold >= roadmap.sessionMinimums.gold &&
        freshLevel.minutesTotal >= roadmap.sessionMinimums.minutes &&
        freshLevel.activeDates.length >= roadmap.sessionMinimums.activeDays;

      const missionCountDone = completedInPool.length >= roadmap.minCompletedMissions;
      const optionalCountDone = optionalDone >= roadmap.minOptionalMissions;

      if (requiredDone && missionCountDone && optionalCountDone && skillsDone && sessionsDone) {
        if (!freshLevel.unlockedLevels.includes(roadmap.nextLevel)) {
          await ctx.db.patch(freshLevel._id, {
            currentLevel: roadmap.nextLevel,
            unlockedLevels: [...freshLevel.unlockedLevels, roadmap.nextLevel],
            updatedAt: Date.now(),
          });
        }
        unlockedNextLevel = true;
      }
    }

    return {
      missionId: mission.missionId,
      missionCompleted,
      unlockedNextLevel,
      checkpointAwardedId,
      duplicateSameDay,
      appliedCredits: {
        bronze: appliedBronzeCredit,
        silver: appliedSilverCredit,
        gold: appliedGoldCredit,
      },
    };
  },
});

export const backfillMissionProgress = mutation({
  args: {
    learnerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const learnerId = args.learnerId ?? "local";
    const rows = await ctx.db
      .query("userMissionProgress")
      .withIndex("by_learner_level", (q) => q.eq("learnerId", learnerId))
      .collect();

    let patched = 0;
    for (const row of rows) {
      const mission = await ctx.db
        .query("missionCatalog")
        .withIndex("by_mission_id", (q) => q.eq("missionId", row.missionId))
        .first();
      const checkpoints = mission
        ? mission.checkpoints ?? defaultMissionCheckpoints(mission)
        : [];
      const requiredCheckpointIds = checkpoints.filter((cp) => cp.required).map((cp) => cp.id);
      const existingCheckpointIds = row.completedCheckpointIds ?? [];
      const mergedCheckpointIds =
        row.status === "completed"
          ? Array.from(new Set([...existingCheckpointIds, ...requiredCheckpointIds]))
          : existingCheckpointIds;

      const needsPatch =
        row.completedCheckpointIds === undefined ||
        row.sessionSignatures === undefined ||
        mergedCheckpointIds.length !== existingCheckpointIds.length;

      if (!needsPatch) continue;
      await ctx.db.patch(row._id, {
        completedCheckpointIds: mergedCheckpointIds,
        sessionSignatures: row.sessionSignatures ?? [],
      });
      patched++;
    }

    return { learnerId, total: rows.length, patched };
  },
});
