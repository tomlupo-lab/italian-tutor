"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Exercise, ExerciseMode } from "@/lib/exerciseTypes";
import { MODE_TYPES } from "@/lib/exerciseTypes";
import ExerciseFlow from "@/components/exercises/ExerciseFlow";
import ModeSelector from "@/components/ModeSelector";
import { MissionShell, StudyShell } from "@/components/layout/ScreenShell";
import { useState } from "react";
import {
  inventoryToExerciseCounts,
  type InventoryStatusResult,
} from "@/lib/inventoryStatus";
import type {
  ActiveMissionResult,
  CatalogMission,
  LearnerMission,
} from "@/lib/missionTypes";

const MODE_LABELS: Record<ExerciseMode, string> = {
  quick: "Bronze",
  standard: "Silver",
  deep: "Gold",
};

interface DueCard {
  _id: string;
  it: string;
  en: string;
  level?: string;
  tag?: string;
  example?: string;
}

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const dateParam = params.date as string;
  const modeParam = searchParams.get("mode") as ExerciseMode | null;

  const [selectedMode, setSelectedMode] = useState<ExerciseMode | null>(
    modeParam,
  );

  const dueCards = useQuery(api.cards.getDue, { limit: 200 });
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMissionResult | null | undefined;
  const missionExercises = useQuery(
    api.exercises.getByMission,
    activeMission?.missionId ? { missionId: activeMission.missionId } : "skip",
  ) as Exercise[] | undefined;
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
  const dueCardsCount = dueCards?.length ?? 0;
  const isQuickMode = selectedMode === "quick";

  // Count exercises per type (for mode selector)
  const exerciseCounts = useMemo(
    () => inventoryToExerciseCounts(inventoryStatus, dueCardsCount),
    [inventoryStatus, dueCardsCount],
  );

  const candidateExercises = useMemo(() => {
    return missionExercises ?? [];
  }, [missionExercises]);

  const enabledModes = useMemo(() => {
    const available = new Set<ExerciseMode>();
    const missionTypes = new Set(candidateExercises.map((ex) => ex.type));

    if (missionTypes.has("srs") || dueCardsCount > 0) available.add("quick");
    if (
      missionTypes.has("cloze") ||
      missionTypes.has("word_builder") ||
      missionTypes.has("pattern_drill") ||
      missionTypes.has("speed_translation") ||
      missionTypes.has("error_hunt")
    ) {
      available.add("standard");
    }
    if (missionTypes.has("conversation") || missionTypes.has("reflection")) {
      available.add("deep");
    }

    return Array.from(available);
  }, [candidateExercises, dueCardsCount]);

  const activeMissionCatalog = useMemo(() => {
    if (!activeMission?.missionId) return null;
    return catalog?.missions?.find((m) => m.missionId === activeMission.missionId) ?? null;
  }, [activeMission?.missionId, catalog?.missions]);

  const modeExercises = useMemo(() => {
    if (!selectedMode) return [];
    const allowedTypes = new Set(MODE_TYPES[selectedMode]);
    const missionExercises = candidateExercises
      .filter((ex) => allowedTypes.has(ex.type as Exercise["type"]))
      .map((ex) => {
        if (ex.type !== "srs") return ex;
        const content = ex.content as unknown as {
          front?: string;
          back?: string;
          tag?: string;
          level?: string;
          example?: string;
        };
        return {
          ...ex,
          content: {
            front: content.front ?? "",
            back: content.back ?? "",
            ...content,
            tag: typeof content.tag === "string" ? content.tag : activeMissionCatalog?.tags?.[0],
            level:
              typeof content.level === "string"
                ? content.level
                : ex.difficulty ?? activeMissionCatalog?.level,
            example:
              typeof content.example === "string"
                ? content.example
                : typeof content.front === "string"
                  ? content.front
                  : undefined,
          },
        };
      })
      .sort((a, b) => a.order - b.order);

    if (selectedMode === "quick") {
      const QUICK_SESSION_LIMIT = 15;
      const quickExercises: Exercise[] = [];
      quickExercises.push(...missionExercises.slice(0, QUICK_SESSION_LIMIT));
      let used = quickExercises.length;
      if (used < QUICK_SESSION_LIMIT && dueCards && dueCards.length > 0) {
        const cardsToTake = Math.min(QUICK_SESSION_LIMIT - used, dueCards.length);
        for (let i = 0; i < cardsToTake; i++) {
          const card = (dueCards as DueCard[])[i];
          quickExercises.push({
            _id: `card-${card._id as string}`,
            date: dateParam,
            type: "srs" as Exercise["type"],
            order: 900 + i,
            content: {
              front: card.it,
              back: card.en,
              tag: card.tag,
              level: card.level,
              example: card.example,
            },
            difficulty: card.level ?? "A1",
            completed: false,
            source: "seed" as Exercise["source"],
          });
        }
      }
      return quickExercises;
    }

    return missionExercises;
  }, [candidateExercises, selectedMode, dueCards, dateParam, activeMissionCatalog]);

  const activeProgress = useMemo(() => {
    const active = learnerProgress?.missions?.find((m) => m.active);
    if (!active) return null;
    const mission = catalog?.missions?.find((m) => m.missionId === active.missionId);
    if (!mission) return null;
    return {
      bronze: `${active.credits?.bronze ?? 0}/${mission.exerciseTargets.bronzeReviews}`,
      silver: `${active.credits?.silver ?? 0}/${mission.exerciseTargets.silverDrills}`,
      gold: `${active.credits?.gold ?? 0}/${mission.exerciseTargets.goldConversations}`,
      blocker: (active.criticalErrorsCount ?? 0) > 0,
    };
  }, [learnerProgress?.missions, catalog?.missions]);

  // Loading
  if (activeMission?.missionId && (missionExercises === undefined || inventoryStatus === undefined)) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  if (!activeMission?.missionId || enabledModes.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/50">No mission exercises are available right now</p>
        <p className="text-xs text-white/30">
          Marco will unlock mission practice as inventory is generated for your active mission.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-accent rounded-xl text-sm hover:bg-accent/80 transition"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  const header = (
    <div
      className={[
        "flex items-center gap-3 px-4 py-3 sticky top-0 z-10",
        isQuickMode
          ? "bg-background/90 backdrop-blur"
          : "border-b border-white/5 bg-card/50 backdrop-blur",
      ].join(" ")}
    >
      <Link
        href="/"
        className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition text-white/50 hover:text-white"
      >
        <ArrowLeft size={20} />
      </Link>
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold">
          {selectedMode
            ? `${MODE_LABELS[selectedMode]} Session`
            : "Choose Tier"}
        </h1>
        <p className="text-xs text-white/30">{dateParam}</p>
      </div>
      {selectedMode && (
        <button
          onClick={() => setSelectedMode(null)}
          className="text-xs text-white/40 hover:text-white/60 transition"
        >
          Change tier
        </button>
      )}
    </div>
  );

  const sessionBody = !selectedMode ? (
    <div className={isQuickMode ? "w-full" : "pt-6"}>
      <ModeSelector
        exerciseCounts={exerciseCounts}
        onSelect={setSelectedMode}
        enabledModes={enabledModes}
      />
    </div>
  ) : modeExercises.length === 0 ? (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-white/50">
        No {MODE_LABELS[selectedMode]} exercises available
      </p>
      <button
        onClick={() => setSelectedMode(null)}
        className="px-4 py-2 bg-card rounded-xl border border-white/10 text-sm"
      >
        Choose different tier
      </button>
    </div>
  ) : (
    <ExerciseFlow
      exercises={modeExercises}
      mode={selectedMode}
      date={dateParam}
    />
  );

  if (isQuickMode) {
    return (
      <StudyShell header={header} contentClassName="py-2 flex-1">
        {sessionBody}
      </StudyShell>
    );
  }

  return (
    <MissionShell header={header} contentClassName="py-0 flex-1">
      <div className="pt-3">
        <div className="rounded-xl border border-white/10 bg-card/40 p-3">
          <p className="text-[10px] text-accent-light uppercase tracking-wider">Active Mission</p>
          <p className="text-sm font-medium mt-0.5">{activeMission?.title ?? "No mission selected"}</p>
          <p className="text-xs text-white/45 mt-1">
            {activeMission?.summary ??
              "Use this session to push mission progress. Marco will adapt future content from your results and errors."}
          </p>
          {activeProgress && (
            <p className="text-[11px] text-white/40 mt-2">
              Bronze {activeProgress.bronze} · Silver {activeProgress.silver} · Gold {activeProgress.gold}
              {activeProgress.blocker ? " · Recovery recommended" : ""}
            </p>
          )}
        </div>
      </div>
      {sessionBody}
    </MissionShell>
  );
}
