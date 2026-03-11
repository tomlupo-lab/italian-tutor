"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ExerciseResult,
  FlashcardDirection,
  SrsContent,
  SrsResult,
} from "@/lib/exerciseTypes";
import type { CardMode } from "@/components/Flashcard";
import SrsCard from "@/components/SrsCard";
import type { VocabCard } from "@/data/vocab";

const CARD_MODE_KEY = "italian-tutor:flashcard-mode";

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function FlashcardExercise({ content, onComplete }: Props) {
  const c = content as SrsContent;
  const startTime = useRef(Date.now());
  const defaultDirection: FlashcardDirection = c.direction ?? "it_to_en";
  const directionToMode = (direction: FlashcardDirection): CardMode =>
    direction === "en_to_it" ? "reverse" : "classic";
  const modeToDirection = (mode: CardMode): FlashcardDirection =>
    mode === "reverse" ? "en_to_it" : "it_to_en";
  const [cardMode, setCardMode] = useState<CardMode>(
    directionToMode(defaultDirection),
  );
  const cardModeInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CARD_MODE_KEY);
    if (stored === "reverse" || stored === "classic") {
      setCardMode(stored as CardMode);
    }
    cardModeInitialized.current = true;
  }, []);

  useEffect(() => {
    if (!cardModeInitialized.current) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CARD_MODE_KEY, cardMode);
  }, [cardMode]);

  const card: VocabCard = {
    id: c.front,
    it: c.front,
    en: c.back,
    ex: c.example || c.audio_front || c.front,
    tag: c.tag,
    level: c.level as VocabCard["level"] | undefined,
  };

  const handleRate = useCallback(
    (quality: number) => {
      const result: SrsResult = {
        quality,
        time_ms: Date.now() - startTime.current,
        direction: modeToDirection(cardMode),
      };
      onComplete(result);
    },
    [onComplete, cardMode],
  );

  return (
    <div className="space-y-4 w-full">
      <SrsCard
        card={card}
        mode={cardMode}
        onRate={handleRate}
        showUndoPrompt={false}
        ratingButtons={[
          { quality: 0, label: "Again", color: "bg-danger/20 text-danger border-danger/30" },
          { quality: 3, label: "Good", color: "bg-warn/20 text-warn border-warn/30" },
          { quality: 5, label: "Easy", color: "bg-success/20 text-success border-success/30" },
        ]}
      />
      <div className="flex items-center justify-between text-xs text-white/40">
        <div className="flex-1" />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setCardMode((prev) => (prev === "classic" ? "reverse" : "classic"));
          }}
          className="text-[10px] font-semibold uppercase text-accent-light hover:text-accent"
        >
          {cardMode === "classic"
            ? "Switch to English prompt first"
            : "Switch to Italian prompt first"}
        </button>
      </div>
    </div>
  );
}
