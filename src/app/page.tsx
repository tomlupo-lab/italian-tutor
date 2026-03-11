"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Flame, Zap, BookOpen, TriangleAlert, Flag, Sparkles } from "lucide-react";
import { getTodayWarsaw } from "../lib/date";
import Badge from "@/components/Badge";
import { DashboardShell } from "@/components/layout/ScreenShell";
import { type InventoryStatusResult } from "@/lib/inventoryStatus";
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

  const dueCardsCount = dueCards?.length ?? 0;
  const streakCount = stats?.streak ?? 0;

  const hasDueCards = dueCardsCount > 0;
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

  const nextStep = (() => {
    if ((activeProgress?.active.criticalErrorsCount ?? 0) > 0) {
      return {
        href: withBasePath("/drills?focus=recovery"),
        label: "Practice mistakes",
        detail:
          activeProgress?.active.criticalErrorsCount === 1
            ? "1 critical weak spot is blocking clean mission progress"
            : `${activeProgress?.active.criticalErrorsCount ?? 0} critical weak spots are blocking clean mission progress`,
        icon: TriangleAlert,
        accentClass: "border-warn/30 bg-warn/10 hover:bg-warn/15",
        iconClass: "text-warn",
      };
    }

    if (dueCardsCount > 0) {
      return {
        href: withBasePath("/practice"),
        label: "Review words",
        detail: `${dueCardsCount} due card${dueCardsCount === 1 ? "" : "s"} ready for recall`,
        icon: BookOpen,
        accentClass: "border-accent/20 bg-accent/10 hover:bg-accent/15",
        iconClass: "text-accent-light",
      };
    }

    if (activeProgress?.mission) {
      return {
        href: withBasePath("/missions/current"),
        label: "Continue mission",
        detail: `${activeProgress.mission.displayLevel ?? activeProgress.mission.level} mission • ${missionProgress?.percent ?? 0}% complete`,
        icon: Flag,
        accentClass: "border-accent/20 bg-accent/10 hover:bg-accent/15",
        iconClass: "text-accent-light",
      };
    }

    return {
      href: withBasePath("/patterns"),
      label: "Learn patterns",
      detail: "Train reusable Italian before your next scenario",
      icon: Sparkles,
      accentClass: "border-accent/20 bg-accent/10 hover:bg-accent/15",
      iconClass: "text-accent-light",
    };
  })();

  return (
    <DashboardShell contentClassName="gap-7">
      <div className="rounded-2xl border border-white/10 bg-card/70 px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-orange-400" />
            <span className="text-[11px] uppercase tracking-wide text-white/45">Streak</span>
            <span className="text-sm font-semibold">{streakCount}</span>
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
        <section className="space-y-2">
          <div className="px-1">
            <p className="text-[11px] uppercase tracking-wider text-accent-light">Best next step</p>
            <h1 className="text-base font-semibold">Start here</h1>
          </div>
          <Link
            href={nextStep.href}
            className={`block rounded-2xl border px-4 py-4 text-left transition ${nextStep.accentClass}`}
          >
            <div className="flex items-center gap-2">
              <nextStep.icon size={16} className={nextStep.iconClass} />
              <p className="text-sm font-semibold">{nextStep.label}</p>
            </div>
            <p className="mt-1 text-[11px] text-white/45">{nextStep.detail}</p>
          </Link>
        </section>

        <section className="space-y-2">
          <div className="px-1">
            <p className="text-[11px] uppercase tracking-wider text-white/35">More ways to practice</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href={withBasePath("/practice")}
              className="rounded-2xl border border-white/10 bg-card px-3 py-4 text-left transition hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-accent-light" />
                <p className="text-sm font-semibold">Review</p>
              </div>
              <p className="mt-1 text-[11px] text-white/45">
                {dueCardsCount > 0 ? `${dueCardsCount} due` : "Short recall session"}
              </p>
            </Link>
            <Link
              href={withBasePath("/patterns")}
              className="rounded-2xl border border-white/10 bg-card px-3 py-4 text-left transition hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent-light" />
                <p className="text-sm font-semibold">Patterns</p>
              </div>
              <p className="mt-1 text-[11px] text-white/45">
                Reusable language for drills and missions
              </p>
            </Link>
            <Link
              href={withBasePath("/missions/current")}
              className="rounded-2xl border border-white/10 bg-card px-3 py-4 text-left transition hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-accent-light" />
                <p className="text-sm font-semibold">Mission</p>
              </div>
              <p className="mt-1 text-[11px] text-white/45">
                {activeProgress?.mission ? "Integrated scenario practice" : "Choose a challenge"}
              </p>
            </Link>
          </div>
        </section>

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
                  : "Choose a mission to start"}
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
          {generating ? (
            <div className="mt-3 rounded-xl border border-accent/20 bg-accent/10 px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-light">
                  AI
                </span>
                <span className="text-xs text-white/35">Preparing mission practice</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-white/45">
                <Loader2 size={14} className="animate-spin text-accent" />
                <span>Building the first batch for your active mission.</span>
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-white/55">Continue mission</span>
            <span className="text-accent-light">Open</span>
          </div>
        </Link>
      </div>
    </DashboardShell>
  );
}
