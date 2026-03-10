"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExerciseResult, SrsContent, SrsResult } from "@/lib/exerciseTypes";
import Flashcard from "@/components/Flashcard";
import type { VocabCard } from "@/data/vocab";
import { speakItalian } from "@/components/Flashcard";

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function FlashcardExercise({ content, onComplete }: Props) {
  const c = content as SrsContent;
  const startTime = useRef(Date.now());
  const [flipped, setFlipped] = useState(false);

  const card: VocabCard = {
    id: c.front,
    it: c.front,
    en: c.back,
    ex: c.example || c.audio_front || c.front,
    tag: c.tag,
    level: c.level as VocabCard["level"] | undefined,
  };

  useEffect(() => {
    speakItalian(card.it, 0.85);
  }, [card.it]);

  const handleRate = useCallback(
    (quality: number) => {
      setFlipped(false);
      const result: SrsResult = {
        quality,
        time_ms: Date.now() - startTime.current,
      };
      onComplete(result);
    },
    [onComplete],
  );

  return (
    <div className="space-y-4 w-full">
      <Flashcard
        card={card}
        flipped={flipped}
        onFlip={() => setFlipped((value) => !value)}
        mode="classic"
      />
      {flipped ? (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleRate(0)}
            className="px-5 py-3 rounded-xl bg-danger/20 border border-danger/30 hover:bg-danger/30 transition text-sm font-medium"
          >
            Again
          </button>
          <button
            onClick={() => handleRate(3)}
            className="px-5 py-3 rounded-xl bg-warn/20 border border-warn/30 hover:bg-warn/30 transition text-sm font-medium"
          >
            Good
          </button>
          <button
            onClick={() => handleRate(5)}
            className="px-5 py-3 rounded-xl bg-success/20 border border-success/30 hover:bg-success/30 transition text-sm font-medium"
          >
            Easy
          </button>
        </div>
      ) : (
        <p className="text-center text-white/20 text-xs">Tap card to flip</p>
      )}
    </div>
  );
}
