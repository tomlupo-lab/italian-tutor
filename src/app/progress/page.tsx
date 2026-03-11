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
import { getSkillBandStatus } from "@/lib/skillBands";
import { useProgressAnalytics } from "@/hooks/useProgressAnalytics";
import { withBasePath } from "@/lib/paths";
import type { LearnerSkill } from "@/lib/missionTypes";

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

const ERROR_INSIGHT_META: Record<string, { label: string; takeaway: string }> = {
  article_gender_number: {
    label: "Articles and agreement",
    takeaway: "Article, gender, or plural agreement is slipping recently.",
  },
  agreement: {
    label: "Agreement",
    takeaway: "Matching words correctly is a frequent recent issue.",
  },
  cloze: {
    label: "Verb endings",
    takeaway: "Filling in the correct verb form is the main recent issue.",
  },
  conversation: {
    label: "Complete responses",
    takeaway: "Your answers are often missing part of what the task asks for.",
  },
  error_recognition: {
    label: "Grammar accuracy",
    takeaway: "Spotting and fixing grammar mistakes needs more attention.",
  },
  false_friend: {
    label: "False friends",
    takeaway: "Similar-looking words across languages are causing confusion.",
  },
  grammar_pattern: {
    label: "Verb tense",
    takeaway: "Choosing the right tense is the biggest recent problem.",
  },
  incomplete_response: {
    label: "Complete responses",
    takeaway: "You are often addressing only part of the task.",
  },
  instruction_misread: {
    label: "Instructions",
    takeaway: "The task prompt itself is being missed or only partly followed.",
  },
  lexical_choice: {
    label: "Word choice",
    takeaway: "Choosing the right word is the main recent weak spot.",
  },
  lexical_gap: {
    label: "Missing words",
    takeaway: "You are often missing the key word or phrase you need.",
  },
  listening_mishear: {
    label: "Listening detail",
    takeaway: "Small listening details are being misheard.",
  },
  negation_reversal: {
    label: "Negation",
    takeaway: "Negation is changing the meaning more often than it should.",
  },
  off_topic: {
    label: "Staying on topic",
    takeaway: "Responses are drifting away from the goal of the task.",
  },
  pragmatic_mismatch: {
    label: "Tone and register",
    takeaway: "The tone or social register is not matching the situation.",
  },
  preposition: {
    label: "Prepositions",
    takeaway: "Prepositions are the most common recent problem.",
  },
  pronunciation_prosody: {
    label: "Stress and rhythm",
    takeaway: "Stress or intonation patterns need more work.",
  },
  pronunciation_segmental: {
    label: "Pronunciation sounds",
    takeaway: "Specific Italian sounds are causing trouble.",
  },
  spelling: {
    label: "Spelling",
    takeaway: "Spelling accuracy is slipping in recent practice.",
  },
  srs_review: {
    label: "Word recall",
    takeaway: "Remembering reviewed words is the main recent issue.",
  },
  translation: {
    label: "Word choice",
    takeaway: "Finding the right translation quickly is causing mistakes.",
  },
  verb_conjugation: {
    label: "Verb endings",
    takeaway: "Verb conjugation is the main recent weak spot.",
  },
  verb_tense: {
    label: "Verb tense",
    takeaway: "Tense choice is the biggest recent problem.",
  },
  word_order: {
    label: "Word order",
    takeaway: "Sentence order is getting in the way of accuracy.",
  },
};

function getErrorInsight(category: string) {
  return (
    ERROR_INSIGHT_META[category] ?? {
      label: category.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      takeaway: "This issue is showing up frequently in recent practice.",
    }
  );
}

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
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { skills?: LearnerSkill[]; level?: { currentLevel?: string | null } | null }
    | undefined;
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

  const practiceMix = useMemo(() => {
    const breakdown = analytics.modeBreakdown ?? {};
    const bronze = breakdown.bronze?.sessions ?? 0;
    const silver = breakdown.silver?.sessions ?? 0;
    const gold = breakdown.gold?.sessions ?? 0;
    const total = bronze + silver + gold;
    const pct = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

    return {
      words: { count: bronze, pct: pct(bronze) },
      drills: { count: silver, pct: pct(silver) },
      conversation: { count: gold, pct: pct(gold) },
    };
  }, [analytics.modeBreakdown]);

  const groupedSkills = useMemo(() => {
    const skills = learnerProgress?.skills ?? [];
    return SKILL_GROUPS.map((group) => {
      const relevant = skills.filter((skill) => group.skillKeys.includes(skill.skillKey));
      const pct = relevant.length > 0
        ? Math.round(relevant.reduce((sum, skill) => sum + skillProgressPct(skill), 0) / relevant.length)
        : 0;
      return { ...group, pct };
    });
  }, [learnerProgress?.skills]);

  const strongestGroups = useMemo(
    () => [...groupedSkills].sort((a, b) => b.pct - a.pct).slice(0, 2),
    [groupedSkills],
  );
  const weakestGroups = useMemo(
    () => [...groupedSkills].sort((a, b) => a.pct - b.pct).slice(0, 2),
    [groupedSkills],
  );

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

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">Strongest now</p>
          {strongestGroups.map((group) => (
            <div key={group.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{group.label}</span>
                <span className="text-white/35">{group.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className="h-2 rounded-full bg-success" style={{ width: `${group.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">Needs work</p>
          {weakestGroups.map((group) => (
            <div key={group.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{group.label}</span>
                <span className="text-white/35">{group.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className="h-2 rounded-full bg-warn" style={{ width: `${group.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">Skill snapshot</p>
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
          <p className="text-[11px] uppercase tracking-wider text-accent-light">Practice mix</p>
          <p className="text-sm text-white/45">How your recent practice time is distributed.</p>
        </div>
        <div className="space-y-3">
          {[
            { label: "Words review", value: practiceMix.words },
            { label: "Drills", value: practiceMix.drills },
            { label: "Conversation", value: practiceMix.conversation },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-white/35">{item.value.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${item.value.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="text-lg font-semibold">{practiceMix.words.count}</p>
            <p className="text-[10px] text-white/30">Words</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="text-lg font-semibold">{practiceMix.drills.count}</p>
            <p className="text-[10px] text-white/30">Drills</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="text-lg font-semibold">{practiceMix.conversation.count}</p>
            <p className="text-[10px] text-white/30">Conversation</p>
          </div>
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
          {last7Days.activeDays} active days in the last 7 days
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center text-[11px] text-white/45">
          Today: Words {completedModes[todayStr]?.bronze ?? 0} · Drills {completedModes[todayStr]?.silver ?? 0} · Conversation {completedModes[todayStr]?.gold ?? 0}
        </div>
      </section>
    </DashboardShell>
  );
}
