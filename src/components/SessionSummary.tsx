"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTodayWarsaw } from "@/lib/date";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";
import { EXERCISE_TIER_META, normalizeExerciseMode, type ExerciseMode } from "@/lib/exerciseTypes";
import Link from "next/link";
import { prettySkillLabel } from "@/lib/labels";
import type { SessionSkillImpact } from "@/lib/sessionSkillImpact";
import { getErrorInsight } from "@/lib/errorInsights";
import { withBasePath } from "@/lib/paths";
import {
  computeSkillBandReadiness,
  describeCurrentBand,
  describeNextTarget,
  getSkillBandStatus,
} from "@/lib/skillBands";
import type {
  ActiveMissionResult,
  CatalogMission,
  LearnerLevel,
  LearnerMission,
  LearnerSkill,
} from "@/lib/missionTypes";

interface SessionSummaryProps {
  mode: ExerciseMode;
  exercisesCompleted: number;
  correctCount: number;
  errorsCount: number;
  accuracyPercent: number;
  sessionDate?: string;
  sessionSkillImpact?: SessionSkillImpact | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCard = Record<string, any>;

interface RecentSessionOutcome {
  date: string;
  type: "lesson" | "quick_practice" | "free_talk" | "speaking_practice";
  mode?: string;
  missionId?: string;
  checkpointAwardedId?: string;
  checkpointPassed?: boolean;
  goldContractStatus?: "strong" | "partial" | "missed";
  duplicatePenaltyApplied?: boolean;
  appliedCredits?: { bronze: number; silver: number; gold: number };
  _creationTime?: number;
}

export default function SessionSummary({
  mode,
  exercisesCompleted,
  correctCount,
  errorsCount,
  accuracyPercent,
  sessionDate,
  sessionSkillImpact,
}: SessionSummaryProps) {
  const effectiveDate = sessionDate ?? getTodayWarsaw();
  const allCards = useQuery(api.cards.getAll) as AnyCard[] | undefined;
  const recentSessions = useQuery(api.sessions.listRecent, { limit: 30 }) as
    | RecentSessionOutcome[]
    | undefined;
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMissionResult | null | undefined;
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[]; skills?: LearnerSkill[]; level?: LearnerLevel | null }
    | undefined;
  const missionCatalog = useQuery(api.missions.listCatalog, {}) as
    | { missions: CatalogMission[] }
    | undefined;

  // ── SRS cards created this session ────────────────────────────────
  const newCorrectionCards = useMemo(() => {
    if (!allCards) return 0;
    // Count correction cards created in the last 2 minutes (just saved)
    const twoMinAgo = Date.now() - 120_000;
    return allCards.filter(
      (c) => c.source === "recovery" && (c._creationTime ?? 0) > twoMinAgo,
    ).length;
  }, [allCards]);

  const recentCorrectionSummary = useMemo(() => {
    if (!allCards) return null;
    const correctionCards = allCards.filter((card) => card.source === "recovery");
    if (correctionCards.length === 0) return null;
    const byCategory: Record<string, number> = {};
    for (const card of correctionCards) {
      const category = card.errorCategory || "other";
      byCategory[category] = (byCategory[category] ?? 0) + 1;
    }
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }, [allCards]);

  const sessionFeedback = useMemo(() => {
    const strongestSkill = missionSkillSummary?.topSkills?.[0] ?? null;
    const primaryError = recentCorrectionSummary?.[0] ?? null;
    const primaryErrorInsight = primaryError ? getErrorInsight(primaryError[0]) : null;

    const sessionTone =
      accuracyPercent >= 85
        ? "Strong session"
        : accuracyPercent >= 70
          ? "Solid session"
          : "Recovery session";

    const outcome =
      accuracyPercent >= 85
        ? "You held accuracy well and moved the session forward cleanly."
        : accuracyPercent >= 70
          ? "You moved forward, but one or two areas still need cleanup."
          : "This session exposed a real weak spot worth practicing again soon.";

    const improved =
      strongestSkill
        ? `${strongestSkill.label} moved most this session.`
        : mode === "bronze"
          ? "You reinforced word recall in this session."
          : mode === "gold"
            ? "You practiced carrying a conversation forward."
            : "You reinforced a focused drill skill in this session.";

    const nextFocus = primaryErrorInsight?.takeaway ?? "Keep building consistency with another short session.";
    const nextAction =
      errorsCount > 0
        ? "Best next step: Practice mistakes."
        : mode === "bronze"
          ? "Best next step: Build skills."
          : "Best next step: Continue mission.";

    return {
      sessionTone,
      outcome,
      improved,
      nextFocus,
      nextAction,
      strongestSkill,
      primaryErrorInsight,
    };
  }, [accuracyPercent, errorsCount, missionSkillSummary, mode, recentCorrectionSummary]);

  // ── Weekly trend ──────────────────────────────────────────────────
  const weekTrend = useMemo(() => {
    if (!recentSessions) return null;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const fmt = (d: Date) => d.toLocaleDateString("sv-SE");
    const recent = recentSessions.filter((s) => s.date >= fmt(sevenDaysAgo));
    const prev = recentSessions.filter(
      (s) => s.date >= fmt(fourteenDaysAgo) && s.date < fmt(sevenDaysAgo),
    );

    const recentCount = recent.length;
    const prevCount = prev.length;

    return {
      sessions: recentCount,
      trend: recentCount > prevCount ? "up" : recentCount < prevCount ? "down" : "stable",
      prevSessions: prevCount,
    };
  }, [recentSessions]);

  const latestMissionOutcome = useMemo(() => {
    if (!recentSessions) return null;
    const candidates = recentSessions.filter(
      (s) => s.type === "lesson" && s.date === effectiveDate && normalizeExerciseMode(s.mode) === mode,
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((latest, row) =>
      (row._creationTime ?? 0) > (latest._creationTime ?? 0) ? row : latest,
    );
  }, [effectiveDate, mode, recentSessions]);
  const latestMissionOutcomeMode = normalizeExerciseMode(latestMissionOutcome?.mode);

  const missionSkillSummary = useMemo(() => {
    if (!sessionSkillImpact || sessionSkillImpact.skills.length === 0) return null;
    const skillStates = new Map((learnerProgress?.skills ?? []).map((row) => [row.skillKey, row] as const));
    const topPoints = Math.max(...sessionSkillImpact.skills.map((row) => row.points), 1);
    const topSkills = sessionSkillImpact.skills.slice(0, 4).map((row) => {
      const skillState = skillStates.get(row.skillKey);
      const totalPoints = skillState?.points ?? row.points;
      const status = getSkillBandStatus(row.skillKey, totalPoints);
      const targetBand = status.nextBand ?? status.currentBand ?? "A1";
      const readiness = computeSkillBandReadiness(row.skillKey, targetBand, {
        points: totalPoints,
        proficiency: skillState?.proficiency ?? row.proficiencySample,
        confidence: skillState?.confidence ?? 0,
        evidenceCount: skillState?.evidenceCount ?? row.evidenceCount,
      });
      return {
        skillKey: row.skillKey,
        label: prettySkillLabel(row.skillKey) ?? row.skillKey,
        pointsGained: row.points,
        totalPoints,
        currentBand: describeCurrentBand(row.skillKey, totalPoints),
        nextTarget: describeNextTarget(row.skillKey, totalPoints),
        nextProgressPct: readiness?.readinessScore ?? status.progressToNextPct,
        proficiency: skillState?.proficiency ?? row.proficiencySample,
        confidence: Math.round((skillState?.confidence ?? 0) * 100),
        evidenceCount: skillState?.evidenceCount ?? row.evidenceCount,
        readiness,
        pct: Math.max(10, Math.round((row.points / topPoints) * 100)),
      };
    });
    return {
      totalSkills: sessionSkillImpact.skills.length,
      totalPoints: sessionSkillImpact.totalPoints,
      exercisesContributing: sessionSkillImpact.exercisesContributing,
      topSkills,
    };
  }, [learnerProgress?.skills, sessionSkillImpact]);

  // ── Session score ─────────────────────────────────────────────────
  const modeInfo = EXERCISE_TIER_META[mode] ?? { label: mode, emoji: "📝", subtitle: "" };
  const levelMissionStats = useMemo(() => {
    const level = learnerProgress?.level?.currentLevel;
    if (!level || !missionCatalog?.missions) return null;
    const total = missionCatalog.missions.filter((m) => m.level === level).length;
    if (total === 0) return null;
    const done = (learnerProgress?.missions ?? []).filter(
      (m) => m.status === "completed" && missionCatalog.missions.some((c) => c.missionId === m.missionId && c.level === level),
    ).length;
    return { level, done, total, pct: Math.round((done / total) * 100) };
  }, [learnerProgress?.level?.currentLevel, learnerProgress?.missions, missionCatalog?.missions]);

  return (
    <div className="w-full space-y-3">
      {/* Session Score Card */}
      <div className="bg-gradient-to-br from-accent/10 to-transparent rounded-xl border border-accent/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{modeInfo.emoji}</span>
            <span className="text-sm font-medium text-white/70">{modeInfo.label} Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-accent-light" />
            <span className="text-lg font-bold text-accent-light">{accuracyPercent}%</span>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-lg font-bold">{exercisesCompleted}</p>
            <p className="text-[9px] text-white/40">exercises</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-lg font-bold text-success">{correctCount}</p>
            <p className="text-[9px] text-white/40">correct</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-lg font-bold text-warn">{errorsCount}</p>
            <p className="text-[9px] text-white/40">to review</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">{sessionFeedback.sessionTone}</p>
          <p className="text-sm text-white">{sessionFeedback.outcome}</p>
          <p className="text-xs text-white/55">{sessionFeedback.improved}</p>
          <p className="text-xs text-white/55">{sessionFeedback.nextFocus}</p>
          <p className="text-xs font-medium text-accent-light">{sessionFeedback.nextAction}</p>
        </div>
      </div>

      {/* Mission Skills */}
      {missionSkillSummary && (
        <div className="bg-card rounded-xl border border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-accent-light" />
            <span className="text-xs font-medium text-white/60">Skills Improved This Session</span>
            <span className="ml-auto text-xs text-white/30">
              {missionSkillSummary.totalSkills} skills
            </span>
          </div>
          <p className="text-[10px] text-white/30">
            {mode === "bronze"
              ? `${missionSkillSummary.exercisesContributing} reviewed card${missionSkillSummary.exercisesContributing === 1 ? "" : "s"} reinforced word knowledge in this session.`
              : `${missionSkillSummary.exercisesContributing} completed exercise${missionSkillSummary.exercisesContributing === 1 ? "" : "s"} fed your strongest skill gains.`}
          </p>
          <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
            {missionSkillSummary.topSkills.map((skill) => (
              <div key={skill.skillKey} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50 flex-1 truncate">{skill.label}</span>
                  <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${skill.pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-accent-light min-w-10 text-right">+{skill.pointsGained}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/35">
                  <span>{skill.currentBand}</span>
                  <span>{skill.totalPoints} pts total</span>
                </div>
                {skill.nextTarget && (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/30"
                        style={{ width: `${skill.nextProgressPct ?? 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-white/30">
                      {skill.nextTarget}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mission Loop */}
      {(activeMission || levelMissionStats) && (
        <div className="bg-card rounded-xl border border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-accent-light" />
            <span className="text-xs font-medium text-white/60">Mission Progress</span>
          </div>
          {activeMission && (
            <p className="text-xs text-white/70">
              Active: <span className="text-accent-light">{activeMission.title}</span>
            </p>
          )}
          {(learnerProgress?.missions?.find((m) => m.active)?.criticalErrorsCount ?? 0) > 0 && (
            <Link
              href={withBasePath("/drills?focus=recovery")}
              className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium border border-warn/30 bg-warn/20 text-warn"
            >
              Recovery block active
            </Link>
          )}
          {levelMissionStats && (
            <>
              <div className="flex items-center justify-between text-[11px] text-white/45">
                <span>{levelMissionStats.level} mission completion</span>
                <span>
                  {levelMissionStats.done}/{levelMissionStats.total}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-700"
                  style={{ width: `${levelMissionStats.pct}%` }}
                />
              </div>
            </>
          )}
          {latestMissionOutcome && (
            <div className="pt-2 border-t border-white/10 space-y-1">
              {latestMissionOutcome.checkpointAwardedId && (
                  <p className="text-[11px] text-success">Checkpoint advanced</p>
              )}
              {latestMissionOutcomeMode === "gold" && latestMissionOutcome.goldContractStatus === "strong" && (
                <p className="text-[11px] text-success">Conversation completed and checkpoint advanced.</p>
              )}
              {latestMissionOutcomeMode === "gold" &&
                latestMissionOutcome.goldContractStatus === "partial" &&
                !latestMissionOutcome.checkpointAwardedId && (
                  <p className="text-[11px] text-warn">
                    Conversation completed, but the checkpoint did not advance.
                  </p>
                )}
              {latestMissionOutcomeMode === "gold" &&
                latestMissionOutcome.goldContractStatus === "missed" && (
                  <p className="text-[11px] text-warn">
                    Conversation did not meet the checkpoint requirement.
                  </p>
                )}
              {latestMissionOutcome.duplicatePenaltyApplied && (
                <p className="text-[11px] text-warn">
                  Repeat session today: less mission progress counted.
                </p>
              )}
              {latestMissionOutcome.appliedCredits && (
                <p className="text-[11px] text-white/45">
                  Mission progress: Review {latestMissionOutcome.appliedCredits.bronze} · Drills{" "}
                  {latestMissionOutcome.appliedCredits.silver} · Conversation{" "}
                  {latestMissionOutcome.appliedCredits.gold}
                </p>
              )}
              {latestMissionOutcome.appliedCredits &&
                latestMissionOutcome.appliedCredits.bronze +
                  latestMissionOutcome.appliedCredits.silver +
                  latestMissionOutcome.appliedCredits.gold ===
                  0 && (
                  <p className="text-[11px] text-warn">
                    This run did not advance mission targets. Improve score or vary the session pattern.
                  </p>
                )}
            </div>
          )}
          <Link
            href={withBasePath(`/session/${effectiveDate}/history`)}
            className="inline-block text-[11px] text-accent-light hover:text-accent transition"
          >
            Review this day
          </Link>
        </div>
      )}

      {/* SRS + Weekly Trend row */}
      <div className="grid grid-cols-2 gap-3">
        {/* New cards created */}
        {newCorrectionCards > 0 && (
          <div className="bg-card rounded-xl border border-white/10 p-3 flex items-center gap-3">
            <Brain size={18} className="text-purple-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">+{newCorrectionCards}</p>
              <p className="text-[9px] text-white/30">SRS cards created</p>
            </div>
          </div>
        )}

        {/* Weekly trend */}
        {weekTrend && (
          <div className="bg-card rounded-xl border border-white/10 p-3 flex items-center gap-3">
            {weekTrend.trend === "up" ? (
              <TrendingUp size={18} className="text-success flex-shrink-0" />
            ) : weekTrend.trend === "down" ? (
              <TrendingDown size={18} className="text-warn flex-shrink-0" />
            ) : (
              <Minus size={18} className="text-white/30 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">{weekTrend.sessions} this week</p>
              <p className="text-[9px] text-white/30">
                {weekTrend.trend === "up"
                  ? `↑ from ${weekTrend.prevSessions} last week`
                  : weekTrend.trend === "down"
                    ? `↓ from ${weekTrend.prevSessions} last week`
                    : "same as last week"}
              </p>
            </div>
          </div>
        )}

        {/* SRS total if no new cards */}
        {newCorrectionCards === 0 && allCards && (
          <div className="bg-card rounded-xl border border-white/10 p-3 flex items-center gap-3">
            <BookOpen size={18} className="text-accent-light flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{allCards.length} cards</p>
              <p className="text-[9px] text-white/30">in your deck</p>
            </div>
          </div>
        )}
      </div>

      {recentCorrectionSummary && (
        <div className="bg-card rounded-xl border border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-warn" />
            <span className="text-xs font-medium text-white/60">Error review</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentCorrectionSummary.map(([category, count]) => (
              <span key={category} className="rounded-full bg-warn/10 px-2 py-0.5 text-[10px] text-warn/80">
                {getErrorInsight(category).label} ({count})
              </span>
            ))}
          </div>
          <Link
            href={withBasePath("/drills?focus=recovery")}
            className="inline-block text-[11px] text-warn"
          >
            Review recent mistakes
          </Link>
        </div>
      )}
    </div>
  );
}
