"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTodayWarsaw } from "@/lib/date";
import { prettySkillLabel } from "@/lib/labels";
import { SKILL_BAND_THRESHOLDS, getSkillBandStatus } from "@/lib/skillBands";
import type { LearnerStateSnapshot } from "@/lib/missionTypes";

// ── Types ──────────────────────────────────────────────────────────

interface Session {
  _id: string;
  date: string;
  duration: number;
  mode?: string;
  rating?: number;
  exercisesCompleted?: number;
  exercisesTotal?: number;
  errors: { original: string; corrected: string; category?: string; skillId?: string }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCard = Record<string, any>;

export interface LevelProgress {
  total: number;
  active: number;
  avgRating: number;
  mastered: number;
  masteredPct: number;
  struggling: number;
  distribution: number[];
}

export interface SkillInfo {
  id: string;
  name: string;
  level: string;
  rating: number;
}

export interface WeekComparison {
  current: { sessions: number; avgRating: number; exercises: number; errors: number };
  previous: { sessions: number; avgRating: number; exercises: number; errors: number };
  ratingTrend: "up" | "down" | "stable" | "new";
  volumeTrend: "up" | "down" | "stable" | "new";
}

export interface SrsHealth {
  total: number;
  dueToday: number;
  mastered: number;
  learning: number;
  newCards: number;
  lapsed: number;
  retentionRate: number;
  bySource: Record<string, number>;
}

export interface ErrorBreakdown {
  total: number;
  byCategory: Record<string, number>;
}

export interface ProgressAnalytics {
  loading: boolean;
  cefr: string;
  levels: Record<string, LevelProgress>;
  weakest: SkillInfo[];
  strongest: SkillInfo[];
  b2Activation: { mastered: number; total: number; threshold: number; remaining: number; pct: number; unlocked: boolean } | null;
  weekComparison: WeekComparison | null;
  modeBreakdown: Record<string, { sessions: number; avgRating: number; exercises: number }>;
  srs: SrsHealth | null;
  errorBreakdown: ErrorBreakdown | null;
}

// ── Helpers ─────────────────────────────────────────────────────────

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

// ── Hook ────────────────────────────────────────────────────────────

export function useProgressAnalytics(): ProgressAnalytics {
  const today = getTodayWarsaw();
  const thirtyDaysAgo = dateNDaysAgo(30);
  const fourteenDaysAgo = dateNDaysAgo(14);
  const sevenDaysAgo = dateNDaysAgo(7);

  const learnerState = useQuery(api.learnerState.getSnapshot, {}) as LearnerStateSnapshot | undefined;
  const sessions = useQuery(api.sessions.getByDateRange, { from: thirtyDaysAgo, to: today }) as Session[] | undefined;
  const allCards = useQuery(api.cards.getAll) as AnyCard[] | undefined;

  const loading = learnerState === undefined || sessions === undefined || allCards === undefined;

  // ── Skill Band Analysis ─────────────────────────────────────────

  const skillAnalysis = useMemo(() => {
    const skills = learnerState?.skills ?? [];
    if (skills.length === 0) return null;

    const secureAtLevel = (skillKey: string, points: number, level: "A1" | "A2" | "B1" | "B2") => {
      const threshold = SKILL_BAND_THRESHOLDS[skillKey]?.[level];
      return typeof threshold?.points === "number" && points >= threshold.points;
    };

    const levels: Record<string, LevelProgress> = {};
    for (const level of ["A1", "A2", "B1", "B2"] as const) {
      const relevant = skills.filter((skill) => typeof SKILL_BAND_THRESHOLDS[skill.skillKey]?.[level]?.points === "number");
      if (relevant.length === 0) continue;
      const progressPcts = relevant.map((skill) => {
        const threshold = SKILL_BAND_THRESHOLDS[skill.skillKey]![level]!;
        return Math.max(0, Math.min(100, Math.round((skill.points / threshold.points) * 100)));
      });
      const mastered = relevant.filter((skill) => secureAtLevel(skill.skillKey, skill.points, level)).length;
      levels[level] = {
        total: relevant.length,
        active: relevant.length,
        avgRating: Math.round((progressPcts.reduce((a, b) => a + b, 0) / progressPcts.length) * 10) / 10,
        mastered,
        masteredPct: Math.round((mastered / relevant.length) * 100),
        struggling: progressPcts.filter((pct) => pct < 25).length,
        distribution: [0, 20, 40, 60, 80].map((start) =>
          progressPcts.filter((pct) => pct >= start && pct < (start === 80 ? 101 : start + 20)).length
        ),
      };
    }

    const scoreForStrength = (skill: LearnerSkill) => {
      const status = getSkillBandStatus(skill.skillKey, skill.points);
      return status.currentThreshold ? skill.points / status.currentThreshold.points : skill.points / 100;
    };

    const weakest = [...skills]
      .sort((a, b) => scoreForStrength(a) - scoreForStrength(b) || a.skillKey.localeCompare(b.skillKey))
      .slice(0, 10);
    const strongest = [...skills]
      .sort((a, b) => scoreForStrength(b) - scoreForStrength(a) || a.skillKey.localeCompare(b.skillKey))
      .slice(0, 5);

    const cefr = learnerState?.level?.currentLevel ?? "A1";

    const b1Relevant = skills.filter((skill) => typeof SKILL_BAND_THRESHOLDS[skill.skillKey]?.B1?.points === "number");
    const b1Secure = b1Relevant.filter((skill) => secureAtLevel(skill.skillKey, skill.points, "B1")).length;
    const threshold = Math.ceil(b1Relevant.length * 0.8);
    const b2Activation = b1Relevant.length > 0
      ? { mastered: b1Secure, total: b1Relevant.length, threshold, remaining: Math.max(0, threshold - b1Secure), pct: threshold > 0 ? Math.round((b1Secure / threshold) * 100) : 0, unlocked: b1Secure >= threshold }
      : null;

    const toInfo = (skill: LearnerSkill): SkillInfo => ({
      id: skill.skillKey,
      name: prettySkillLabel(skill.skillKey) ?? skill.skillKey,
      level: getSkillBandStatus(skill.skillKey, skill.points).currentBand ?? "A1",
      rating: Math.min(4, Math.max(0, Math.round((scoreForStrength(skill) * 4)))),
    });

    return {
      cefr,
      levels,
      weakest: weakest.map(toInfo),
      strongest: strongest.map(toInfo),
      b2Activation,
    };
  }, [learnerState?.level?.currentLevel, learnerState?.skills]);

  // ── Session Accuracy ────────────────────────────────────────────

  const sessionAnalysis = useMemo(() => {
    if (!sessions) return null;

    // Week comparison
    const recent7 = sessions.filter((s) => s.date >= sevenDaysAgo);
    const prev7 = sessions.filter((s) => s.date >= fourteenDaysAgo && s.date < sevenDaysAgo);

    const periodStats = (list: Session[]) => ({
      sessions: list.length,
      avgRating: list.length > 0 ? Math.round((list.reduce((s, x) => s + (x.rating ?? 0), 0) / list.length) * 10) / 10 : 0,
      exercises: list.reduce((s, x) => s + (x.exercisesCompleted ?? 0), 0),
      errors: list.reduce((s, x) => s + x.errors.length, 0),
    });

    const current = periodStats(recent7);
    const previous = periodStats(prev7);

    const trend = (curr: number, prev: number): "up" | "down" | "stable" | "new" => {
      if (prev === 0) return "new";
      const diff = curr - prev;
      if (Math.abs(diff) < 0.3) return "stable";
      return diff > 0 ? "up" : "down";
    };

    const weekComparison: WeekComparison = {
      current,
      previous,
      ratingTrend: trend(current.avgRating, previous.avgRating),
      volumeTrend: trend(current.sessions, previous.sessions),
    };

    // Mode breakdown
    const modeBreakdown: Record<string, { sessions: number; avgRating: number; exercises: number }> = {};
    for (const s of sessions) {
      const mode = s.mode ?? "unknown";
      if (!modeBreakdown[mode]) modeBreakdown[mode] = { sessions: 0, avgRating: 0, exercises: 0 };
      modeBreakdown[mode].sessions++;
      modeBreakdown[mode].avgRating += s.rating ?? 0;
      modeBreakdown[mode].exercises += s.exercisesCompleted ?? 0;
    }
    for (const mode of Object.values(modeBreakdown)) {
      if (mode.sessions > 0) mode.avgRating = Math.round((mode.avgRating / mode.sessions) * 10) / 10;
    }

    // Error breakdown
    const errorCats: Record<string, number> = {};
    let totalErrors = 0;
    for (const s of sessions) {
      for (const err of s.errors) {
        const cat = err.category ?? "unknown";
        errorCats[cat] = (errorCats[cat] ?? 0) + 1;
        totalErrors++;
      }
    }

    return { weekComparison, modeBreakdown, errorBreakdown: { total: totalErrors, byCategory: errorCats } };
  }, [sessions, sevenDaysAgo, fourteenDaysAgo]);

  // ── SRS Health ──────────────────────────────────────────────────

  const srs = useMemo((): SrsHealth | null => {
    if (!allCards) return null;

    const due = allCards.filter((c) => (c.nextReview ?? "9999") <= today);
    const mastered = allCards.filter((c) => (c.interval ?? 0) >= 21 && (c.lastQuality ?? 0) >= 3);
    const learning = allCards.filter((c) => (c.interval ?? 0) > 0 && (c.interval ?? 0) < 21);
    const newCards = allCards.filter((c) => (c.repetitions ?? 0) === 0);
    const lapsed = allCards.filter((c) => (c.repetitions ?? 0) > 0 && (c.lastQuality ?? 0) < 3 && (c.interval ?? 0) <= 1);
    const reviewed = allCards.filter((c) => (c.repetitions ?? 0) > 0);
    const retained = reviewed.filter((c) => (c.lastQuality ?? 0) >= 3);

    const bySource: Record<string, number> = {};
    for (const c of allCards) bySource[c.source ?? "unknown"] = (bySource[c.source ?? "unknown"] ?? 0) + 1;

    return {
      total: allCards.length,
      dueToday: due.length,
      mastered: mastered.length,
      learning: learning.length,
      newCards: newCards.length,
      lapsed: lapsed.length,
      retentionRate: reviewed.length > 0 ? Math.round((retained.length / reviewed.length) * 100) : 0,
      bySource,
    };
  }, [allCards, today]);

  // ── Return ──────────────────────────────────────────────────────

  return {
    loading,
    cefr: skillAnalysis?.cefr ?? "—",
    levels: skillAnalysis?.levels ?? {},
    weakest: skillAnalysis?.weakest ?? [],
    strongest: skillAnalysis?.strongest ?? [],
    b2Activation: skillAnalysis?.b2Activation ?? null,
    weekComparison: sessionAnalysis?.weekComparison ?? null,
    modeBreakdown: sessionAnalysis?.modeBreakdown ?? {},
    srs,
    errorBreakdown: sessionAnalysis?.errorBreakdown ?? null,
  };
}
