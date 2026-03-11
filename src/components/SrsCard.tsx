"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VocabCard } from "@/data/vocab";
import Flashcard, { speakItalian } from "@/components/Flashcard";
import type { CardMode } from "@/components/Flashcard";
import { cn } from "@/lib/cn";
import { stopItalianTts } from "@/lib/audioTts";

interface RatingButton {
  quality: number;
  label: string;
  color: string;
}

const DEFAULT_BUTTONS: RatingButton[] = [
  { quality: 0, label: "Again", color: "bg-danger/20 text-danger border-danger/30" },
  { quality: 3, label: "Good", color: "bg-warn/20 text-warn border-warn/30" },
  { quality: 5, label: "Easy", color: "bg-success/20 text-success border-success/30" },
];

export interface SrsCardData {
  id?: string;
  front: string;
  back: string;
  example?: string;
  speakText?: string;
  exampleSpeakText?: string;
  tag?: string;
  level?: string;
  it?: string;
  en?: string;
  ex?: string;
}

interface Props {
  card: SrsCardData;
  mode?: CardMode;
  onRate: (quality: number) => void;
  speechRate?: number;
  ratingButtons?: RatingButton[];
  revealHint?: string;
  reverseAutoplayDelayMs?: number;
  showUndoPrompt?: boolean;
}

export default function SrsCard({
  card,
  mode = "classic",
  onRate,
  speechRate = 0.85,
  ratingButtons = DEFAULT_BUTTONS,
  revealHint = "Tap card to flip",
  reverseAutoplayDelayMs = 5000,
  showUndoPrompt = false,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const [pendingQuality, setPendingQuality] = useState<number | null>(null);
  const submitTimerRef = useRef<number | null>(null);

  const vocabCard: VocabCard = {
    id: card.id ?? card.front ?? card.it ?? "",
    it: card.front ?? card.it ?? "",
    en: card.back ?? card.en ?? "",
    ex: card.example ?? card.ex ?? card.front ?? card.it ?? "",
    speakText: "speakText" in card ? (card as VocabCard).speakText : undefined,
    exampleSpeakText: "exampleSpeakText" in card ? (card as VocabCard).exampleSpeakText : undefined,
    tag: card.tag,
    level: card.level as VocabCard["level"] | undefined,
  };

  useEffect(() => {
    setFlipped(false);
    setPendingQuality(null);
    stopItalianTts();
    if (submitTimerRef.current !== null) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
  }, [vocabCard.id]);

  const handleRate = useCallback(
    (quality: number) => {
      if (showUndoPrompt) {
        if (pendingQuality !== null) return;
        setPendingQuality(quality);
      }
      onRate(quality);
      if (!showUndoPrompt) return;
      submitTimerRef.current = window.setTimeout(() => {
        setPendingQuality(null);
        setFlipped(false);
      }, 1200);
    },
    [onRate, pendingQuality, showUndoPrompt],
  );

  const cancelPendingRate = useCallback(() => {
    if (submitTimerRef.current !== null) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    setPendingQuality(null);
  }, []);

  useEffect(() => {
    stopItalianTts();
    if (mode === "classic" || mode === "listening") {
      speakItalian(vocabCard.it, speechRate);
      return () => {
        stopItalianTts();
        if (submitTimerRef.current !== null) {
          window.clearTimeout(submitTimerRef.current);
        }
      };
    }
    if (mode === "cloze") {
      const timeoutId = window.setTimeout(() => {
        speakItalian(vocabCard.it, speechRate);
      }, reverseAutoplayDelayMs);
      return () => {
        window.clearTimeout(timeoutId);
        stopItalianTts();
        if (submitTimerRef.current !== null) {
          window.clearTimeout(submitTimerRef.current);
        }
      };
    }
    return () => {
      stopItalianTts();
      if (submitTimerRef.current !== null) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, [mode, reverseAutoplayDelayMs, speechRate, vocabCard.it]);

  const handleFlip = useCallback(() => {
    setFlipped((value) => {
      const next = !value;
      if (!next) return next;
      stopItalianTts();
      if (mode === "classic" || mode === "listening") {
        speakItalian(vocabCard.ex, speechRate);
      } else if (mode === "reverse") {
        speakItalian(vocabCard.it, speechRate);
      }
      return next;
    });
  }, [mode, speechRate, vocabCard.ex, vocabCard.it]);

  return (
    <div className="space-y-4 w-full">
      <Flashcard
        card={vocabCard}
        flipped={flipped}
        onFlip={handleFlip}
        mode={mode}
        speechRate={speechRate}
      />

      <div className="min-h-[72px] space-y-3">
      {flipped ? (
        <div className={cn("grid gap-3", ratingButtons.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
          {ratingButtons.map((btn) => (
            <button
              key={btn.quality}
              onClick={() => handleRate(btn.quality)}
              disabled={pendingQuality !== null}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-medium border transition active:scale-95 disabled:opacity-40",
                btn.color,
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="pt-6 text-center text-white/20 text-xs">{revealHint}</p>
      )}

      {showUndoPrompt && pendingQuality !== null && (
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
      </div>
    </div>
  );
}
