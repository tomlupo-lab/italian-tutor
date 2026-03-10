"use client";

import { useProgressAnalytics } from "@/hooks/useProgressAnalytics";
import MilestoneBar from "@/components/MilestoneBar";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Lock,
  Unlock,
  Brain,
  Target,
  BookOpen,
  BarChart3,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/ScreenShell";
import { useRouter } from "next/navigation";
import { getNowWarsaw } from "@/lib/date";
import ModeSelector from "@/components/ModeSelector";
import {
  inventoryToExerciseCounts,
  pickRunnableMode,
  type InventoryStatusResult,
} from "@/lib/inventoryStatus";
import type {
  ActiveMissionResult,
  CatalogMission,
  LearnerMission,
  Level,
} from "@/lib/missionTypes";

const MODE_META: { mode: string; label: string; emoji: string; color: string }[] = [
  { mode: "quick", label: "Bronze", emoji: "🥉", color: "from-amber-700/20 to-amber-800/5 border-amber-600/30" },
  { mode: "standard", label: "Silver", emoji: "🥈", color: "from-slate-400/20 to-slate-500/5 border-slate-400/30" },
  { mode: "deep", label: "Gold", emoji: "🥇", color: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30" },
];

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-400",
  A2: "bg-accent",
  B1: "bg-purple-400",
  B2: "bg-yellow-400",
};

const CAT_LABELS: Record<string, string> = {
  grammar: "Grammar",
  vocab: "Vocabulary",
  functional: "Functional",
};

const ERROR_CAT_LABELS: Record<string, string> = {
  cloze: "Fill-in-the-blank",
  word_order: "Word order",
  grammar_pattern: "Grammar patterns",
  translation: "Translation",
  error_recognition: "Error spotting",
  grammar: "Grammar",
  vocab: "Vocabulary",
  functional: "Functional",
  unknown: "General",
  other: "General",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCard = Record<string, any>;

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

type DayStatus = "gold" | "silver" | "bronze" | "ready" | "empty" | "future";

interface DayInfo {
  date: string;
  day: number;
  status: DayStatus;
  hasExercises: boolean;
  sessionCount: number;
  checkpointCount: number;
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp size={14} className="text-success" />;
  if (trend === "down") return <TrendingDown size={14} className="text-warn" />;
  return <Minus size={14} className="text-white/30" />;
}

export default function ProgressPage() {
  const router = useRouter();
  const { year: wYear, month: wMonth, dateStr: todayStr } = getNowWarsaw();
  const [year, setYear] = useState(wYear);
  const [month, setMonth] = useState(wMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const analytics = useProgressAnalytics();
  const stats = useQuery(api.sessions.getStats);
  const recentSessions = useQuery(api.sessions.listRecent, { limit: 200 });
  const milestones = useQuery(api.milestones.getAll);
  const allCards = useQuery(api.cards.getAll) as AnyCard[] | undefined;
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMissionResult | null | undefined;
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[] }
    | undefined;
  const catalog = useQuery(api.missions.listCatalog, {}) as
    | { missions: CatalogMission[] }
    | undefined;
  const activeProgress = learnerProgress?.missions?.find((m) => m.active);
  const from = formatDate(year, month, 1);
  const to = formatDate(year, month, new Date(year, month + 1, 0).getDate());
  const exerciseSummaries = useQuery(api.exercises.getDateSummaries, { from, to });
  const calendarSessions = useQuery(api.sessions.getByDateRange, { from, to });
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });
  const selectedInventoryStatus = useQuery(
    api.exercises.getInventoryStatus,
    selectedDate ? { date: selectedDate } : "skip",
  ) as InventoryStatusResult | undefined;
  const selectedMissionInventoryStatus = useQuery(
    api.exercises.getInventoryStatus,
    selectedDate && activeMission?.missionId
      ? { date: selectedDate, missionId: activeMission.missionId }
      : "skip",
  ) as InventoryStatusResult | undefined;

  // Correction cards — recent mistakes to review
  const corrections = useMemo(() => {
    if (!allCards) return { recent: [] as AnyCard[], byCategory: {} as Record<string, number>, total: 0 };
    const correctionCards = allCards.filter((c) => c.source === "correction");
    const byCategory: Record<string, number> = {};
    for (const c of correctionCards) {
      const cat = c.errorCategory || "other";
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }
    const recent = correctionCards
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0))
      .slice(0, 8);
    return { recent, byCategory, total: correctionCards.length };
  }, [allCards]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const exerciseDates = useMemo(() => {
    const set = new Set<string>();
    if (exerciseSummaries) {
      for (const summary of exerciseSummaries) set.add(summary.date);
    }
    return set;
  }, [exerciseSummaries]);

  const completedModes = useMemo(() => {
    const map: Record<string, { quick: number; standard: number; deep: number; total: number; checkpoints: number }> = {};
    if (calendarSessions) {
      for (const session of calendarSessions) {
        if (!map[session.date]) map[session.date] = { quick: 0, standard: 0, deep: 0, total: 0, checkpoints: 0 };
        if (session.mode === "quick") map[session.date].quick += 1;
        if (session.mode === "standard") map[session.date].standard += 1;
        if (session.mode === "deep") map[session.date].deep += 1;
        if (session.checkpointAwardedId) map[session.date].checkpoints += 1;
        map[session.date].total += 1;
      }
    }
    return map;
  }, [calendarSessions]);

  function getTierStatus(date: string, hasExercises: boolean, isFuture: boolean): DayStatus {
    if (isFuture && !hasExercises) return "future";
    if (!hasExercises) return "empty";
    const modes = completedModes[date];
    if (!modes || modes.total === 0) return "ready";
    if (modes.deep > 0) return "gold";
    if (modes.standard > 0) return "silver";
    if (modes.quick > 0) return "bronze";
    return "ready";
  }

  const days: (DayInfo | null)[] = useMemo(() => {
    const result: (DayInfo | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = formatDate(year, month, d);
      const hasExercises = exerciseDates.has(date) || (date === todayStr && (dueCards?.length ?? 0) > 0);
      const isFuture = date > todayStr;
      result.push({
        date,
        day: d,
        status: getTierStatus(date, hasExercises, isFuture),
        hasExercises,
        sessionCount: completedModes[date]?.total ?? 0,
        checkpointCount: completedModes[date]?.checkpoints ?? 0,
      });
    }
    return result;
  }, [completedModes, daysInMonth, dueCards, exerciseDates, month, startOffset, todayStr, year]);

  const exerciseCounts = useMemo(() => {
    const inventory = activeMission?.missionId ? selectedMissionInventoryStatus : selectedInventoryStatus;
    if (!inventory) return {};
    const dueCardsCount = selectedDate === todayStr ? (dueCards?.length ?? 0) : 0;
    return inventoryToExerciseCounts(inventory, dueCardsCount);
  }, [activeMission?.missionId, dueCards, selectedDate, selectedInventoryStatus, selectedMissionInventoryStatus, todayStr]);

  const selectedHasExercises = useMemo(
    () => Object.values(exerciseCounts).some((count) => count > 0),
    [exerciseCounts],
  );
  const selectedSessionStats = selectedDate ? completedModes[selectedDate] : null;
  const selectedIsPast = Boolean(selectedDate && selectedDate < todayStr);
  const suggestedMode = useMemo(() => {
    const inventory = activeMission?.missionId ? selectedMissionInventoryStatus : selectedInventoryStatus;
    if (!inventory) return undefined;
    const dueCardsCount = selectedDate === todayStr ? (dueCards?.length ?? 0) : 0;
    const active = learnerProgress?.missions?.find((m) => m.active);
    const mission = active ? catalog?.missions?.find((m) => m.missionId === active.missionId) : null;

    if (selectedDate === todayStr && active && mission) {
      const bronzeMissing = mission.exerciseTargets.bronzeReviews - (active.credits?.bronze ?? 0);
      const silverMissing = mission.exerciseTargets.silverDrills - (active.credits?.silver ?? 0);
      const goldMissing = mission.exerciseTargets.goldConversations - (active.credits?.gold ?? 0);
      const preferred =
        goldMissing > 0 ? "deep" : silverMissing > 0 ? "standard" : bronzeMissing > 0 ? "quick" : "standard";
      return pickRunnableMode(preferred, inventory, dueCardsCount) ?? undefined;
    }

    return pickRunnableMode("standard", inventory, dueCardsCount) ?? undefined;
  }, [
    activeMission?.missionId,
    catalog?.missions,
    dueCards,
    learnerProgress?.missions,
    selectedDate,
    selectedInventoryStatus,
    selectedMissionInventoryStatus,
    todayStr,
  ]);

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Weekly activity chart (last 8 weeks)
  const weeklyTrends = useMemo(() => {
    if (!recentSessions) return [];
    const now = new Date();
    const weeks: { label: string; sessions: number; minutes: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const startStr = weekStart.toLocaleDateString("sv-SE");
      const endStr = weekEnd.toLocaleDateString("sv-SE");
      const weekSessions = recentSessions.filter((s) => s.date >= startStr && s.date <= endStr);
      weeks.push({
        label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sessions: weekSessions.length,
        minutes: Math.round(weekSessions.reduce((sum, s) => sum + s.duration, 0)),
      });
    }
    return weeks;
  }, [recentSessions]);

  // Grouped milestones for detailed view
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByLevel = useMemo(() => {
    if (!milestones) return {} as Record<string, any[]>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups: Record<string, any[]> = {};
    for (const m of milestones) {
      if (!(m as { active: boolean }).active) continue;
      const level = (m as { level: string }).level;
      (groups[level] ??= []).push(m);
    }
    for (const level of Object.keys(groups)) {
      groups[level].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
    }
    return groups;
  }, [milestones]);

  if (analytics.loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  const wc = analytics.weekComparison;
  const b2 = analytics.b2Activation;

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition text-white/50 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold flex-1">Progress</h1>
      </div>

      {/* Top cards: CEFR + Streak */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl border border-white/10 p-4 flex flex-col items-center gap-1">
          <span className="text-3xl font-bold text-accent-light">{analytics.cefr}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">CEFR Level</span>
        </div>
        <div className="bg-card rounded-2xl border border-white/10 p-4 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <Flame size={22} className="text-orange-400" />
            <span className="text-3xl font-bold">{stats?.streak ?? 0}</span>
          </div>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Day Streak</span>
          <span className="text-[9px] text-white/20">{stats?.totalSessions ?? 0} sessions total</span>
        </div>
      </div>

      {/* Campaign status */}
      <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Flag size={14} className="text-accent-light" />
          <h2 className="text-sm font-medium text-white/60">Campaign Status</h2>
        </div>
        <p className="text-sm font-semibold">
          {activeMission?.title ?? "No active mission"}
        </p>
        <p className="text-xs text-white/45">
          {activeMission?.summary ??
            "Select a mission to get continuous adaptive progression with clear unlock rules."}
        </p>
        {activeProgress && (
          <p className="text-[11px] text-white/40">
            Credits: Bronze {activeProgress.credits?.bronze ?? 0} · Silver {activeProgress.credits?.silver ?? 0} · Gold {activeProgress.credits?.gold ?? 0}
            {(activeProgress.criticalErrorsCount ?? 0) > 0 ? ` · ${activeProgress.criticalErrorsCount} critical blockers` : ""}
          </p>
        )}
        <div className="pt-2 border-t border-white/10 flex items-center gap-3">
          <Link href="/missions" className="text-[11px] text-accent-light">Open mission hub</Link>
          <Link href="/exercises?focus=recovery" className="text-[11px] text-warn">Run recovery drills</Link>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-accent-light" />
            <h2 className="text-sm font-medium text-white/60">Activity Calendar</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (month === 0) {
                  setYear(year - 1);
                  setMonth(11);
                } else {
                  setMonth(month - 1);
                }
                setSelectedDate(null);
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 transition"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} className="text-white/60" />
            </button>
            <button
              onClick={() => {
                setYear(wYear);
                setMonth(wMonth);
                setSelectedDate(todayStr);
              }}
              className="px-2 py-1 rounded-lg hover:bg-white/5 transition text-xs font-medium"
            >
              {monthName}
            </button>
            <button
              onClick={() => {
                if (month === 11) {
                  setYear(year + 1);
                  setMonth(0);
                } else {
                  setMonth(month + 1);
                }
                setSelectedDate(null);
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 transition"
              aria-label="Next month"
            >
              <ChevronRight size={16} className="text-white/60" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-[9px] text-white/25 font-medium py-0.5">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />;
            const selected = selectedDate === day.date;
            const today = day.date === todayStr;
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(selected ? null : day.date)}
                className={cn(
                  "relative h-9 rounded-md flex items-center justify-center text-xs transition",
                  selected && "ring-1.5 ring-white/50",
                  today && "font-bold",
                  day.status === "gold" && "bg-yellow-500/20 text-yellow-400",
                  day.status === "silver" && "bg-slate-400/20 text-slate-300",
                  day.status === "bronze" && "bg-amber-700/20 text-amber-500",
                  day.status === "ready" && "bg-accent/15 text-accent-light",
                  day.status === "empty" && "text-white/15",
                  day.status === "future" && "text-white/10",
                )}
              >
                {day.day}
                {day.sessionCount > 1 && (
                  <span className="absolute -bottom-0.5 -right-0.5 min-w-3 h-3 px-0.5 rounded-full bg-white/15 text-[8px] leading-3 text-white/80">
                    {day.sessionCount}
                  </span>
                )}
                {day.checkpointCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-success" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent" /><span className="text-[9px] text-white/25">Ready</span></div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-600" /><span className="text-[9px] text-white/25">Bronze</span></div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /><span className="text-[9px] text-white/25">Silver</span></div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /><span className="text-[9px] text-white/25">Gold</span></div>
        </div>

        {selectedDate && (
          <div className="pt-2 border-t border-white/10 space-y-3">
            <p className="text-xs text-white/35 text-center">
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            {(completedModes[selectedDate]?.total ?? 0) > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-[11px] text-white/45 text-center">
                Sessions: Bronze {completedModes[selectedDate]?.quick ?? 0} · Silver {completedModes[selectedDate]?.standard ?? 0} · Gold {completedModes[selectedDate]?.deep ?? 0}
                {(completedModes[selectedDate]?.checkpoints ?? 0) > 0 ? ` · Checkpoints ${completedModes[selectedDate]?.checkpoints ?? 0}` : ""}
              </div>
            )}
            {selectedHasExercises ? (
              <ModeSelector
                exerciseCounts={exerciseCounts}
                onSelect={(mode) => router.push(`/session/${selectedDate}?mode=${mode}`)}
                suggested={suggestedMode}
                date={selectedDate}
              />
            ) : selectedSessionStats && selectedSessionStats.total > 0 && selectedIsPast ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-accent-light">Past Session Summary</p>
                <p className="text-sm text-white/65">
                  Bronze {selectedSessionStats.quick} · Silver {selectedSessionStats.standard} · Gold {selectedSessionStats.deep}
                </p>
                <Link
                  href={`/session/${selectedDate}/history`}
                  className="inline-block text-[11px] text-accent-light"
                >
                  View session details
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-sm text-white/30">
                No exercises for this day
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-[11px] text-white/35 uppercase tracking-wider px-1">Learning Activity</p>

      {/* 7-Day Comparison */}
      {wc && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-accent-light" />
            <h2 className="text-sm font-medium text-white/60">This Week vs Last</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendIcon trend={wc.volumeTrend} />
                <span className="text-sm">{wc.current.sessions} sessions</span>
              </div>
              <p className="text-[10px] text-white/30 ml-6">
                {wc.previous.sessions > 0 ? `was ${wc.previous.sessions} last week` : "first week!"}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendIcon trend={wc.ratingTrend} />
                <span className="text-sm">{wc.current.avgRating}/5 avg</span>
              </div>
              <p className="text-[10px] text-white/30 ml-6">
                {wc.previous.avgRating > 0 ? `was ${wc.previous.avgRating}/5` : "—"}
              </p>
            </div>
          </div>
          {/* Error trend */}
          {(wc.current.errors > 0 || wc.previous.errors > 0) && (
            <div className="pt-2 border-t border-white/5 flex items-center gap-2">
              <span className="text-xs text-white/40">Errors:</span>
              <span className="text-xs text-warn">{wc.current.errors} this week</span>
              {wc.previous.errors > 0 && (
                <span className="text-[10px] text-white/25">({wc.previous.errors} last)</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode Completions — always show all three tiers */}
      <div className="flex gap-2">
        {MODE_META.map(({ mode, label, emoji, color }) => {
          const data = analytics.modeBreakdown[mode];
          return (
            <div
              key={mode}
              className={`flex-1 rounded-xl border bg-gradient-to-br ${color} px-3 py-2.5 text-center ${!data ? "opacity-40" : ""}`}
            >
              <span className="text-base">{emoji}</span>
              <p className="text-sm font-semibold tabular-nums">{data ? `${data.sessions}x` : "—"}</p>
              <p className="text-[9px] text-white/30">{data ? `avg ${data.avgRating}/5` : label}</p>
            </div>
          );
        })}
      </div>

      {/* Weekly Activity Chart */}
      {weeklyTrends.some((w) => w.sessions > 0) && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-accent-light" />
              <h2 className="text-sm font-medium text-white/60">Weekly Activity</h2>
            </div>
            <span className="text-[10px] text-white/30">
              {weeklyTrends.reduce((s, w) => s + w.minutes, 0)} min total
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {weeklyTrends.map((week, i) => {
              const maxS = Math.max(...weeklyTrends.map((w) => w.sessions), 1);
              const pct = (week.sessions / maxS) * 100;
              const isCurrent = i === weeklyTrends.length - 1;
              return (
                <div key={week.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "48px" }}>
                    <div
                      className={cn(
                        "w-full max-w-[20px] rounded-t-md transition-all",
                        isCurrent ? "bg-accent" : "bg-white/10",
                        week.sessions === 0 && "bg-white/5",
                      )}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span className={cn("text-[7px]", isCurrent ? "text-accent-light" : "text-white/20")}>
                    {week.label.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SRS Deck Health */}
      {analytics.srs && analytics.srs.total > 0 && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-purple-400" />
            <h2 className="text-sm font-medium text-white/60">SRS Deck</h2>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-accent-light">{analytics.srs.dueToday}</p>
              <p className="text-[9px] text-white/30">due</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success">{analytics.srs.mastered}</p>
              <p className="text-[9px] text-white/30">mastered</p>
            </div>
            <div>
              <p className="text-lg font-bold">{analytics.srs.learning}</p>
              <p className="text-[9px] text-white/30">learning</p>
            </div>
            <div>
              <p className="text-lg font-bold text-warn">{analytics.srs.lapsed}</p>
              <p className="text-[9px] text-white/30">lapsed</p>
            </div>
          </div>
          {analytics.srs.retentionRate > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <span className="text-xs text-white/40">Retention:</span>
              <span className={cn("text-xs font-medium", analytics.srs.retentionRate >= 80 ? "text-success" : analytics.srs.retentionRate >= 60 ? "text-warn" : "text-danger")}>
                {analytics.srs.retentionRate}%
              </span>
              <span className="text-[10px] text-white/20">({analytics.srs.total} cards total)</span>
            </div>
          )}
        </div>
      )}

      {/* Mistakes to Learn From — correction cards from SRS */}
      {corrections.total > 0 && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-warn" />
              <h2 className="text-sm font-medium text-white/60">Mistakes to learn from</h2>
            </div>
            <span className="text-[10px] text-white/30">{corrections.total} cards</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(corrections.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-warn/10 text-warn/70">
                  {ERROR_CAT_LABELS[cat] || cat} ({count})
                </span>
              ))}
          </div>
          <div className="space-y-2">
            {corrections.recent.map((card: AnyCard) => (
              <div key={card._id} className="text-xs py-1.5 border-b border-white/5 last:border-0">
                <p className="text-white/80">{card.it}</p>
                <p className="text-white/40 mt-0.5">{card.en}</p>
              </div>
            ))}
          </div>
          <Link
            href="/exercises?focus=recovery"
            className="inline-block text-[11px] text-warn"
          >
            Start a focused recovery set
          </Link>
        </div>
      )}

      <p className="text-[11px] text-white/35 uppercase tracking-wider px-1">Skills Map</p>

      {/* B2 Activation */}
      {b2 && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            {b2.unlocked ? <Unlock size={16} className="text-success" /> : <Lock size={16} className="text-warn" />}
            <h2 className="text-sm font-medium text-white/60">
              {b2.unlocked ? "B2 Unlocked!" : "B2 Activation"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/5 rounded-full">
              <div
                className={cn("h-full rounded-full transition-all duration-700", b2.unlocked ? "bg-success" : "bg-warn")}
                style={{ width: `${Math.min(100, b2.pct)}%` }}
              />
            </div>
            <span className="text-xs text-white/40 tabular-nums">{b2.mastered}/{b2.total}</span>
          </div>
          <p className="text-[10px] text-white/30">
            {b2.unlocked
              ? "B2 content available"
              : `${b2.remaining} more B1 skills at 3+ to unlock B2`}
          </p>
        </div>
      )}

      {/* Category Strengths */}
      {Object.keys(analytics.categoryStrengths).length > 0 && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-accent-light" />
            <h2 className="text-sm font-medium text-white/60">Skill Categories</h2>
          </div>
          {Object.entries(analytics.categoryStrengths)
            .sort(([, a], [, b]) => a.avgRating - b.avgRating)
            .map(([cat, data]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-white/50 w-20">{CAT_LABELS[cat] ?? cat}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", data.avgRating >= 3 ? "bg-success" : data.avgRating >= 2 ? "bg-accent" : data.avgRating >= 1 ? "bg-yellow-400" : "bg-warn")}
                    style={{ width: `${(data.avgRating / 4) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/30 w-8 text-right">{data.avgRating}/4</span>
              </div>
            ))}
        </div>
      )}

      {/* Recent Level-Ups */}
      {analytics.recentLevelUps.length > 0 && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-2">
          <h2 className="text-sm font-medium text-white/60">🎯 Recently Improved</h2>
          {analytics.recentLevelUps.map((skill) => (
            <MilestoneBar key={skill.id} name={skill.name} rating={skill.rating} level={skill.level} />
          ))}
        </div>
      )}

      {/* Full Skill Breakdown by Level */}
      {Object.entries(groupedByLevel).length > 0 && (
        <details className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
          <summary className="text-sm font-medium cursor-pointer text-white/70">
            Full Skill Breakdown
          </summary>
          <div className="pt-2 space-y-3">
            {["A1", "A2", "B1", "B2"].map((level) => {
              const skills = groupedByLevel[level];
              if (!skills?.length) return null;
              const levelData = analytics.levels[level];
              return (
                <div key={level} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", LEVEL_COLORS[level] ?? "bg-white/20")} />
                      <h3 className="text-sm font-medium">{level}</h3>
                      <span className="text-[10px] text-white/30">{skills.length} skills</span>
                    </div>
                    {levelData && (
                      <span className="text-[10px] text-white/30">
                        {levelData.masteredPct}% mastered
                      </span>
                    )}
                  </div>
                  {levelData && (
                    <div className="flex gap-1">
                      {levelData.distribution.map((count, i) => (
                        <div key={i} className="flex-1 text-center">
                          <div
                            className={cn(
                              "h-1 rounded-full mx-0.5",
                              i === 0 ? "bg-white/10" : i === 1 ? "bg-warn" : i === 2 ? "bg-yellow-400" : i === 3 ? "bg-accent" : "bg-success",
                            )}
                            style={{ opacity: count > 0 ? 1 : 0.2 }}
                          />
                          <span className="text-[8px] text-white/20">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {skills.map((skill: { skillId: string; name: string; rating: number; level: string }) => (
                      <MilestoneBar key={skill.skillId} name={skill.name} rating={skill.rating} level={skill.level} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </DashboardShell>
  );
}
