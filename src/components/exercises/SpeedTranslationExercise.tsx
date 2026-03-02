"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ExerciseResult,
  SpeedTranslationContent,
  SpeedTranslationResult,
} from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { Clock, Check, X } from "lucide-react";

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function SpeedTranslationExercise({
  content,
  onComplete,
}: Props) {
  const c = content as SpeedTranslationContent;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [scores, setScores] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(c.time_limit_seconds);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sentence = c.sentences[currentIdx];
  const total = c.sentences.length;

  // Timer
  useEffect(() => {
    if (finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up — finish with unanswered
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [finished]);

  // Handle time running out
  useEffect(() => {
    if (timeLeft > 0 || finished) return;
    // Pad remaining answers with -1
    const remaining = total - answers.length;
    const paddedAnswers = [...answers, ...Array(remaining).fill(-1)];
    const paddedScores = [...scores, ...Array(remaining).fill(false)];
    const totalCorrect = paddedScores.filter(Boolean).length;

    setFinished(true);
    const result: SpeedTranslationResult = {
      answers: paddedAnswers,
      scores: paddedScores,
      total_correct: totalCorrect,
      time_ms: c.time_limit_seconds * 1000,
    };
    onComplete(result);
  }, [timeLeft, finished, answers, scores, total, c.time_limit_seconds, onComplete]);

  const handleSelect = useCallback(
    (idx: number) => {
      if (showFeedback || finished) return;

      const correct = idx === sentence.correct;
      setAnswers((prev) => [...prev, idx]);
      setScores((prev) => [...prev, correct]);
      setShowFeedback(true);

      setTimeout(() => {
        setShowFeedback(false);
        if (currentIdx + 1 >= total) {
          // All answered
          setFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
          const allAnswers = [...answers, idx];
          const allScores = [...scores, correct];
          const result: SpeedTranslationResult = {
            answers: allAnswers,
            scores: allScores,
            total_correct: allScores.filter(Boolean).length,
            time_ms: Date.now() - startTime.current,
          };
          onComplete(result);
        } else {
          setCurrentIdx((i) => i + 1);
        }
      }, correct ? 400 : 1000);
    },
    [showFeedback, finished, sentence, currentIdx, total, answers, scores, onComplete],
  );

  if (finished) return null;

  const timerPct = (timeLeft / c.time_limit_seconds) * 100;
  const isUrgent = timeLeft <= 15;

  return (
    <div className="bg-card rounded-2xl border border-white/10 p-5 space-y-4">
      {/* Timer bar */}
      <div className="flex items-center gap-3">
        <Clock
          size={16}
          className={cn(isUrgent ? "text-danger" : "text-white/40")}
        />
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              isUrgent ? "bg-danger" : "bg-accent",
            )}
            style={{ width: `${timerPct}%` }}
          />
        </div>
        <span
          className={cn(
            "text-sm tabular-nums font-medium",
            isUrgent ? "text-danger" : "text-white/40",
          )}
        >
          {timeLeft}s
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-white/30">
        <span>
          {currentIdx + 1} of {total}
        </span>
        <span>
          {scores.filter(Boolean).length} correct
        </span>
      </div>

      {/* Source sentence */}
      <p className="text-lg font-medium text-center py-2">{sentence.source}</p>

      {/* Options */}
      <div className="space-y-2">
        {sentence.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={showFeedback}
            className={cn(
              "w-full py-3 px-4 rounded-xl text-sm text-left transition min-h-[48px]",
              showFeedback && idx === sentence.correct
                ? "bg-success/20 border border-success/40 text-success"
                : showFeedback && idx === answers[currentIdx]
                  ? "bg-danger/20 border border-danger/40 text-danger"
                  : "bg-white/5 border border-white/10 hover:border-accent/30 active:scale-[0.98]",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
