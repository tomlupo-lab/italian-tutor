"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ExerciseResult,
  PatternDrillContent,
  PatternDrillResult,
} from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { Check, X } from "lucide-react";

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function PatternDrillExercise({ content, onComplete }: Props) {
  const c = content as PatternDrillContent;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [scores, setScores] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const startTime = useRef(Date.now());
  const [showHint, setShowHint] = useState(false);

  // Guard: malformed content (after hooks to satisfy Rules of Hooks)
  if (!Array.isArray(c?.sentences) || c.sentences.length === 0) {
    return <div className="bg-card rounded-2xl border border-white/10 p-5 text-white/50 text-sm">Exercise data missing</div>;
  }

  const sentence = c.sentences[currentIdx];
  const isDone = currentIdx >= c.sentences.length;

  const handleSubmit = useCallback(() => {
    if (!sentence || showFeedback) return;

    const userAnswer = input.trim().toLowerCase();
    const correct = userAnswer === sentence.correct.toLowerCase();

    setAnswers((prev) => [...prev, input.trim()]);
    setScores((prev) => [...prev, correct]);
    setLastCorrect(correct);
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setInput("");
      setShowHint(false);
      setLastCorrect(false);

      if (currentIdx + 1 >= c.sentences.length) {
        // All done
        const allAnswers = [...answers, input.trim()];
        const allScores = [...scores, correct];
        const result: PatternDrillResult = {
          answers: allAnswers,
          scores: allScores,
          time_ms: Date.now() - startTime.current,
        };
        onComplete(result);
      } else {
        setCurrentIdx((i) => i + 1);
      }
    }, correct ? 800 : 1800);
  }, [input, sentence, showFeedback, currentIdx, c.sentences.length, answers, scores, onComplete]);

  if (isDone) return null;

  return (
    <div className="bg-card rounded-2xl border border-white/10 p-5 space-y-4">
      {/* Pattern header */}
      <div>
        <h3 className="text-sm font-medium text-accent-light">
          {c.pattern_name}
        </h3>
        <p className="text-xs text-white/40 mt-1">{c.pattern_description}</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center">
        {c.sentences.map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition",
              i < currentIdx
                ? scores[i]
                  ? "bg-success"
                  : "bg-danger"
                : i === currentIdx
                  ? "bg-accent"
                  : "bg-white/10",
            )}
          />
        ))}
      </div>

      {/* Sentence template */}
      <p className="text-lg leading-relaxed text-center">
        {sentence.template.split("___").map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 && (
              <span
                className={cn(
                  "inline-block min-w-[4rem] border-b-2 mx-1 text-center font-semibold",
                  showFeedback && lastCorrect
                    ? "border-success text-success"
                    : showFeedback
                      ? "border-danger text-danger"
                      : "border-accent/50",
                )}
              >
                {showFeedback
                  ? lastCorrect
                    ? input.trim()
                    : sentence.correct
                  : "\u00A0"}
              </span>
            )}
          </span>
        ))}
      </p>

      {/* Blank label */}
      <p className="text-xs text-white/30 text-center">{sentence.blank}</p>

      {/* Input + feedback */}
      {showFeedback ? (
        <div className="flex items-center justify-center gap-2 py-2">
          {lastCorrect ? (
            <Check size={20} className="text-success" />
          ) : (
            <>
              <X size={20} className="text-danger" />
              <span className="text-sm text-white/50">
                Correct: <strong className="text-success">{sentence.correct}</strong>
              </span>
            </>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/40"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={cn(
              "px-4 py-3 rounded-xl text-sm font-medium transition",
              input.trim()
                ? "bg-accent text-white"
                : "bg-white/5 text-white/20",
            )}
          >
            Check
          </button>
        </form>
      )}

      {/* Hint toggle */}
      {sentence.hint && !showFeedback && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-xs text-white/30 hover:text-white/50 transition"
        >
          {showHint ? sentence.hint : "Show hint"}
        </button>
      )}
    </div>
  );
}
