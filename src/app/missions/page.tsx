"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CheckCircle2, Flag, Lock, Loader2, PlayCircle, Target } from "lucide-react";
import { cn } from "@/lib/cn";
import Badge from "@/components/Badge";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/ScreenShell";
import {
  pickRunnableMode,
  type InventoryStatusResult,
} from "@/lib/inventoryStatus";
import type {
  CatalogMission,
  LearnerLevel,
  LearnerMission,
  LearnerSkill,
  Level,
  RoadmapRule,
} from "@/lib/missionTypes";

const LEVELS: Level[] = ["A1", "A2", "B1", "B2"];
const missionLevelLabel = (mission: CatalogMission) => mission.displayLevel ?? mission.level;

function prettySkill(skillKey: string): string {
  return skillKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function checklistTone(done: boolean) {
  return done ? "text-success" : "text-white/45";
}

export default function MissionsPage() {
  const [workingMissionId, setWorkingMissionId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level>("A1");

  const catalog = useQuery(api.missions.listCatalog, {}) as { missions: CatalogMission[] } | undefined;
  const learner = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[]; level?: LearnerLevel | null; skills?: LearnerSkill[] }
    | undefined;
  const roadmapData = useQuery(
    api.missions.getRoadmap,
    learner?.level?.currentLevel
      ? { level: learner.level.currentLevel }
      : "skip",
  ) as { roadmap?: RoadmapRule | null } | undefined;
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });
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
    for (const m of catalog?.missions ?? []) grouped[m.level as Level].push(m);
    for (const level of LEVELS) grouped[level].sort((a, b) => a.order - b.order);
    return grouped;
  }, [catalog?.missions]);

  const unlocked = new Set<string>(learner?.level?.unlockedLevels ?? ["A1"]);
  const currentLevel = (learner?.level?.currentLevel as Level | undefined) ?? "A1";
  const activeMission = learner?.missions?.find((m) => m.active);
  const activeMissionCatalog = activeMission
    ? catalog?.missions?.find((m) => m.missionId === activeMission.missionId)
    : undefined;
  const inventoryStatus = useQuery(
    api.exercises.getInventoryStatus,
    activeMission?.missionId
      ? {
          date: new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" }),
          missionId: activeMission.missionId,
        }
      : {
          date: new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" }),
        },
  ) as InventoryStatusResult | undefined;

  const unlockChecklist = useMemo(() => {
    if (!learner?.level || !roadmapData?.roadmap || !catalog?.missions) return null;
    const roadmap = roadmapData.roadmap;
    const completed = new Set(
      learner.missions.filter((m) => m.status === "completed").map((m) => m.missionId),
    );
    const doneInPool = catalog.missions
      .filter((m) => m.level === roadmap.level && completed.has(m.missionId))
      .map((m) => m.missionId);
    const optionalDone = doneInPool.filter((id) => !roadmap.requiredMissionIds.includes(id)).length;
    const requiredDone = roadmap.requiredMissionIds.filter((id) => completed.has(id)).length;

    const skillMap = new Map((learner.skills ?? []).map((s) => [s.skillKey, s.points] as const));
    const skillChecks = roadmap.skillThresholds.map((rule) => ({
      ...rule,
      current: skillMap.get(rule.skillKey) ?? 0,
    }));
    const sessions = roadmap.sessionMinimums;

    return {
      requiredDone,
      requiredTotal: roadmap.requiredMissionIds.length,
      completedDone: doneInPool.length,
      completedTarget: roadmap.minCompletedMissions,
      optionalDone,
      optionalTarget: roadmap.minOptionalMissions,
      skillChecks,
      sessions,
      currentTier: learner.level.tierCredits ?? { bronze: 0, silver: 0, gold: 0 },
      currentMinutes: learner.level.minutesTotal ?? 0,
      currentDays: learner.level.activeDates?.length ?? 0,
    };
  }, [learner, roadmapData?.roadmap, catalog?.missions]);

  const recommendedMode = useMemo(() => {
    if (!activeMission || !activeMissionCatalog) return null;
    const bronzeMissing = activeMissionCatalog.exerciseTargets.bronzeReviews - (activeMission.credits?.bronze ?? 0);
    const silverMissing = activeMissionCatalog.exerciseTargets.silverDrills - (activeMission.credits?.silver ?? 0);
    const goldMissing = activeMissionCatalog.exerciseTargets.goldConversations - (activeMission.credits?.gold ?? 0);
    if (goldMissing > 0) return "deep";
    if (silverMissing > 0) return "standard";
    if (bronzeMissing > 0) return "quick";
    return "standard";
  }, [activeMission, activeMissionCatalog]);
  const runnableMode = useMemo(
    () =>
      recommendedMode && inventoryStatus
        ? pickRunnableMode(recommendedMode, inventoryStatus, dueCards?.length ?? 0)
        : null,
    [recommendedMode, inventoryStatus, dueCards?.length],
  );
  const nextLevel = roadmapData?.roadmap?.nextLevel;

  useEffect(() => {
    if (!unlocked.has(selectedLevel)) {
      setSelectedLevel(currentLevel);
    }
  }, [currentLevel, selectedLevel, unlocked]);

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
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  const hasCatalog = (catalog.missions?.length ?? 0) > 0;

  return (
    <DashboardShell>
      <section className="bg-card rounded-2xl border border-white/10 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Mission Hub</p>
            <h1 className="text-lg font-semibold mt-0.5">Progression Campaign</h1>
            <p className="text-xs text-white/45 mt-1">
              Active level: <span className="text-white/70">{currentLevel}</span>
            </p>
          </div>
          <Flag size={18} className="text-accent-light mt-1" />
        </div>

        {!hasCatalog && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className={cn(
              "w-full rounded-xl px-4 py-2.5 text-sm font-medium border transition",
              "bg-accent/20 text-accent-light border-accent/30",
              seeding && "opacity-60 cursor-not-allowed",
            )}
          >
            {seeding ? "Initializing mission catalog..." : "Initialize mission catalog"}
          </button>
        )}

        {hasCatalog && (
          <div className="grid grid-cols-4 gap-2">
            {LEVELS.map((level) => (
              <div
                key={level}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-center",
                  unlocked.has(level)
                    ? "border-white/15 bg-white/5"
                    : "border-white/10 bg-white/0 opacity-55",
                )}
              >
                <p className="text-xs font-medium">{level}</p>
                <p className="text-[10px] text-white/45">
                  {missionsByLevel[level].filter((m) => progressByMission.get(m.missionId)?.status === "completed").length}/
                  {missionsByLevel[level].length}
                </p>
              </div>
            ))}
          </div>
        )}
        {hasCatalog && (
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-white/10">
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => unlocked.has(level) && setSelectedLevel(level)}
                disabled={!unlocked.has(level)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-center text-xs transition",
                  selectedLevel === level
                    ? "border-accent/40 bg-accent/20 text-accent-light"
                    : unlocked.has(level)
                      ? "border-white/15 bg-white/5 text-white/70 hover:border-white/25"
                      : "border-white/10 bg-white/0 text-white/30 cursor-not-allowed",
                )}
              >
                {level}
              </button>
            ))}
          </div>
        )}
        {activeMissionCatalog && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <p className="text-xs text-white/60">
              Active mission: <span className="text-accent-light">{activeMissionCatalog.title}</span>
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={
                  activeMission && (activeMission.criticalErrorsCount ?? 0) > 0
                    ? "/exercises?focus=recovery"
                    : runnableMode
                        ? `/session/${new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" })}?mode=${runnableMode}`
                        : "/missions"
                }
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-accent/30 bg-accent/20 text-accent-light"
              >
                {(activeMission?.criticalErrorsCount ?? 0) > 0
                  ? "Run recovery session"
                  : runnableMode
                    ? `Continue active mission (${runnableMode === "quick" ? "Bronze" : runnableMode === "standard" ? "Silver" : "Gold"})`
                    : "Preparing next mission content"}
              </Link>
              {runnableMode && (activeMission?.criticalErrorsCount ?? 0) === 0 && (
                <Badge tone="accent" className="text-[11px] py-1">
                  Recommended now: {runnableMode === "quick" ? "Bronze" : runnableMode === "standard" ? "Silver" : "Gold"}
                </Badge>
              )}
              {(activeMission?.criticalErrorsCount ?? 0) > 0 && (
                <span className="text-[11px] text-warn">
                  Blocker: {(activeMission?.criticalErrorsCount ?? 0)} critical errors
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {unlockChecklist && (
        <section className="bg-card rounded-2xl border border-white/10 p-4 space-y-2">
          <h2 className="text-sm font-semibold">Unlock {nextLevel ?? "Next Level"}</h2>
          <p className="text-xs text-white/45">
            Requirements from your {currentLevel} track
          </p>
          <div className="space-y-1 pt-1">
            <p className={cn("text-xs", checklistTone(unlockChecklist.requiredDone >= unlockChecklist.requiredTotal))}>
              {unlockChecklist.requiredDone >= unlockChecklist.requiredTotal ? "✓" : "•"} Required missions ({unlockChecklist.requiredDone}/{unlockChecklist.requiredTotal})
            </p>
            <p className={cn("text-xs", checklistTone(unlockChecklist.completedDone >= unlockChecklist.completedTarget))}>
              {unlockChecklist.completedDone >= unlockChecklist.completedTarget ? "✓" : "•"} Total missions ({unlockChecklist.completedDone}/{unlockChecklist.completedTarget})
            </p>
            <p className={cn("text-xs", checklistTone(unlockChecklist.optionalDone >= unlockChecklist.optionalTarget))}>
              {unlockChecklist.optionalDone >= unlockChecklist.optionalTarget ? "✓" : "•"} Optional missions ({unlockChecklist.optionalDone}/{unlockChecklist.optionalTarget})
            </p>
            <p
              className={cn(
                "text-xs",
                checklistTone(
                  unlockChecklist.currentTier.bronze >= unlockChecklist.sessions.bronze &&
                    unlockChecklist.currentTier.silver >= unlockChecklist.sessions.silver &&
                    unlockChecklist.currentTier.gold >= unlockChecklist.sessions.gold,
                ),
              )}
            >
              {unlockChecklist.currentTier.bronze >= unlockChecklist.sessions.bronze &&
              unlockChecklist.currentTier.silver >= unlockChecklist.sessions.silver &&
              unlockChecklist.currentTier.gold >= unlockChecklist.sessions.gold
                ? "✓"
                : "•"}{" "}
              Level totals (Bronze {Math.min(unlockChecklist.currentTier.bronze, unlockChecklist.sessions.bronze)}/{unlockChecklist.sessions.bronze} · Silver {Math.min(unlockChecklist.currentTier.silver, unlockChecklist.sessions.silver)}/{unlockChecklist.sessions.silver} · Gold {Math.min(unlockChecklist.currentTier.gold, unlockChecklist.sessions.gold)}/{unlockChecklist.sessions.gold})
            </p>
            <p
              className={cn(
                "text-xs",
                checklistTone(
                  unlockChecklist.currentMinutes >= unlockChecklist.sessions.minutes &&
                    unlockChecklist.currentDays >= unlockChecklist.sessions.activeDays,
                ),
              )}
            >
              {unlockChecklist.currentMinutes >= unlockChecklist.sessions.minutes &&
              unlockChecklist.currentDays >= unlockChecklist.sessions.activeDays
                ? "✓"
                : "•"}{" "}
              Time and consistency ({Math.min(unlockChecklist.currentMinutes, unlockChecklist.sessions.minutes)}/{unlockChecklist.sessions.minutes} min · {Math.min(unlockChecklist.currentDays, unlockChecklist.sessions.activeDays)}/{unlockChecklist.sessions.activeDays} days)
            </p>
          </div>
          <div className="pt-1 border-t border-white/10 space-y-1">
            {unlockChecklist.skillChecks.slice(0, 6).map((skill) => (
              <p
                key={skill.skillKey}
                className={cn("text-[11px]", checklistTone(skill.current >= skill.minPoints))}
              >
                {skill.current >= skill.minPoints ? "✓" : "•"} {prettySkill(skill.skillKey)} ({Math.min(skill.current, skill.minPoints)}/{skill.minPoints})
              </p>
            ))}
          </div>
          <Link href="/progress" className="inline-block text-[11px] text-accent-light">
            View full skills and error trends
          </Link>
        </section>
      )}

      {(() => {
        const level = selectedLevel;
        const levelMissions = missionsByLevel[level];
        if (!levelMissions.length) return null;
        const isUnlocked = unlocked.has(level);

        return (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">{level} Missions</h2>
              {!isUnlocked && (
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  <Lock size={11} /> locked
                </span>
              )}
            </div>

            <div className="space-y-2">
              {levelMissions.map((mission) => {
                const progress = progressByMission.get(mission.missionId);
                const status = progress?.status ?? "not_started";
                const isActive = progress?.active ?? false;
                const completed = status === "completed";

                const bronze = progress?.credits?.bronze ?? 0;
                const silver = progress?.credits?.silver ?? 0;
                const gold = progress?.credits?.gold ?? 0;
                const requiredCheckpointTotal = (mission.checkpoints ?? []).filter((cp) => cp.required).length;
                const completedCheckpointCount = (progress?.completedCheckpointIds ?? []).filter((id) =>
                  (mission.checkpoints ?? []).some((cp) => cp.required && cp.id === id),
                ).length;
                const nextCheckpoint = (mission.checkpoints ?? []).find(
                  (cp) => !(progress?.completedCheckpointIds ?? []).includes(cp.id),
                );
                const blockers = [
                  bronze < mission.exerciseTargets.bronzeReviews ? `Bronze ${bronze}/${mission.exerciseTargets.bronzeReviews}` : null,
                  silver < mission.exerciseTargets.silverDrills ? `Silver ${silver}/${mission.exerciseTargets.silverDrills}` : null,
                  gold < mission.exerciseTargets.goldConversations ? `Gold ${gold}/${mission.exerciseTargets.goldConversations}` : null,
                ].filter(Boolean) as string[];

                return (
                  <div
                    key={mission.missionId}
                    className={cn(
                      "rounded-xl border p-3",
                      completed
                        ? "border-success/30 bg-success/10"
                        : isActive
                          ? "border-accent/40 bg-accent/10"
                          : "border-white/10 bg-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] text-white/45">
                          {mission.required ? "Required" : "Optional"} · {missionLevelLabel(mission)}
                        </p>
                        <h3 className="text-sm font-semibold leading-tight mt-0.5">{mission.title}</h3>
                        <p className="text-xs text-white/45 mt-1">{mission.summary}</p>
                      </div>
                      {completed ? (
                        <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <Target size={16} className="text-white/35 flex-shrink-0 mt-0.5" />
                      )}
                    </div>

                    {completed ? (
                      <p className="mt-2 text-[11px] text-success">Mission complete</p>
                    ) : (
                      <div className="mt-2 space-y-1 text-[11px]">
                        {blockers.length > 0 && (
                          <p className="text-white/45">Still needed: {blockers.join(" · ")}</p>
                        )}
                        {requiredCheckpointTotal > 0 && (
                          <p className="text-white/45">
                            Required checkpoints {completedCheckpointCount}/{requiredCheckpointTotal}
                          </p>
                        )}
                      </div>
                    )}
                    {nextCheckpoint && (
                      <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] p-2 space-y-1">
                        <p className="text-[10px] text-white/35 uppercase tracking-wider">Next checkpoint</p>
                        <p className="text-[11px] text-accent-light">
                          {nextCheckpoint.title} (min {nextCheckpoint.minScore}%)
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => activateMission(mission.missionId)}
                        disabled={!isUnlocked || workingMissionId !== null}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
                          isActive
                            ? "border-accent/40 bg-accent/20 text-accent-light"
                            : "border-white/15 bg-white/5 text-white/80",
                          (!isUnlocked || workingMissionId !== null) && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {workingMissionId === mission.missionId ? (
                          <span className="inline-flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> saving
                          </span>
                        ) : isActive ? (
                          "Active"
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <PlayCircle size={12} /> Set active
                          </span>
                        )}
                      </button>
                      <span className="text-[11px] text-white/40">{status.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}
    </DashboardShell>
  );
}
