"use client";

import { useCallback, useRef, useState } from "react";
import type { ClozeContent, ClozeResult, ExerciseResult } from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { Volume2 } from "lucide-react";

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function ClozeSprintExercise({ content, onComplete }: Props) {
  const c = content as ClozeContent;
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const startTime = useRef(Date.now());

  const handleSelect = useCallback(
    (idx: number) => {
      if (showResult) return;
      setSelected(idx);
      setShowResult(true);

      const isCorrect = idx === c.correct;
      const result: ClozeResult = {
        selected: idx,
        correct: isCorrect,
        time_ms: Date.now() - startTime.current,
      };

      // Auto-advance after brief feedback
      setTimeout(
        () => {
          onComplete(result);
        },
        isCorrect ? 600 : 1500,
      );
    },
    [c.correct, onComplete, showResult],
  );

  const handleSpeak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const full = c.sentence.replace("___", c.options[c.correct]);
    const u = new SpeechSynthesisUtterance(full);
    u.lang = "it-IT";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }, [c]);

  return (
    <div className="bg-card rounded-2xl border border-white/10 p-5 space-y-5">
      {/* Sentence with blank */}
      <div className="flex items-start gap-2">
        <p className="text-lg leading-relaxed flex-1">
          {c.sentence.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  className={cn(
                    "inline-block min-w-[4rem] border-b-2 mx-1 text-center font-semibold",
                    showResult && selected === c.correct
                      ? "border-success text-success"
                      : showResult
                        ? "border-danger text-danger"
                        : "border-accent/50",
                  )}
                >
                  {showResult ? c.options[c.correct] : "\u00A0"}
                </span>
              )}
            </span>
          ))}
        </p>
        <button
          onClick={handleSpeak}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 transition flex-shrink-0 mt-1"
        >
          <Volume2 size={16} />
        </button>
      </div>

      {/* Hint */}
      {c.hint && (
        <p className="text-xs text-white/30 italic">{c.hint}</p>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {c.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={showResult}
            className={cn(
              "py-3 px-4 rounded-xl text-sm font-medium transition min-h-[48px]",
              showResult && idx === c.correct
                ? "bg-success/20 border border-success/40 text-success"
                : showResult && idx === selected
                  ? "bg-danger/20 border border-danger/40 text-danger"
                  : "bg-white/5 border border-white/10 hover:border-accent/30 active:scale-95",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
