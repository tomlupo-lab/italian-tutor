"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { DashboardShell } from "@/components/layout/ScreenShell";
import { cn } from "@/lib/cn";
import { getNowWarsaw } from "@/lib/date";
import { normalizeExerciseMode } from "@/lib/exerciseTypes";
import { getErrorInsight } from "@/lib/errorInsights";
import { getSkillBandStatus } from "@/lib/skillBands";
import { useProgressAnalytics } from "@/hooks/useProgressAnalytics";
import { withBasePath } from "@/lib/paths";
import type { LearnerStateSnapshot, LearnerSkill } from "@/lib/missionTypes";

type DayStatus = "gold" | "silver" | "bronze" | "ready" | "empty";

interface DayInfo {
  date: string;
  status: DayStatus;
  sessionCount: number;
  label: string;
}

type SkillGroupKey =
  | "vocabulary"
  | "grammar"
  | "listening"
  | "reading"
  | "speaking"
  | "conversation";

const SKILL_GROUPS: Array<{
  key: SkillGroupKey;
  label: string;
  skillKeys: string[];
}> = [
  { key: "vocabulary", label: "Vocabulary", skillKeys: ["vocab_core"] },
  { key: "grammar", label: "Grammar", skillKeys: ["grammar_forms", "grammar_syntax"] },
  { key: "listening", label: "Listening", skillKeys: ["listening_literal", "listening_inference"] },
  { key: "reading", label: "Reading", skillKeys: ["reading_comprehension"] },
  { key: "speaking", label: "Speaking", skillKeys: ["speaking_accuracy", "speaking_fluency", "pronunciation"] },
  { key: "conversation", label: "Conversation", skillKeys: ["pragmatics", "task_completion"] },
];

function skillProgressPct(skill: LearnerSkill) {
  const status = getSkillBandStatus(skill.skillKey, skill.points);
  if (status.nextThreshold) {
    return Math.max(0, Math.min(100, Math.round((skill.points / status.nextThreshold.points) * 100)));
  }
  if (status.currentThreshold) return 100;
  return 0;
}

export default function ProgressPage() {
  const analytics = useProgressAnalytics();
  const { dateStr: todayStr } = getNowWarsaw();
  const selectedDate = todayStr;

  const stats = useQuery(api.sessions.getStats);
  const learnerState = useQuery(api.learnerState.getSnapshot, {}) as LearnerStateSnapshot | undefined;
  const recentSessions = useQuery(api.sessions.listRecent, { limit: 200 });
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });

  const completedModes = useMemo(() => {
    const byDate: Record<string, { bronze: number; silver: number; gold: number; total: number }> = {};
    if (!recentSessions) return byDate;

    for (const session of recentSessions) {
      if (!byDate[session.date]) {
        byDate[session.date] = { bronze: 0, silver: 0, gold: 0, total: 0 };
      }
      const normalizedMode = normalizeExerciseMode(session.mode);
      if (normalizedMode === "bronze") byDate[session.date].bronze += 1;
      if (normalizedMode === "silver") byDate[session.date].silver += 1;
      if (normalizedMode === "gold") byDate[session.date].gold += 1;
      byDate[session.date].total += 1;
    }

    return byDate;
  }, [recentSessions]);

  const days = useMemo(() => {
    const entries: DayInfo[] = [];
    for (let index = 13; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const dateStr = date.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
      const hasExercises = dateStr === todayStr ? (dueCards?.length ?? 0) > 0 : Boolean(completedModes[dateStr]);
      const summary = completedModes[dateStr];

      let status: DayStatus = "empty";
      if (summary?.gold) status = "gold";
      else if (summary?.silver) status = "silver";
      else if (summary?.bronze) status = "bronze";
      else if (hasExercises) status = "ready";

      entries.push({
        date: dateStr,
        status,
        sessionCount: summary?.total ?? 0,
        label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
      });
    }
    return entries;
  }, [completedModes, dueCards?.length, todayStr]);

  const recentMistakes = useMemo(() => {
    const entries = Object.entries(analytics.errorBreakdown?.byCategory ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return {
      total,
      items: entries.map(([category, count]) => ({
        category,
        ...getErrorInsight(category),
        count,
        share: total > 0 ? Math.round((count / total) * 100) : 0,
      })),
    };
  }, [analytics.errorBreakdown]);

  const last7Days = useMemo(() => {
    const sessions = recentSessions ?? [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffStr = cutoff.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
    const weekSessions = sessions.filter((session) => session.date >= cutoffStr);
    const activeDays = new Set(weekSessions.map((session) => session.date)).size;
    return {
      sessions: weekSessions.length,
      activeDays,
    };
  }, [recentSessions]);

  const groupedSkills = useMemo(() => {
    const skills = learnerState?.skills ?? [];
    return SKILL_GROUPS.map((group) => {
      const relevant = skills.filter((skill) => group.skillKeys.includes(skill.skillKey));
      const pct = relevant.length > 0
        ? Math.round(relevant.reduce((sum, skill) => sum + skillProgressPct(skill), 0) / relevant.length)
        : 0;
      return { ...group, pct };
    });
  }, [learnerState?.skills]);

  const trendText = useMemo(() => {
    const comparison = analytics.weekComparison;
    if (!comparison) return "No recent sessions yet";
    if (comparison.volumeTrend === "up") return "More active than last week";
    if (comparison.volumeTrend === "down") return "Less active than last week";
    if (comparison.current.sessions > 0) return "Steady progress this week";
    return "No recent sessions yet";
  }, [analytics.weekComparison]);

  if (analytics.loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </main>
    );
  }

  return (
    <DashboardShell contentClassName="gap-6">
      <div className="flex items-center gap-3">
        <Link href={withBasePath("/")} className="rounded-lg p-2 -ml-2 text-white/50 transition hover:bg-white/5 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-lg font-semibold">Progress</h1>
      </div>

      <section className="rounded-2xl border border-white/10 bg-card p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">Snapshot</p>
          <h2 className="text-lg font-semibold">{analytics.cefr}</h2>
          <p className="text-sm text-white/45">{trendText}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="text-2xl font-semibold text-accent-light">{last7Days.sessions}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">This week</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="text-2xl font-semibold">{last7Days.activeDays}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Active days</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="text-2xl font-semibold">{stats?.streak ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/30">Streak</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">Skills now</p>
          <p className="text-sm text-white/45">Your current development by learner-facing skill area.</p>
        </div>
        <div className="space-y-3">
          {groupedSkills.map((group) => (
            <div key={group.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{group.label}</span>
                <span className="text-white/35">{group.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${group.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">Recent mistakes</p>
          <p className="text-sm text-white/45">What has been tripping you up most in recent sessions.</p>
        </div>
        {recentMistakes.items.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white/60">
              <p className="text-[11px] uppercase tracking-wider text-accent-light">Main pattern</p>
              <p className="mt-1 text-sm text-white">
                {recentMistakes.items[0]?.takeaway}
              </p>
            </div>
            <div className="space-y-2">
              <p className="px-1 text-[11px] uppercase tracking-wider text-white/35">Also showing up</p>
              {recentMistakes.items.map((mistake) => (
                <div key={mistake.category} className="rounded-xl bg-white/[0.03] px-3 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{mistake.label}</span>
                    <span className="text-sm text-white/45">{mistake.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-warn transition-all" style={{ width: `${mistake.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Link
              href={withBasePath("/drills?focus=recovery")}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm transition hover:bg-white/[0.05]"
            >
              <div className="space-y-0.5">
                <p className="font-medium text-white">Best next step</p>
                <p className="text-xs text-white/40">Practice mistakes</p>
              </div>
              <span className="text-white/40">Open</span>
            </Link>
            <p className="px-1 text-[11px] text-white/35">
              Based on {recentMistakes.total} recent mistakes across the latest sessions.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-white/[0.03] px-3 py-4 text-sm text-white/40">
            No recent mistakes recorded yet.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">Recent activity</p>
          <p className="text-sm text-white/45">Your last 14 days of study activity.</p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div key={day.date} className="space-y-1 text-center">
              <div
                className={cn(
                  "mx-auto h-8 w-8 rounded-full",
                  day.status === "gold" && "bg-yellow-500/20 border border-yellow-500/30",
                  day.status === "silver" && "bg-slate-400/20 border border-slate-400/30",
                  day.status === "bronze" && "bg-amber-700/20 border border-amber-700/30",
                  day.status === "ready" && "bg-accent/15 border border-accent/30",
                  day.status === "empty" && "bg-white/[0.03] border border-white/5",
                )}
              />
              <p className="text-[9px] text-white/30">{day.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center text-[11px] text-white/45">
          Last 7 days: {last7Days.activeDays} active day{last7Days.activeDays === 1 ? "" : "s"} · Today: Words {completedModes[todayStr]?.bronze ?? 0} · Drills {completedModes[todayStr]?.silver ?? 0} · Conversation {completedModes[todayStr]?.gold ?? 0}
        </div>
      </section>
    </DashboardShell>
  );
}
