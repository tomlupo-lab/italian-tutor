"use client";

import type { ExerciseResult } from "@/lib/exerciseTypes";

function hasCorrectFlag(result: ExerciseResult): result is ExerciseResult & { correct: boolean } {
  return "correct" in result && typeof result.correct === "boolean";
}

function hasScores(result: ExerciseResult): result is ExerciseResult & { scores: boolean[] } {
  return "scores" in result && Array.isArray(result.scores);
}

function hasTotalCorrect(result: ExerciseResult): result is ExerciseResult & { total_correct: number; answers?: number[] } {
  return "total_correct" in result && typeof result.total_correct === "number";
}

function hasRating(result: ExerciseResult): result is ExerciseResult & { rating: number } {
  return "rating" in result && typeof result.rating === "number";
}

function hasQuality(result: ExerciseResult): result is ExerciseResult & { quality: number } {
  return "quality" in result && typeof result.quality === "number";
}

function hasConversationMetrics(
  result: ExerciseResult,
): result is ExerciseResult & {
  user_turns: number;
  target_phrases_used: string[];
} {
  return (
    "user_turns" in result &&
    typeof result.user_turns === "number" &&
    "target_phrases_used" in result &&
    Array.isArray(result.target_phrases_used)
  );
}

export function resultScore(result: ExerciseResult): number {
  if (hasCorrectFlag(result)) {
    return result.correct ? 1 : 0;
  }
  if (hasScores(result)) {
    const scores = result.scores;
    if (scores.length === 0) return 0.5;
    const ok = scores.filter(Boolean).length;
    return ok / scores.length;
  }
  if (hasTotalCorrect(result)) {
    const total = Math.max(1, result.answers?.length ?? 10);
    return Math.max(0, Math.min(1, result.total_correct / total));
  }
  if (hasRating(result)) {
    return Math.max(0, Math.min(1, result.rating / 5));
  }
  if (hasQuality(result)) {
    return Math.max(0, Math.min(1, result.quality / 5));
  }
  if (hasConversationMetrics(result)) {
    const phraseScore = Math.min(result.target_phrases_used.length / 2, 1);
    const turnScore = Math.min(result.user_turns / 4, 1);
    return (phraseScore + turnScore) / 2;
  }
  return 0.5;
}

export function summarizeResults(results: Iterable<ExerciseResult>) {
  let totalItems = 0;
  let correctItems = 0;

  for (const result of results) {
    if (hasCorrectFlag(result)) {
      totalItems += 1;
      if (result.correct) correctItems += 1;
      continue;
    }

    if (hasScores(result)) {
      for (const score of result.scores) {
        totalItems += 1;
        if (score) correctItems += 1;
      }
      continue;
    }

    if (hasTotalCorrect(result)) {
      const total = Math.max(1, result.answers?.length ?? 10);
      totalItems += total;
      correctItems += Math.max(0, Math.min(total, result.total_correct));
      continue;
    }

    if (hasQuality(result)) {
      totalItems += 1;
      if (result.quality >= 3) correctItems += 1;
      continue;
    }

    totalItems += 1;
    correctItems += resultScore(result);
  }

  return {
    totalItems,
    correctItems,
    accuracy: totalItems > 0 ? correctItems / totalItems : 0,
  };
}
