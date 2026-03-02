"use client";

import { useCallback, useState } from "react";
import type {
  ExerciseResult,
  ReflectionContent,
  ReflectionResult,
} from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { Star } from "lucide-react";

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function ReflectionExercise({ content, onComplete }: Props) {
  const c = content as ReflectionContent;
  const [rating, setRating] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = useCallback(() => {
    if (rating === 0) return;
    const result: ReflectionResult = {
      rating,
      answer: answer.trim(),
    };
    onComplete(result);
  }, [rating, answer, onComplete]);

  return (
    <div className="bg-card rounded-2xl border border-white/10 p-5 space-y-5">
      {/* Rating */}
      <div className="text-center space-y-2">
        <p className="text-sm text-white/40">How was this session?</p>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition"
            >
              <Star
                size={32}
                className={cn(
                  "transition",
                  n <= (hoverRating || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-white/15",
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-white/30">
          {rating === 1
            ? "Very easy"
            : rating === 2
              ? "Easy"
              : rating === 3
                ? "Just right"
                : rating === 4
                  ? "Challenging"
                  : rating === 5
                    ? "Very hard"
                    : "Tap to rate"}
        </p>
      </div>

      {/* Reflection prompt */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{c.prompt}</p>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write your thoughts..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-accent/40"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className={cn(
          "w-full py-3 rounded-xl text-sm font-medium transition",
          rating > 0
            ? "bg-accent text-white"
            : "bg-white/5 text-white/20",
        )}
      >
        Complete Session
      </button>
    </div>
  );
}
