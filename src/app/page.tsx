"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Loader2, Flag } from "lucide-react";
import { getTodayWarsaw } from "../lib/date";
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

const MODE_COPY: Record<ExerciseMode, { subtitle: string; emoji: string }> = {
  quick: { subtitle: "Review", emoji: "🥉" },
  standard: { subtitle: "Drills", emoji: "🥈" },
  deep: { subtitle: "Conversation", emoji: "🥇" },
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

  const missionProgress = useMemo(() => {
    if (!activeProgress?.mission) return null;
    const bronzeTarget = activeProgress.mission.exerciseTargets.bronzeReviews || 0;
    const silverTarget = activeProgress.mission.exerciseTargets.silverDrills || 0;
    const goldTarget = activeProgress.mission.exerciseTargets.goldConversations || 0;
    const totalTarget = bronzeTarget + silverTarget + goldTarget;
    const totalDone =
      (activeProgress.active.credits?.bronze ?? 0) +
      (activeProgress.active.credits?.silver ?? 0) +
      (activeProgress.active.credits?.gold ?? 0);
    return {
      totalDone,
      totalTarget,
      percent: totalTarget > 0 ? Math.min(100, Math.round((totalDone / totalTarget) * 100)) : 0,
    };
  }, [activeProgress]);

  const recommendationText = useMemo(() => {
    if (missionStatus === "blocked") {
      return "Recovery recommended before continuing the mission.";
    }
    if (!runnableRecommendedMode) {
      return generating
        ? "Marco is preparing the next mission set."
        : "No mission activity is ready yet.";
    }
    if (runnableRecommendedMode === "quick") {
      return dueCardsCount > 0
        ? `${dueCardsCount} review card${dueCardsCount === 1 ? "" : "s"} due.`
        : "Quick review is the best next step.";
    }
    if (runnableRecommendedMode === "standard") {
      return `${exerciseCounts.cloze + exerciseCounts.word_builder + exerciseCounts.pattern_drill + exerciseCounts.speed_translation + exerciseCounts.error_hunt} drill items ready.`;
    }
    return `${exerciseCounts.conversation} conversation scenari${exerciseCounts.conversation === 1 ? "o" : "os"} ready.`;
  }, [dueCardsCount, exerciseCounts, generating, missionStatus, runnableRecommendedMode]);

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
      <div className="text-center pt-1">
        <p className="text-xs text-white/30">{today}</p>
      </div>

      <div className="bg-card rounded-2xl border border-white/10 p-5 space-y-4">
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
        <p className="text-sm text-white/55">
          {activeMission?.summary ??
            "Marco continuously adapts drills and conversations from your errors, score trends, and current mission goals."}
        </p>
        {activeProgress?.mission ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>Mission progress</span>
                <span>{missionProgress?.totalDone ?? 0}/{missionProgress?.totalTarget ?? 0}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${missionProgress?.percent ?? 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {(["quick", "standard", "deep"] as ExerciseMode[]).map((mode) => {
                const count = (["quick", "standard", "deep"].includes(mode)
                  ? mode === "quick"
                    ? exerciseCounts.srs
                    : mode === "standard"
                      ? exerciseCounts.cloze + exerciseCounts.word_builder + exerciseCounts.pattern_drill + exerciseCounts.speed_translation + exerciseCounts.error_hunt
                      : exerciseCounts.conversation + exerciseCounts.reflection
                  : 0);
                const unavailable = count === 0;
                const recommended = runnableRecommendedMode === mode && !unavailable && !activeProgress.blocker;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeSelect(mode)}
                    disabled={unavailable || generating}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      recommended
                        ? "border-accent/50 bg-accent/10"
                        : "border-white/10 bg-white/[0.03]"
                    } ${unavailable || generating ? "opacity-50 cursor-not-allowed" : "hover:bg-white/[0.06]"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg">{MODE_COPY[mode].emoji}</span>
                      {recommended && (
                        <span className="text-[10px] rounded-full bg-accent/20 px-1.5 py-0.5 text-accent-light">
                          Now
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-semibold">{MODE_LABEL[mode]}</p>
                    <p className="text-[11px] text-white/45">{MODE_COPY[mode].subtitle}</p>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-white/40">
              {recommendationText}
            </p>

            {activeProgress.blocker ? (
              <Link
                href="/exercises?focus=recovery"
                className="inline-block px-4 py-2 rounded-xl text-sm font-medium bg-warn/20 text-warn border border-warn/30"
              >
                Run recovery session
              </Link>
            ) : null}
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
    </main>
  );
}
