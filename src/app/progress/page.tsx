"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import MilestoneBar from "@/components/MilestoneBar";
import ErrorHeatMap from "@/components/ErrorHeatMap";
import StreakCalendar from "@/components/StreakCalendar";
import { getNowWarsaw } from "@/lib/date";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// Group milestones by category
interface Milestone {
  skillId: string;
  name: string;
  level: string;
  category: string;
  rating: number;
  active: boolean;
}

const LEVEL_ORDER = ["A1", "A2", "B1", "B2"];

export default function ProgressPage() {
  const milestones = useQuery(api.milestones.getAll);
  const stats = useQuery(api.sessions.getStats);
  const { year, month, dateStr: today } = getNowWarsaw();

  // Recent sessions for error heatmap and streak calendar
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date(today + "T12:00:00");
    d.setDate(d.getDate() - 30);
    return d.toLocaleDateString("sv-SE");
  }, [today]);
  const recentSessions = useQuery(api.sessions.getByDateRange, {
    from: thirtyDaysAgo,
    to: today,
  });

  // Group milestones by category
  const groupedMilestones = useMemo(() => {
    if (!milestones) return {};
    const groups: Record<string, Milestone[]> = {};
    for (const m of milestones as Milestone[]) {
      if (!m.active) continue;
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    }
    // Sort within each group by level then name
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => {
        const li = LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level);
        if (li !== 0) return li;
        return a.name.localeCompare(b.name);
      });
    }
    return groups;
  }, [milestones]);

  // CEFR estimate: weighted average of ratings
  const cefrEstimate = useMemo(() => {
    if (!milestones || milestones.length === 0) return null;
    const active = (milestones as Milestone[]).filter((m) => m.active);
    if (active.length === 0) return null;
    const avg = active.reduce((sum, m) => sum + m.rating, 0) / active.length;
    if (avg >= 3.5) return "B2";
    if (avg >= 2.5) return "B1";
    if (avg >= 1.5) return "A2";
    return "A1";
  }, [milestones]);

  // Session dates for streak calendar
  const sessionDates = useMemo(() => {
    if (!recentSessions) return new Set<string>();
    return new Set(recentSessions.map((s) => s.date));
  }, [recentSessions]);

  // Error sessions for heatmap
  const errorSessions = useMemo(() => {
    if (!recentSessions) return [];
    return recentSessions.map((s) => ({
      date: s.date,
      errors: s.errors || [],
    }));
  }, [recentSessions]);

  // Loading
  if (milestones === undefined || recentSessions === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto pb-20 px-4 py-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition text-white/50 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Progress</h1>
          {cefrEstimate && (
            <p className="text-xs text-white/40">
              Estimated level: {cefrEstimate}
            </p>
          )}
        </div>
        {stats && (
          <div className="text-right text-xs text-white/40">
            <p>{stats.streak} day streak</p>
            <p>{stats.totalSessions} sessions</p>
          </div>
        )}
      </div>

      {/* Streak Calendar */}
      <div className="bg-card rounded-2xl border border-white/10 p-4">
        <StreakCalendar
          sessionDates={sessionDates}
          year={year}
          month={month}
        />
      </div>

      {/* Error Heat Map */}
      {errorSessions.some((s) => s.errors.length > 0) && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-2">
          <h2 className="text-sm font-medium text-white/60">
            Error patterns (30 days)
          </h2>
          <ErrorHeatMap sessions={errorSessions} />
        </div>
      )}

      {/* Milestone Progress */}
      {Object.keys(groupedMilestones).length > 0 ? (
        Object.entries(groupedMilestones).map(([category, skills]) => (
          <div
            key={category}
            className="bg-card rounded-2xl border border-white/10 p-4 space-y-3"
          >
            <h2 className="text-sm font-medium text-white/60 capitalize">
              {category}
            </h2>
            <div className="space-y-2">
              {skills.map((skill) => (
                <MilestoneBar
                  key={skill.skillId}
                  name={skill.name}
                  rating={skill.rating}
                  level={skill.level}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="bg-card rounded-2xl border border-white/10 p-6 text-center">
          <p className="text-white/50">No milestones yet</p>
          <p className="text-xs text-white/30 mt-1">
            Milestones are synced from the nightly intelligence engine.
          </p>
        </div>
      )}
    </main>
  );
}
