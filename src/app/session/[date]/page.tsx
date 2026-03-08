"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useSearchParams } from "next/navigation";
// useRouter removed — Bronze no longer redirects to /practice
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Exercise, ExerciseMode } from "@/lib/exerciseTypes";
import { MODE_TYPES } from "@/lib/exerciseTypes";
import ExerciseFlow from "@/components/exercises/ExerciseFlow";
import ModeSelector from "@/components/ModeSelector";
import { useState } from "react";
import {
  inventoryToExerciseCounts,
  type InventoryStatusResult,
} from "@/lib/inventoryStatus";
// NOTE: /practice page still exists for standalone SRS card-deck review

const MODE_LABELS: Record<ExerciseMode, string> = {
  quick: "Bronze",
  standard: "Silver",
  deep: "Gold",
};

// Map mission topics to card tags for unified Bronze deck
const MISSION_CARD_TAGS: Record<string, string[]> = {
  "a1-flat-hunt-48h": ["home", "casa"],
  "a1-dinner-inlaws": ["food", "cibo-bevande", "ristorante", "famiglia"],
  "a1-last-train": ["travel", "trasporti", "viaggi"],
  "a1-workweek-milan": ["work", "lavoro"],
  "a1-shopping-rush": ["shopping", "fare-la-spesa", "shopping-comparativi"],
  "a1-midnight-pharmacy": ["health", "salute", "dal-dottore", "corpo"],
  "a1-social-circle": ["social", "presentarsi", "emozioni", "emotions"],
  "a1-final-day-test": ["routine", "routine-quotidiana"],
  "a2-roommate-reset": ["home", "casa", "opinioni"],
  "a2-customer-support-call": ["tech", "tecnologia", "bureaucracy"],
  "a2-family-visit-plan": ["famiglia", "fare-piani", "travel"],
  "a2-neighborhood-committee": ["social", "opinioni", "home"],
  "a2-travel-disruption-chain": ["travel", "trasporti", "viaggi"],
  "a2-health-followup": ["health", "salute", "dal-dottore"],
  "a2-final-city-week": ["routine", "routine-quotidiana", "social"],
  "b1-startup-pitch": ["work", "lavoro", "tech", "tecnologia"],
  "b1-housing-negotiation": ["home", "casa", "finance"],
  "b1-media-interview": ["media", "media-notizie", "opinioni"],
  "b1-team-conflict-mediation": ["work", "lavoro", "emotions", "emozioni"],
  "b1-bureaucracy-marathon": ["bureaucracy", "email-formali"],
  "b1-community-event": ["social", "vestiti", "shopping"],
  "b1-final-b2-bridge": ["connettivi", "congiuntivo-presente", "argomentare"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConvexCard = Record<string, any>;

interface ActiveMissionResult {
  missionId: string;
  title: string;
  summary: string;
}

interface LearnerMission {
  missionId: string;
  active: boolean;
  credits: { bronze: number; silver: number; gold: number };
  criticalErrorsCount?: number;
}

interface CatalogMission {
  missionId: string;
  exerciseTargets: { bronzeReviews: number; silverDrills: number; goldConversations: number };
}

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const dateParam = params.date as string;
  const modeParam = searchParams.get("mode") as ExerciseMode | null;

  const [selectedMode, setSelectedMode] = useState<ExerciseMode | null>(
    modeParam,
  );

  const allExercises = useQuery(api.exercises.getByDate, { date: dateParam });
  const dueCards = useQuery(api.cards.getDue, { limit: 200 });
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMissionResult | null | undefined;
  const inventoryStatus = useQuery(
    api.exercises.getInventoryStatus,
    activeMission?.missionId
      ? { date: dateParam, missionId: activeMission.missionId }
      : { date: dateParam },
  ) as InventoryStatusResult | undefined;
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {}) as
    | { missions: LearnerMission[] }
    | undefined;
  const catalog = useQuery(api.missions.listCatalog, {}) as
    | { missions: CatalogMission[] }
    | undefined;

  const inferredTopicTag = useMemo(() => {
    if (!allExercises || allExercises.length === 0) return "";
    const bag: string[] = [];
    for (const ex of allExercises as Exercise[]) {
      if (ex.skillId) bag.push(ex.skillId);
      if (ex.type === "conversation") {
        const c = ex.content as { scenario?: string; target_phrases?: string[] };
        if (c?.scenario) bag.push(c.scenario);
        if (Array.isArray(c?.target_phrases)) bag.push(c.target_phrases.join(" "));
      }
      if (ex.type === "srs") {
        const c = ex.content as { front?: string; back?: string };
        if (c?.front) bag.push(c.front);
        if (c?.back) bag.push(c.back);
      }
    }
    const hay = bag.join(" ").toLowerCase();
    const tagRules: Array<{ tag: string; words: string[] }> = [
      { tag: "home", words: ["casa", "appartamento", "quartiere", "camera", "soggiorno"] },
      { tag: "food", words: ["ristorante", "cibo", "piatto", "mangiare", "cucina"] },
      { tag: "travel", words: ["viaggio", "treno", "vacanza", "hotel", "aeroporto"] },
      { tag: "work", words: ["lavoro", "ufficio", "riunione", "progetto"] },
      { tag: "sport", words: ["sport", "allenamento", "partita", "campione"] },
      { tag: "fitness", words: ["palestra", "allenarsi", "stretching", "benessere"] },
      { tag: "tech", words: ["tecnologia", "software", "codice", "app"] },
      { tag: "routine", words: ["giornata", "mattina", "abitudine", "quotidiana"] },
    ];
    let bestTag = "";
    let bestScore = 0;
    for (const rule of tagRules) {
      const score = rule.words.reduce(
        (acc, w) => (hay.includes(w) ? acc + 1 : acc),
        0,
      );
      if (score > bestScore) {
        bestScore = score;
        bestTag = rule.tag;
      }
    }
    return bestTag;
  }, [allExercises]);

  // Topic-matched due cards for unified Bronze deck
  const topicDueCards = useMemo(() => {
    if (!dueCards || !activeMission?.missionId) return [];
    const missionTags = MISSION_CARD_TAGS[activeMission.missionId] ?? [];
    if (missionTags.length === 0) return [];
    const tagSet = new Set(missionTags);
    return dueCards.filter((c: ConvexCard) => c.tag && tagSet.has(c.tag));
  }, [dueCards, activeMission?.missionId]);

  // Count exercises per type (for mode selector)
  // Bronze = mission SRS exercises + topic-matched due cards
  const exerciseCounts = useMemo(
    () => inventoryToExerciseCounts(inventoryStatus, topicDueCards.length),
    [inventoryStatus, topicDueCards.length],
  );

  // Bronze now uses ExerciseFlow with SRS exercises from exercises table
  // (old card-deck SRS review is available separately from /practice)

  // Filter exercises by mode
  const candidateExercises = useMemo(() => {
    if (!allExercises) return [];
    const missionId = activeMission?.missionId;
    if (!missionId) return allExercises as Exercise[];
    return (allExercises as Exercise[]).filter(
      (ex) => !ex.missionId || ex.missionId === missionId,
    );
  }, [allExercises, activeMission?.missionId]);

  const modeExercises = useMemo(() => {
    if (!selectedMode) return [];
    const allowedTypes = new Set(MODE_TYPES[selectedMode]);
    const missionExercises = candidateExercises
      .filter((ex) => allowedTypes.has(ex.type as Exercise["type"]))
      .sort((a, b) => a.order - b.order);

    // For Bronze: append topic-matched due cards as SRS exercises
    if (selectedMode === "quick" && topicDueCards.length > 0) {
      const cardExercises: Exercise[] = topicDueCards.map((card: ConvexCard, i: number) => ({
        _id: `card-${card._id}`,
        date: dateParam,
        type: "srs" as const,
        order: 900 + i,
        content: { front: card.it, back: card.en },
        difficulty: card.level ?? "A1",
        completed: false,
        source: "card_deck" as const,
        _cardId: card._id,
      }));
      return [...missionExercises, ...cardExercises];
    }

    return missionExercises;
  }, [candidateExercises, selectedMode, topicDueCards, dateParam]);

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
  if (allExercises === undefined || inventoryStatus === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  if ((inventoryStatus.counts.totalReady ?? 0) === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/50">No mission-ready exercises for {dateParam}</p>
        <p className="text-xs text-white/30">
          Marco adds mission-ready practice as your progress, errors, and review queue evolve.
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

  return (
    <main className="min-h-screen flex flex-col max-w-lg mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-card/50 backdrop-blur sticky top-0 z-10">
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

      <div className="px-4 pt-3">
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

      {/* Mode selection or exercise flow */}
      {!selectedMode ? (
        <div className="px-4 py-6">
          <ModeSelector
            exerciseCounts={exerciseCounts}
            onSelect={setSelectedMode}
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
      )}
    </main>
  );
}
