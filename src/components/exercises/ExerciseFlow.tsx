"use client";

import { useMemo } from "react";
import { useExerciseSession } from "@/hooks/useExerciseSession";
import type { Exercise, ExerciseMode } from "@/lib/exerciseTypes";
import ExerciseRenderer from "./ExerciseRenderer";
import ExerciseErrorBoundary from "./ExerciseErrorBoundary";
import { CheckCircle, Loader2, XCircle, PartyPopper } from "lucide-react";
import Link from "next/link";
import SessionSummary from "../SessionSummary";
import { prettySkillLabel } from "@/lib/labels";
import { resultScore, summarizeResults } from "@/lib/exerciseResults";
import { computeSessionSkillImpact } from "@/lib/sessionSkillImpact";
import sessionContracts from "@/lib/sessionContracts";
import Badge from "../Badge";
import StudyProgressHeader from "../StudyProgressHeader";

const { getConversationMetrics } = sessionContracts;

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
  const isQuickMode = mode === "quick";
  const {
    current,
    total,
    progress,
    currentExercise,
    sessionExercises,
    done,
    saving,
    error,
    results,
    sessionErrors,
    missionCompleted,
    submitResult,
    skip,
  } = useExerciseSession({ exercises, mode, date });

  const contract = useMemo(() => {
    const { totalItems, accuracy } = summarizeResults(results.values());
    const completedAll = results.size >= total && total > 0;

    if (mode === "standard") {
      return {
        headline: "Marco Contract: Clean Structured Execution",
        rules: [
          { label: "Finish all Silver exercises", pass: completedAll },
          {
            label: "Reach at least 70% accuracy",
            pass: accuracy >= 0.7,
            meta: totalItems > 0 ? `${Math.round(accuracy * 100)}%` : "0%",
          },
        ],
      };
    }

    if (mode === "deep") {
      const { usedTargets, userTurns, completedAll } = getConversationMetrics(
        sessionExercises,
        results,
      );

      return {
        headline: "Marco Contract: Immersive Gold Roleplay",
        rules: [
          { label: "Complete the full Gold session", pass: completedAll },
          {
            label: "Use at least 2 target phrases in conversation",
            pass: usedTargets >= 2,
            meta: `${usedTargets}/2`,
          },
          {
            label: "Sustain dialogue for at least 4 learner turns",
            pass: userTurns >= 4,
            meta: `${userTurns}/4`,
          },
        ],
      };
    }

    return {
      headline: "Marco Contract",
      rules: [{ label: "Finish the session", pass: completedAll }],
    };
  }, [mode, results, sessionExercises, total]);
  const currentSkillLabel = prettySkillLabel(currentExercise?.skillId);

  // ── Completion screen ──────────────────────────────────────────────
  if (done) {
    const { accuracy } = summarizeResults(results.values());
    const topLevelCorrect = Array.from(results.values()).filter(
      (result) => resultScore(result) >= 0.6,
    ).length;
    const sessionSkillImpact = computeSessionSkillImpact(sessionExercises, results);

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
            {missionCompleted ? (
              <div className="w-full bg-gradient-to-br from-yellow-500/20 to-amber-600/10 rounded-2xl border border-yellow-500/30 p-6 text-center space-y-2 animate-pulse-once">
                <PartyPopper size={40} className="mx-auto text-yellow-400" />
                <h2 className="text-2xl font-bold text-yellow-300">Mission Complete!</h2>
                <p className="text-sm text-yellow-200/70">
                  All targets reached. Marco is unlocking your next mission.
                </p>
              </div>
            ) : (
              <>
                <CheckCircle size={48} className="text-success" />
                <h2 className="text-2xl font-bold">Session Complete!</h2>
              </>
            )}

            {/* Contract rules */}
            <div className="w-full bg-card rounded-xl border border-white/10 p-4 space-y-2">
              <h3 className="text-sm font-medium text-white/70">{contract.headline}</h3>
              {contract.rules.map((rule) => (
                <div key={rule.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className={rule.pass ? "text-success" : "text-warn"}>{rule.label}</span>
                  <span className="text-xs text-white/35">
                    {rule.meta ? `${rule.meta} · ` : ""}
                    {rule.pass ? "met" : "missed"}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress Summary — scores, skills, SRS, trends */}
            <SessionSummary
              mode={mode}
              exercisesCompleted={results.size}
              correctCount={topLevelCorrect}
              errorsCount={sessionErrors.length}
              accuracyPercent={Math.round(accuracy * 100)}
              sessionDate={date}
              sessionSkillImpact={sessionSkillImpact}
            />

            {/* Errors to review */}
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

  if (isQuickMode) {
    return (
      <div className="w-full flex flex-col items-center gap-4 pb-20">
        <StudyProgressHeader
          title="Bronze Cards"
          current={current + 1}
          total={total}
        />

        <ExerciseErrorBoundary key={currentExercise._id} onSkip={skip}>
          <ExerciseRenderer
            exercise={currentExercise}
            onComplete={submitResult}
            onSkip={skip}
          />
        </ExerciseErrorBoundary>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4 pb-20">
      <div className="rounded-xl border border-white/10 bg-card/40 px-3 py-2">
        <p className="text-[10px] text-accent-light uppercase tracking-wider">
          Session Contract
        </p>
        <p className="text-xs text-white/60 mt-0.5">{contract.headline}</p>
      </div>

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

      <div className="flex items-center gap-2">
        <Badge tone="accent" className="text-xs border-0">
          {currentExercise.type.replace("_", " ")}
        </Badge>
        {currentSkillLabel && (
          <span className="text-xs text-white/30">
            {currentSkillLabel}
          </span>
        )}
      </div>

      <ExerciseErrorBoundary key={currentExercise._id} onSkip={skip}>
        <ExerciseRenderer
          exercise={currentExercise}
          onComplete={submitResult}
          onSkip={skip}
        />
      </ExerciseErrorBoundary>
    </div>
  );
}
