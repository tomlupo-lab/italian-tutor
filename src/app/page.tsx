"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Flame, Trophy, Zap, Loader2, Flag } from "lucide-react";
import { getTodayWarsaw } from "../lib/date";
import ModeSelector from "../components/ModeSelector";
import SkillsWidget from "../components/SkillsWidget";
import { useRouter } from "next/navigation";
import type { ExerciseMode } from "@/lib/exerciseTypes";

interface ActiveMissionResult {
  missionId: string;
  level: "A1" | "A2" | "B1" | "B2";
  status: "not_started" | "active" | "paused" | "completed";
  title: string;
  summary: string;
}

interface LearnerMission {
  missionId: string;
  active: boolean;
  status: "not_started" | "active" | "paused" | "completed";
  credits: { bronze: number; silver: number; gold: number };
  criticalErrorsCount?: number;
}

interface CatalogMission {
  missionId: string;
  title: string;
  exerciseTargets: {
    bronzeReviews: number;
    silverDrills: number;
    goldConversations: number;
  };
}

export default function Home() {
  const router = useRouter();
  const today = getTodayWarsaw();

  const stats = useQuery(api.sessions.getStats);
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });
  const todayExercises = useQuery(api.exercises.getByDate, { date: today });
  const milestones = useQuery(api.milestones.getAll);
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMissionResult | null | undefined;
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[] }
    | undefined;
  const catalog = useQuery(api.missions.listCatalog, {}) as
    | { missions: CatalogMission[] }
    | undefined;

  // Count exercises per type — include due SRS cards in Bronze count
  const exerciseCounts = useMemo(() => {
    if (!todayExercises) return {};
    const counts: Record<string, number> = {};
    for (const ex of todayExercises) {
      counts[ex.type] = (counts[ex.type] ?? 0) + 1;
    }
    // Bronze = SRS: include due cards even if no SRS exercises were generated
    if (dueCards && dueCards.length > 0) {
      counts["srs"] = Math.max(counts["srs"] ?? 0, dueCards.length);
    }
    return counts;
  }, [todayExercises, dueCards]);

  const totalExercises = todayExercises?.length ?? 0;
  const hasDueCards = dueCards && dueCards.length > 0;
  const isFirstRun =
    stats !== undefined &&
    milestones !== undefined &&
    stats.totalSessions === 0 &&
    milestones.length === 0;

  const activeProgress = useMemo(() => {
    const active = learnerProgress?.missions?.find((m) => m.active);
    if (!active) return null;
    const mission = catalog?.missions?.find((m) => m.missionId === active.missionId);
    if (!mission) return { active, mission: null, recommendedMode: "standard" as ExerciseMode, blocker: false };
    const bronzeMissing = mission.exerciseTargets.bronzeReviews - (active.credits?.bronze ?? 0);
    const silverMissing = mission.exerciseTargets.silverDrills - (active.credits?.silver ?? 0);
    const goldMissing = mission.exerciseTargets.goldConversations - (active.credits?.gold ?? 0);
    const recommendedMode: ExerciseMode =
      goldMissing > 0 ? "deep" : silverMissing > 0 ? "standard" : bronzeMissing > 0 ? "quick" : "standard";
    return {
      active,
      mission,
      recommendedMode,
      blocker: (active.criticalErrorsCount ?? 0) > 0,
    };
  }, [learnerProgress?.missions, catalog?.missions]);

  const missionStatus = useMemo(() => {
    if (!activeProgress) return "none" as const;
    if (activeProgress.blocker) return "blocked" as const;
    if (activeProgress.active.status === "completed") return "completed" as const;
    return "in_progress" as const;
  }, [activeProgress]);

  const handleModeSelect = (mode: ExerciseMode) => {
    // Bronze with no SRS exercises but due cards → go to SRS practice
    if (mode === "quick") {
      const srsExercises = todayExercises?.filter((e) => e.type === "srs").length ?? 0;
      if (srsExercises === 0 && dueCards && dueCards.length > 0) {
        router.push(`/practice?embedded=1&date=${today}`);
        return;
      }
    }
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
      <main className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center gap-6 text-center">
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
    <main className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-5">
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

      {/* Mission Hero */}
      <div className="bg-card rounded-2xl border border-white/10 p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-accent-light uppercase tracking-wider">Mission</p>
          {missionStatus === "blocked" ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-warn/20 text-warn">Blocked</span>
          ) : missionStatus === "completed" ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success">Completed</span>
          ) : missionStatus === "in_progress" ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-light">In progress</span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">None</span>
          )}
        </div>
        <h2 className="text-base font-semibold">
          {activeProgress?.mission?.title ?? "No active mission selected"}
        </h2>
        <p className="text-xs text-white/50">
          {activeMission?.summary ??
            "Marco continuously adapts drills and conversations from your errors, score trends, and current mission goals."}
        </p>
        {activeProgress?.mission ? (
          <>
            <p className="text-xs text-white/45">
              Bronze {activeProgress.active.credits?.bronze ?? 0}/{activeProgress.mission.exerciseTargets.bronzeReviews} ·
              Silver {activeProgress.active.credits?.silver ?? 0}/{activeProgress.mission.exerciseTargets.silverDrills} ·
              Gold {activeProgress.active.credits?.gold ?? 0}/{activeProgress.mission.exerciseTargets.goldConversations}
            </p>
            <p className="text-[11px] text-white/45">
              Focus now:{" "}
              {activeProgress.recommendedMode === "deep"
                ? "Gold conversations"
                : activeProgress.recommendedMode === "standard"
                  ? "Silver drills"
                  : "Bronze SRS"}
            </p>
            {activeProgress.blocker ? (
              <Link
                href="/exercises?focus=recovery"
                className="inline-block px-4 py-2 rounded-xl text-sm font-medium bg-warn/20 text-warn border border-warn/30"
              >
                Run recovery session
              </Link>
            ) : (
              <button
                onClick={() => handleModeSelect(activeProgress.recommendedMode)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-black"
              >
                Continue active mission ({activeProgress.recommendedMode})
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">Open Missions to start your campaign</p>
            <Link
              href="/missions"
              className="inline-block px-4 py-2 rounded-xl text-sm font-medium bg-accent/20 text-accent-light border border-accent/30"
            >
              Open Mission Hub
            </Link>
          </>
        )}
        <div className="pt-2 border-t border-white/10">
          <Link href="/missions" className="text-xs text-accent-light inline-flex items-center gap-1.5">
            <Flag size={12} />
            Manage missions and unlocks
          </Link>
        </div>
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

      {/* Skills Progress Widget */}
      <SkillsWidget />
    </main>
  );
}
