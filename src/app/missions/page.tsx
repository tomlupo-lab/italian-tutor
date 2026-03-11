"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Flag, Loader2, PlayCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import Badge from "@/components/Badge";
import { DashboardShell } from "@/components/layout/ScreenShell";
import { cn } from "@/lib/cn";
import { withBasePath } from "@/lib/paths";
import type {
  CatalogMission,
  LearnerLevel,
  LearnerMission,
  LearnerSkill,
  Level,
} from "@/lib/missionTypes";

const LEVELS: Level[] = ["A1", "A2", "B1", "B2"];

function missionLevelLabel(mission: CatalogMission) {
  return mission.displayLevel ?? mission.level;
}

function missionPercent(mission: CatalogMission, progress?: LearnerMission) {
  if (!progress) return 0;

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

  if (activeTiers.length === 0) return 0;

  return Math.round((activeTiers.reduce((sum, value) => sum + value, 0) / activeTiers.length) * 100);
}

type MissionState = "active" | "recommended" | "completed" | "available";

function stateBadge(state: MissionState) {
  if (state === "active") {
    return <Badge tone="accent">Active</Badge>;
  }
  if (state === "recommended") {
    return <Badge tone="accent">Recommended</Badge>;
  }
  if (state === "completed") {
    return <Badge tone="status" status="completed">Completed</Badge>;
  }
  return <Badge>Available</Badge>;
}

export default function MissionsPage() {
  const [workingMissionId, setWorkingMissionId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level>("A1");

  const catalog = useQuery(api.missions.listCatalog, {}) as { missions: CatalogMission[] } | undefined;
  const learner = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[]; level?: LearnerLevel | null; skills?: LearnerSkill[] }
    | undefined;
  const seedCatalog = useMutation(api.missions.seedCatalog);
  const setActiveMission = useMutation(api.missions.setActiveMission);

  const progressByMission = useMemo(() => {
    const map = new Map<string, LearnerMission>();
    for (const row of learner?.missions ?? []) {
      map.set(row.missionId, row);
    }
    return map;
  }, [learner?.missions]);

  const missionsByLevel = useMemo(() => {
    const grouped: Record<Level, CatalogMission[]> = { A1: [], A2: [], B1: [], B2: [] };
    for (const mission of catalog?.missions ?? []) {
      grouped[mission.level as Level].push(mission);
    }
    for (const level of LEVELS) {
      grouped[level].sort((a, b) => a.order - b.order);
    }
    return grouped;
  }, [catalog?.missions]);

  const currentLevel = (learner?.level?.currentLevel as Level | undefined) ?? "A1";
  const activeMission = learner?.missions?.find((mission) => mission.active);
  const activeMissionCatalog = activeMission
    ? catalog?.missions?.find((mission) => mission.missionId === activeMission.missionId)
    : undefined;

  const recommendedMission = useMemo(() => {
    if (!catalog?.missions?.length) return null;

    if (activeMissionCatalog && activeMission?.status !== "completed") {
      return activeMissionCatalog;
    }

    const unfinishedCurrentLevel = missionsByLevel[currentLevel].find((mission) => {
      const progress = progressByMission.get(mission.missionId);
      return progress?.status !== "completed";
    });
    if (unfinishedCurrentLevel) return unfinishedCurrentLevel;

    return catalog.missions.find((mission) => {
      const progress = progressByMission.get(mission.missionId);
      return progress?.status !== "completed";
    }) ?? null;
  }, [activeMission?.status, activeMissionCatalog, catalog?.missions, currentLevel, missionsByLevel, progressByMission]);

  useEffect(() => {
    if (!LEVELS.includes(selectedLevel)) {
      setSelectedLevel(currentLevel);
    }
  }, [currentLevel, selectedLevel]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedCatalog({});
    } finally {
      setSeeding(false);
    }
  };

  const activateMission = async (missionId: string) => {
    setWorkingMissionId(missionId);
    try {
      await setActiveMission({ missionId });
    } finally {
      setWorkingMissionId(null);
    }
  };

  if (catalog === undefined || learner === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </main>
    );
  }

  const hasCatalog = (catalog.missions?.length ?? 0) > 0;
  const completedCount = learner.missions.filter((mission) => mission.status === "completed").length;
  const visibleLevel = selectedLevel || currentLevel;
  const visibleMissions = missionsByLevel[visibleLevel];

  return (
    <DashboardShell contentClassName="gap-6">
      <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/40">Missions</p>
            <h1 className="mt-0.5 text-lg font-semibold">Choose your current challenge</h1>
            <p className="mt-1 text-xs text-white/45">
              {currentLevel} campaign • {completedCount}/{catalog.missions.length} complete
            </p>
          </div>
          <Flag size={18} className="mt-1 text-accent-light" />
        </div>

        {!hasCatalog && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className={cn(
              "w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition",
              "border-accent/30 bg-accent/20 text-accent-light",
              seeding && "cursor-not-allowed opacity-60",
            )}
          >
            {seeding ? "Initializing mission catalog..." : "Initialize mission catalog"}
          </button>
        )}
      </section>

      {hasCatalog && activeMissionCatalog && activeMission ? (
        <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-accent-light">Current mission</p>
              <h2 className="text-base font-semibold">{activeMissionCatalog.title}</h2>
              <p className="text-sm text-white/45">{activeMissionCatalog.summary}</p>
            </div>
            {stateBadge("active")}
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/40">
            <span>{missionLevelLabel(activeMissionCatalog)}</span>
            <span>{missionPercent(activeMissionCatalog, activeMission)}% complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${missionPercent(activeMissionCatalog, activeMission)}%` }}
            />
          </div>
          <Link
            href={withBasePath("/missions/current")}
            className="inline-flex rounded-xl border border-accent/30 bg-accent/20 px-4 py-2 text-sm font-medium text-accent-light"
          >
            Open mission
          </Link>
        </section>
      ) : null}

      {hasCatalog && recommendedMission && recommendedMission.missionId !== activeMissionCatalog?.missionId ? (
        <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-accent-light">Recommended next</p>
            <h2 className="text-base font-semibold">{recommendedMission.title}</h2>
            <p className="text-sm text-white/45">{recommendedMission.summary}</p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/40">
            <span>{missionLevelLabel(recommendedMission)}</span>
            {stateBadge("recommended")}
          </div>
          <button
            onClick={() => activateMission(recommendedMission.missionId)}
            disabled={workingMissionId !== null}
            className={cn(
              "inline-flex items-center gap-1 rounded-xl border px-4 py-2 text-sm font-medium transition",
              "border-accent/30 bg-accent/20 text-accent-light",
              workingMissionId !== null && "cursor-not-allowed opacity-60",
            )}
          >
            <PlayCircle size={14} />
            {workingMissionId === recommendedMission.missionId ? "Setting active..." : "Set active"}
          </button>
        </section>
      ) : null}

      {hasCatalog ? (
        <section className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">Browse by level</h2>
              <p className="text-[11px] text-white/40">{visibleLevel} selected</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition",
                    visibleLevel === level
                      ? "border-accent/30 bg-accent/20 text-accent-light"
                      : "border-white/10 bg-card text-white/70 hover:bg-white/[0.03]",
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">{visibleLevel} Missions</h2>
              <p className="text-[11px] text-white/40">
                {visibleMissions.filter((mission) => progressByMission.get(mission.missionId)?.status === "completed").length}/
                {visibleMissions.length} complete
              </p>
            </div>

            <div className="space-y-2">
              {visibleMissions.map((mission) => {
                const progress = progressByMission.get(mission.missionId);
                const isActive = progress?.active ?? false;
                const isCompleted = progress?.status === "completed";
                const isRecommended =
                  !isActive &&
                  !isCompleted &&
                  mission.missionId === recommendedMission?.missionId;
                const state: MissionState = isActive
                  ? "active"
                  : isCompleted
                    ? "completed"
                    : isRecommended
                      ? "recommended"
                      : "available";

                return (
                  <div
                    key={mission.missionId}
                    className={cn(
                      "rounded-2xl border p-4",
                      state === "active"
                        ? "border-accent/30 bg-accent/10"
                        : state === "recommended"
                          ? "border-white/15 bg-white/[0.03]"
                          : state === "completed"
                            ? "border-success/25 bg-success/10"
                            : "border-white/10 bg-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{mission.title}</p>
                          {stateBadge(state)}
                        </div>
                        <p className="text-xs text-white/45">
                          {missionLevelLabel(mission)} • {mission.summary}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {isActive ? (
                        <Link
                          href={withBasePath("/missions/current")}
                          className="inline-flex rounded-lg border border-accent/30 bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent-light"
                        >
                          Open
                        </Link>
                      ) : (
                        <button
                          onClick={() => activateMission(mission.missionId)}
                          disabled={workingMissionId !== null}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                            "border-white/15 bg-white/5 text-white/80",
                            workingMissionId !== null && "cursor-not-allowed opacity-60",
                          )}
                        >
                          <PlayCircle size={12} />
                          {workingMissionId === mission.missionId ? "Setting active..." : "Set active"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      ) : null}
    </DashboardShell>
  );
}
