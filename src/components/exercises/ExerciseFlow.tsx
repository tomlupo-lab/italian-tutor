"use client";

import { useExerciseSession } from "@/hooks/useExerciseSession";
import type { Exercise, ExerciseMode } from "@/lib/exerciseTypes";
import ExerciseRenderer from "./ExerciseRenderer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

interface ExerciseFlowProps {
  exercises: Exercise[];
  mode: ExerciseMode;
  date: string;
}

export default function ExerciseFlow({
  exercises,
  mode,
  date,
}: ExerciseFlowProps) {
  const {
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
  } = useExerciseSession({ exercises, mode, date });

  // ── Completion screen ──────────────────────────────────────────────
  if (done) {
    const correctCount = Array.from(results.values()).filter((r) => {
      if ("correct" in r && typeof (r as { correct: boolean }).correct === "boolean")
        return (r as { correct: boolean }).correct;
      if ("scores" in r && Array.isArray((r as { scores: boolean[] }).scores))
        return (r as { scores: boolean[] }).scores.every(Boolean);
      return false;
    }).length;

    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        {saving ? (
          <>
            <Loader2 size={48} className="text-accent animate-spin" />
            <p className="text-white/50">Saving session...</p>
          </>
        ) : error ? (
          <>
            <XCircle size={48} className="text-danger" />
            <p className="text-danger text-sm">{error}</p>
            <Link
              href="/"
              className="px-6 py-3 bg-card rounded-xl border border-white/10 text-sm"
            >
              Back to Home
            </Link>
          </>
        ) : (
          <>
            <CheckCircle size={48} className="text-success" />
            <h2 className="text-2xl font-bold">Session Complete!</h2>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-accent-light">
                  {results.size}/{total}
                </p>
                <p className="text-xs text-white/40">exercises</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-success">
                  {correctCount}
                </p>
                <p className="text-xs text-white/40">correct</p>
              </div>
              {sessionErrors.length > 0 && (
                <div>
                  <p className="text-3xl font-bold text-warn">
                    {sessionErrors.length}
                  </p>
                  <p className="text-xs text-white/40">errors</p>
                </div>
              )}
            </div>
            {sessionErrors.length > 0 && (
              <div className="w-full bg-card rounded-xl border border-white/10 p-4 space-y-2">
                <h3 className="text-sm font-medium text-white/60">
                  Errors to review
                </h3>
                {sessionErrors.slice(0, 5).map((err, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-danger line-through">
                      {err.original}
                    </span>
                    {" → "}
                    <span className="text-success">{err.corrected}</span>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/"
              className="px-6 py-3 bg-accent rounded-xl text-sm font-medium"
            >
              Back to Home
            </Link>
          </>
        )}
      </div>
    );
  }

  // ── Active exercise ────────────────────────────────────────────────
  if (!currentExercise) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-white/50">No exercises available</p>
        <Link
          href="/"
          className="mt-4 inline-block px-4 py-2 bg-card rounded-xl border border-white/10 text-sm"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4 pb-20">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-white/40 tabular-nums">
          {current + 1}/{total}
        </span>
      </div>

      {/* Exercise type label */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-light">
          {currentExercise.type.replace("_", " ")}
        </span>
        {currentExercise.skillId && (
          <span className="text-xs text-white/30">
            {currentExercise.skillId}
          </span>
        )}
      </div>

      {/* Exercise component */}
      <ExerciseRenderer
        exercise={currentExercise}
        onComplete={submitResult}
        onSkip={skip}
      />
    </div>
  );
}
