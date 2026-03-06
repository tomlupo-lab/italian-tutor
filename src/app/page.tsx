"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Flame, Trophy, Zap, BarChart3, Loader2 } from "lucide-react";
import { getTodayWarsaw } from "../lib/date";
import ModeSelector from "../components/ModeSelector";
import { useRouter } from "next/navigation";
import type { ExerciseMode } from "@/lib/exerciseTypes";

export default function Home() {
  const router = useRouter();
  const today = getTodayWarsaw();

  const stats = useQuery(api.sessions.getStats);
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });
  const todayExercises = useQuery(api.exercises.getByDate, { date: today });
  const milestones = useQuery(api.milestones.getAll);

  // Count exercises per type
  const exerciseCounts = useMemo(() => {
    if (!todayExercises) return {};
    const counts: Record<string, number> = {};
    for (const ex of todayExercises) {
      counts[ex.type] = (counts[ex.type] ?? 0) + 1;
    }
    return counts;
  }, [todayExercises]);

  const totalExercises = todayExercises?.length ?? 0;
  const hasDueCards = dueCards && dueCards.length > 0;
  const isFirstRun =
    stats !== undefined &&
    milestones !== undefined &&
    stats.totalSessions === 0 &&
    milestones.length === 0;

  const handleModeSelect = (mode: ExerciseMode) => {
    router.push(`/session/${today}?mode=${mode}`);
  };

  // Loading state
  if (stats === undefined || todayExercises === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  // First-run welcome screen
  if (isFirstRun) {
    return (
      <main className="max-w-lg mx-auto pb-20 px-4 py-12 flex flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <p className="text-4xl">🇮🇹</p>
          <h1 className="text-2xl font-bold">Ciao! Welcome to Marco</h1>
          <p className="text-white/50">
            Your adaptive Italian learning companion.
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-white/10 p-5 space-y-3 w-full text-left">
          <h2 className="text-sm font-medium">How it works</h2>
          <ul className="text-xs text-white/50 space-y-2">
            <li>
              <strong className="text-white/70">3 tiers</strong> — Bronze
              (5 min), Silver (10 min), Gold (15 min)
            </li>
            <li>
              <strong className="text-white/70">8 exercise types</strong> —
              Flashcards, cloze, word builder, conversation, and more
            </li>
            <li>
              <strong className="text-white/70">Adaptive</strong> — Exercises
              adapt to your errors and progress
            </li>
          </ul>
        </div>
        <p className="text-xs text-white/30">
          Exercises will appear after Marco&apos;s first nightly run.
          {hasDueCards && " Meanwhile, try some flashcard practice!"}
        </p>
        {hasDueCards ? (
          <Link
            href="/practice"
            className="px-6 py-3 bg-accent rounded-xl text-sm font-medium"
          >
            Practice SRS cards ({dueCards.length} due)
          </Link>
        ) : (
          <Link
            href="/progress"
            className="px-6 py-3 bg-card rounded-xl border border-white/10 text-sm"
          >
            View Progress
          </Link>
        )}
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto pb-20 px-4 py-4 flex flex-col gap-5">
      {/* Stats bar */}
      {stats && (
        <div className="flex items-center justify-center gap-6 py-1">
          <div className="flex items-center gap-1.5">
            <Flame size={18} className="text-orange-400" />
            <span className="text-lg font-bold">{stats.streak}</span>
            <span className="text-xs text-white/40">streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={18} className="text-yellow-400" />
            <span className="text-lg font-bold">{stats.masteredCards}</span>
            <span className="text-xs text-white/40">mastered</span>
          </div>
          {hasDueCards && (
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-sm font-medium">{dueCards.length}</span>
              <span className="text-xs text-white/40">due</span>
            </div>
          )}
        </div>
      )}

      {/* Today's date header */}
      <div className="text-center">
        <p className="text-xs text-white/30">{today}</p>
        <h1 className="text-lg font-semibold mt-0.5">
          {totalExercises > 0
            ? `${totalExercises} exercises ready`
            : "No exercises today"}
        </h1>
      </div>

      {/* Mode selector or fallback */}
      {totalExercises > 0 ? (
        <ModeSelector
          exerciseCounts={exerciseCounts}
          onSelect={handleModeSelect}
        />
      ) : (
        <div className="bg-card rounded-2xl border border-white/10 p-6 text-center space-y-2">
          <p className="text-white/50">Exercises are generated Sunday night</p>
          <p className="text-xs text-white/30">
            Or the nightly patch adds new ones based on your errors.
          </p>
          {hasDueCards && (
            <Link
              href="/practice"
              className="mt-3 inline-block px-4 py-2 bg-accent rounded-xl text-sm font-medium"
            >
              Practice SRS cards ({dueCards.length} due)
            </Link>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/practice">
          <div className="bg-card rounded-xl border border-white/10 p-4 hover:border-white/20 transition">
            <Zap size={20} className="text-yellow-400 mb-2" />
            <h3 className="text-sm font-medium">Practice</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {hasDueCards
                ? `${dueCards.length} cards due`
                : "Flashcards"}
            </p>
          </div>
        </Link>
        <Link href="/progress">
          <div className="bg-card rounded-xl border border-white/10 p-4 hover:border-white/20 transition">
            <BarChart3 size={20} className="text-accent-light mb-2" />
            <h3 className="text-sm font-medium">Progress</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {stats ? `${stats.totalSessions} sessions` : "View stats"}
            </p>
          </div>
        </Link>
      </div>
    </main>
  );
}
