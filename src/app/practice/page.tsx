"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import SrsCard from "@/components/SrsCard";

type DueCard = {
  _id: string;
  it: string;
  en: string;
  level?: string;
  tag?: string;
};

export default function PracticePage() {
  const dueCards = useQuery(api.cards.getDue, { limit: 100 }) as DueCard[] | undefined;
  const reviewCard = useMutation(api.cards.review);
  const [current, setCurrent] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const cards = dueCards ?? [];
  const currentCard = cards[current] ?? null;
  const remaining = Math.max(0, cards.length - reviewed);

  const handleRate = useCallback(
    async (quality: number) => {
      if (!currentCard) return;
      await reviewCard({ cardId: currentCard._id as Parameters<typeof reviewCard>[0]["cardId"], quality });
      setReviewed((value) => value + 1);
      setCurrent((value) => value + 1);
    },
    [currentCard, reviewCard],
  );

  const summary = useMemo(
    () => ({
      reviewed,
      total: cards.length,
      remaining,
    }),
    [cards.length, remaining, reviewed],
  );

  if (dueCards === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  if (cards.length === 0 || !currentCard) {
    return (
      <main className="min-h-screen max-w-lg mx-auto px-4 py-10 flex flex-col items-center justify-center gap-5 text-center">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">SRS Cards</p>
          <h1 className="text-2xl font-semibold">
            {summary.reviewed > 0 ? "Review complete" : "No cards due"}
          </h1>
          <p className="text-sm text-white/45">
            {summary.reviewed > 0
              ? `You reviewed ${summary.reviewed} card${summary.reviewed === 1 ? "" : "s"}.`
              : "Come back when more cards are ready."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-medium"
          >
            Back Home
          </Link>
          <Link
            href="/exercises?focus=recovery"
            className="px-4 py-2 rounded-xl border border-white/10 bg-card text-sm"
          >
            Error Drills
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
      <div className="text-center space-y-1 pt-1">
        <p className="text-[11px] uppercase tracking-wider text-accent-light">SRS Cards</p>
        <h1 className="text-lg font-semibold">Due cards only</h1>
        <p className="text-xs text-white/35">
          Standalone review lane. This does not use the mission Bronze queue.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/70 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-white/45">
          <span>Progress</span>
          <span>{summary.reviewed}/{summary.total}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${summary.total > 0 ? (summary.reviewed / summary.total) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          {summary.remaining} remaining
        </p>
      </div>

      <SrsCard
        card={{
          front: currentCard.it,
          back: currentCard.en,
          level: currentCard.level,
          tag: currentCard.tag,
        }}
        onRate={(quality) => void handleRate(quality)}
      />

      <div className="text-center">
        <Link
          href="/"
          className="text-xs text-accent-light hover:text-accent transition"
        >
          Back to mission home
        </Link>
      </div>
    </main>
  );
}
