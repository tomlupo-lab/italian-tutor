"use client";

import { useCallback } from "react";
import type { VocabCard } from "../data/vocab";
import { cn } from "../lib/cn";
import { Volume2 } from "lucide-react";
import { playItalianTts } from "../lib/audioTts";
import Badge from "./Badge";

export type CardMode = "classic" | "reverse" | "listening" | "cloze";

function speakItalian(text: string, rate = 0.85) {
  void playItalianTts(text, { rate, userInitiated: true });
}

function getClozeData(card: VocabCard): { sentence: string; answer: string } | null {
  const word = card.it.toLowerCase().replace(/^(il |la |lo |l'|i |le |gli |un |una |uno )/, "");
  const ex = card.ex;
  const idx = ex.toLowerCase().indexOf(word.toLowerCase());
  if (idx === -1) return null;
  const blank = ex.substring(0, idx) + "_____" + ex.substring(idx + word.length);
  return { sentence: blank, answer: ex.substring(idx, idx + word.length) };
}

export default function Flashcard({
  card,
  flipped,
  onFlip,
  mode = "classic",
  speechRate = 0.85,
}: {
  card: VocabCard;
  flipped: boolean;
  onFlip: () => void;
  mode?: CardMode;
  speechRate?: number;
}) {
  const handleSpeak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      speakItalian(card.speakText ?? card.it, speechRate);
    },
    [card.it, card.speakText, speechRate],
  );

  const handleSpeakExample = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      speakItalian(card.exampleSpeakText ?? card.ex, speechRate);
    },
    [card.ex, card.exampleSpeakText, speechRate],
  );

  const levelBadge = card.level ? (
    <Badge tone="level" level={card.level} className="px-1.5">
      {card.level}
    </Badge>
  ) : null;

  const handleFlipKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      onFlip();
    },
    [onFlip],
  );

  if (mode === "classic") {
    return (
      <div
        className="perspective-1000 w-full h-60 cursor-pointer mx-auto"
        onClick={onFlip}
        onKeyDown={handleFlipKeyDown}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Hide card answer" : "Reveal card answer"}
      >
        <div className={cn("relative w-full h-full transition-transform duration-500 preserve-3d", flipped && "rotate-y-180")}>
          <div className="absolute inset-0 backface-hidden bg-card rounded-2xl border border-white/10 flex flex-col items-center justify-center p-7">
            <p className="text-2xl font-semibold text-center">{card.it}</p>
            <div className="flex items-center gap-2 mt-3">
              {card.tag && <Badge>{card.tag}</Badge>}
              {levelBadge}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={handleSpeak} className="p-2 rounded-full bg-accent/20 hover:bg-accent/30 text-accent-light transition" aria-label="Hear pronunciation">
                <Volume2 size={16} />
              </button>
              <p className="text-white/30 text-sm">Tap to reveal</p>
            </div>
          </div>
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card rounded-2xl border border-accent/30 flex flex-col items-center justify-center p-7">
            <p className="text-lg font-medium text-accent-light text-center">{card.en}</p>
            <div className="flex items-center gap-2 mt-3">
              <p className="text-white/50 text-sm italic text-center">&ldquo;{card.ex}&rdquo;</p>
              <button onClick={handleSpeakExample} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition flex-shrink-0" aria-label="Hear example">
                <Volume2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "reverse") {
    return (
      <div
        className="perspective-1000 w-full h-60 cursor-pointer mx-auto"
        onClick={onFlip}
        onKeyDown={handleFlipKeyDown}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Hide card answer" : "Reveal card answer"}
      >
        <div className={cn("relative w-full h-full transition-transform duration-500 preserve-3d", flipped && "rotate-y-180")}>
          <div className="absolute inset-0 backface-hidden bg-card rounded-2xl border border-white/10 flex flex-col items-center justify-center p-7">
            <p className="text-2xl font-semibold text-center text-accent-light">{card.en}</p>
            <div className="flex items-center gap-2 mt-3">
              {card.tag && <Badge>{card.tag}</Badge>}
              {levelBadge}
            </div>
            <p className="text-white/30 text-sm mt-4">Can you say it in Italian?</p>
          </div>
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card rounded-2xl border border-accent/30 flex flex-col items-center justify-center p-7">
            <p className="text-xl font-semibold text-center">{card.it}</p>
            <div className="flex items-center gap-2 mt-3">
              <p className="text-white/50 text-sm italic text-center">&ldquo;{card.ex}&rdquo;</p>
              <button onClick={handleSpeakExample} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition flex-shrink-0" aria-label="Hear example">
                <Volume2 size={14} />
              </button>
            </div>
            <button onClick={handleSpeak} className="mt-3 p-2 rounded-full bg-accent/20 hover:bg-accent/30 text-accent-light transition" aria-label="Hear word">
              <Volume2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "listening") {
    return (
      <div
        className="perspective-1000 w-full h-60 cursor-pointer mx-auto"
        onClick={onFlip}
        onKeyDown={handleFlipKeyDown}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Hide card answer" : "Reveal card answer"}
      >
        <div className={cn("relative w-full h-full transition-transform duration-500 preserve-3d", flipped && "rotate-y-180")}>
          <div className="absolute inset-0 backface-hidden bg-card rounded-2xl border border-white/10 flex flex-col items-center justify-center p-7">
            <button onClick={handleSpeak} className="p-5 rounded-full bg-accent/20 hover:bg-accent/30 text-accent-light transition mb-4" aria-label="Listen to pronunciation">
              <Volume2 size={32} />
            </button>
            <p className="text-white/40 text-sm">Listen and guess</p>
            <div className="flex items-center gap-2 mt-2">{levelBadge}</div>
          </div>
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card rounded-2xl border border-accent/30 flex flex-col items-center justify-center p-7">
            <p className="text-xl font-semibold text-center">{card.it}</p>
            <p className="text-lg text-accent-light mt-1 text-center">{card.en}</p>
            <div className="flex items-center gap-2 mt-3">
              <p className="text-white/50 text-sm italic text-center">&ldquo;{card.ex}&rdquo;</p>
              <button onClick={handleSpeakExample} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition flex-shrink-0">
                <Volume2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cloze = getClozeData(card);
  const clozeSentence = cloze?.sentence || `_____ = ${card.en}`;
  const clozeAnswer = cloze?.answer || card.it;

  return (
    <div
      className="perspective-1000 w-full h-60 cursor-pointer mx-auto"
      onClick={onFlip}
      onKeyDown={handleFlipKeyDown}
      role="button"
      tabIndex={0}
      aria-label={flipped ? "Hide card answer" : "Reveal card answer"}
    >
      <div className={cn("relative w-full h-full transition-transform duration-500 preserve-3d", flipped && "rotate-y-180")}>
        <div className="absolute inset-0 backface-hidden bg-card rounded-2xl border border-white/10 flex flex-col items-center justify-center p-7">
          <p className="text-xs text-white/30 mb-2">📝 Fill the blank</p>
          <p className="text-lg text-center leading-relaxed">&ldquo;{clozeSentence}&rdquo;</p>
          <div className="flex items-center gap-2 mt-3">
            {card.tag && <Badge>{card.tag}</Badge>}
            {levelBadge}
          </div>
          <p className="text-white/30 text-sm mt-3">Tap to reveal</p>
        </div>
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card rounded-2xl border border-accent/30 flex flex-col items-center justify-center p-7">
          <p className="text-lg text-center leading-relaxed">
            &ldquo;{card.ex.replace(
              new RegExp(`(${clozeAnswer})`, "i"),
              `**$1**`,
            ).split("**").map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="text-accent-light">{part}</strong> : part,
            )}&rdquo;
          </p>
          <p className="text-sm text-white/50 mt-2">{card.en}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSpeak} className="p-2 rounded-full bg-accent/20 hover:bg-accent/30 text-accent-light transition">
              <Volume2 size={14} />
            </button>
            <button onClick={handleSpeakExample} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 transition">
              <Volume2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { speakItalian };
