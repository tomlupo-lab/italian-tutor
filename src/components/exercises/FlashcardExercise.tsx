"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ExerciseResult,
  FlashcardDirection,
  SrsContent,
  SrsResult,
} from "@/lib/exerciseTypes";
import Flashcard, { type CardMode, speakItalian } from "@/components/Flashcard";
import type { VocabCard } from "@/data/vocab";

const CARD_MODE_KEY = "italian-tutor:flashcard-mode";

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function FlashcardExercise({ content, onComplete }: Props) {
  const c = content as SrsContent;
  const startTime = useRef(Date.now());
  const [flipped, setFlipped] = useState(false);
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

  useEffect(() => {
    if (cardMode !== "reverse") {
      speakItalian(card.it, 0.85);
    }
  }, [card.it, cardMode]);

  useEffect(() => {
    if (!flipped || cardMode !== "reverse") return;
    speakItalian(card.it, 0.85);
  }, [flipped, card.it, cardMode]);

  const handleRate = useCallback(
    (quality: number) => {
      setFlipped(false);
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
      <Flashcard
        card={card}
        flipped={flipped}
        onFlip={() => setFlipped((value) => !value)}
        mode={cardMode}
      />
      <div className="flex items-center justify-between text-xs text-white/40">
        <p className="flex-1 text-center text-white/30">
          {flipped ? "Rate how well you recalled it" : "Tap card to flip"}
        </p>
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
      {flipped ? (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleRate(0)}
            className="w-full px-5 py-3 rounded-xl bg-danger/20 border border-danger/30 hover:bg-danger/30 transition text-sm font-medium"
          >
            Again
          </button>
          <button
            onClick={() => handleRate(3)}
            className="w-full px-5 py-3 rounded-xl bg-warn/20 border border-warn/30 hover:bg-warn/30 transition text-sm font-medium"
          >
            Good
          </button>
          <button
            onClick={() => handleRate(5)}
            className="w-full px-5 py-3 rounded-xl bg-success/20 border border-success/30 hover:bg-success/30 transition text-sm font-medium"
          >
            Easy
          </button>
        </div>
      ) : null}
    </div>
  );
}
