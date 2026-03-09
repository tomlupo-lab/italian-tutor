"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "../../lib/cn";
import { getNowWarsaw } from "../../lib/date";
import ModeSelector from "../../components/ModeSelector";
import { useRouter } from "next/navigation";
import type { ExerciseMode } from "@/lib/exerciseTypes";
import {
  inventoryToExerciseCounts,
  pickRunnableMode,
  type InventoryStatusResult,
} from "@/lib/inventoryStatus";
import type { CatalogMission, LearnerMission } from "@/lib/missionTypes";

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

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

export default function CalendarPage() {
  const router = useRouter();
  const { year: wYear, month: wMonth, dateStr: todayStr } = getNowWarsaw();
  const [year, setYear] = useState(wYear);
  const [month, setMonth] = useState(wMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  const from = formatDate(year, month, 1);
  const to = formatDate(year, month, new Date(year, month + 1, 0).getDate());

  const exerciseSummaries = useQuery(api.exercises.getDateSummaries, { from, to });
  const sessions = useQuery(api.sessions.getByDateRange, { from, to });
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });
  const activeMission = useQuery(api.missions.getActiveMission, {});
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[] }
    | undefined;
  const catalog = useQuery(api.missions.listCatalog, {}) as
    | { missions: CatalogMission[] }
    | undefined;

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

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfMonth + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Dates that have exercises
  const exerciseDates = useMemo(() => {
    const set = new Set<string>();
    if (exerciseSummaries) {
      for (const s of exerciseSummaries) set.add(s.date);
    }
    return set;
  }, [exerciseSummaries]);

  // Completed modes per date (from sessions)
  const completedModes = useMemo(() => {
    const map: Record<string, { quick: number; standard: number; deep: number; total: number; checkpoints: number }> = {};
    if (sessions) {
      for (const s of sessions) {
        if (!map[s.date]) map[s.date] = { quick: 0, standard: 0, deep: 0, total: 0, checkpoints: 0 };
        if (s.mode === "quick") map[s.date].quick += 1;
        if (s.mode === "standard") map[s.date].standard += 1;
        if (s.mode === "deep") map[s.date].deep += 1;
        if (s.checkpointAwardedId) map[s.date].checkpoints += 1;
        map[s.date].total += 1;
      }
    }
    return map;
  }, [sessions]);

  // Determine highest tier completed for a date
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, daysInMonth, startOffset, exerciseDates, completedModes, todayStr, dueCards]);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedDate(null);
  };

  // Exercise counts for ModeSelector
  const exerciseCounts = useMemo(() => {
    const inventory = activeMission?.missionId
      ? selectedMissionInventoryStatus
      : selectedInventoryStatus;
    if (!inventory) return {};
    const dueCardsCount = selectedDate === todayStr ? (dueCards?.length ?? 0) : 0;
    return inventoryToExerciseCounts(inventory, dueCardsCount);
  }, [activeMission?.missionId, selectedMissionInventoryStatus, selectedInventoryStatus, selectedDate, todayStr, dueCards]);

  const handleModeSelect = (mode: ExerciseMode) => {
    if (selectedDate) {
      router.push(`/session/${selectedDate}?mode=${mode}`);
    }
  };

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isToday = (date: string) => date === todayStr;
  const selectedHasExercises = useMemo(
    () => Object.values(exerciseCounts).some((count) => count > 0),
    [exerciseCounts],
  );
  const selectedSessionStats = selectedDate ? completedModes[selectedDate] : null;
  const selectedIsPast = Boolean(selectedDate && selectedDate < todayStr);
  const suggestedMode = useMemo(() => {
    const inventory = activeMission?.missionId
      ? selectedMissionInventoryStatus
      : selectedInventoryStatus;
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
    selectedMissionInventoryStatus,
    selectedInventoryStatus,
    selectedDate,
    todayStr,
    dueCards,
    learnerProgress?.missions,
    catalog?.missions,
  ]);

  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5 transition" aria-label="Previous month">
          <ChevronLeft size={18} className="text-white/60" />
        </button>
        <button
          onClick={() => {
            setYear(wYear);
            setMonth(wMonth);
            setSelectedDate(todayStr);
          }}
          className="text-sm font-semibold hover:text-accent-light transition"
          aria-label="Go to today"
        >
          {monthName}
          {(year !== wYear || month !== wMonth) && (
            <span className="ml-1.5 text-[10px] text-accent-light font-normal">today</span>
          )}
        </button>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5 transition" aria-label="Next month">
          <ChevronRight size={18} className="text-white/60" />
        </button>
      </div>

      {/* Calendar grid — compact */}
      <div className="bg-card rounded-2xl border border-white/10 p-2">
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-[9px] text-white/25 font-medium py-0.5">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />;

            const selected = selectedDate === day.date;
            const today = isToday(day.date);

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(selected ? null : day.date)}
                className={cn(
                  "relative h-8 rounded-md flex items-center justify-center text-xs transition",
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

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-2 pt-1.5 border-t border-white/5">
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent" /><span className="text-[9px] text-white/25">Ready</span></div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-600" /><span className="text-[9px] text-white/25">Bronze</span></div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /><span className="text-[9px] text-white/25">Silver</span></div>
          <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /><span className="text-[9px] text-white/25">Gold</span></div>
        </div>
      </div>

      {/* Selected day → ModeSelector (same as home page) */}
      {selectedDate && (
        <div className="space-y-2">
          <p className="text-xs text-white/30 text-center">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          {(completedModes[selectedDate]?.total ?? 0) > 0 && (
            <div className="bg-card rounded-xl border border-white/10 p-2.5 text-[11px] text-white/45 text-center">
              Sessions: Bronze {completedModes[selectedDate]?.quick ?? 0} · Silver {completedModes[selectedDate]?.standard ?? 0} · Gold {completedModes[selectedDate]?.deep ?? 0}
              {(completedModes[selectedDate]?.checkpoints ?? 0) > 0 && (
                <> · Checkpoints {completedModes[selectedDate]?.checkpoints ?? 0}</>
              )}
            </div>
          )}

          {selectedHasExercises ? (
            <ModeSelector
              exerciseCounts={exerciseCounts}
              onSelect={handleModeSelect}
              suggested={suggestedMode}
              date={selectedDate}
            />
          ) : selectedSessionStats && selectedSessionStats.total > 0 && selectedIsPast ? (
            <div className="bg-card rounded-2xl border border-white/10 p-4 text-center space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-accent-light">Past Session Summary</p>
                <p className="text-sm text-white/65 mt-1">
                  Bronze {selectedSessionStats.quick} · Silver {selectedSessionStats.standard} · Gold {selectedSessionStats.deep}
                </p>
                <p className="text-xs text-white/35 mt-1">
                  {selectedSessionStats.total} total session{selectedSessionStats.total === 1 ? "" : "s"}
                  {selectedSessionStats.checkpoints > 0 ? ` · ${selectedSessionStats.checkpoints} checkpoint${selectedSessionStats.checkpoints === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <Link
                href={`/session/${selectedDate}/history`}
                className="inline-block px-4 py-2 rounded-xl border border-white/10 text-sm text-white/70 hover:bg-white/5 transition"
              >
                View session details
              </Link>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-white/10 p-4 text-center">
              <p className="text-white/30 text-sm">No exercises for this day</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
