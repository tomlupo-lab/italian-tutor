"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ExerciseRenderer from "@/components/exercises/ExerciseRenderer";
import ExerciseErrorBoundary from "@/components/exercises/ExerciseErrorBoundary";
import type { Exercise, ExerciseResult } from "@/lib/exerciseTypes";
import { Loader2, RefreshCw, Target, Shuffle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type PracticeMode = "errors" | "random";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCard = Record<string, any>;

export default function ExercisesPage() {
  const [mode, setMode] = useState<PracticeMode | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Map<string, ExerciseResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allCards = useQuery(api.cards.getAll);
  const bulkAddCards = useMutation(api.cards.bulkAdd);

  // Recent correction cards for error-based practice
  const recentErrors = useMemo(() => {
    if (!allCards) return [];
    return (allCards as AnyCard[])
      .filter((c) => c.source === "correction")
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0))
      .slice(0, 10);
  }, [allCards]);

  const generateExercises = useCallback(
    async (selectedMode: PracticeMode) => {
      setLoading(true);
      setError(null);
      setMode(selectedMode);
      setCurrent(0);
      setResults(new Map());
      setDone(false);

      try {
        const body: {
          count: number;
          level: string;
          errors?: { it: string; en: string; errorCategory?: string; example?: string }[];
          types?: string[];
        } = {
          count: 5,
          level: "A2",
        };

        if (selectedMode === "errors" && recentErrors.length > 0) {
          body.errors = recentErrors.map((c) => ({
            it: c.it,
            en: c.en,
            errorCategory: c.errorCategory,
            example: c.example,
          }));
          body.types = ["cloze", "pattern_drill", "speed_translation"];
        } else {
          body.types = ["cloze", "pattern_drill", "speed_translation"];
        }

        const res = await fetch("/api/generate-practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Failed to generate exercises");

        const { exercises: generated } = await res.json();
        setExercises(generated);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate");
      } finally {
        setLoading(false);
      }
    },
    [recentErrors],
  );

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
        // Create correction cards from wrong answers (same logic as session)
        const wrongCards: { it: string; en: string; source: "correction"; errorCategory: string }[] = [];
        const allResults = new Map(results);
        allResults.set(currentExercise._id, result);

        for (const [id, r] of allResults) {
          const ex = exercises.find((e) => e._id === id);
          if (!ex) continue;

          if ("correct" in r && !(r as { correct: boolean }).correct) {
            const content = ex.content as { sentence?: string; options?: string[]; correct?: number };
            if (content.sentence && content.options && typeof content.correct === "number") {
              const parts = (content.sentence as string).split("___");
              const filled = parts.join(content.options[content.correct]);
              wrongCards.push({
                it: filled,
                en: `Practice: ${content.options[content.correct]}`,
                source: "correction",
                errorCategory: ex.type,
              });
            }
          }
          if ("scores" in r) {
            const scores = (r as { scores: boolean[] }).scores;
            scores.forEach((s, i) => {
              if (!s) {
                const content = ex.content as { sentences?: { source?: string; options?: string[]; correct?: number; template?: string; correct_answer?: string }[] };
                const sentence = content.sentences?.[i];
                if (sentence?.options && typeof sentence.correct === "number") {
                  wrongCards.push({
                    it: sentence.options[sentence.correct],
                    en: sentence.source || "Practice exercise",
                    source: "correction",
                    errorCategory: ex.type,
                  });
                }
              }
            });
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

  // ── Mode selection screen ───────────────────────────────
  if (!mode || (exercises.length === 0 && !loading)) {
    return (
      <main className="min-h-screen max-w-lg mx-auto pb-20 px-4 py-6 space-y-4">
        <h1 className="text-lg font-semibold text-center">Exercises</h1>
        <p className="text-xs text-white/30 text-center">
          AI-generated practice — infinite drills on demand
        </p>

        <div className="space-y-3 pt-2">
          {/* Error drills */}
          <button
            onClick={() => generateExercises("errors")}
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
                  Practice exercises targeting your recent mistakes
                </p>
              </div>
            </div>
          </button>

          {/* Random practice */}
          <button
            onClick={() => generateExercises("random")}
            className={cn(
              "w-full text-left rounded-2xl border p-4 transition active:scale-[0.98]",
              "bg-gradient-to-br from-accent/15 to-accent/5 border-accent/20",
            )}
          >
            <div className="flex items-center gap-3">
              <Shuffle size={24} className="text-accent-light flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold">Random Practice</span>
                <p className="text-xs text-white/40 mt-0.5">
                  Fresh exercises at your level — cloze, pattern drills, translation
                </p>
              </div>
            </div>
          </button>
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
            onClick={() => generateExercises(mode)}
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
    <main className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4 pb-20">
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
