"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Loader2, Flame, Zap, BookOpen, TriangleAlert } from "lucide-react";
import { getTodayWarsaw } from "../lib/date";
import Badge from "@/components/Badge";
import { DashboardShell } from "@/components/layout/ScreenShell";
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

export default function Home() {
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
  const exerciseCounts = inventoryToExerciseCounts(inventoryStatus, dueCardsCount);

  const hasDueCards = dueCardsCount > 0;
  const isFirstRun =
    stats !== undefined &&
    stats.totalSessions === 0 &&
    (learnerProgress?.missions?.length ?? 0) === 0;

  const activeProgress = (() => {
    const active = learnerProgress?.missions?.find((m) => m.active);
    if (!active) return null;
    const mission = catalog?.missions?.find((m) => m.missionId === active.missionId);
    if (!mission) return { active, mission: null, blocker: false };
    return {
      active,
      mission,
      blocker: (active.criticalErrorsCount ?? 0) > 0,
    };
  })();

  const missionStatus = (() => {
    if (!activeProgress) return "none" as const;
    if (activeProgress.blocker) return "blocked" as const;
    if (activeProgress.active.status === "completed") return "completed" as const;
    return "in_progress" as const;
  })();

  const missionProgress = (() => {
    if (!activeProgress?.mission) return null;
    const bronzeTarget = activeProgress.mission.exerciseTargets.bronzeReviews || 0;
    const silverTarget = activeProgress.mission.exerciseTargets.silverDrills || 0;
    const goldTarget = activeProgress.mission.exerciseTargets.goldConversations || 0;
    const bronzeDone = Math.min(activeProgress.active.credits?.bronze ?? 0, bronzeTarget);
    const silverDone = Math.min(activeProgress.active.credits?.silver ?? 0, silverTarget);
    const goldDone = Math.min(activeProgress.active.credits?.gold ?? 0, goldTarget);
    const tierPercents = [
      bronzeTarget > 0 ? bronzeDone / bronzeTarget : 0,
      silverTarget > 0 ? silverDone / silverTarget : 0,
      goldTarget > 0 ? goldDone / goldTarget : 0,
    ];
    const completedTiers = tierPercents.filter((value, index) => {
      const target = [bronzeTarget, silverTarget, goldTarget][index];
      return target > 0;
    });
    const percent =
      completedTiers.length > 0
        ? Math.round((completedTiers.reduce((sum, value) => sum + value, 0) / completedTiers.length) * 100)
        : 0;
    return {
      percent,
    };
  })();

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
            href={`/session/${today}?mode=bronze`}
            className="px-6 py-3 bg-accent rounded-xl text-sm font-medium"
          >
            Start Bronze session ({dueCards?.length ?? 0} due)
          </Link>
        ) : (
          <Link
            href={withBasePath("/progress")}
            className="px-6 py-3 bg-card rounded-xl border border-white/10 text-sm"
          >
            View Progress
          </Link>
        )}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell contentClassName="gap-7">
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
            <span className="text-[11px] uppercase tracking-wide text-white/45">Due Reviews</span>
            <span className="text-sm font-semibold">{dueCardsCount}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Link
          href={withBasePath("/practice")}
          className="block rounded-2xl border border-accent/20 bg-accent/10 px-4 py-4 text-left transition hover:bg-accent/15"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-accent-light" />
            <p className="text-sm font-semibold">Review words</p>
          </div>
          <p className="mt-1 text-[11px] text-white/45">
            {dueCardsCount > 0 ? `${dueCardsCount} due card${dueCardsCount === 1 ? "" : "s"}` : "All cards with filters and modes"}
          </p>
        </Link>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={withBasePath("/drills?focus=recovery")}
            className="rounded-2xl border border-white/10 bg-card px-3 py-4 text-left transition hover:bg-white/[0.03]"
          >
            <div className="flex items-center gap-2">
              <TriangleAlert size={16} className="text-warn" />
              <p className="text-sm font-semibold">Practice mistakes</p>
            </div>
            <p className="mt-1 text-[11px] text-white/45">
              Fix recent weak spots
            </p>
          </Link>
          <Link
            href={withBasePath("/skills")}
            className="rounded-2xl border border-white/10 bg-card px-3 py-4 text-left transition hover:bg-white/[0.03]"
          >
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-accent-light" />
              <p className="text-sm font-semibold">Build skills</p>
            </div>
            <p className="mt-1 text-[11px] text-white/45">
              Train with drills
            </p>
          </Link>
        </div>

        <Link
          href={withBasePath("/missions/current")}
          className="block rounded-2xl border border-white/10 bg-card px-4 py-5 transition hover:bg-white/[0.03]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-accent-light">Current mission</p>
              <h2 className="text-sm font-semibold">
                {activeProgress?.mission?.title ?? "No active mission selected"}
              </h2>
              <p className="text-[11px] text-white/45">
                {activeProgress?.mission
                  ? `${activeProgress.mission.displayLevel ?? activeProgress.mission.level} • ${missionProgress?.percent ?? 0}% complete`
                  : "Open Missions to start your campaign"}
              </p>
            </div>
            {missionStatus === "blocked" ? (
              <Badge tone="status" status="blocked">Blocked</Badge>
            ) : missionStatus === "completed" ? (
              <Badge tone="status" status="completed">Completed</Badge>
            ) : activeProgress?.mission?.level ? (
              <Badge
                tone="level"
                level={activeProgress.mission.displayLevel ?? activeProgress.mission.level}
              >
                {activeProgress.mission.displayLevel ?? activeProgress.mission.level}
              </Badge>
            ) : (
              <Badge>None</Badge>
            )}
          </div>
          {activeProgress?.mission ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>Mission progress</span>
                <span>{missionProgress?.percent ?? 0}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${missionProgress?.percent ?? 0}%` }}
                />
              </div>
            </div>
          ) : null}
        </Link>
      </div>
    </DashboardShell>
  );
}
