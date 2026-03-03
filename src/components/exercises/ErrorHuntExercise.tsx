"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ErrorHuntContent,
  ErrorHuntResult,
  ExerciseResult,
} from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { AlertTriangle, Check, X } from "lucide-react";

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function ErrorHuntExercise({ content, onComplete }: Props) {
  const c = content as ErrorHuntContent;
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [corrections, setCorrections] = useState<Map<number, string>>(
    new Map(),
  );
  const [phase, setPhase] = useState<"flag" | "correct" | "review">("flag");
  const [showResults, setShowResults] = useState(false);

  // Guard: malformed content (after hooks to satisfy Rules of Hooks)
  if (!Array.isArray(c?.sentences) || c.sentences.length === 0) {
    return <div className="bg-card rounded-2xl border border-white/10 p-5 text-white/50 text-sm">Exercise data missing</div>;
  }
  const startTime = useRef(Date.now());

  const handleToggleFlag = useCallback(
    (idx: number) => {
      if (phase !== "flag") return;
      setFlagged((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        return next;
      });
    },
    [phase],
  );

  const handleProceedToCorrect = useCallback(() => {
    if (flagged.size === 0) {
      // No flags — just submit
      handleSubmit();
      return;
    }
    setPhase("correct");
  }, [flagged]);

  const handleCorrectionChange = useCallback((idx: number, val: string) => {
    setCorrections((prev) => {
      const next = new Map(prev);
      next.set(idx, val);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const identified = c.sentences.map((_, i) => flagged.has(i));
    const correctionArr = c.sentences.map((_, i) =>
      corrections.get(i) || "",
    );

    // Score each sentence
    const scoreArr = c.sentences.map((s, i) => {
      const userFlagged = flagged.has(i);
      if (s.has_error && userFlagged) {
        // Correctly flagged — check if correction is close enough
        const userCorr = (corrections.get(i) || "").trim().toLowerCase();
        const expected = (s.corrected || "").trim().toLowerCase();
        return userCorr === expected || userCorr.includes(expected) || expected.includes(userCorr);
      }
      if (!s.has_error && !userFlagged) {
        return true; // Correctly left alone
      }
      return false; // Wrong flag or missed error
    });

    setShowResults(true);
    setPhase("review");

    const result: ErrorHuntResult = {
      identified,
      corrections: correctionArr,
      scores: scoreArr,
      time_ms: Date.now() - startTime.current,
    };

    setTimeout(() => onComplete(result), 3000);
  }, [c.sentences, flagged, corrections, onComplete]);

  return (
    <div className="bg-card rounded-2xl border border-white/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-warn" />
        <h3 className="text-sm font-medium">
          {phase === "flag"
            ? "Tap sentences that contain errors"
            : phase === "correct"
              ? "Correct the flagged sentences"
              : "Results"}
        </h3>
      </div>

      {/* Sentences */}
      <div className="space-y-2">
        {c.sentences.map((s, i) => (
          <div key={i}>
            <button
              onClick={() => handleToggleFlag(i)}
              disabled={phase !== "flag"}
              className={cn(
                "w-full text-left py-3 px-4 rounded-xl text-sm transition",
                showResults
                  ? s.has_error && flagged.has(i)
                    ? "bg-success/10 border border-success/30"
                    : s.has_error && !flagged.has(i)
                      ? "bg-danger/10 border border-danger/30"
                      : !s.has_error && flagged.has(i)
                        ? "bg-warn/10 border border-warn/30"
                        : "bg-white/5 border border-white/5"
                  : flagged.has(i)
                    ? "bg-warn/10 border border-warn/30"
                    : "bg-white/5 border border-white/10 hover:border-white/20",
              )}
            >
              <div className="flex items-start gap-2">
                <span className="flex-1">{s.text}</span>
                {showResults &&
                  (s.has_error ? (
                    flagged.has(i) ? (
                      <Check size={16} className="text-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <X size={16} className="text-danger flex-shrink-0 mt-0.5" />
                    )
                  ) : flagged.has(i) ? (
                    <X size={16} className="text-warn flex-shrink-0 mt-0.5" />
                  ) : (
                    <Check size={16} className="text-success/50 flex-shrink-0 mt-0.5" />
                  ))}
              </div>

              {/* Show correction input in correct phase */}
              {phase === "correct" && flagged.has(i) && (
                <input
                  type="text"
                  value={corrections.get(i) || ""}
                  onChange={(e) => handleCorrectionChange(i, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Type the corrected sentence..."
                  autoComplete="off"
                  autoCapitalize="off"
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent/40"
                />
              )}

              {/* Show explanation in review */}
              {showResults && s.has_error && s.explanation && (
                <p className="mt-1 text-xs text-white/40">
                  {s.corrected && (
                    <span className="text-success">{s.corrected}</span>
                  )}
                  {" — "}
                  {s.explanation}
                </p>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Action button */}
      {phase === "flag" && (
        <button
          onClick={handleProceedToCorrect}
          className="w-full py-3 bg-accent rounded-xl text-sm font-medium"
        >
          {flagged.size > 0
            ? `Continue with ${flagged.size} flagged`
            : "No errors found"}
        </button>
      )}
      {phase === "correct" && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-accent rounded-xl text-sm font-medium"
        >
          Submit corrections
        </button>
      )}
    </div>
  );
}
