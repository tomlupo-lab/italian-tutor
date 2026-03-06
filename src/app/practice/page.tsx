"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { VocabCard } from "../../data/vocab";
import Flashcard, { speakItalian } from "../../components/Flashcard";
import type { CardMode } from "../../components/Flashcard";
import { cn } from "../../lib/cn";
import { Loader2, X, ChevronDown } from "lucide-react";
import ExerciseErrorBoundary from "../../components/exercises/ExerciseErrorBoundary";

const MODES: { key: CardMode; label: string; icon: string }[] = [
  { key: "classic", label: "Classic", icon: "🇮🇹→🇬🇧" },
  { key: "reverse", label: "Reverse", icon: "🇬🇧→🇮🇹" },
  { key: "listening", label: "Listening", icon: "🎧" },
  { key: "cloze", label: "Cloze", icon: "📝" },
];

const LEVELS = ["A2", "B1", "B2"] as const;

const LEVEL_COLORS: Record<string, string> = {
  A2: "bg-success/20 text-success border-success/30",
  B1: "bg-accent/20 text-accent-light border-accent/30",
  B2: "bg-warn/20 text-warn border-warn/30",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConvexCard = Record<string, any>;

function toVocabCard(card: ConvexCard): VocabCard {
  return {
    id: card._id,
    it: card.it,
    en: card.en,
    ex: card.example || card.it,
    tag: card.tag || card.errorCategory,
  };
}

export default function PracticePage() {
  // Filter state
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>(
    undefined,
  );
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [studyAll, setStudyAll] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  // Session state
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [totalQuality, setTotalQuality] = useState(0);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<CardMode>("classic");

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Queries
  const filteredCards = useQuery(api.cards.getFiltered, {
    limit: 50,
    level: selectedLevel,
    tag: selectedTag,
    includeAll: studyAll,
  });
  const tags = useQuery(api.cards.getTags);
  const counts = useQuery(api.cards.getCount, {
    level: selectedLevel,
    tag: selectedTag,
  });
  const reviewCard = useMutation(api.cards.review);

  // Offline support: snapshot cards to localStorage, use snapshot when offline
  const [offlineCards, setOfflineCards] = useState<ConvexCard[] | null>(null);
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("tag");
    if (raw) setSelectedTag(raw);
  }, []);

  useEffect(() => {
    if (filteredCards && filteredCards.length > 0) {
      try {
        localStorage.setItem("marco-cards-snapshot", JSON.stringify(filteredCards));
      } catch { /* quota exceeded — non-critical */ }
    }
  }, [filteredCards]);

  useEffect(() => {
    if (filteredCards === undefined && isOffline) {
      try {
        const snapshot = localStorage.getItem("marco-cards-snapshot");
        if (snapshot) setOfflineCards(JSON.parse(snapshot));
      } catch { /* corrupted — ignore */ }
    }
  }, [filteredCards, isOffline]);

  const cards = filteredCards ?? offlineCards ?? [];
  const currentCard = cards[idx] as ConvexCard | undefined;

  // Reset session when filters change
  useEffect(() => {
    setIdx(0);
    setFlipped(false);
    setReviewed(0);
    setTotalQuality(0);
    setDone(false);
  }, [selectedLevel, selectedTag, studyAll]);

  // Close tag dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setTagDropdownOpen(false);
      }
    }
    if (tagDropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [tagDropdownOpen]);

  // Auto-speak on card change
  useEffect(() => {
    if (!currentCard || done) return;
    if (mode === "classic" || mode === "listening") {
      speakItalian(currentCard.it, 0.85);
    }
  }, [idx, currentCard, mode, done]);

  // Auto-speak Italian when reverse card is flipped
  useEffect(() => {
    if (!currentCard || mode !== "reverse" || !flipped) return;
    speakItalian(currentCard.it, 0.85);
  }, [flipped, mode, currentCard]);

  const handleFeedback = useCallback(
    (quality: 1 | 3 | 5) => {
      if (!currentCard) return;

      reviewCard({
        cardId: currentCard._id,
        quality,
      }).catch(() => {});

      setTotalQuality((prev) => prev + quality);
      setReviewed((prev) => prev + 1);
      setFlipped(false);

      if (idx < cards.length - 1) {
        setIdx((i) => i + 1);
      } else {
        setDone(true);
      }
    },
    [currentCard, idx, cards.length, reviewCard],
  );

  const hasActiveFilters = !!(selectedLevel || selectedTag);

  // -- Filter bar component (shared between main view and empty state) --
  const filterBar = (
    <div className="w-full space-y-3">
      {/* Level chips + Study All toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() =>
                setSelectedLevel(selectedLevel === level ? undefined : level)
              }
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition",
                selectedLevel === level
                  ? LEVEL_COLORS[level]
                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10",
              )}
            >
              {level}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStudyAll(!studyAll)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition",
            studyAll
              ? "bg-accent/20 text-accent-light border-accent/30"
              : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10",
          )}
        >
          <span
            className={cn(
              "w-3 h-3 rounded-full border-2 transition flex items-center justify-center",
              studyAll ? "border-accent bg-accent" : "border-white/30",
            )}
          >
            {studyAll && (
              <span className="block w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </span>
          Study All
        </button>
      </div>

      {/* Topic dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition",
            selectedTag
              ? "bg-accent/10 text-accent-light border-accent/20"
              : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10",
          )}
        >
          <span>{selectedTag || "All topics"}</span>
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform",
              tagDropdownOpen && "rotate-180",
            )}
          />
        </button>
        {tagDropdownOpen && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg bg-card border border-white/10 shadow-lg">
            <button
              onClick={() => {
                setSelectedTag(undefined);
                setTagDropdownOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition",
                !selectedTag ? "text-accent-light" : "text-white/60",
              )}
            >
              All topics
            </button>
            {(tags ?? []).map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTag(tag);
                  setTagDropdownOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition flex justify-between",
                  selectedTag === tag ? "text-accent-light" : "text-white/60",
                )}
              >
                <span>{tag}</span>
                <span className="text-white/20">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap">
          {selectedLevel && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                LEVEL_COLORS[selectedLevel],
              )}
            >
              {selectedLevel}
              <button
                onClick={() => setSelectedLevel(undefined)}
                className="hover:opacity-70 transition"
              >
                <X size={10} />
              </button>
            </span>
          )}
          {selectedTag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/15 text-accent-light border border-accent/20">
              {selectedTag}
              <button
                onClick={() => setSelectedTag(undefined)}
                className="hover:opacity-70 transition"
              >
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Card count summary */}
      {counts && (
        <p className="text-center text-[11px] text-white/30">
          {counts.due} due / {counts.total} total
        </p>
      )}
    </div>
  );

  // Loading — show spinner only when online and waiting for Convex
  if (filteredCards === undefined && !isOffline && !offlineCards) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  // No cards
  if (cards.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center max-w-lg mx-auto pb-20 px-4 gap-4">
        <div className="w-full">{filterBar}</div>
        <div className="text-5xl mt-4">
          {hasActiveFilters || studyAll ? "🔍" : "🎉"}
        </div>
        <h2 className="text-xl font-semibold">
          {hasActiveFilters || studyAll
            ? "No cards match"
            : "All caught up!"}
        </h2>
        <p className="text-white/50 text-sm text-center">
          {hasActiveFilters
            ? "Try removing a filter or selecting a different topic"
            : studyAll
              ? "No cards found. Complete a lesson to generate cards."
              : "No cards due for review"}
        </p>
        {!hasActiveFilters && !studyAll && (
          <p className="text-white/30 text-xs text-center">
            Cards are created from your exercise mistakes.
            <br />
            Complete a lesson to generate new cards.
          </p>
        )}
      </main>
    );
  }

  // Session complete
  if (done) {
    const avg = reviewed > 0 ? (totalQuality / reviewed).toFixed(1) : "0";
    return (
      <main className="min-h-screen flex flex-col items-center justify-center max-w-lg mx-auto pb-20 px-4 gap-6">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-semibold">Practice Complete!</h2>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-accent-light">{reviewed}</p>
            <p className="text-xs text-white/40">Reviewed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{avg}</p>
            <p className="text-xs text-white/40">Avg Quality</p>
          </div>
        </div>
      </main>
    );
  }

  if (!currentCard) return null;
  const vocabCard = toVocabCard(currentCard);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center max-w-lg mx-auto pb-20 px-4 gap-4">
      {/* Filter bar */}
      {filterBar}

      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap justify-center">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key);
              setFlipped(false);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition",
              mode === m.key
                ? "bg-accent text-white"
                : "bg-white/5 text-white/40 hover:bg-white/10",
            )}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Progress header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-accent-light">
          SRS Practice
        </h2>
        <p className="text-white/40 text-sm">
          {idx + 1} / {cards.length} {studyAll ? "cards" : "due"}
        </p>
        <div className="w-48 h-1.5 bg-white/5 rounded-full mt-2 mx-auto">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${(reviewed / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card badges */}
      <div className="flex gap-2 items-center">
        {currentCard.level && (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium border",
              LEVEL_COLORS[currentCard.level] ||
                "bg-white/10 text-white/50 border-white/20",
            )}
          >
            {currentCard.level}
          </span>
        )}
        {currentCard.source === "correction" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-warn/20 text-warn">
            From your mistakes
          </span>
        )}
      </div>

      <ExerciseErrorBoundary onSkip={() => handleFeedback(1)}>
        <Flashcard
          card={vocabCard}
          flipped={flipped}
          onFlip={() => setFlipped(!flipped)}
          mode={mode}
          speechRate={0.85}
        />
      </ExerciseErrorBoundary>

      {flipped ? (
        <div className="flex gap-3">
          <button
            onClick={() => handleFeedback(1)}
            className="px-5 py-3 rounded-xl bg-danger/20 border border-danger/30 hover:bg-danger/30 transition text-sm font-medium"
            aria-label="Again — review soon"
          >
            Again
          </button>
          <button
            onClick={() => handleFeedback(3)}
            className="px-5 py-3 rounded-xl bg-warn/20 border border-warn/30 hover:bg-warn/30 transition text-sm font-medium"
            aria-label="Good — review later"
          >
            Good
          </button>
          <button
            onClick={() => handleFeedback(5)}
            className="px-5 py-3 rounded-xl bg-success/20 border border-success/30 hover:bg-success/30 transition text-sm font-medium"
            aria-label="Easy — long interval"
          >
            Easy
          </button>
        </div>
      ) : (
        <p className="text-white/20 text-xs">Tap card to flip</p>
      )}
    </main>
  );
}
