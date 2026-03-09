"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Flame, Trophy, Zap, Loader2, Flag } from "lucide-react";
import { getTodayWarsaw } from "../lib/date";
import ModeSelector from "../components/ModeSelector";
import SkillsWidget from "../components/SkillsWidget";
import { useRouter } from "next/navigation";
import type { ExerciseMode } from "@/lib/exerciseTypes";
import {
  inventoryToExerciseCounts,
  pickRunnableMode,
  type InventoryStatusResult,
} from "@/lib/inventoryStatus";
import type {
  ActiveMissionResult,
  CatalogMission,
  LearnerMission,
} from "@/lib/missionTypes";

const MODE_LABEL: Record<ExerciseMode, string> = {
  quick: "Bronze",
  standard: "Silver",
  deep: "Gold",
};

export default function Home() {
  const router = useRouter();
  const today = getTodayWarsaw();

  const stats = useQuery(api.sessions.getStats);
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });
  const generateExercises = useMutation(api.exerciseGenerator.generateExercises);
  const milestones = useQuery(api.milestones.getAll);
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMissionResult | null | undefined;
  const inventoryStatus = useQuery(
    api.exercises.getInventoryStatus,
    activeMission?.missionId
      ? { date: today, missionId: activeMission.missionId }
      : { date: today },
  ) as InventoryStatusResult | undefined;
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[] }
    | undefined;
  const catalog = useQuery(api.missions.listCatalog, {}) as
    | { missions: CatalogMission[] }
    | undefined;

  // Auto-generate exercises when inventory is empty and mission is active
  const [generating, setGenerating] = useState(false);
  const generatedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      inventoryStatus?.status === "empty" &&
      activeMission?.missionId &&
      activeMission.status === "active" &&
      !generating &&
      generatedRef.current !== `${today}-${activeMission.missionId}`
    ) {
      setGenerating(true);
      generatedRef.current = `${today}-${activeMission.missionId}`;
      generateExercises({ date: today, missionId: activeMission.missionId })
        .then((r) => console.log("Auto-generated exercises:", r))
        .catch((e) => console.error("Exercise generation failed:", e))
        .finally(() => setGenerating(false));
    }
  }, [inventoryStatus?.status, activeMission?.missionId, activeMission?.status, today, generating, generateExercises]);

  // Count exercises per type — include due SRS cards in Bronze count
  const dueCardsCount = dueCards?.length ?? 0;
  const exerciseCounts = useMemo(
    () => inventoryToExerciseCounts(inventoryStatus, dueCardsCount),
    [inventoryStatus, dueCardsCount],
  );

  const totalExercises = useMemo(() => {
    if (!inventoryStatus) return 0;
    return (
      Math.max(inventoryStatus.counts.quickReady, dueCardsCount) +
      inventoryStatus.counts.standardReady +
      inventoryStatus.counts.deepReady
    );
  }, [inventoryStatus, dueCardsCount]);
  const hasDueCards = dueCardsCount > 0;
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

  const runnableRecommendedMode = useMemo(() => {
    if (!activeProgress) return null;
    return pickRunnableMode(
      activeProgress.recommendedMode,
      inventoryStatus,
      dueCardsCount,
    );
  }, [activeProgress, inventoryStatus, dueCardsCount]);

  const handleModeSelect = (mode: ExerciseMode) => {
    router.push(`/session/${today}?mode=${mode}`);
  };

  // Loading state
  if (stats === undefined || inventoryStatus === undefined) {
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
              (vocab), Silver (drills), Gold (conversation)
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
          Marco will unlock fresh practice as your mission and review queue fill in.
          {hasDueCards && " Meanwhile, start a Bronze session."}
        </p>
        {hasDueCards ? (
          <Link
            href={`/session/${today}?mode=quick`}
            className="px-6 py-3 bg-accent rounded-xl text-sm font-medium"
          >
            Start Bronze session ({dueCards?.length ?? 0} due)
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
              <span className="text-sm font-medium">{dueCards?.length ?? 0}</span>
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
                onClick={() => runnableRecommendedMode && handleModeSelect(runnableRecommendedMode)}
                disabled={!runnableRecommendedMode}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-black"
              >
                {runnableRecommendedMode
                  ? `Continue active mission (${MODE_LABEL[runnableRecommendedMode]})`
                  : "Marco is preparing your next step"}
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
        <section className="space-y-2">
          <p className="text-[11px] text-white/35 uppercase tracking-wider px-1">Choose Today&apos;s Tier</p>
          <ModeSelector
            exerciseCounts={exerciseCounts}
            onSelect={handleModeSelect}
            suggested={runnableRecommendedMode ?? undefined}
          />
        </section>
      ) : (
        <div className="bg-card rounded-2xl border border-white/10 p-6 text-center space-y-2">
          <p className="text-white/50">No mission-ready exercises right now</p>
          <p className="text-xs text-white/30">
            Marco adapts new practice from your mission progress, errors, and due reviews.
          </p>
          {hasDueCards && (
            <Link
              href={`/session/${today}?mode=quick`}
              className="mt-3 inline-block px-4 py-2 bg-accent rounded-xl text-sm font-medium"
            >
              Start Bronze session ({dueCards?.length ?? 0} due)
            </Link>
          )}
        </div>
      )}

      {/* Skills Progress Widget */}
      <SkillsWidget />
    </main>
  );
}
