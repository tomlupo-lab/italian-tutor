"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VocabCard } from "@/data/vocab";
import Flashcard, { speakItalian } from "@/components/Flashcard";
import type { CardMode } from "@/components/Flashcard";
import { cn } from "@/lib/cn";

export type SrsCardMode = Exclude<CardMode, "cloze">;

export interface SrsCardData {
  front: string;
  back: string;
  example?: string;
  tag?: string;
  level?: string;
}

const QUALITY_BUTTONS = [
  { quality: 0, label: "Again", color: "bg-danger/20 text-danger border-danger/30" },
  { quality: 2, label: "Hard", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { quality: 3, label: "Good", color: "bg-accent/20 text-accent-light border-accent/30" },
  { quality: 5, label: "Easy", color: "bg-success/20 text-success border-success/30" },
];

interface Props {
  card: SrsCardData;
  mode?: SrsCardMode;
  onRate: (quality: number) => void;
  speechRate?: number;
}

export default function SrsCard({
  card,
  mode = "classic",
  onRate,
  speechRate = 0.85,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const [pendingQuality, setPendingQuality] = useState<number | null>(null);
  const submitTimerRef = useRef<number | null>(null);

  const vocabCard: VocabCard = {
    id: card.front,
    it: card.front,
    en: card.back,
    ex: card.example || card.front,
    tag: card.tag,
    level: card.level as VocabCard["level"] | undefined,
  };

  const handleRate = useCallback(
    (quality: number) => {
      if (pendingQuality !== null) return;
      setPendingQuality(quality);
      onRate(quality);
      submitTimerRef.current = window.setTimeout(() => {
        setPendingQuality(null);
        setFlipped(false);
      }, 1200);
    },
    [onRate, pendingQuality],
  );

  const cancelPendingRate = useCallback(() => {
    if (submitTimerRef.current !== null) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    setPendingQuality(null);
  }, []);

  useEffect(() => {
    speakItalian(vocabCard.it, speechRate);
    return () => {
      if (submitTimerRef.current !== null) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, [speechRate, vocabCard.it]);

  return (
    <div className="space-y-4 w-full">
      <Flashcard
        card={vocabCard}
        flipped={flipped}
        onFlip={() => !flipped && setFlipped(true)}
        mode={mode}
        speechRate={speechRate}
      />

      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_BUTTONS.map((btn) => (
            <button
              key={btn.quality}
              onClick={() => handleRate(btn.quality)}
              disabled={pendingQuality !== null}
              className={cn(
                "py-3 rounded-xl text-sm font-medium border transition active:scale-95 disabled:opacity-40",
                btn.color,
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {pendingQuality !== null && (
        <div className="rounded-xl border border-accent/20 bg-accent/10 px-3 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-accent-light">Rating saved. Undo?</p>
          <button
            onClick={cancelPendingRate}
            className="text-xs font-medium text-white/70 hover:text-white transition"
          >
            Undo
          </button>
        </div>
      )}

      {!flipped && (
        <p className="text-center text-white/20 text-xs">Tap card to flip</p>
      )}
    </div>
  );
}
