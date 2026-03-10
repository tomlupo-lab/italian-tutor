"use client";

import type { Level } from "@/lib/missionTypes";

export interface SkillBandThresholds {
  A1?: SkillBandTarget;
  A2?: SkillBandTarget;
  B1?: SkillBandTarget;
  B2?: SkillBandTarget;
}

const ORDERED_LEVELS: Level[] = ["A1", "A2", "B1", "B2"];

export interface SkillBandTarget {
  points: number;
  proficiency: number; // 0..100
  confidence: number; // 0..1
  evidenceCount: number;
}

const DEFAULT_BAND_REQUIREMENTS: Record<Level, Omit<SkillBandTarget, "points">> = {
  A1: { proficiency: 55, confidence: 0.35, evidenceCount: 20 },
  A2: { proficiency: 63, confidence: 0.45, evidenceCount: 22 },
  B1: { proficiency: 72, confidence: 0.6, evidenceCount: 18 },
  B2: { proficiency: 82, confidence: 0.72, evidenceCount: 24 },
};

function target(points: number, level: Level): SkillBandTarget {
  return {
    points,
    ...DEFAULT_BAND_REQUIREMENTS[level],
  };
}

// These thresholds define explicit CEFR readiness targets for every tracked skill.
// Roadmap-critical skills reuse the existing unlock anchors; the remaining skills are
// filled in so every supported skill has a clear "secure at this band" threshold.
export const SKILL_BAND_THRESHOLDS: Record<string, SkillBandThresholds> = {
  vocab_core: { A1: target(220, "A1"), A2: target(420, "A2"), B1: target(640, "B1"), B2: target(880, "B2") },
  grammar_forms: { A1: target(180, "A1"), A2: target(320, "A2"), B1: target(500, "B1") },
  grammar_syntax: { A1: target(150, "A1"), A2: target(300, "A2"), B1: target(500, "B1"), B2: target(740, "B2") },
  listening_literal: { A1: target(140, "A1"), A2: target(250, "A2"), B1: target(380, "B1") },
  listening_inference: { A2: target(210, "A2"), B1: target(360, "B1"), B2: target(560, "B2") },
  speaking_accuracy: { A1: target(140, "A1"), A2: target(260, "A2"), B1: target(420, "B1"), B2: target(620, "B2") },
  speaking_fluency: { A1: target(120, "A1"), A2: target(220, "A2"), B1: target(380, "B1"), B2: target(580, "B2") },
  pronunciation: { A1: target(110, "A1"), A2: target(180, "A2"), B1: target(240, "B1"), B2: target(360, "B2") },
  reading_comprehension: { A1: target(130, "A1"), A2: target(240, "A2"), B1: target(390, "B1") },
  writing_micro: { A1: target(120, "A1"), A2: target(230, "A2"), B1: target(380, "B1") },
  pragmatics: { A1: target(90, "A1"), A2: target(180, "A2"), B1: target(320, "B1"), B2: target(500, "B2") },
  task_completion: { A1: target(160, "A1"), A2: target(260, "A2"), B1: target(420, "B1"), B2: target(620, "B2") },
};

export interface SkillBandStatus {
  currentBand: Level | null;
  nextBand: Level | null;
  currentThreshold: SkillBandTarget | null;
  nextThreshold: SkillBandTarget | null;
  pointsToNext: number | null;
  progressToNextPct: number | null;
}

export interface SkillReadinessMetrics {
  points: number;
  proficiency: number; // 0..100
  confidence: number; // 0..1
  evidenceCount: number;
}

export interface SkillBandReadinessGate {
  current: number;
  target: number;
  pct: number;
  met: boolean;
}

export interface SkillBandReadiness {
  secure: boolean;
  readinessScore: number;
  gates: {
    points: SkillBandReadinessGate;
    proficiency: SkillBandReadinessGate;
    confidence: SkillBandReadinessGate;
    evidence: SkillBandReadinessGate;
  };
}

export function getSkillBandStatus(skillKey: string, totalPoints: number): SkillBandStatus {
  const thresholds = SKILL_BAND_THRESHOLDS[skillKey] ?? {};
  let currentBand: Level | null = null;
  let currentThreshold: SkillBandTarget | null = null;
  let nextBand: Level | null = null;
  let nextThreshold: SkillBandTarget | null = null;

  for (const level of ORDERED_LEVELS) {
    const threshold = thresholds[level];
    if (!threshold) continue;
    if (totalPoints >= threshold.points) {
      currentBand = level;
      currentThreshold = threshold;
      continue;
    }
    nextBand = level;
    nextThreshold = threshold;
    break;
  }

  if (!nextBand) {
    const lastThresholdEntry = [...ORDERED_LEVELS]
      .reverse()
      .find((level) => Boolean(thresholds[level]));
    const lastThreshold = lastThresholdEntry ? thresholds[lastThresholdEntry] ?? null : null;
    return {
      currentBand,
      nextBand: null,
      currentThreshold: currentThreshold ?? lastThreshold,
      nextThreshold: null,
      pointsToNext: null,
      progressToNextPct: null,
    };
  }

  const baseline = currentThreshold?.points ?? 0;
  const range = Math.max(1, nextThreshold!.points - baseline);
  return {
    currentBand,
    nextBand,
    currentThreshold,
    nextThreshold,
    pointsToNext: Math.max(0, nextThreshold!.points - totalPoints),
    progressToNextPct: Math.max(0, Math.min(100, Math.round(((totalPoints - baseline) / range) * 100))),
  };
}

export function describeCurrentBand(skillKey: string, totalPoints: number): string {
  const status = getSkillBandStatus(skillKey, totalPoints);
  if (status.currentBand) return `${status.currentBand} secure`;
  const thresholds = SKILL_BAND_THRESHOLDS[skillKey] ?? {};
  const firstBand = ORDERED_LEVELS.find((level) => Boolean(thresholds[level]));
  return firstBand ? `Building toward ${firstBand}` : "Tracking only";
}

export function describeNextTarget(skillKey: string, totalPoints: number): string | null {
  const status = getSkillBandStatus(skillKey, totalPoints);
  if (!status.nextBand || !status.pointsToNext || !status.nextThreshold) return null;
  return `${status.pointsToNext} pts to ${status.nextBand} secure (${totalPoints}/${status.nextThreshold.points})`;
}

export function getSkillBandTarget(skillKey: string, band: Level): SkillBandTarget | null {
  return SKILL_BAND_THRESHOLDS[skillKey]?.[band] ?? null;
}

export function computeSkillBandReadiness(
  skillKey: string,
  band: Level,
  metrics: SkillReadinessMetrics,
): SkillBandReadiness | null {
  const target = getSkillBandTarget(skillKey, band);
  if (!target) return null;

  const pointsPct = Math.min(metrics.points / target.points, 1);
  const proficiencyPct = Math.min(metrics.proficiency / target.proficiency, 1);
  const confidencePct = Math.min(metrics.confidence / target.confidence, 1);
  const evidencePct = Math.min(metrics.evidenceCount / target.evidenceCount, 1);

  const readinessScore = Math.round(
    (pointsPct * 0.25 + proficiencyPct * 0.4 + confidencePct * 0.2 + evidencePct * 0.15) * 100
  );

  return {
    secure:
      metrics.points >= target.points &&
      metrics.proficiency >= target.proficiency &&
      metrics.confidence >= target.confidence &&
      metrics.evidenceCount >= target.evidenceCount,
    readinessScore,
    gates: {
      points: {
        current: metrics.points,
        target: target.points,
        pct: Math.round(pointsPct * 100),
        met: metrics.points >= target.points,
      },
      proficiency: {
        current: metrics.proficiency,
        target: target.proficiency,
        pct: Math.round(proficiencyPct * 100),
        met: metrics.proficiency >= target.proficiency,
      },
      confidence: {
        current: Math.round(metrics.confidence * 100),
        target: Math.round(target.confidence * 100),
        pct: Math.round(confidencePct * 100),
        met: metrics.confidence >= target.confidence,
      },
      evidence: {
        current: metrics.evidenceCount,
        target: target.evidenceCount,
        pct: Math.round(evidencePct * 100),
        met: metrics.evidenceCount >= target.evidenceCount,
      },
    },
  };
}
