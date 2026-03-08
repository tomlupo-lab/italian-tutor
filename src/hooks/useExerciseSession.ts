"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTodayWarsaw } from "@/lib/date";
import { normalizeContent } from "@/lib/normalizeContent";
import { apiPath } from "@/lib/paths";
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

const TIER_KEY = "italian-tutor-tier-scores";
const DRILL_TYPES = new Set(["cloze", "word_builder", "pattern_drill", "speed_translation", "error_hunt"]);
const GOLD_TYPES = new Set(["conversation", "reflection"]);

function buildSessionSignature(exercises: Exercise[], mode: ExerciseMode): string {
  const typeCounts = new Map<string, number>();
  for (const ex of exercises) {
    typeCounts.set(ex.type, (typeCounts.get(ex.type) ?? 0) + 1);
  }
  const idFingerprint = exercises
    .map((ex) => ex._id)
    .sort()
    .join(",");
  const fingerprint = Array.from(typeCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => `${type}:${count}`)
    .join("|");
  return `${mode}|${fingerprint || "empty"}|ids:${idFingerprint || "none"}`;
}

function mapExerciseTypeToSkills(type: Exercise["type"]): string[] {
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

function mapErrorCategoryToKey(category?: string): string {
  switch (category) {
    case "cloze":
      return "verb_conjugation";
    case "word_order":
      return "word_order";
    case "grammar_pattern":
      return "verb_tense";
    case "translation":
      return "lexical_choice";
    case "error_recognition":
      return "agreement";
    case "conversation":
      return "incomplete_response";
    default:
      return "instruction_misread";
  }
}

function resultScore(result: ExerciseResult): number {
  if ("correct" in result && typeof (result as { correct: boolean }).correct === "boolean") {
    return (result as { correct: boolean }).correct ? 1 : 0;
  }
  if ("scores" in result && Array.isArray((result as { scores: boolean[] }).scores)) {
    const scores = (result as { scores: boolean[] }).scores;
    if (scores.length === 0) return 0.5;
    const ok = scores.filter(Boolean).length;
    return ok / scores.length;
  }
  if ("total_correct" in result && typeof (result as { total_correct: number }).total_correct === "number") {
    const total = Math.max(1, (result as { answers?: number[] }).answers?.length ?? 10);
    return Math.max(0, Math.min(1, (result as { total_correct: number }).total_correct / total));
  }
  if ("rating" in result && typeof (result as { rating: number }).rating === "number") {
    return Math.max(0, Math.min(1, (result as { rating: number }).rating / 5));
  }
  return 0.5;
}

function persistTierScore(date: string, mode: ExerciseMode, scorePercent: number) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(TIER_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const current = parsed?.[date]?.[mode];
    const bestScore = Math.max(Number(current?.bestScore ?? 0), scorePercent);
    parsed[date] = parsed[date] ?? {};
    parsed[date][mode] = {
      completed: true,
      bestScore,
      lastCompleted: new Date().toISOString(),
    };
    localStorage.setItem(TIER_KEY, JSON.stringify(parsed));
  } catch {
    // non-critical
  }
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
              const filled = s.template ? s.template.replace("___", s.correct) : s.correct;
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
    const res = await fetch(apiPath("/api/enrich-errors"), {
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
  const attachMissionOutcome = useMutation(api.sessions.attachMissionOutcome);
  const markComplete = useMutation(api.exercises.markComplete);
  const reviewCard = useMutation(api.cards.review);
  const upsertCard = useMutation(api.cards.upsert);
  const bulkAddCards = useMutation(api.cards.bulkAdd);
  const updateCardExplanation = useMutation(api.cards.updateExplanation);
  const recordMissionCompletion = useMutation(api.missions.recordLessonCompletion);

  const startedAt = useRef(Date.now());
  const clientSessionId = useRef(`sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Map<string, ExerciseResult>>(
    new Map(),
  );
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missionCompleted, setMissionCompleted] = useState(false);

  const total = exercises.length;
  const currentExercise = exercises[current] ?? null;
  const progress = total > 0 ? (current / total) * 100 : 0;

  /** Errors extracted from exercise results — all drill types */
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
      const content = normalizeContent(ex.type, ex.content);

      switch (ex.type) {
        case "cloze": {
          const c = content as ClozeContent;
          const r = result as { selected: number; correct: boolean };
          if (!r.correct && c.sentence) {
            errors.push({
              original: c.options[r.selected],
              corrected: c.options[c.correct],
              explanation: c.hint,
              category: "cloze",
              skillId: ex.skillId,
            });
          }
          break;
        }
        case "word_builder": {
          const c = content as WordBuilderContent;
          const r = result as WordBuilderResult;
          if (!r.correct && c.target_sentence) {
            errors.push({
              original: "wrong order",
              corrected: c.target_sentence,
              explanation: c.translation,
              category: "word_order",
              skillId: ex.skillId,
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
                errors.push({
                  original: s.blank || "wrong",
                  corrected: s.correct,
                  explanation: s.hint || c.pattern_name,
                  category: "grammar_pattern",
                  skillId: ex.skillId,
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
                errors.push({
                  original: s.source,
                  corrected: s.options[s.correct],
                  category: "translation",
                  skillId: ex.skillId,
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
                errors.push({
                  original: s.text,
                  corrected: s.corrected!,
                  explanation: s.explanation,
                  category: "error_recognition",
                  skillId: ex.skillId,
                });
              }
            });
          }
          break;
        }
        case "conversation": {
          const convResult = result as { errors?: Array<{ original: string; corrected: string; explanation?: string }> };
          if (convResult.errors) {
            for (const err of convResult.errors) {
              errors.push({ ...err, category: "conversation", skillId: ex.skillId });
            }
          }
          break;
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
      const isCardExercise = currentExercise._id.startsWith("card-");
      if (!isCardExercise) {
        markComplete({
          exerciseId: currentExercise._id as Parameters<typeof markComplete>[0]["exerciseId"],
          result: result as Parameters<typeof markComplete>[0]["result"],
        }).catch(() => {});
      }

      // SM-2 scheduling for SRS exercises
      if (currentExercise.type === "srs" && "quality" in result) {
        const quality = (result as { quality: number }).quality;
        // Map 0-5 quality to SM-2 review quality (1/3/5)
        const sm2Quality = quality <= 1 ? 1 : quality <= 3 ? 3 : 5;

        if (isCardExercise) {
          // Card from cards table — call review directly
          const realCardId = currentExercise._id.replace("card-", "");
          reviewCard({ cardId: realCardId as Parameters<typeof reviewCard>[0]["cardId"], quality: sm2Quality }).catch(() => {});
        } else {
          // Mission SRS exercise — upsert into cards table for SM-2 tracking
          const content = currentExercise.content as { front?: string; back?: string };
          if (content.front && content.back) {
            upsertCard({
              it: content.front,
              en: content.back,
              source: "lesson" as const,
              tag: currentExercise.missionId ?? undefined,
              level: currentExercise.difficulty ?? "A1",
              quality: sm2Quality,
            }).catch(() => {});
          }
        }
      }

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

          const saveResult = await saveSession({
            date: sessionDate,
            clientSessionId: clientSessionId.current,
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
          persistTierScore(sessionDate, mode, Math.round(pct * 100));

          // Mission progression update (non-blocking but awaited to keep state consistent)
          const skillMap = new Map<string, number>();
          let bronzeCredit = 0;
          let silverCredit = 0;
          let goldCredit = 0;
          for (const ex of exercises) {
            const r = allResults.get(ex._id);
            if (!r) continue;
            const score = resultScore(r);
            const points = Math.max(1, Math.round(score * 10));
            for (const skill of mapExerciseTypeToSkills(ex.type)) {
              skillMap.set(skill, (skillMap.get(skill) ?? 0) + points);
            }
            if (ex.type === "srs") bronzeCredit += 1;
            if (DRILL_TYPES.has(ex.type)) silverCredit += 1;
            if (GOLD_TYPES.has(ex.type)) goldCredit += 1;
          }

          const errorMap = new Map<string, number>();
          for (const err of sessionErrors) {
            const key = mapErrorCategoryToKey(err.category);
            errorMap.set(key, (errorMap.get(key) ?? 0) + 1);
          }

          const criticalErrors = ["off_topic", "incomplete_response", "dosage_misunderstood", "negation_reversal", "instruction_misread"]
            .reduce((sum, key) => sum + (errorMap.get(key) ?? 0), 0);

          if (saveResult.status === "created" && "id" in saveResult && saveResult.id) {
            try {
              const sessionSignature = buildSessionSignature(exercises, mode);
              const missionResult = await recordMissionCompletion({
                sessionDate,
                scorePercent: Math.round(pct * 100),
                bronzeCredit,
                silverCredit,
                goldCredit,
                minutes: totalMinutes,
                sessionSignature,
                criticalErrors,
                confidenceWeight: Math.min(1, Math.max(0.25, allResults.size / 20)),
                skillDeltas: Array.from(skillMap.entries()).map(([skillKey, points]) => ({
                  skillKey,
                  points,
                })),
                errorDeltas: Array.from(errorMap.entries()).map(([errorKey, count]) => ({
                  errorKey,
                  count,
                })),
              });
              await attachMissionOutcome({
                sessionId: saveResult.id,
                missionId: missionResult.missionId,
                checkpointAwardedId: missionResult.checkpointAwardedId ?? undefined,
                duplicatePenaltyApplied: missionResult.duplicateSameDay,
                appliedCredits: missionResult.appliedCredits,
              });
              if (missionResult.missionCompleted) {
                setMissionCompleted(true);
              }
            } catch {
              // non-critical
            }
          }

          if (saveResult.status === "created") {
            // Extract correction cards from wrong answers and add to SRS deck.
            // Skip on duplicate save retries to avoid duplicate correction cards.
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
          }

          setError(null);
          clientSessionId.current = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
      attachMissionOutcome,
      bulkAddCards,
      updateCardExplanation,
      recordMissionCompletion,
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
    missionCompleted,
    submitResult,
    skip,
  };
}
