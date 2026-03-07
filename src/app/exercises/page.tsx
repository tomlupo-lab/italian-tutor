"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ExerciseRenderer from "@/components/exercises/ExerciseRenderer";
import ExerciseErrorBoundary from "@/components/exercises/ExerciseErrorBoundary";
import type { Exercise, ExerciseResult } from "@/lib/exerciseTypes";
import { Loader2, RefreshCw, Target, Shuffle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiPath } from "@/lib/paths";
import Link from "next/link";

type PracticeMode = "errors" | "random" | "typed";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCard = Record<string, any>;

const DRILL_TYPES: { type: string; label: string; emoji: string }[] = [
  { type: "cloze", label: "Fill-in-blank", emoji: "📝" },
  { type: "word_builder", label: "Word builder", emoji: "🧩" },
  { type: "pattern_drill", label: "Pattern drill", emoji: "🔄" },
  { type: "speed_translation", label: "Translation", emoji: "⚡" },
  { type: "error_hunt", label: "Error hunt", emoji: "🔍" },
];

export default function ExercisesPage() {
  const [mode, setMode] = useState<PracticeMode | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [recoveryFocus, setRecoveryFocus] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Map<string, ExerciseResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allCards = useQuery(api.cards.getAll);
  const practiceExercises = useQuery(
    api.exercises.getForPractice,
    selectedType ? { limit: 5, types: [selectedType] } : { limit: 5 },
  );
  const bulkAddCards = useMutation(api.cards.bulkAdd);

  // Recent correction cards for error-based practice
  const recentErrors = useMemo(() => {
    if (!allCards) return [];
    return (allCards as AnyCard[])
      .filter((c) => c.source === "correction")
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0))
      .slice(0, 10);
  }, [allCards]);

  const startPractice = useCallback(
    async (selectedMode: PracticeMode, typeFilter?: string) => {
      setCurrent(0);
      setResults(new Map());
      setDone(false);
      setError(null);
      setMode(selectedMode);

      if (selectedMode === "random" || selectedMode === "typed") {
        // Use existing exercises from Convex — instant, no API call
        if (typeFilter) setSelectedType(typeFilter);
        // When changing type filter, practiceExercises may not reflect
        // the new filter yet — only use current data if no filter change
        if (!typeFilter && practiceExercises && practiceExercises.length > 0) {
          setExercises(practiceExercises as Exercise[]);
        } else if (typeFilter) {
          // Let the reactive query update — exercises will be set via effect
          setLoading(true);
        } else {
          setError("No exercises available for this type. Try another!");
        }
      } else {
        // Error Drills — generate with OpenAI
        setLoading(true);
        try {
          const res = await fetch(apiPath("/api/generate-practice"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              count: 5,
              level: "A2",
              errors: recentErrors.map((c) => ({
                it: c.it,
                en: c.en,
                errorCategory: c.errorCategory,
                example: c.example,
              })),
              types: ["cloze", "pattern_drill", "speed_translation"],
            }),
          });

          if (!res.ok) throw new Error("Failed to generate exercises");
          const { exercises: generated } = await res.json();
          setExercises(generated);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to generate");
          setMode(null);
        } finally {
          setLoading(false);
        }
      }
    },
    [recentErrors, practiceExercises],
  );

  // Handle typed mode: when practiceExercises reactively updates after type filter change
  const prevPracticeRef = useRef(practiceExercises);
  useEffect(() => {
    if (!loading || mode !== "typed" || !practiceExercises) return;
    if (practiceExercises === prevPracticeRef.current) return;

    prevPracticeRef.current = practiceExercises;
    if (practiceExercises.length > 0) {
      setExercises(practiceExercises as Exercise[]);
      setLoading(false);
      setError(null);
      return;
    }

    setError("No exercises available for this type. Try another!");
    setLoading(false);
    setMode(null);
  }, [loading, mode, practiceExercises]);

  const currentExercise = exercises[current] ?? null;
  const progress = exercises.length > 0 ? (current / exercises.length) * 100 : 0;

  const handleComplete = useCallback(
    (result: ExerciseResult) => {
      if (!currentExercise) return;

      setResults((prev) => {
        const next = new Map(prev);
        next.set(currentExercise._id, result);
        return next;
      });

      if (current + 1 >= exercises.length) {
        setDone(true);
        // Create correction cards from wrong answers
        const wrongCards: { it: string; en: string; source: "correction"; errorCategory: string }[] = [];
        const allResults = new Map(results);
        allResults.set(currentExercise._id, result);

        for (const [id, r] of allResults) {
          const ex = exercises.find((e) => e._id === id);
          if (!ex) continue;

          if ("correct" in r && !(r as { correct: boolean }).correct) {
            const content = ex.content as unknown as Record<string, unknown>;
            const sentence = typeof content.sentence === "string" ? content.sentence : null;
            const options = Array.isArray(content.options) ? content.options as string[] : null;
            const correctIdx = typeof content.correct === "number" ? content.correct : null;
            if (sentence && options && correctIdx !== null && options[correctIdx]) {
              const parts = sentence.split("___");
              const filled = parts.join(options[correctIdx]);
              wrongCards.push({
                it: filled,
                en: `Practice: ${options[correctIdx]}`,
                source: "correction",
                errorCategory: ex.type,
              });
            }
          }
          if ("scores" in r) {
            const scores = (r as { scores: boolean[] }).scores;
            if (Array.isArray(scores)) {
              scores.forEach((s, i) => {
                if (!s) {
                  const content = ex.content as unknown as Record<string, unknown>;
                  const sentences = Array.isArray(content.sentences) ? content.sentences : [];
                  const sentence = sentences[i] as Record<string, unknown> | undefined;
                  const options = sentence && Array.isArray(sentence.options) ? sentence.options as string[] : null;
                  const correctIdx = sentence && typeof sentence.correct === "number" ? sentence.correct : null;
                  if (options && correctIdx !== null && options[correctIdx]) {
                    wrongCards.push({
                      it: options[correctIdx],
                      en: (typeof sentence?.source === "string" ? sentence.source : null) || "Practice exercise",
                      source: "correction",
                      errorCategory: ex.type,
                    });
                  }
                }
              });
            }
          }
        }

        if (wrongCards.length > 0) {
          bulkAddCards({ cards: wrongCards }).catch(() => {});
        }
      } else {
        setCurrent((c) => c + 1);
      }
    },
    [current, currentExercise, exercises, results, bulkAddCards],
  );

  const handleSkip = useCallback(() => {
    if (current + 1 >= exercises.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
    }
  }, [current, exercises.length]);

  const correctCount = useMemo(() => {
    return Array.from(results.values()).filter((r) => {
      if ("correct" in r && typeof (r as { correct: boolean }).correct === "boolean")
        return (r as { correct: boolean }).correct;
      if ("scores" in r && Array.isArray((r as { scores: boolean[] }).scores))
        return (r as { scores: boolean[] }).scores.every(Boolean);
      return false;
    }).length;
  }, [results]);

  const availableCount = practiceExercises?.length ?? 0;

  useEffect(() => {
    if (mode || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("focus") === "recovery") {
      setRecoveryFocus(true);
      startPractice("errors");
    }
  }, [mode, startPractice]);

  // ── Mode selection screen ───────────────────────────────
  if (!mode || (exercises.length === 0 && !loading)) {
    return (
      <main className="min-h-screen max-w-lg mx-auto px-4 py-6 space-y-4">
        <h1 className="text-lg font-semibold text-center">Drills</h1>
        <p className="text-xs text-white/30 text-center">
          Practice exercises on demand
        </p>

        {(recoveryFocus || recentErrors.length > 0) && (
          <div className="rounded-2xl border border-warn/30 bg-warn/10 p-4 space-y-1">
            <p className="text-[11px] text-warn uppercase tracking-wider">Recovery Focus</p>
            <p className="text-sm font-medium">
              {recentErrors.length > 0
                ? `Marco detected ${recentErrors.length} recent errors to target`
                : "Run a focused recovery set"}
            </p>
            <p className="text-xs text-white/50">
              Start with Error Drills first, then switch to Random Mix.
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {/* Error drills */}
          <button
            onClick={() => startPractice("errors")}
            disabled={recentErrors.length === 0}
            className={cn(
              "w-full text-left rounded-2xl border p-4 transition active:scale-[0.98]",
              "bg-gradient-to-br from-warn/15 to-warn/5 border-warn/20",
              recentErrors.length === 0 && "opacity-40 cursor-not-allowed",
            )}
          >
            <div className="flex items-center gap-3">
              <Target size={24} className="text-warn flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Error Drills</span>
                  {recentErrors.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warn/20 text-warn">
                      {recentErrors.length} errors
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  AI generates exercises targeting your recent mistakes
                </p>
              </div>
            </div>
          </button>

          {/* Random practice — from existing exercises */}
          <button
            onClick={() => startPractice("random")}
            disabled={availableCount === 0}
            className={cn(
              "w-full text-left rounded-2xl border p-4 transition active:scale-[0.98]",
              "bg-gradient-to-br from-accent/15 to-accent/5 border-accent/20",
              availableCount === 0 && "opacity-40 cursor-not-allowed",
            )}
          >
            <div className="flex items-center gap-3">
              <Shuffle size={24} className="text-accent-light flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Random Mix</span>
                  {availableCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-light">
                      {availableCount} ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  Replay exercises from your lesson batches
                </p>
              </div>
            </div>
          </button>

          <Link
            href="/practice"
            className="w-full block text-left rounded-2xl border p-4 transition active:scale-[0.98] bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 border-yellow-500/20"
          >
            <div className="flex items-center gap-3">
              <RefreshCw size={24} className="text-yellow-300 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold">Cards (SRS)</span>
                <p className="text-xs text-white/40 mt-0.5">
                  Open spaced-repetition flashcards
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* By exercise type */}
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider px-1">
            By Type
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {DRILL_TYPES.map(({ type, label, emoji }) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  startPractice("typed", type);
                }}
                className="text-left rounded-xl border border-white/10 bg-card p-3 transition active:scale-[0.98] hover:border-white/20"
              >
                <span className="text-lg">{emoji}</span>
                <p className="text-xs font-medium mt-1">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-danger text-center">{error}</p>
        )}
      </main>
    );
  }

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="text-accent animate-spin" />
        <p className="text-white/50 text-sm">Generating exercises...</p>
      </main>
    );
  }

  // ── Completion screen ───────────────────────────────────
  if (done) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <CheckCircle size={48} className="text-success" />
        <h2 className="text-2xl font-bold">Practice Complete!</h2>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-accent-light">
              {results.size}/{exercises.length}
            </p>
            <p className="text-xs text-white/40">exercises</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-success">{correctCount}</p>
            <p className="text-xs text-white/40">correct</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => startPractice(mode)}
            className="px-5 py-3 bg-accent rounded-xl text-sm font-medium hover:bg-accent/80 transition flex items-center gap-2"
          >
            <RefreshCw size={16} />
            More Practice
          </button>
          <button
            onClick={() => {
              setMode(null);
              setExercises([]);
              setDone(false);
            }}
            className="px-5 py-3 bg-card rounded-xl border border-white/10 text-sm"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  // ── Active exercise ────────────────────────────────────
  if (!currentExercise) return null;

  return (
    <main className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-white/40 tabular-nums">
          {current + 1}/{exercises.length}
        </span>
      </div>

      {/* Exercise type + mode label */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-light">
          {currentExercise.type.replace("_", " ")}
        </span>
        <span className="text-xs text-white/20">
          {mode === "errors" ? "Error drill" : "Random practice"}
        </span>
      </div>

      <ExerciseErrorBoundary key={currentExercise._id} onSkip={handleSkip}>
        <ExerciseRenderer
          exercise={currentExercise}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      </ExerciseErrorBoundary>
    </main>
  );
}
