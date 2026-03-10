"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  Loader2,
  TrendingUp,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { DashboardShell } from "@/components/layout/ScreenShell";
import ModeSelector from "@/components/ModeSelector";
import { cn } from "@/lib/cn";
import { getNowWarsaw } from "@/lib/date";
import {
  inventoryToExerciseCounts,
  pickRunnableMode,
  type InventoryStatusResult,
} from "@/lib/inventoryStatus";
import { useProgressAnalytics } from "@/hooks/useProgressAnalytics";
import type {
  ActiveMissionResult,
  CatalogMission,
  LearnerMission,
} from "@/lib/missionTypes";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

type DayStatus = "gold" | "silver" | "bronze" | "ready" | "empty" | "future";

interface DayInfo {
  date: string;
  day: number;
  status: DayStatus;
  sessionCount: number;
  checkpointCount: number;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function weightedMissionProgress(mission: LearnerMission | undefined, catalogMission: CatalogMission | undefined) {
  if (!mission || !catalogMission) return 0;

  const targets = catalogMission.exerciseTargets;
  const bronzePct = targets.bronzeReviews > 0
    ? Math.min(1, (mission.credits?.bronze ?? 0) / targets.bronzeReviews)
    : 1;
  const silverPct = targets.silverDrills > 0
    ? Math.min(1, (mission.credits?.silver ?? 0) / targets.silverDrills)
    : 1;
  const goldPct = targets.goldConversations > 0
    ? Math.min(1, (mission.credits?.gold ?? 0) / targets.goldConversations)
    : 1;

  return clampPct(((bronzePct + silverPct + goldPct) / 3) * 100);
}

const SKILL_LEVELS = ["A1", "A2", "B1", "B2"] as const;
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

export default function ProgressPage() {
  const router = useRouter();
  const analytics = useProgressAnalytics();
  const { year: currentYear, month: currentMonth, dateStr: todayStr } = getNowWarsaw();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  const stats = useQuery(api.sessions.getStats);
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMissionResult | null | undefined;
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[] }
    | undefined;
  const catalog = useQuery(api.missions.listCatalog, {}) as
    | { missions: CatalogMission[] }
    | undefined;
  const recentSessions = useQuery(api.sessions.listRecent, { limit: 200 });
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });
  const allCards = useQuery(api.cards.getAll) as Record<string, unknown>[] | undefined;

  const from = formatDate(year, month, 1);
  const to = formatDate(year, month, new Date(year, month + 1, 0).getDate());
  const exerciseSummaries = useQuery(api.exercises.getDateSummaries, { from, to });
  const calendarSessions = useQuery(api.sessions.getByDateRange, { from, to });

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

  const activeProgress = learnerProgress?.missions?.find((mission) => mission.active);
  const catalogMission = useMemo(
    () => catalog?.missions?.find((mission) => mission.missionId === activeMission?.missionId),
    [activeMission?.missionId, catalog?.missions],
  );

  const missionProgress = useMemo(
    () => weightedMissionProgress(activeProgress, catalogMission),
    [activeProgress, catalogMission],
  );

  const completedModes = useMemo(() => {
    const byDate: Record<string, { quick: number; standard: number; deep: number; total: number; checkpoints: number }> = {};
    if (!calendarSessions) return byDate;

    for (const session of calendarSessions) {
      if (!byDate[session.date]) {
        byDate[session.date] = { quick: 0, standard: 0, deep: 0, total: 0, checkpoints: 0 };
      }
      if (session.mode === "quick") byDate[session.date].quick += 1;
      if (session.mode === "standard") byDate[session.date].standard += 1;
      if (session.mode === "deep") byDate[session.date].deep += 1;
      if (session.checkpointAwardedId) byDate[session.date].checkpoints += 1;
      byDate[session.date].total += 1;
    }

    return byDate;
  }, [calendarSessions]);

  const exerciseDates = useMemo(() => {
    const dates = new Set<string>();
    if (exerciseSummaries) {
      for (const summary of exerciseSummaries) dates.add(summary.date);
    }
    return dates;
  }, [exerciseSummaries]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = useMemo(() => {
    const entries: (DayInfo | null)[] = [];
    for (let i = 0; i < startOffset; i += 1) entries.push(null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = formatDate(year, month, day);
      const isFuture = date > todayStr;
      const hasExercises = exerciseDates.has(date) || (date === todayStr && (dueCards?.length ?? 0) > 0);
      const summary = completedModes[date];

      let status: DayStatus = "empty";
      if (isFuture && !hasExercises) {
        status = "future";
      } else if (summary?.deep) {
        status = "gold";
      } else if (summary?.standard) {
        status = "silver";
      } else if (summary?.quick) {
        status = "bronze";
      } else if (hasExercises) {
        status = "ready";
      }

      entries.push({
        date,
        day,
        status,
        sessionCount: summary?.total ?? 0,
        checkpointCount: summary?.checkpoints ?? 0,
      });
    }

    return entries;
  }, [completedModes, daysInMonth, dueCards?.length, exerciseDates, month, startOffset, todayStr, year]);

  const exerciseCounts = useMemo(() => {
    const inventory = activeMission?.missionId ? selectedMissionInventoryStatus : selectedInventoryStatus;
    if (!inventory) return {};
    const dueCardsCount = selectedDate === todayStr ? (dueCards?.length ?? 0) : 0;
    return inventoryToExerciseCounts(inventory, dueCardsCount);
  }, [activeMission?.missionId, dueCards?.length, selectedDate, selectedInventoryStatus, selectedMissionInventoryStatus, todayStr]);

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
    if (selectedDate === todayStr && activeProgress && catalogMission) {
      const bronzeMissing = catalogMission.exerciseTargets.bronzeReviews - (activeProgress.credits?.bronze ?? 0);
      const silverMissing = catalogMission.exerciseTargets.silverDrills - (activeProgress.credits?.silver ?? 0);
      const goldMissing = catalogMission.exerciseTargets.goldConversations - (activeProgress.credits?.gold ?? 0);
      const preferred =
        goldMissing > 0 ? "deep" : silverMissing > 0 ? "standard" : bronzeMissing > 0 ? "quick" : "standard";
      return pickRunnableMode(preferred, inventory, dueCardsCount) ?? undefined;
    }

    return pickRunnableMode("standard", inventory, dueCardsCount) ?? undefined;
  }, [
    activeMission?.missionId,
    activeProgress,
    catalogMission,
    dueCards?.length,
    selectedDate,
    selectedInventoryStatus,
    selectedMissionInventoryStatus,
    todayStr,
  ]);

  const weeklyTrends = useMemo(() => {
    if (!recentSessions) return [];

    const now = new Date();
    const weeks: { label: string; sessions: number }[] = [];
    for (let index = 7; index >= 0; index -= 1) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - index * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const startStr = weekStart.toLocaleDateString("sv-SE");
      const endStr = weekEnd.toLocaleDateString("sv-SE");
      const sessions = recentSessions.filter((session) => session.date >= startStr && session.date <= endStr);
      weeks.push({
        label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sessions: sessions.length,
      });
    }

    return weeks;
  }, [recentSessions]);

  const corrections = useMemo(() => {
    if (!allCards) return null;
    const correctionCards = allCards.filter((card) => card.source === "correction");
    if (correctionCards.length === 0) return null;
    const byCategory: Record<string, number> = {};
    for (const card of correctionCards) {
      const category =
        typeof card.errorCategory === "string" ? card.errorCategory : "other";
      byCategory[category] = (byCategory[category] ?? 0) + 1;
    }
    return Object.entries(byCategory).sort(([, a], [, b]) => b - a).slice(0, 4);
  }, [allCards]);

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (analytics.loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </main>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center gap-3">
        <Link href="/" className="rounded-lg p-2 -ml-2 text-white/50 transition hover:bg-white/5 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">Progress</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-card p-4 text-center">
          <p className="text-3xl font-bold text-accent-light">{analytics.cefr}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/30">Current level</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Flame size={22} className="text-orange-400" />
            <p className="text-3xl font-bold">{stats?.streak ?? 0}</p>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-white/30">Day streak</p>
          <p className="text-[10px] text-white/20">{stats?.totalSessions ?? 0} sessions total</p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Flag size={14} className="text-accent-light" />
          <h2 className="text-sm font-medium text-white/70">Current mission</h2>
        </div>
        <div>
          <p className="text-sm font-semibold">{activeMission?.title ?? "No active mission"}</p>
          <p className="mt-1 text-xs text-white/45">
            {activeMission?.summary ?? "Pick a mission to get structured Bronze, Silver, and Gold progression."}
          </p>
        </div>
        {catalogMission && activeProgress && (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-white/45">
                <span>Mission progress</span>
                <span>{missionProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${missionProgress}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/[0.03] p-2">
                <p className="text-sm font-semibold text-amber-400">
                  {Math.min(activeProgress.credits?.bronze ?? 0, catalogMission.exerciseTargets.bronzeReviews)}/{catalogMission.exerciseTargets.bronzeReviews}
                </p>
                <p className="text-[10px] text-white/35">Bronze</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-2">
                <p className="text-sm font-semibold text-slate-300">
                  {Math.min(activeProgress.credits?.silver ?? 0, catalogMission.exerciseTargets.silverDrills)}/{catalogMission.exerciseTargets.silverDrills}
                </p>
                <p className="text-[10px] text-white/35">Silver</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-2">
                <p className="text-sm font-semibold text-yellow-400">
                  {Math.min(activeProgress.credits?.gold ?? 0, catalogMission.exerciseTargets.goldConversations)}/{catalogMission.exerciseTargets.goldConversations}
                </p>
                <p className="text-[10px] text-white/35">Gold</p>
              </div>
            </div>
          </>
        )}
        <p className="text-[11px] text-white/35">
          Choose a session level to move the mission forward. Once a level reaches 100%, you can still replay it for practice, but it will not add more mission progress.
        </p>
      </section>

      {SKILL_LEVELS.some((level) => analytics.levels[level]) && (
        <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-accent-light" />
            <h2 className="text-sm font-medium text-white/70">Skills progression</h2>
          </div>
          <div className="space-y-3">
            {SKILL_LEVELS.map((level) => {
              const data = analytics.levels[level];
              if (!data) return null;
              return (
                <div key={level} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-white/45">
                    <span>{level}</span>
                    <span>{data.mastered}/{data.total} mastered</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-accent transition-all"
                      style={{ width: `${data.masteredPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-accent-light" />
            <h2 className="text-sm font-medium text-white/70">Activity calendar</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (month === 0) {
                  setYear(year - 1);
                  setMonth(11);
                } else {
                  setMonth(month - 1);
                }
                setSelectedDate(null);
              }}
              className="rounded-lg p-1.5 transition hover:bg-white/5"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} className="text-white/60" />
            </button>
            <button
              type="button"
              onClick={() => {
                setYear(currentYear);
                setMonth(currentMonth);
                setSelectedDate(todayStr);
              }}
              className="rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-white/5"
            >
              {monthName}
            </button>
            <button
              type="button"
              onClick={() => {
                if (month === 11) {
                  setYear(year + 1);
                  setMonth(0);
                } else {
                  setMonth(month + 1);
                }
                setSelectedDate(null);
              }}
              className="rounded-lg p-1.5 transition hover:bg-white/5"
              aria-label="Next month"
            >
              <ChevronRight size={16} className="text-white/60" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="py-0.5 text-center text-[9px] font-medium text-white/25">
              {weekday}
            </div>
          ))}
          {days.map((day, index) => {
            if (!day) return <div key={`pad-${index}`} />;
            const selected = selectedDate === day.date;
            const isToday = day.date === todayStr;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(selected ? null : day.date)}
                className={cn(
                  "relative flex h-9 items-center justify-center rounded-md text-xs transition",
                  selected && "ring-1.5 ring-white/50",
                  isToday && "font-bold",
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
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 min-w-3 rounded-full bg-white/15 px-0.5 text-[8px] leading-3 text-white/80">
                    {day.sessionCount}
                  </span>
                )}
                {day.checkpointCount > 0 && (
                  <span className="absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full bg-success" />
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="space-y-3 border-t border-white/10 pt-2">
            <p className="text-center text-xs text-white/35">
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            {(selectedSessionStats?.total ?? 0) > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-center text-[11px] text-white/45">
                Bronze {selectedSessionStats?.quick ?? 0} · Silver {selectedSessionStats?.standard ?? 0} · Gold {selectedSessionStats?.deep ?? 0}
                {(selectedSessionStats?.checkpoints ?? 0) > 0 ? ` · Checkpoints ${selectedSessionStats?.checkpoints ?? 0}` : ""}
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
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                <p className="text-[11px] uppercase tracking-wider text-accent-light">Past session summary</p>
                <Link href={`/session/${selectedDate}/history`} className="text-[11px] text-accent-light">
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
      </section>

      {weeklyTrends.some((week) => week.sessions > 0) && (
        <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-accent-light" />
            <h2 className="text-sm font-medium text-white/70">Weekly activity</h2>
          </div>
          <div className="flex h-16 items-end gap-1.5">
            {weeklyTrends.map((week, index) => {
              const maxSessions = Math.max(...weeklyTrends.map((entry) => entry.sessions), 1);
              const height = (week.sessions / maxSessions) * 100;
              const current = index === weeklyTrends.length - 1;
              return (
                <div key={week.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-12 w-full items-end justify-center">
                    <div
                      className={cn(
                        "w-full max-w-[20px] rounded-t-md",
                        current ? "bg-accent" : "bg-white/10",
                        week.sessions === 0 && "bg-white/5",
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className={cn("text-[7px]", current ? "text-accent-light" : "text-white/20")}>
                    {week.label.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {analytics.srs && analytics.srs.total > 0 && (
        <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-purple-400" />
            <h2 className="text-sm font-medium text-white/70">SRS deck</h2>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-accent-light">{analytics.srs.dueToday}</p>
              <p className="text-[9px] text-white/30">Due</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success">{analytics.srs.mastered}</p>
              <p className="text-[9px] text-white/30">Mastered</p>
            </div>
            <div>
              <p className="text-lg font-bold">{analytics.srs.learning}</p>
              <p className="text-[9px] text-white/30">Learning</p>
            </div>
            <div>
              <p className="text-lg font-bold text-warn">{analytics.srs.lapsed}</p>
              <p className="text-[9px] text-white/30">Lapsed</p>
            </div>
          </div>
          <p className="text-xs text-white/40">
            Retention {analytics.srs.retentionRate}% · {analytics.srs.total} cards total
          </p>
        </section>
      )}

      {corrections && (
        <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-warn" />
            <h2 className="text-sm font-medium text-white/70">Error review</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {corrections.map(([category, count]) => (
              <span key={category} className="rounded-full bg-warn/10 px-2 py-0.5 text-[10px] text-warn/80">
                {ERROR_CAT_LABELS[category] ?? category} ({count})
              </span>
            ))}
          </div>
          <Link href="/exercises?focus=recovery" className="inline-block text-[11px] text-warn">
            Review recent mistakes
          </Link>
        </section>
      )}
    </DashboardShell>
  );
}
