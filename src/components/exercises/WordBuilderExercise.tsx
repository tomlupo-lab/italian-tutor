"use client";

import { useCallback, useRef, useState } from "react";
import type { ExerciseResult, WordBuilderContent, WordBuilderResult } from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { RotateCcw } from "lucide-react";

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function WordBuilderExercise({ content, onComplete }: Props) {
  const c = content as WordBuilderContent;
  const [placed, setPlaced] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const startTime = useRef(Date.now());

  const available = c.scrambled_words
    .map((_, i) => i)
    .filter((i) => !placed.includes(i));

  const builtSentence = placed.map((i) => c.scrambled_words[i]).join(" ");
  const targetWords = c.target_sentence.split(" ");

  const handleTapWord = useCallback(
    (idx: number) => {
      if (showResult) return;
      setPlaced((prev) => [...prev, idx]);
    },
    [showResult],
  );

  const handleRemoveLast = useCallback(() => {
    if (showResult) return;
    setPlaced((prev) => prev.slice(0, -1));
  }, [showResult]);

  const handleReset = useCallback(() => {
    if (showResult) return;
    setPlaced([]);
  }, [showResult]);

  const handleSubmit = useCallback(() => {
    if (placed.length !== c.scrambled_words.length) return;

    const builtWords = placed.map((i) => c.scrambled_words[i]);
    const correct =
      builtWords.join(" ").toLowerCase() ===
      c.target_sentence.toLowerCase();

    setIsCorrect(correct);
    setShowResult(true);

    const result: WordBuilderResult = {
      user_order: placed,
      correct,
      time_ms: Date.now() - startTime.current,
    };

    setTimeout(
      () => onComplete(result),
      correct ? 800 : 2000,
    );
  }, [placed, c, onComplete]);

  return (
    <div className="bg-card rounded-2xl border border-white/10 p-5 space-y-5">
      {/* Translation hint */}
      {c.translation && (
        <p className="text-sm text-white/40 text-center italic">
          {c.translation}
        </p>
      )}

      {/* Built sentence area */}
      <div
        className={cn(
          "min-h-[60px] rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-2 items-center",
          showResult && isCorrect
            ? "border-success/40 bg-success/5"
            : showResult
              ? "border-danger/40 bg-danger/5"
              : "border-white/10",
        )}
        onClick={handleRemoveLast}
      >
        {placed.length === 0 ? (
          <span className="text-white/20 text-sm">Tap words to build the sentence...</span>
        ) : (
          placed.map((wordIdx, i) => (
            <span
              key={i}
              className="px-3 py-1.5 bg-accent/20 rounded-lg text-sm font-medium text-accent-light"
            >
              {c.scrambled_words[wordIdx]}
            </span>
          ))
        )}
      </div>

      {/* Show correct answer on wrong */}
      {showResult && !isCorrect && (
        <p className="text-sm text-success text-center">
          {c.target_sentence}
        </p>
      )}

      {/* Available words */}
      <div className="flex flex-wrap gap-2 justify-center">
        {c.scrambled_words.map((word, idx) => {
          const isPlaced = placed.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleTapWord(idx)}
              disabled={isPlaced || showResult}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition min-h-[44px]",
                isPlaced
                  ? "bg-white/5 text-white/10 border border-white/5"
                  : "bg-white/10 border border-white/15 hover:border-accent/30 active:scale-95",
              )}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      {!showResult && (
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleReset}
            disabled={placed.length === 0}
            className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-white/60 transition disabled:opacity-30"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={handleSubmit}
            disabled={placed.length !== c.scrambled_words.length}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-medium transition",
              placed.length === c.scrambled_words.length
                ? "bg-accent text-white"
                : "bg-white/5 text-white/20",
            )}
          >
            Check
          </button>
        </div>
      )}
    </div>
  );
}
