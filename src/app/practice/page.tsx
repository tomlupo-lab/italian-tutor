"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { VocabCard } from "../../data/vocab";
import SrsCard from "../../components/SrsCard";
import type { CardMode } from "../../components/Flashcard";
import { cn } from "../../lib/cn";
import { Loader2, X, ChevronDown, ArrowLeft } from "lucide-react";
import ExerciseErrorBoundary from "../../components/exercises/ExerciseErrorBoundary";
import { StudyShell } from "../../components/layout/ScreenShell";
import Badge from "../../components/Badge";
import StudyProgressHeader from "../../components/StudyProgressHeader";
import Link from "next/link";
import { withBasePath } from "@/lib/paths";

const MODES: { key: CardMode; label: string; icon: string }[] = [
  { key: "classic", label: "Word to meaning", icon: "🇮🇹→🇬🇧" },
  { key: "reverse", label: "Meaning to word", icon: "🇬🇧→🇮🇹" },
  { key: "listening", label: "Listening", icon: "🎧" },
  { key: "cloze", label: "Cloze", icon: "📝" },
];

const LEVELS = ["A2", "B1", "B2"] as const;

const LEVEL_COLORS: Record<string, string> = {
  A2: "bg-success/20 text-success border-success/30",
  B1: "bg-accent/20 text-accent-light border-accent/30",
  B2: "bg-warn/20 text-warn border-warn/30",
};

const TIER_KEY = "italian-tutor-tier-scores";

type ConvexCard = Record<string, any>;

function toVocabCard(card: ConvexCard): VocabCard {
  return {
    id: card._id,
    it: card.it,
    en: card.en,
    ex: card.example || card.it,
    tag: card.tag || card.errorCategory,
    level: card.level,
  };
}

export default function PracticePage() {
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [studyAll, setStudyAll] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [embeddedMode, setEmbeddedMode] = useState(false);
  const [sessionDate, setSessionDate] = useState<string | undefined>(undefined);

  const [idx, setIdx] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [totalQuality, setTotalQuality] = useState(0);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<CardMode>("classic");
  const [showReviewOptions, setShowReviewOptions] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const [offlineCards, setOfflineCards] = useState<ConvexCard[] | null>(null);
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = new URLSearchParams(window.location.search);
    const rawTag = search.get("tag");
    if (rawTag) setSelectedTag(rawTag);
    const embedded = search.get("embedded") === "1";
    setEmbeddedMode(embedded);
    const date = search.get("date");
    if (date) setSessionDate(date);
  }, []);

  useEffect(() => {
    if (filteredCards && filteredCards.length > 0) {
      try {
        localStorage.setItem("marco-cards-snapshot", JSON.stringify(filteredCards));
      } catch {}
    }
  }, [filteredCards]);

  useEffect(() => {
    if (filteredCards === undefined && isOffline) {
      try {
        const snapshot = localStorage.getItem("marco-cards-snapshot");
        if (snapshot) setOfflineCards(JSON.parse(snapshot));
      } catch {}
    }
  }, [filteredCards, isOffline]);

  const cards = filteredCards ?? offlineCards ?? [];
  const currentCard = cards[idx] as ConvexCard | undefined;

  useEffect(() => {
    if (!done || !embeddedMode || !sessionDate) return;
    const scorePct = reviewed > 0 ? Math.round((totalQuality / (reviewed * 5)) * 100) : 0;
    try {
      const raw = localStorage.getItem(TIER_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const current = parsed?.[sessionDate]?.bronze;
      const bestScore = Math.max(Number(current?.bestScore ?? 0), scorePct);
      parsed[sessionDate] = parsed[sessionDate] ?? {};
      parsed[sessionDate].bronze = {
        completed: true,
        bestScore,
        lastCompleted: new Date().toISOString(),
      };
      localStorage.setItem(TIER_KEY, JSON.stringify(parsed));
    } catch {}
  }, [done, embeddedMode, reviewed, sessionDate, totalQuality]);

  useEffect(() => {
    setIdx(0);
    setReviewed(0);
    setTotalQuality(0);
    setDone(false);
  }, [selectedLevel, selectedTag, studyAll]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    }
    if (tagDropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [tagDropdownOpen]);

  const handleFeedback = useCallback(
    (quality: 1 | 3 | 5) => {
      if (!currentCard) return;

      reviewCard({
        cardId: currentCard._id,
        quality,
      }).catch(() => {});

      setTotalQuality((prev) => prev + quality);
      setReviewed((prev) => prev + 1);

      if (idx < cards.length - 1) {
        setIdx((i) => i + 1);
      } else {
        setDone(true);
      }
    },
    [currentCard, idx, cards.length, reviewCard],
  );

  const hasActiveFilters = !!(selectedLevel || selectedTag);

  const filterBar = (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? undefined : level)}
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
            {studyAll && <span className="block w-1.5 h-1.5 rounded-full bg-white" />}
          </span>
          Include new cards
        </button>
      </div>

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
          <ChevronDown size={14} className={cn("transition-transform", tagDropdownOpen && "rotate-180")} />
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
              <button onClick={() => setSelectedLevel(undefined)} className="hover:opacity-70 transition">
                <X size={10} />
              </button>
            </span>
          )}
          {selectedTag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/15 text-accent-light border border-accent/20">
              {selectedTag}
              <button onClick={() => setSelectedTag(undefined)} className="hover:opacity-70 transition">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      )}

      {counts && (
        <p className="text-center text-[11px] text-white/30">
          {counts.due} due / {counts.total} total
        </p>
      )}
    </div>
  );

  if (filteredCards === undefined && !isOffline && !offlineCards) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <StudyShell contentClassName="gap-4">
        {!embeddedMode && <div className="w-full">{filterBar}</div>}
        <div className="text-5xl mt-4">
          {hasActiveFilters || studyAll ? "🔍" : "🎉"}
        </div>
        <h2 className="text-xl font-semibold">
          {embeddedMode
            ? "No Bronze cards for this topic"
            : hasActiveFilters || studyAll
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
        {embeddedMode && sessionDate && (
          <Link
            href={withBasePath(`/session/${sessionDate}`)}
            className="mt-2 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/70 hover:bg-white/5 transition"
          >
            Back to Session
          </Link>
        )}
      </StudyShell>
    );
  }

  if (done) {
    const avg = reviewed > 0 ? (totalQuality / reviewed).toFixed(1) : "0";
    return (
      <StudyShell contentClassName="gap-6">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-semibold">Practice Complete!</h2>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-accent-light">{reviewed}</p>
            <p className="text-xs text-white/40">Reviewed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{avg}</p>
            <p className="text-xs text-white/40">Avg quality / 5</p>
          </div>
        </div>
        {!embeddedMode && (
          <div className="w-full flex flex-col gap-3">
            <Link
              href={withBasePath("/practice")}
              className="w-full px-5 py-3 bg-accent rounded-xl text-sm font-medium text-center"
            >
              Keep reviewing
            </Link>
            <Link
              href={withBasePath("/drills?focus=recovery")}
              className="w-full px-5 py-3 bg-card rounded-xl border border-white/10 text-sm text-center"
            >
              Practice mistakes
            </Link>
            <Link
              href={withBasePath("/missions/current")}
              className="w-full px-5 py-3 bg-card rounded-xl border border-white/10 text-sm text-center"
            >
              Continue mission
            </Link>
          </div>
        )}
        {embeddedMode && sessionDate && (
          <Link
            href={withBasePath(`/session/${sessionDate}`)}
            className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/70 hover:bg-white/5 transition"
          >
            Back to Session
          </Link>
        )}
      </StudyShell>
    );
  }

  if (!currentCard) return null;
  const vocabCard = toVocabCard(currentCard);

  const header = embeddedMode ? (
    <div className="w-full flex items-center justify-between">
      <Link
        href={sessionDate ? withBasePath(`/session/${sessionDate}`) : withBasePath("/")}
        className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition text-white/50 hover:text-white"
      >
        <ArrowLeft size={18} />
      </Link>
      <div className="text-center">
        <p className="text-xs text-white/30">{sessionDate ?? "today"}</p>
        <h1 className="text-sm font-semibold">Bronze Session</h1>
      </div>
      <div className="w-6" />
    </div>
  ) : undefined;

  return (
    <StudyShell header={header} contentClassName="gap-4">
      {!embeddedMode && (
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between gap-3">
            <StudyProgressHeader
              title="SRS Practice"
              current={idx + 1}
              total={cards.length}
              label={studyAll ? "cards" : "due"}
            />
            <button
              type="button"
              onClick={() => setShowReviewOptions((value) => !value)}
              className="shrink-0 rounded-xl border border-white/10 bg-card px-3 py-2 text-xs text-white/65 transition hover:bg-white/[0.03]"
            >
              {showReviewOptions ? "Hide options" : "Adjust review"}
            </button>
          </div>
          {showReviewOptions ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/60 p-4">
              {filterBar}
              <div className="flex gap-2 flex-wrap justify-center">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setMode(m.key);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition",
                      mode === m.key ? "bg-accent text-white" : "bg-white/5 text-white/40 hover:bg-white/10",
                    )}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {embeddedMode ? (
        <StudyProgressHeader
          title="SRS Practice"
          current={idx + 1}
          total={cards.length}
          label={studyAll ? "cards" : "due"}
        />
      ) : null}

      <div className="flex gap-2 items-center">
        {currentCard.level && (
          <Badge tone="level" level={currentCard.level}>
            {currentCard.level}
          </Badge>
        )}
        {currentCard.source === "correction" && (
          <Badge tone="source" source="correction">
            From your mistakes
          </Badge>
        )}
      </div>

      <ExerciseErrorBoundary onSkip={() => handleFeedback(1)}>
        <SrsCard
          card={vocabCard}
          mode={mode}
          onRate={handleFeedback}
          speechRate={0.85}
          showUndoPrompt={false}
          ratingButtons={[
            { quality: 1, label: "Again", color: "bg-danger/20 text-danger border-danger/30" },
            { quality: 3, label: "Good", color: "bg-warn/20 text-warn border-warn/30" },
            { quality: 5, label: "Easy", color: "bg-success/20 text-success border-success/30" },
          ]}
        />
      </ExerciseErrorBoundary>
    </StudyShell>
  );
}
