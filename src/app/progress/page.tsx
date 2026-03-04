"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import MilestoneBar from "@/components/MilestoneBar";
import { ArrowLeft, Flame, Loader2, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

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

const LEVEL_ORDER = ["A1", "A2", "B1", "B2"];

const CATEGORY_LABELS: Record<string, string> = {
  cloze: "Fill-in-the-blank",
  word_order: "Word order",
  grammar_pattern: "Grammar patterns",
  translation: "Translation",
  error_recognition: "Error spotting",
  other: "General",
};

const MODE_META: { mode: string; label: string; emoji: string; color: string }[] = [
  { mode: "quick", label: "Bronze", emoji: "🥉", color: "from-amber-700/20 to-amber-800/5 border-amber-600/30" },
  { mode: "standard", label: "Silver", emoji: "🥈", color: "from-slate-400/20 to-slate-500/5 border-slate-400/30" },
  { mode: "deep", label: "Gold", emoji: "🥇", color: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30" },
];

function WeeklyTrends({ weeks }: { weeks: { label: string; sessions: number; minutes: number }[] }) {
  if (weeks.length === 0 || !weeks.some((w) => w.sessions > 0)) return null;
  const maxSessions = Math.max(...weeks.map((w) => w.sessions), 1);
  const totalMinutes = weeks.reduce((sum, w) => sum + w.minutes, 0);

  return (
    <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-accent-light" />
          <h2 className="text-sm font-medium text-white/60">Weekly Activity</h2>
        </div>
        <span className="text-[10px] text-white/30">{totalMinutes} min total</span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {weeks.map((week, i) => {
          const pct = maxSessions > 0 ? (week.sessions / maxSessions) * 100 : 0;
          const isCurrentWeek = i === weeks.length - 1;
          return (
            <div key={week.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: "60px" }}>
                <div
                  className={cn(
                    "w-full max-w-[24px] rounded-t-md transition-all",
                    isCurrentWeek ? "bg-accent" : "bg-white/10",
                    week.sessions === 0 && "bg-white/5",
                  )}
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className={cn(
                "text-[8px] leading-none",
                isCurrentWeek ? "text-accent-light" : "text-white/20",
              )}>
                {week.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const milestones = useQuery(api.milestones.getAll);
  const stats = useQuery(api.sessions.getStats);
  const allCards = useQuery(api.cards.getAll);
  const modeCounts = useQuery(api.sessions.getModeCounts);
  const recentSessions = useQuery(api.sessions.listRecent, { limit: 200 });

  // Group milestones by category
  const groupedMilestones = useMemo(() => {
    if (!milestones) return {};
    const groups: Record<string, Milestone[]> = {};
    for (const m of milestones as Milestone[]) {
      if (!m.active) continue;
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    }
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => {
        const li = LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level);
        if (li !== 0) return li;
        return a.name.localeCompare(b.name);
      });
    }
    return groups;
  }, [milestones]);

  // CEFR estimate from milestones, or fallback
  const cefrEstimate = useMemo(() => {
    if (!milestones) return null;
    const active = (milestones as Milestone[]).filter((m) => m.active);
    if (active.length === 0) return null;
    const avg = active.reduce((sum, m) => sum + m.rating, 0) / active.length;
    if (avg >= 3.5) return "B2";
    if (avg >= 2.5) return "B1";
    if (avg >= 1.5) return "A2";
    return "A1";
  }, [milestones]);

  const cefrLabel = cefrEstimate
    ? cefrEstimate
    : stats && stats.totalSessions > 0
      ? "A2"
      : "—";

  // Correction cards — recent mistakes to review
  const corrections = useMemo(() => {
    if (!allCards) return { recent: [], byCategory: {} as Record<string, number>, total: 0 };
    const correctionCards = (allCards as AnyCard[]).filter(
      (c) => c.source === "correction",
    );
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

  // Total mode completions
  const totalModeCompletions = modeCounts
    ? (modeCounts.quick ?? 0) + (modeCounts.standard ?? 0) + (modeCounts.deep ?? 0)
    : 0;

  // Weekly activity trends (last 8 weeks)
  const weeklyTrends = useMemo(() => {
    if (!recentSessions) return [];
    const now = new Date();
    const weeks: { label: string; sessions: number; minutes: number }[] = [];

    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - w * 7); // Monday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

      const startStr = weekStart.toLocaleDateString("sv-SE");
      const endStr = weekEnd.toLocaleDateString("sv-SE");

      const weekSessions = recentSessions.filter(
        (s) => s.date >= startStr && s.date <= endStr,
      );

      const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      weeks.push({
        label,
        sessions: weekSessions.length,
        minutes: Math.round(weekSessions.reduce((sum, s) => sum + s.duration, 0)),
      });
    }
    return weeks;
  }, [recentSessions]);

  // Loading
  if (milestones === undefined || stats === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto pb-24 px-4 py-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition text-white/50 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold flex-1">Progress</h1>
      </div>

      {/* Level + Streak cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Level card */}
        <div className="bg-card rounded-2xl border border-white/10 p-4 flex flex-col items-center gap-1">
          <span className="text-3xl font-bold text-accent-light">{cefrLabel}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">CEFR Level</span>
          {!cefrEstimate && stats && stats.totalSessions > 0 && (
            <span className="text-[9px] text-white/20">(starting)</span>
          )}
        </div>

        {/* Streak card */}
        <div className="bg-card rounded-2xl border border-white/10 p-4 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <Flame size={22} className="text-orange-400" />
            <span className="text-3xl font-bold">{stats?.streak ?? 0}</span>
          </div>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Day Streak</span>
          <span className="text-[9px] text-white/20">{stats?.totalSessions ?? 0} sessions total</span>
        </div>
      </div>

      {/* Mode Stats — chip row */}
      {modeCounts && totalModeCompletions > 0 && (
        <div className="flex gap-2">
          {MODE_META.map(({ mode, emoji, color }) => {
            const count = modeCounts[mode] ?? 0;
            return (
              <div
                key={mode}
                className={`flex-1 rounded-xl border bg-gradient-to-br ${color} px-3 py-2.5 flex items-center justify-center gap-1.5`}
              >
                <span className="text-base">{emoji}</span>
                <span className="text-sm font-semibold tabular-nums">{count}x</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly Trends */}
      <WeeklyTrends weeks={weeklyTrends} />

      {/* Mastered cards */}
      {stats && stats.masteredCards > 0 && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 flex items-center gap-3">
          <Trophy size={20} className="text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{stats.masteredCards} cards mastered</p>
            <p className="text-[10px] text-white/30">{stats.totalCards} total cards</p>
          </div>
        </div>
      )}

      {/* Recent Corrections */}
      {corrections.total > 0 && (
        <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/60">
              Mistakes to learn from
            </h2>
            <span className="text-[10px] text-white/30">
              {corrections.total} cards
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Object.entries(corrections.byCategory).map(([cat, count]) => (
              <span
                key={cat}
                className="text-[10px] px-2 py-0.5 rounded-full bg-warn/10 text-warn/70"
              >
                {CATEGORY_LABELS[cat] || cat} ({count})
              </span>
            ))}
          </div>

          <div className="space-y-2">
            {corrections.recent.map((card: AnyCard) => (
              <div
                key={card._id}
                className="text-xs py-1.5 border-b border-white/5 last:border-0"
              >
                <p className="text-white/80">{card.it}</p>
                <p className="text-white/40 mt-0.5">{card.en}</p>
              </div>
            ))}
          </div>
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
        <div className="bg-card rounded-2xl border border-white/10 p-4 text-center">
          <p className="text-white/40 text-sm">No skill milestones yet</p>
          <p className="text-xs text-white/30 mt-1">
            Milestones update as Marco analyzes your sessions.
          </p>
        </div>
      )}
    </main>
  );
}
