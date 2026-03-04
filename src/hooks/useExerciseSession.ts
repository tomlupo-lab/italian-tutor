"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTodayWarsaw } from "@/lib/date";
import { normalizeContent } from "@/lib/normalizeContent";
import type {
  ClozeContent,
  ErrorHuntContent,
  ErrorHuntResult,
  Exercise,
  ExerciseMode,
  ExerciseResult,
  PatternDrillContent,
  PatternDrillResult,
  SpeedTranslationContent,
  SpeedTranslationResult,
  WordBuilderContent,
  WordBuilderResult,
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

interface CorrectionCard {
  it: string;
  en: string;
  example?: string;
  tag?: string;
  source: "correction";
  skillId?: string;
  errorCategory?: string;
}

/**
 * Extracts SRS correction cards from wrong answers across exercise types.
 * Each wrong answer becomes a card the learner will review via spaced repetition.
 */
function extractCorrectionCards(
  exercises: Exercise[],
  results: Map<string, ExerciseResult>,
): CorrectionCard[] {
  const cards: CorrectionCard[] = [];

  for (const ex of exercises) {
    const result = results.get(ex._id);
    if (!result) continue;

    const content = normalizeContent(ex.type, ex.content);

    switch (ex.type) {
      case "cloze": {
        const c = content as ClozeContent;
        const r = result as { selected: number; correct: boolean };
        if (!r.correct && c.sentence) {
          // Replace the blank with the correct answer
          const parts = c.sentence.split("___");
          const filled = parts.join(c.options[c.correct]);
          cards.push({
            it: filled,
            en: c.hint || c.options[r.selected] + " → " + c.options[c.correct],
            source: "correction",
            skillId: ex.skillId,
            errorCategory: "cloze",
          });
        }
        break;
      }
      case "word_builder": {
        const c = content as WordBuilderContent;
        const r = result as WordBuilderResult;
        if (!r.correct && c.target_sentence) {
          cards.push({
            it: c.target_sentence,
            en: c.translation || "Word order practice",
            source: "correction",
            skillId: ex.skillId,
            errorCategory: "word_order",
          });
        }
        break;
      }
      case "pattern_drill": {
        const c = content as PatternDrillContent;
        const r = result as PatternDrillResult;
        if (c?.sentences && r?.scores) {
          r.scores.forEach((correct, i) => {
            if (!correct && c.sentences[i]) {
              const s = c.sentences[i];
              const filled = s.template.replace("___", s.correct);
              cards.push({
                it: filled,
                en: s.hint || c.pattern_name || "Pattern practice",
                example: s.template,
                source: "correction",
                skillId: ex.skillId,
                errorCategory: "grammar_pattern",
              });
            }
          });
        }
        break;
      }
      case "speed_translation": {
        const c = content as SpeedTranslationContent;
        const r = result as SpeedTranslationResult;
        if (c?.sentences && r?.scores) {
          r.scores.forEach((correct, i) => {
            if (!correct && c.sentences[i]) {
              const s = c.sentences[i];
              cards.push({
                it: s.options[s.correct],
                en: s.source,
                source: "correction",
                skillId: ex.skillId,
                errorCategory: "translation",
              });
            }
          });
        }
        break;
      }
      case "error_hunt": {
        const c = content as ErrorHuntContent;
        const r = result as ErrorHuntResult;
        if (c?.sentences && r?.scores) {
          r.scores.forEach((correct, i) => {
            if (!correct && c.sentences[i]?.has_error && c.sentences[i].corrected) {
              const s = c.sentences[i];
              cards.push({
                it: s.corrected!,
                en: s.explanation || "Error correction",
                example: s.text,
                source: "correction",
                skillId: ex.skillId,
                errorCategory: "error_recognition",
              });
            }
          });
        }
        break;
      }
      case "conversation": {
        // Conversation results contain errors detected by the AI tutor
        const convResult = result as { errors?: Array<{ original: string; corrected: string; explanation?: string }> };
        if (convResult.errors) {
          for (const err of convResult.errors) {
            if (err.original && err.corrected) {
              cards.push({
                it: err.corrected,
                en: err.explanation || `${err.original} → ${err.corrected}`,
                example: err.original,
                source: "correction",
                skillId: ex.skillId,
                errorCategory: "conversation",
              });
            }
          }
        }
        break;
      }
    }
  }

  return cards;
}

/**
 * Calls the AI enrichment API to improve correction card explanations,
 * then updates each card in Convex with the better explanation.
 */
async function enrichCorrectionCards(
  cards: CorrectionCard[],
  updateFn: (args: { it: string; en: string }) => Promise<{ updated: boolean }>,
) {
  try {
    const res = await fetch("/api/enrich-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cards: cards.map((c) => ({
          it: c.it,
          en: c.en,
          errorCategory: c.errorCategory,
        })),
      }),
    });
    if (!res.ok) return;
    const { enriched } = await res.json();
    if (!enriched?.length) return;

    for (const card of enriched as { it: string; en: string }[]) {
      updateFn({ it: card.it, en: card.en }).catch(() => {});
    }
  } catch {
    // Non-critical — original explanations remain
  }
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
  const bulkAddCards = useMutation(api.cards.bulkAdd);
  const updateCardExplanation = useMutation(api.cards.updateExplanation);

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

          // Extract correction cards from wrong answers and add to SRS deck
          const correctionCards = extractCorrectionCards(exercises, allResults);
          if (correctionCards.length > 0) {
            bulkAddCards({ cards: correctionCards })
              .then(() => {
                // Enrich card explanations with AI (fire and forget)
                enrichCorrectionCards(correctionCards, updateCardExplanation);
              })
              .catch(() => {
                // Non-critical — cards can be generated again
              });
          }

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
      exercises,
      markComplete,
      saveSession,
      bulkAddCards,
      updateCardExplanation,
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
