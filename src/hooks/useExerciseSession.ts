"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTodayWarsaw } from "@/lib/date";
import { triggerAnswerFeedback } from "@/lib/feedback";
import { normalizeContent } from "@/lib/normalizeContent";
import { apiPath } from "@/lib/paths";
import {
  buildRecoveryCard,
  recoveryLevelForExercise,
  recoveryTagForExercise,
} from "@/lib/recoveryCards";
import { resultScore, summarizeResults } from "@/lib/exerciseResults";
import { computeExerciseEvidenceEntries, computeSessionSkillImpact } from "@/lib/sessionSkillImpact";
import sessionContracts from "@/lib/sessionContracts";
import type {
  ClozeContent,
  ErrorHuntContent,
  ErrorHuntResult,
  Exercise,
  ExerciseMode,
  ExerciseResult,
  SrsContent,
  SrsResult,
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
  prompt?: string;
  explanation?: string;
  tag?: string;
  level?: string;
  source: "recovery";
  skillId?: string;
  errorCategory?: string;
}

const TIER_KEY = "italian-tutor-tier-scores";
const SESSION_RESUME_PREFIX = "italian-tutor:session-resume";
const { computeTierCredits, evaluateGoldContract } = sessionContracts;

interface PersistedExerciseSession {
  mode: ExerciseMode;
  date: string;
  exerciseIds: string[];
  current: number;
  startedAt: number;
  clientSessionId: string;
  results: Array<[string, ExerciseResult]>;
}

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

function mapErrorCategoryToKey(category?: string): string | null {
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
    case "srs_review":
      return null;
    default:
      return "instruction_misread";
  }
}

function getConversationErrors(result: ExerciseResult) {
  return "errors" in result && Array.isArray(result.errors)
    ? result.errors
        .filter((err) => Boolean(err?.original && err?.corrected))
        .map((err) => ({
          original: err.original,
          corrected: err.corrected,
          explanation: err.explanation ?? "",
        }))
    : [];
}

function getSrsText(content: Exercise["content"]): SrsContent | null {
  if (!content || typeof content !== "object") return null;
  const maybe = content as Partial<SrsContent>;
  return typeof maybe.front === "string" && typeof maybe.back === "string"
    ? (maybe as SrsContent)
    : null;
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

function buildResumeStorageKey(date: string, mode: ExerciseMode, exercises: Exercise[]) {
  return `${SESSION_RESUME_PREFIX}:${date}:${mode}:${exercises.map((ex) => ex._id).join(",")}`;
}

function loadPersistedSession(
  key: string,
  mode: ExerciseMode,
  date: string,
  exercises: Exercise[],
): PersistedExerciseSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedExerciseSession;
    const exerciseIds = exercises.map((ex) => ex._id);
    if (
      parsed.mode !== mode ||
      parsed.date !== date ||
      parsed.exerciseIds.join(",") !== exerciseIds.join(",")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearPersistedSession(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

function savePersistedSession(key: string, payload: PersistedExerciseSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(payload));
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
          cards.push(buildRecoveryCard({
            it: filled,
            prompt: c.sentence,
            example: c.sentence,
            explanation: c.hint || `${c.options[c.correct]} completes the sentence correctly.`,
            tag: recoveryTagForExercise(ex),
            level: recoveryLevelForExercise(ex),
            phase: ex.phase,
            patternId: ex.patternId,
            domain: ex.domain,
            skillId: ex.skillId,
            errorCategory: "cloze",
          }));
        }
        break;
      }
      case "word_builder": {
        const c = content as WordBuilderContent;
        const r = result as WordBuilderResult;
        if (!r.correct && c.target_sentence) {
          cards.push(buildRecoveryCard({
            it: c.target_sentence,
            en: c.translation || "Rebuild the sentence in Italian.",
            prompt: c.translation || "Put the words in the right order.",
            example: c.target_sentence,
            explanation: "Rebuild the full sentence in the correct word order.",
            tag: recoveryTagForExercise(ex),
            level: recoveryLevelForExercise(ex),
            phase: ex.phase,
            patternId: ex.patternId,
            domain: ex.domain,
            skillId: ex.skillId,
            errorCategory: "word_order",
          }));
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
              cards.push(buildRecoveryCard({
                it: filled,
                example: s.template,
                prompt: s.template,
                explanation: s.hint || c.pattern_name || "Use the target pattern.",
                tag: recoveryTagForExercise(ex),
                level: recoveryLevelForExercise(ex),
                phase: ex.phase,
                patternId: ex.patternId,
                domain: ex.domain,
                skillId: ex.skillId,
                errorCategory: "grammar_pattern",
              }));
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
              cards.push(buildRecoveryCard({
                it: s.options[s.correct],
                en: s.source,
                prompt: s.source,
                example: s.options[s.correct],
                explanation: "Recall the Italian version of this prompt.",
                tag: recoveryTagForExercise(ex),
                level: recoveryLevelForExercise(ex),
                phase: ex.phase,
                patternId: ex.patternId,
                domain: ex.domain,
                skillId: ex.skillId,
                errorCategory: "translation",
              }));
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
              cards.push(buildRecoveryCard({
                it: s.corrected!,
                example: s.text,
                prompt: s.text,
                explanation: s.explanation || "Correct the sentence and keep the intended meaning.",
                tag: recoveryTagForExercise(ex),
                level: recoveryLevelForExercise(ex),
                phase: ex.phase,
                patternId: ex.patternId,
                domain: ex.domain,
                skillId: ex.skillId,
                errorCategory: "error_recognition",
              }));
            }
          });
        }
        break;
      }
      case "conversation": {
        for (const err of getConversationErrors(result)) {
          cards.push(buildRecoveryCard({
            it: err.corrected,
            example: err.original,
            prompt: err.original,
            explanation: err.explanation || "Use the corrected Italian version.",
            tag: recoveryTagForExercise(ex),
            level: recoveryLevelForExercise(ex),
            phase: ex.phase,
            patternId: ex.patternId,
            domain: ex.domain,
            skillId: ex.skillId,
            errorCategory: "conversation",
          }));
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
  updateFn: (args: { it: string; explanation: string }) => Promise<{ updated: boolean }>,
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
      updateFn({ it: card.it, explanation: card.en }).catch(() => {});
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

function extractSessionErrors(
  exercises: Exercise[],
  resultMap: Map<string, ExerciseResult>,
) {
  const errors: Array<{
    original: string;
    corrected: string;
    explanation?: string;
    category?: string;
    skillId?: string;
  }> = [];

  for (const [id, result] of resultMap) {
    const ex = exercises.find((e) => e._id === id);
    if (!ex) continue;
    const content = normalizeContent(ex.type, ex.content);

    switch (ex.type) {
      case "srs": {
        const r = result as { quality?: number };
        const c = getSrsText(ex.content);
        if (r.quality === 0 && c?.front && c.back) {
          errors.push({
            original: c.front,
            corrected: c.back,
            explanation: "Marked Again for extra SRS review",
            category: "srs_review",
            skillId: ex.skillId,
          });
        }
        break;
      }
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
        for (const err of getConversationErrors(result)) {
          errors.push({ ...err, category: "conversation", skillId: ex.skillId });
        }
        break;
      }
    }
  }

  return errors;
}

export function useExerciseSession({
  exercises,
  mode,
  date,
}: UseExerciseSessionOptions) {
  const sessionDate = date ?? getTodayWarsaw();
  const resumeStorageKey = useMemo(
    () => buildResumeStorageKey(sessionDate, mode, exercises),
    [sessionDate, mode, exercises],
  );
  const initialPersistedState = useMemo(
    () => loadPersistedSession(resumeStorageKey, mode, sessionDate, exercises),
    [resumeStorageKey, mode, sessionDate, exercises],
  );
  const saveSession = useMutation(api.sessions.save);
  const attachMissionOutcome = useMutation(api.sessions.attachMissionOutcome);
  const markComplete = useMutation(api.exercises.markComplete);
  const reviewCard = useMutation(api.cards.review);
  const upsertCard = useMutation(api.cards.upsert);
  const bulkAddCards = useMutation(api.cards.bulkAdd);
  const updateCardExplanation = useMutation(api.cards.updateExplanation);
  const recordMissionCompletion = useMutation(api.missions.recordLessonCompletion);

  const startedAt = useRef(initialPersistedState?.startedAt ?? Date.now());
  const clientSessionId = useRef(
    initialPersistedState?.clientSessionId ?? `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  );
  const [current, setCurrent] = useState(initialPersistedState?.current ?? 0);
  const [results, setResults] = useState<Map<string, ExerciseResult>>(
    () => new Map(initialPersistedState?.results ?? []),
  );
  const resultsRef = useRef<Map<string, ExerciseResult>>(new Map(initialPersistedState?.results ?? []));
  const submittedExerciseIds = useRef<Set<string>>(
    new Set((initialPersistedState?.results ?? []).map(([exerciseId]) => exerciseId)),
  );
  const [finalResults, setFinalResults] = useState<Map<string, ExerciseResult> | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const sessionExercisesRef = useRef(exercises);
  const sessionExercises = sessionExercisesRef.current;

  const total = sessionExercises.length;
  const currentExercise = sessionExercises[current] ?? null;
  const progress = total > 0 ? (current / total) * 100 : 0;
  const visibleResults = finalResults ?? results;

  useEffect(() => {
    if (done || total === 0) {
      clearPersistedSession(resumeStorageKey);
      return;
    }

    savePersistedSession(resumeStorageKey, {
      mode,
      date: sessionDate,
      exerciseIds: sessionExercises.map((ex) => ex._id),
      current,
      startedAt: startedAt.current,
      clientSessionId: clientSessionId.current,
      results: Array.from(resultsRef.current.entries()),
    });
  }, [current, done, mode, resumeStorageKey, sessionDate, sessionExercises, total, visibleResults]);

  /** Errors extracted from exercise results — all drill types */
  const sessionErrors = useMemo(
    () => extractSessionErrors(sessionExercises, visibleResults),
    [sessionExercises, visibleResults],
  );

  const finalizeSession = useCallback(
    async (allResults: Map<string, ExerciseResult>) => {
      setDone(true);
      clearPersistedSession(resumeStorageKey);

      if (allResults.size === 0) {
        setFinalResults(allResults);
        setError(null);
        return;
      }

      setSaving(true);
      try {
        const elapsed = Date.now() - startedAt.current;
        const totalMinutes = Math.max(1, Math.round(elapsed / 60000));
        const finalErrors = extractSessionErrors(sessionExercises, allResults);

        setFinalResults(allResults);
        const { accuracy, totalItems } = summarizeResults(allResults.values());
        const pct = totalItems > 0 ? accuracy : 0.5;
        const rating = Math.round(pct * 4) + 1;

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
          errors: finalErrors,
        });
        persistTierScore(sessionDate, mode, Math.round(pct * 100));

        const sessionSkillImpact = computeSessionSkillImpact(sessionExercises, allResults);
        const { bronzeCredit, silverCredit, goldCredit } = computeTierCredits(
          sessionExercises,
          allResults,
        );
        const goldContract =
          mode === "gold" ? evaluateGoldContract(sessionExercises, allResults) : null;
        const goldContractStatus = goldContract?.contractStatus as
          | "strong"
          | "partial"
          | "missed"
          | undefined;

        const errorMap = new Map<string, number>();
        for (const err of finalErrors) {
          const key = mapErrorCategoryToKey(err.category);
          if (!key) continue;
          errorMap.set(key, (errorMap.get(key) ?? 0) + 1);
        }

        const criticalErrors = [
          "off_topic",
          "incomplete_response",
          "dosage_misunderstood",
          "negation_reversal",
          "instruction_misread",
        ].reduce((sum, key) => sum + (errorMap.get(key) ?? 0), 0);

        if (saveResult.status === "created" && "id" in saveResult && saveResult.id) {
          try {
            const sessionSignature = buildSessionSignature(exercises, mode);
            const missionResult = await recordMissionCompletion({
              sessionId: saveResult.id,
              mode,
              sessionDate,
              scorePercent: Math.round(pct * 100),
              bronzeCredit,
              silverCredit,
              goldCredit,
              minutes: totalMinutes,
              sessionSignature,
              criticalErrors,
              goldCheckpointPassed: goldContract?.checkpointPassed,
              goldContractStatus,
              confidenceWeight: Math.min(1, Math.max(0.25, allResults.size / 20)),
              skillDeltas: sessionSkillImpact.skills.map((skill) => ({
                skillKey: skill.skillKey,
                points: skill.points,
                evidenceCount: skill.evidenceCount,
                proficiencySample: skill.proficiencySample,
              })),
              evidenceEntries: computeExerciseEvidenceEntries(sessionExercises, allResults),
              errorDeltas: Array.from(errorMap.entries()).map(([errorKey, count]) => ({
                errorKey,
                count,
              })),
            });
            await attachMissionOutcome({
              sessionId: saveResult.id,
              missionId: missionResult.missionId,
              checkpointAwardedId: missionResult.checkpointAwardedId ?? undefined,
              checkpointPassed: missionResult.checkpointPassed,
              goldContractStatus: missionResult.goldContractStatus as
                | "strong"
                | "partial"
                | "missed"
                | undefined,
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
          const correctionCards = extractCorrectionCards(sessionExercises, allResults);
          if (correctionCards.length > 0) {
            bulkAddCards({ cards: correctionCards })
              .then(() => {
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
    },
    [
      attachMissionOutcome,
      bulkAddCards,
      exercises,
      mode,
      recordMissionCompletion,
      resumeStorageKey,
      saveSession,
      sessionDate,
      sessionExercises,
      total,
      updateCardExplanation,
    ],
  );

  /** Record a result for the current exercise and advance */
  const submitResult = useCallback(
    async (result: ExerciseResult) => {
      if (!currentExercise) return;
      if (submittedExerciseIds.current.has(currentExercise._id)) return;
      submittedExerciseIds.current.add(currentExercise._id);

      // Store result locally
      const nextResults = new Map(resultsRef.current);
      nextResults.set(currentExercise._id, result);
      resultsRef.current = nextResults;
      setResults(nextResults);
      const feedbackScore = resultScore(result);
      triggerAnswerFeedback(
        currentExercise.type === "srs"
          ? feedbackScore >= 0.6
            ? "success"
            : "error"
          : feedbackScore >= 0.8
            ? "success"
            : feedbackScore >= 0.45
              ? "warning"
              : "error",
      );

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
        // Pass quality directly — SM-2 handles 0 (again), 2 (hard), 3 (good), 5 (easy)
        const sm2Quality = quality;

        if (isCardExercise) {
          // Card from cards table — call review directly
          const realCardId = currentExercise._id.replace("card-", "");
          reviewCard({ cardId: realCardId as Parameters<typeof reviewCard>[0]["cardId"], quality: sm2Quality }).catch(() => {});
        } else {
          // Mission SRS exercise — upsert into cards table for SM-2 tracking
          const content = getSrsText(currentExercise.content);
          const resultDirection =
            (result as SrsResult).direction ?? content?.direction ?? "it_to_en";
          if (content?.front && content.back) {
            upsertCard({
              it: content.front,
              en: content.back,
              example: content.example,
              source: "mission_topup" as const,
              tag: currentExercise.missionId ?? undefined,
              level: currentExercise.difficulty ?? "A1",
              direction: resultDirection,
              quality: sm2Quality,
            }).catch(() => {});
          }
        }
      }

      // Advance or finish
      if (current + 1 >= total) {
        await finalizeSession(new Map(nextResults));
      } else {
        setCurrent((c) => c + 1);
      }
    },
    [
      current,
      currentExercise,
      total,
        results,
        resultsRef,
      sessionExercises,
      markComplete,
      saveSession,
      attachMissionOutcome,
      bulkAddCards,
      updateCardExplanation,
      recordMissionCompletion,
      finalizeSession,
      mode,
    ],
  );

  /** Skip to next exercise without recording a result */
  const skip = useCallback(() => {
    if (current + 1 >= total) {
      void finalizeSession(new Map(resultsRef.current));
    } else {
      setCurrent((c) => c + 1);
    }
  }, [current, finalizeSession, total]);

  const endSession = useCallback(() => {
    void finalizeSession(new Map(resultsRef.current));
  }, [finalizeSession]);

  return {
    current,
    total,
    progress,
    currentExercise,
    sessionExercises,
    done,
    saving,
    error,
    results: visibleResults,
    resultsRef,
    sessionErrors,
    missionCompleted,
    submitResult,
    skip,
    endSession,
  };
}

export type UseExerciseSessionResult = ReturnType<typeof useExerciseSession>;
