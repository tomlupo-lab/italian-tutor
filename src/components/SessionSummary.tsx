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
import { cn } from "@/lib/cn";
import type { ExerciseMode } from "@/lib/exerciseTypes";
import Link from "next/link";

interface SessionSummaryProps {
  mode: ExerciseMode;
  exercisesCompleted: number;
  correctCount: number;
  errorsCount: number;
}

const MODE_LABELS: Record<string, { label: string; emoji: string }> = {
  quick: { label: "Bronze", emoji: "🥉" },
  standard: { label: "Silver", emoji: "🥈" },
  deep: { label: "Gold", emoji: "🥇" },
};

interface Milestone {
  skillId: string;
  name: string;
  level: string;
  category: string;
  rating: number;
  active: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCard = Record<string, any>;

type Level = "A1" | "A2" | "B1" | "B2";
type MissionStatus = "not_started" | "active" | "paused" | "completed";

interface CatalogMission {
  missionId: string;
  level: Level;
  required: boolean;
}

interface LearnerMission {
  missionId: string;
  status: MissionStatus;
  active: boolean;
  criticalErrorsCount?: number;
}

interface LearnerLevel {
  currentLevel: Level;
  unlockedLevels: Level[];
}

interface ActiveMission {
  missionId: string;
  level: Level;
  status: MissionStatus;
  title: string;
}

interface RecentSessionOutcome {
  date: string;
  type: "lesson" | "quick_practice" | "free_talk" | "speaking_practice";
  mode?: string;
  missionId?: string;
  checkpointAwardedId?: string;
  duplicatePenaltyApplied?: boolean;
  appliedCredits?: { bronze: number; silver: number; gold: number };
  _creationTime?: number;
}

export default function SessionSummary({
  mode,
  exercisesCompleted,
  correctCount,
  errorsCount,
}: SessionSummaryProps) {
  const today = getTodayWarsaw();
  const milestones = useQuery(api.milestones.getAll) as Milestone[] | undefined;
  const allCards = useQuery(api.cards.getAll) as AnyCard[] | undefined;
  const recentSessions = useQuery(api.sessions.listRecent, { limit: 30 }) as
    | RecentSessionOutcome[]
    | undefined;
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMission | null | undefined;
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[]; level?: LearnerLevel | null }
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
      (c) => c.source === "correction" && (c._creationTime ?? 0) > twoMinAgo,
    ).length;
  }, [allCards]);

  // ── Skills touched (from exercises' skillIds) ─────────────────────
  const skillProgress = useMemo(() => {
    if (!milestones) return [];
    const active = milestones.filter((m) => m.active);
    // Show A2 skills that are still being worked on (rating < 3)
    const a2Working = active
      .filter((m) => m.level === "A2" && m.rating < 3)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
    return a2Working;
  }, [milestones]);

  // ── A2 mastery progress ───────────────────────────────────────────
  const a2Mastery = useMemo(() => {
    if (!milestones) return null;
    const a2 = milestones.filter((m) => m.level === "A2" && m.active);
    if (!a2.length) return null;
    const mastered = a2.filter((m) => m.rating >= 2).length;
    return { mastered, total: a2.length, pct: Math.round((mastered / a2.length) * 100) };
  }, [milestones]);

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
      (s) => s.type === "lesson" && s.date === today && s.mode === mode,
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((latest, row) =>
      (row._creationTime ?? 0) > (latest._creationTime ?? 0) ? row : latest,
    );
  }, [mode, recentSessions, today]);

  // ── Session score ─────────────────────────────────────────────────
  const accuracy = exercisesCompleted > 0 ? Math.round((correctCount / exercisesCompleted) * 100) : 0;
  const modeInfo = MODE_LABELS[mode] ?? { label: mode, emoji: "📝" };
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
            <span className="text-lg font-bold text-accent-light">{accuracy}%</span>
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
      </div>

      {/* Skills Progress */}
      {a2Mastery && (
        <div className="bg-card rounded-xl border border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-accent-light" />
            <span className="text-xs font-medium text-white/60">A2 Skill Mastery</span>
            <span className="ml-auto text-xs text-white/30">{a2Mastery.pct}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${a2Mastery.pct}%` }}
            />
          </div>
          <p className="text-[10px] text-white/30">
            {a2Mastery.mastered}/{a2Mastery.total} skills at level 2+
          </p>

          {/* Individual skill bars */}
          {skillProgress.length > 0 && (
            <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
              {skillProgress.map((skill) => (
                <div key={skill.skillId} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50 flex-1 truncate">{skill.name}</span>
                  <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        skill.rating >= 3 ? "bg-success" : skill.rating >= 2 ? "bg-accent" : skill.rating >= 1 ? "bg-yellow-400" : "bg-white/10",
                      )}
                      style={{ width: `${(skill.rating / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-white/30 w-4 text-right">{skill.rating}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mission Loop */}
      {(activeMission || levelMissionStats) && (
        <div className="bg-card rounded-xl border border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-accent-light" />
            <span className="text-xs font-medium text-white/60">Campaign Feedback</span>
          </div>
          {activeMission && (
            <p className="text-xs text-white/70">
              Active: <span className="text-accent-light">{activeMission.title}</span>
            </p>
          )}
          {(learnerProgress?.missions?.find((m) => m.active)?.criticalErrorsCount ?? 0) > 0 && (
            <Link
              href="/exercises?focus=recovery"
              className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium border border-warn/30 bg-warn/20 text-warn"
            >
              Recovery session recommended
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
                <p className="text-[11px] text-success">Checkpoint earned in this session</p>
              )}
              {latestMissionOutcome.duplicatePenaltyApplied && (
                <p className="text-[11px] text-warn">
                  Repeat pattern detected today: reduced mission credits applied
                </p>
              )}
              {latestMissionOutcome.appliedCredits && (
                <p className="text-[11px] text-white/45">
                  Credits applied: Bronze {latestMissionOutcome.appliedCredits.bronze} · Silver{" "}
                  {latestMissionOutcome.appliedCredits.silver} · Gold{" "}
                  {latestMissionOutcome.appliedCredits.gold}
                </p>
              )}
              {latestMissionOutcome.appliedCredits &&
                latestMissionOutcome.appliedCredits.bronze +
                  latestMissionOutcome.appliedCredits.silver +
                  latestMissionOutcome.appliedCredits.gold ===
                  0 && (
                  <p className="text-[11px] text-warn">
                    No mission credits from this run. Improve score or use a different session pattern.
                  </p>
                )}
            </div>
          )}
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
    </div>
  );
}
