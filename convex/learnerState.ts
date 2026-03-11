import { query } from "./_generated/server";
import { v } from "convex/values";

function defaultLevelState() {
  return {
    currentLevel: "A1" as const,
    unlockedLevels: ["A1"] as const,
    tierCredits: { bronze: 0, silver: 0, gold: 0 },
    minutesTotal: 0,
    activeDates: [],
  };
}

function mergeErrorCounts(missions: Array<{ errorCounts?: Array<{ errorKey: string; count: number }> }>) {
  const totals = new Map<string, number>();
  for (const mission of missions) {
    for (const row of mission.errorCounts ?? []) {
      totals.set(row.errorKey, (totals.get(row.errorKey) ?? 0) + row.count);
    }
  }
  return Array.from(totals.entries())
    .map(([errorKey, count]) => ({ errorKey, count }))
    .sort((a, b) => b.count - a.count);
}

function patternRecommendations(errorKeys: string[]) {
  const recommendations: string[] = [];
  const push = (value: string) => {
    if (!recommendations.includes(value)) recommendations.push(value);
  };

  for (const errorKey of errorKeys) {
    if (["preposition", "instruction_misread"].includes(errorKey)) push("movement_and_location");
    if (["verb_tense", "verb_conjugation"].includes(errorKey)) push("past_events");
    if (["word_order", "incomplete_response"].includes(errorKey)) push("plans_and_reasons");
    if (["pragmatic_mismatch", "off_topic", "incomplete_response"].includes(errorKey)) push("conversation_repair");
    if (["lexical_gap", "pragmatic_mismatch"].includes(errorKey)) push("requests_and_needs");
    if (["lexical_choice", "agreement", "off_topic"].includes(errorKey)) push("preferences_and_opinions");
  }

  if (recommendations.length === 0) push("requests_and_needs");
  return recommendations.slice(0, 3);
}

export const getSnapshot = query({
  args: {
    learnerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const learnerId = args.learnerId ?? "local";

    const [missions, skills, level, catalog] = await Promise.all([
      ctx.db
        .query("userMissionProgress")
        .withIndex("by_learner_level", (q) => q.eq("learnerId", learnerId))
        .collect(),
      ctx.db
        .query("userSkillProgress")
        .withIndex("by_learner", (q) => q.eq("learnerId", learnerId))
        .collect(),
      ctx.db
        .query("userLevelProgress")
        .withIndex("by_learner", (q) => q.eq("learnerId", learnerId))
        .first(),
      ctx.db.query("missionCatalog").collect(),
    ]);

    const catalogByMissionId = new Map(catalog.map((mission) => [mission.missionId, mission] as const));
    const sortedMissions = [...missions].sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return a.missionId.localeCompare(b.missionId);
    });
    const sortedSkills = [...skills].sort((a, b) => {
      const weakA = (a.rollingErrorRate ?? 0) * 100 + (a.recentWeakEvidence ?? 0);
      const weakB = (b.rollingErrorRate ?? 0) * 100 + (b.recentWeakEvidence ?? 0);
      return weakB - weakA || b.points - a.points || a.skillKey.localeCompare(b.skillKey);
    });

    const activeMissionProgress = sortedMissions.find((mission) => mission.active) ?? null;
    const activeMissionCatalog = activeMissionProgress
      ? catalogByMissionId.get(activeMissionProgress.missionId) ?? null
      : null;

    const weakSkills = [...skills]
      .sort((a, b) => {
        const scoreA = (a.rollingErrorRate ?? 0) * 100 + (a.recentWeakEvidence ?? 0) * 4 - (a.confidence ?? 0) * 10;
        const scoreB = (b.rollingErrorRate ?? 0) * 100 + (b.recentWeakEvidence ?? 0) * 4 - (b.confidence ?? 0) * 10;
        return scoreB - scoreA || a.skillKey.localeCompare(b.skillKey);
      })
      .slice(0, 6);

    const strongSkills = [...skills]
      .sort((a, b) => {
        const scoreA = (a.proficiency ?? 0) + (a.confidence ?? 0) * 20 + a.points / 20;
        const scoreB = (b.proficiency ?? 0) + (b.confidence ?? 0) * 20 + b.points / 20;
        return scoreB - scoreA || a.skillKey.localeCompare(b.skillKey);
      })
      .slice(0, 4);

    const weakErrors = mergeErrorCounts(activeMissionProgress ? [activeMissionProgress] : sortedMissions).slice(0, 6);
    const blockers = activeMissionProgress?.skillBlockers ?? [];
    const recommendedPatterns = patternRecommendations(weakErrors.map((row) => row.errorKey));

    return {
      learnerId,
      level: level ?? defaultLevelState(),
      activeMission: activeMissionProgress && activeMissionCatalog
        ? {
            missionId: activeMissionProgress.missionId,
            level: activeMissionProgress.level,
            displayLevel: activeMissionCatalog.displayLevel,
            status: activeMissionProgress.status,
            title: activeMissionCatalog.title,
            summary: activeMissionCatalog.summary,
          }
        : null,
      missions: sortedMissions,
      skills: sortedSkills,
      adaptiveFocus: {
        weakSkills,
        strongSkills,
        weakErrors,
        blockers,
        recommendedPatterns,
        recommendedLevel: level?.currentLevel ?? "A1",
      },
    };
  },
});
