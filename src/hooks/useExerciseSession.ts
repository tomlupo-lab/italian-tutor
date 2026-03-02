"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTodayWarsaw } from "@/lib/date";
import type {
  Exercise,
  ExerciseMode,
  ExerciseResult,
} from "@/lib/exerciseTypes";

export interface SessionState {
  /** Current exercise index */
  current: number;
  /** Total exercises in this session */
  total: number;
  /** Results collected per exercise */
  results: Map<string, ExerciseResult>;
  /** Session started at (ms) */
  startedAt: number;
  /** Is the session complete? */
  done: boolean;
  /** Is saving to Convex? */
  saving: boolean;
  /** Save error, if any */
  error: string | null;
}

interface UseExerciseSessionOptions {
  exercises: Exercise[];
  mode: ExerciseMode;
  date?: string;
}

export function useExerciseSession({
  exercises,
  mode,
  date,
}: UseExerciseSessionOptions) {
  const saveSession = useMutation(api.sessions.save);
  const markComplete = useMutation(api.exercises.markComplete);

  const startedAt = useRef(Date.now());
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Map<string, ExerciseResult>>(
    new Map(),
  );
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = exercises.length;
  const currentExercise = exercises[current] ?? null;
  const progress = total > 0 ? (current / total) * 100 : 0;

  /** Errors extracted from exercise results */
  const sessionErrors = useMemo(() => {
    const errors: Array<{
      original: string;
      corrected: string;
      explanation?: string;
      category?: string;
      skillId?: string;
    }> = [];
    for (const [id, result] of results) {
      const ex = exercises.find((e) => e._id === id);
      if (!ex) continue;
      // Extract errors from conversation results
      if (
        ex.type === "conversation" &&
        "errors" in result &&
        Array.isArray((result as { errors: unknown[] }).errors)
      ) {
        for (const err of (result as { errors: Array<{ original: string; corrected: string; explanation?: string }> }).errors) {
          errors.push({ ...err, skillId: ex.skillId });
        }
      }
    }
    return errors;
  }, [results, exercises]);

  /** Record a result for the current exercise and advance */
  const submitResult = useCallback(
    async (result: ExerciseResult) => {
      if (!currentExercise) return;

      // Store result locally
      setResults((prev) => {
        const next = new Map(prev);
        next.set(currentExercise._id, result);
        return next;
      });

      // Mark exercise complete in Convex (fire and forget)
      markComplete({
        exerciseId: currentExercise._id as never,
        result: result as unknown,
      }).catch(() => {
        // Non-critical — session save captures everything
      });

      // Advance or finish
      if (current + 1 >= total) {
        setDone(true);
        // Save session
        setSaving(true);
        try {
          const sessionDate = date ?? getTodayWarsaw();
          const elapsed = Date.now() - startedAt.current;
          const totalMinutes = Math.round(elapsed / 60000);

          // Compute rating from results
          let correctCount = 0;
          let totalItems = 0;
          const allResults = new Map(results);
          allResults.set(currentExercise._id, result);

          for (const r of allResults.values()) {
            if ("correct" in r && typeof (r as { correct: boolean }).correct === "boolean") {
              totalItems++;
              if ((r as { correct: boolean }).correct) correctCount++;
            } else if ("scores" in r && Array.isArray((r as { scores: boolean[] }).scores)) {
              for (const s of (r as { scores: boolean[] }).scores) {
                totalItems++;
                if (s) correctCount++;
              }
            } else if ("total_correct" in r) {
              totalItems += 10;
              correctCount += (r as { total_correct: number }).total_correct;
            }
          }

          const pct = totalItems > 0 ? correctCount / totalItems : 0.5;
          const rating = Math.round(pct * 4) + 1; // 1-5

          await saveSession({
            date: sessionDate,
            type: "lesson",
            duration: totalMinutes,
            mode,
            rating,
            exercisesCompleted: allResults.size,
            exercisesTotal: total,
            cardsReviewed: 0,
            cardsCorrect: 0,
            newPhrases: [],
            phrasesUsed: [],
            errors: sessionErrors,
          });
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to save session");
        } finally {
          setSaving(false);
        }
      } else {
        setCurrent((c) => c + 1);
      }
    },
    [
      current,
      currentExercise,
      total,
      results,
      markComplete,
      saveSession,
      mode,
      date,
      sessionErrors,
    ],
  );

  /** Skip to next exercise without recording a result */
  const skip = useCallback(() => {
    if (current + 1 >= total) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
    }
  }, [current, total]);

  return {
    current,
    total,
    progress,
    currentExercise,
    done,
    saving,
    error,
    results,
    sessionErrors,
    submitResult,
    skip,
  };
}
