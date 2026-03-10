"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Loader2, Flame, Zap, BookOpen, TriangleAlert } from "lucide-react";
import { getTodayWarsaw } from "../lib/date";
import { useRouter } from "next/navigation";
import Badge from "@/components/Badge";
import { DashboardShell } from "@/components/layout/ScreenShell";
import type { ExerciseMode } from "@/lib/exerciseTypes";
import { prettySkillLabel } from "@/lib/labels";
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
  quick: { subtitle: "Card", emoji: "🥉" },
  standard: { subtitle: "Drills", emoji: "🥈" },
  deep: { subtitle: "Conversation", emoji: "🥇" },
};

const MODE_TARGET_KEY: Record<ExerciseMode, "bronzeReviews" | "silverDrills" | "goldConversations"> = {
  quick: "bronzeReviews",
  standard: "silverDrills",
  deep: "goldConversations",
};

const MODE_CREDIT_KEY: Record<ExerciseMode, "bronze" | "silver" | "gold"> = {
  quick: "bronze",
  standard: "silver",
  deep: "gold",
};

export default function Home() {
  const router = useRouter();
  const today = getTodayWarsaw();

  const stats = useQuery(api.sessions.getStats);
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });
  const generateExercises = useMutation(api.exerciseGenerator.generateExercises);
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMissionResult | null | undefined;
  const inventoryStatus = useQuery(
    api.exercises.getMissionInventoryStatus,
    activeMission?.missionId ? { missionId: activeMission.missionId } : "skip",
  ) as InventoryStatusResult | undefined;
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[] }
    | undefined;
  const catalog = useQuery(api.missions.listCatalog, {}) as
    | { missions: CatalogMission[] }
    | undefined;

  // Auto-generate the first mission inventory when a mission has no exercises at all.
  const [generating, setGenerating] = useState(false);
  const generatedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      inventoryStatus?.status === "empty" &&
      activeMission?.missionId &&
      activeMission.status === "active" &&
      !generating &&
      generatedRef.current !== activeMission.missionId
    ) {
      setGenerating(true);
      generatedRef.current = activeMission.missionId;
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

  const hasDueCards = dueCardsCount > 0;
  const isFirstRun =
    stats !== undefined &&
    stats.totalSessions === 0 &&
    (learnerProgress?.missions?.length ?? 0) === 0;

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

  const modeProgress = useMemo(() => {
    if (!activeProgress?.mission) return null;

    return (["quick", "standard", "deep"] as ExerciseMode[]).reduce((acc, mode) => {
      const target = activeProgress.mission?.exerciseTargets[MODE_TARGET_KEY[mode]] ?? 0;
      const done = activeProgress.active.credits?.[MODE_CREDIT_KEY[mode]] ?? 0;
      acc[mode] = {
        done,
        target,
        percent: target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0,
      };
      return acc;
    }, {} as Record<ExerciseMode, { done: number; target: number; percent: number }>);
  }, [activeProgress]);

  const recommendationText = useMemo(() => {
    if (missionStatus === "blocked") {
      const blockers = activeProgress?.active.skillBlockers ?? [];
      if (blockers.length > 0) {
        const labels = blockers
          .slice(0, 2)
          .map((blocker) => prettySkillLabel(blocker.skillKey) ?? blocker.skillKey);
        return `Recovery recommended for ${labels.join(" and ")} before continuing the mission.`;
      }
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
  }, [activeProgress?.active.skillBlockers, dueCardsCount, exerciseCounts, generating, missionStatus, runnableRecommendedMode]);

  const handleModeSelect = (mode: ExerciseMode) => {
    router.push(`/session/${today}?mode=${mode}`);
  };

  // Loading state
  if (stats === undefined || (activeMission?.missionId && inventoryStatus === undefined)) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  // First-run welcome screen
  if (isFirstRun) {
    return (
      <DashboardShell contentClassName="py-12 flex flex-col items-center gap-6 text-center">
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
      </DashboardShell>
    );
  }

  return (
    <DashboardShell contentClassName="gap-5">
      <div className="rounded-2xl border border-white/10 bg-card/70 px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-orange-400" />
            <span className="text-[11px] uppercase tracking-wide text-white/45">Streak</span>
            <span className="text-sm font-semibold">{stats.streak}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-[11px] uppercase tracking-wide text-white/45">Due Review</span>
            <span className="text-sm font-semibold">{dueCardsCount}</span>
          </div>
        </div>
      </div>

      <div className="text-center pt-1">
        <p className="text-xs text-white/30">{today}</p>
      </div>

      <div className="bg-card rounded-2xl border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-accent-light uppercase tracking-wider">Mission</p>
          {missionStatus === "blocked" ? (
            <Badge tone="status" status="blocked">Blocked</Badge>
          ) : missionStatus === "completed" ? (
            <Badge tone="status" status="completed">Completed</Badge>
          ) : activeProgress?.mission?.level ? (
            <Badge tone="level" level={activeProgress.mission.level}>
              {activeProgress.mission.level}
            </Badge>
          ) : (
            <Badge>None</Badge>
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

            <div className="space-y-1.5 pt-1">
              {(["quick", "standard", "deep"] as ExerciseMode[]).map((mode) => {
                const count = (["quick", "standard", "deep"].includes(mode)
                  ? mode === "quick"
                    ? inventoryStatus?.counts.quickTotal ?? exerciseCounts.srs
                    : mode === "standard"
                      ? inventoryStatus?.counts.standardTotal ?? (
                          exerciseCounts.cloze +
                          exerciseCounts.word_builder +
                          exerciseCounts.pattern_drill +
                          exerciseCounts.speed_translation +
                          exerciseCounts.error_hunt
                        )
                      : inventoryStatus?.counts.deepTotal ?? (exerciseCounts.conversation + exerciseCounts.reflection)
                  : 0);
                const unavailable = !activeProgress.mission;
                const recommended = runnableRecommendedMode === mode && !unavailable && !activeProgress.blocker;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeSelect(mode)}
                    disabled={unavailable || generating}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                      recommended
                        ? "border-accent/50 bg-accent/10"
                        : "border-white/10 bg-white/[0.03]"
                    } ${unavailable || generating ? "opacity-50 cursor-not-allowed" : "hover:bg-white/[0.06]"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{MODE_COPY[mode].emoji}</span>
                          <p className="text-[13px] font-semibold">{MODE_LABEL[mode]}</p>
                          <p className="text-[10px] text-white/40">{MODE_COPY[mode].subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        {recommended && (
                          <Badge tone="accent" className="px-1.5 border-0">Now</Badge>
                        )}
                        <p className="text-[10px] text-white/35">
                          {count > 0 ? `${count} ready` : "Replay"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-white/35">
                        <span className="uppercase tracking-wide">Progress</span>
                        <span>{modeProgress?.[mode].done ?? 0}/{modeProgress?.[mode].target ?? 0}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${modeProgress?.[mode].percent ?? 0}%` }}
                        />
                      </div>
                    </div>
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
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/practice"
          className="rounded-2xl border border-white/10 bg-card px-4 py-4 text-left transition hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-accent-light" />
            <p className="text-sm font-semibold">SRS Practice</p>
          </div>
          <p className="mt-1 text-[11px] text-white/45">
            {dueCardsCount > 0 ? `${dueCardsCount} due card${dueCardsCount === 1 ? "" : "s"}` : "All cards with filters and modes"}
          </p>
        </Link>
        <Link
          href="/exercises?focus=recovery"
          className="rounded-2xl border border-white/10 bg-card px-4 py-4 text-left transition hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-2">
            <TriangleAlert size={16} className="text-warn" />
            <p className="text-sm font-semibold">Error Drills</p>
          </div>
          <p className="mt-1 text-[11px] text-white/45">
            Target recent mistakes with focused drills
          </p>
        </Link>
      </div>
    </DashboardShell>
  );
}
