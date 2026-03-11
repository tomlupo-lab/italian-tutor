"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import Badge from "@/components/Badge";
import { DashboardShell } from "@/components/layout/ScreenShell";
import { getTodayWarsaw } from "@/lib/date";
import {
  EXERCISE_TIER_META,
  type ExerciseMode,
} from "@/lib/exerciseTypes";
import {
  inventoryToExerciseCounts,
  type InventoryStatusResult,
} from "@/lib/inventoryStatus";
import { withBasePath } from "@/lib/paths";
import type {
  ActiveMissionResult,
  CatalogMission,
  LearnerMission,
} from "@/lib/missionTypes";

const TIER_ACTIVITY_LABEL: Record<ExerciseMode, string> = {
  bronze: "Words",
  silver: "Drills",
  gold: "Conversation",
};

const MODE_TARGET_KEY: Record<ExerciseMode, "bronzeReviews" | "silverDrills" | "goldConversations"> = {
  bronze: "bronzeReviews",
  silver: "silverDrills",
  gold: "goldConversations",
};

const MODE_CREDIT_KEY: Record<ExerciseMode, "bronze" | "silver" | "gold"> = {
  bronze: "bronze",
  silver: "silver",
  gold: "gold",
};

export default function CurrentMissionPage() {
  const today = getTodayWarsaw();
  const [generating, setGenerating] = useState(false);
  const generatedRef = useRef<string | null>(null);

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
        .catch((error) => console.error("Exercise generation failed:", error))
        .finally(() => setGenerating(false));
    }
  }, [activeMission?.missionId, activeMission?.status, generateExercises, generating, inventoryStatus?.status, today]);

  if (learnerProgress === undefined || catalog === undefined || (activeMission?.missionId && inventoryStatus === undefined)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </main>
    );
  }

  const progress = learnerProgress.missions.find((mission) => mission.active);
  const mission = progress
    ? catalog.missions.find((entry) => entry.missionId === progress.missionId)
    : null;

  if (!progress || !mission) {
    return (
      <DashboardShell contentClassName="gap-6">
        <section className="rounded-2xl border border-white/10 bg-card p-5 space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-accent-light">Current mission</p>
          <h1 className="text-lg font-semibold">No active mission selected</h1>
          <p className="text-sm text-white/50">
            Choose a mission first, then come back here to select a tier.
          </p>
          <Link
            href={withBasePath("/missions")}
            className="inline-flex rounded-xl border border-accent/30 bg-accent/20 px-4 py-2 text-sm font-medium text-accent-light"
          >
            Open Mission Hub
          </Link>
        </section>
      </DashboardShell>
    );
  }

  const dueCardsCount = dueCards?.length ?? 0;
  const exerciseCounts = inventoryToExerciseCounts(inventoryStatus, dueCardsCount);

  const bronzeTarget = mission.exerciseTargets.bronzeReviews || 0;
  const silverTarget = mission.exerciseTargets.silverDrills || 0;
  const goldTarget = mission.exerciseTargets.goldConversations || 0;
  const bronzeDone = Math.min(progress.credits?.bronze ?? 0, bronzeTarget);
  const silverDone = Math.min(progress.credits?.silver ?? 0, silverTarget);
  const goldDone = Math.min(progress.credits?.gold ?? 0, goldTarget);
  const tierPercents = [
    bronzeTarget > 0 ? bronzeDone / bronzeTarget : 0,
    silverTarget > 0 ? silverDone / silverTarget : 0,
    goldTarget > 0 ? goldDone / goldTarget : 0,
  ];
  const activeTiers = tierPercents.filter((_, index) => [bronzeTarget, silverTarget, goldTarget][index] > 0);
  const missionPercent =
    activeTiers.length > 0
      ? Math.round((activeTiers.reduce((sum, value) => sum + value, 0) / activeTiers.length) * 100)
      : 0;

  const modeProgress = (["bronze", "silver", "gold"] as ExerciseMode[]).reduce((acc, mode) => {
    const target = mission.exerciseTargets[MODE_TARGET_KEY[mode]] ?? 0;
    const done = progress.credits?.[MODE_CREDIT_KEY[mode]] ?? 0;
    acc[mode] = {
      done,
      target,
      percent: target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0,
    };
    return acc;
  }, {} as Record<ExerciseMode, { done: number; target: number; percent: number }>);

  const blockedByErrors = (progress.criticalErrorsCount ?? 0) > 0;
  const recommendedTier = (["bronze", "silver", "gold"] as ExerciseMode[]).reduce(
    (best, mode) => {
      if (!best) return mode;
      if (modeProgress[mode].percent < modeProgress[best].percent) return mode;
      return best;
    },
    null as ExerciseMode | null,
  ) ?? "bronze";

  return (
    <DashboardShell contentClassName="gap-6">
      <section className="rounded-2xl border border-white/10 bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-accent-light">Current mission</p>
            <h1 className="text-lg font-semibold">{mission.title}</h1>
            <p className="text-sm text-white/55">{activeMission?.summary ?? mission.summary}</p>
          </div>
          <Badge tone="level" level={mission.displayLevel ?? mission.level}>
            {mission.displayLevel ?? mission.level}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-white/40">
            <span>Mission progress</span>
            <span>{missionPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${missionPercent}%` }}
            />
          </div>
        </div>

        {blockedByErrors ? (
          <div className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-white/70">
            You have {progress.criticalErrorsCount} critical errors to recover before continuing the mission.
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-semibold">Choose tier</h2>
          <p className="mt-1 text-xs text-white/45">
            Pick Bronze, Silver, or Gold for this mission.
          </p>
        </div>

        <div className="space-y-3">
          {(["bronze", "silver", "gold"] as ExerciseMode[]).map((mode) => {
            const readyCount =
              mode === "bronze"
                ? exerciseCounts.srs
                : mode === "silver"
                  ? exerciseCounts.cloze
                  : exerciseCounts.conversation;
            const unavailable = blockedByErrors || readyCount === 0 || generating;
            const stateLabel =
              modeProgress[mode].percent >= 100
                ? "Complete"
                : modeProgress[mode].done > 0
                  ? "In progress"
                  : "Not started";
            const showReplayBadge = modeProgress[mode].percent >= 100;
            const showRecommendedBadge = mode === recommendedTier && modeProgress[mode].percent < 100;

            return (
              <Link
                key={mode}
                href={
                  blockedByErrors
                    ? "/drills?focus=recovery"
                    : `/session/${today}?mode=${mode}`
                }
                aria-disabled={unavailable}
                className={`block rounded-2xl border px-4 py-4 transition ${
                  unavailable
                    ? "pointer-events-none cursor-not-allowed border-white/10 bg-white/[0.03] opacity-50"
                    : mode === recommendedTier
                      ? "border-accent/30 bg-accent/10 hover:bg-accent/15"
                      : "border-white/10 bg-card hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{EXERCISE_TIER_META[mode].emoji}</span>
                      <p className="text-sm font-semibold">{EXERCISE_TIER_META[mode].label}</p>
                      <p className="text-[11px] text-white/45">{stateLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {showReplayBadge ? (
                      <Badge tone="accent" className="text-[10px] py-1">
                        Replay
                      </Badge>
                    ) : null}
                    {showRecommendedBadge ? (
                      <Badge tone="accent" className="text-[10px] py-1">
                      Recommended
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-white/40">
                    <span>{TIER_ACTIVITY_LABEL[mode]}</span>
                    <span>
                      {Math.min(modeProgress[mode].done, modeProgress[mode].target)}/{modeProgress[mode].target}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${modeProgress[mode].percent}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}
