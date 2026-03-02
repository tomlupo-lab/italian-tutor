"use client";

import { useCallback, useRef, useState } from "react";
import type { ExerciseResult, SrsContent, SrsResult } from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { Volume2 } from "lucide-react";

async function playTTS(text: string) {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "it-IT";
      u.rate = 0.9;
      speechSynthesis.speak(u);
    }
  }
}

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

const QUALITY_BUTTONS = [
  { quality: 0, label: "Again", color: "bg-danger/20 text-danger border-danger/30" },
  { quality: 2, label: "Hard", color: "bg-warn/20 text-warn border-warn/30" },
  { quality: 3, label: "Good", color: "bg-accent/20 text-accent-light border-accent/30" },
  { quality: 5, label: "Easy", color: "bg-success/20 text-success border-success/30" },
];

export default function FlashcardExercise({ content, onComplete }: Props) {
  const c = content as SrsContent;
  const [flipped, setFlipped] = useState(false);
  const startTime = useRef(Date.now());

  const handleRate = useCallback(
    (quality: number) => {
      const result: SrsResult = {
        quality,
        time_ms: Date.now() - startTime.current,
      };
      onComplete(result);
    },
    [onComplete],
  );

  return (
    <div className="space-y-4">
      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        className={cn(
          "bg-card rounded-2xl border p-6 min-h-[200px] flex flex-col items-center justify-center cursor-pointer transition-all",
          flipped ? "border-accent/30" : "border-white/10 hover:border-white/20",
        )}
      >
        {!flipped ? (
          <>
            <p className="text-2xl font-semibold text-center">{c.front}</p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playTTS(c.front);
                }}
                className="p-2 rounded-full bg-accent/20 hover:bg-accent/30 text-accent-light transition"
              >
                <Volume2 size={16} />
              </button>
              <p className="text-white/30 text-sm">Tap to reveal</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-white/40 mb-2">{c.front}</p>
            <p className="text-xl font-medium text-accent-light text-center">
              {c.back}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playTTS(c.front);
              }}
              className="mt-3 p-2 rounded-full bg-accent/20 hover:bg-accent/30 text-accent-light transition"
            >
              <Volume2 size={16} />
            </button>
          </>
        )}
      </div>

      {/* Rating buttons — only after flip */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_BUTTONS.map((btn) => (
            <button
              key={btn.quality}
              onClick={() => handleRate(btn.quality)}
              className={cn(
                "py-3 rounded-xl text-sm font-medium border transition active:scale-95",
                btn.color,
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
