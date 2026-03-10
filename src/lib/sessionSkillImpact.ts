"use client";

import { resultScore } from "@/lib/exerciseResults";
import type { Exercise, ExerciseResult } from "@/lib/exerciseTypes";

export function mapExerciseTypeToSkills(type: Exercise["type"]): string[] {
  switch (type) {
    case "srs":
      return ["vocab_core"];
    case "cloze":
      return ["grammar_forms", "grammar_syntax"];
    case "word_builder":
      return ["grammar_syntax", "writing_micro"];
    case "pattern_drill":
      return ["grammar_forms", "speaking_accuracy"];
    case "speed_translation":
      return ["vocab_core", "listening_literal"];
    case "error_hunt":
      return ["reading_comprehension", "grammar_syntax"];
    case "conversation":
      return ["speaking_fluency", "speaking_accuracy", "pragmatics", "task_completion"];
    case "reflection":
      return ["writing_micro", "task_completion"];
    default:
      return ["task_completion"];
  }
}

export interface SessionSkillImpact {
  totalPoints: number;
  exercisesContributing: number;
  skills: Array<{ skillKey: string; points: number; evidenceCount: number; proficiencySample: number }>;
}

export interface ExerciseEvidenceEntry {
  exerciseId: string;
  exerciseType: Exercise["type"];
  skillKey: string;
  evidenceType: "srs" | "drill" | "conversation" | "reflection";
  rawScore: number; // 0..1
  weight: number;
  pointsDelta: number;
}

function evidenceTypeForExercise(type: Exercise["type"]): ExerciseEvidenceEntry["evidenceType"] {
  switch (type) {
    case "srs":
      return "srs";
    case "conversation":
      return "conversation";
    case "reflection":
      return "reflection";
    default:
      return "drill";
  }
}

function weightForExercise(type: Exercise["type"]): number {
  switch (type) {
    case "srs":
      return 1;
    case "cloze":
    case "word_builder":
    case "pattern_drill":
    case "speed_translation":
    case "error_hunt":
      return 1.15;
    case "conversation":
      return 1.5;
    case "reflection":
      return 0.75;
    default:
      return 1;
  }
}

export function computeSessionSkillImpact(
  exercises: Exercise[],
  results: Map<string, ExerciseResult>,
): SessionSkillImpact {
  const skillMap = new Map<string, number>();
  const evidenceMap = new Map<string, number>();
  const proficiencySumMap = new Map<string, number>();
  let totalPoints = 0;
  let exercisesContributing = 0;

  for (const exercise of exercises) {
    const result = results.get(exercise._id);
    if (!result) continue;

    const points = Math.max(1, Math.round(resultScore(result) * 10));
    exercisesContributing += 1;
    totalPoints += points;

    for (const skillKey of mapExerciseTypeToSkills(exercise.type)) {
      skillMap.set(skillKey, (skillMap.get(skillKey) ?? 0) + points);
      evidenceMap.set(skillKey, (evidenceMap.get(skillKey) ?? 0) + 1);
      proficiencySumMap.set(skillKey, (proficiencySumMap.get(skillKey) ?? 0) + Math.round(resultScore(result) * 100));
    }
  }

  const skills = Array.from(skillMap.entries())
    .map(([skillKey, points]) => {
      const evidenceCount = evidenceMap.get(skillKey) ?? 0;
      const proficiencySum = proficiencySumMap.get(skillKey) ?? 0;
      return {
        skillKey,
        points,
        evidenceCount,
        proficiencySample: evidenceCount > 0 ? Math.round(proficiencySum / evidenceCount) : 0,
      };
    })
    .sort((a, b) => b.points - a.points || a.skillKey.localeCompare(b.skillKey));

  return {
    totalPoints,
    exercisesContributing,
    skills,
  };
}

export function computeExerciseEvidenceEntries(
  exercises: Exercise[],
  results: Map<string, ExerciseResult>,
): ExerciseEvidenceEntry[] {
  const entries: ExerciseEvidenceEntry[] = [];

  for (const exercise of exercises) {
    const result = results.get(exercise._id);
    if (!result) continue;

    const rawScore = resultScore(result);
    const weight = weightForExercise(exercise.type);
    const weightedPoints = Math.max(1, Math.round(rawScore * 10 * weight));
    const evidenceType = evidenceTypeForExercise(exercise.type);

    for (const skillKey of mapExerciseTypeToSkills(exercise.type)) {
      entries.push({
        exerciseId: exercise._id,
        exerciseType: exercise.type,
        skillKey,
        evidenceType,
        rawScore,
        weight,
        pointsDelta: weightedPoints,
      });
    }
  }

  return entries;
}
