"use client";

import type { ExerciseMode } from "@/lib/exerciseTypes";
import { MODE_TYPES, normalizeExerciseMode } from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import Badge from "@/components/Badge";
import { Trophy, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";

interface ModeSelectorProps {
  exerciseCounts: Record<string, number>;
  onSelect: (mode: ExerciseMode) => void;
  suggested?: ExerciseMode;
  date?: string;
  enabledModes?: ExerciseMode[];
}

// Local storage for tier completion tracking
const TIER_KEY = "italian-tutor-tier-scores";

interface TierScore {
  completed: boolean;
  bestScore: number;
  lastCompleted?: string;
}

function loadTierScores(): Record<string, Record<string, TierScore>> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(TIER_KEY);
  const parsed = raw ? JSON.parse(raw) : {};
  for (const date of Object.keys(parsed)) {
    const entry = parsed[date] ?? {};
    for (const key of Object.keys(entry)) {
      const normalized = normalizeExerciseMode(key);
      if (normalized && normalized !== key) {
        entry[normalized] = entry[normalized] ?? entry[key];
      }
    }
  }
  return parsed;
}

function getTierScore(date: string, mode: string): TierScore | null {
  const data = loadTierScores();
  const normalized = normalizeExerciseMode(mode) ?? mode;
  return data[date]?.[normalized] ?? data[date]?.[mode] ?? null;
}

const MODES: {
  mode: ExerciseMode;
  label: string;
  emoji: string;
  duration: string;
  description: string;
  color: string;
  emptyHint: string;
}[] = [
  {
    mode: "bronze",
    label: "Bronze",
    emoji: "🥉",
    duration: "~5 min",
    description: "SRS flashcard review",
    color: "from-amber-700/20 to-amber-800/5 border-amber-600/30",
    emptyHint: "No due cards or Bronze reviews yet",
  },
  {
    mode: "silver",
    label: "Silver",
    emoji: "🥈",
    duration: "~10 min",
    description: "Cloze, drills, translation, error hunt",
    color: "from-slate-400/20 to-slate-500/5 border-slate-400/30",
    emptyHint: "Complete lessons or recovery work to unlock drills",
  },
  {
    mode: "gold",
    label: "Gold",
    emoji: "🥇",
    duration: "~15 min",
    description: "Conversation with Marco",
    color: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30",
    emptyHint: "Conversation opens when Marco has a live scenario ready",
  },
];

export default function ModeSelector({
  exerciseCounts,
  onSelect,
  suggested,
  date,
  enabledModes,
}: ModeSelectorProps) {
  const [scores, setScores] = useState<Record<string, TierScore | null>>({});
  const scoreDate = date ?? new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

  useEffect(() => {
    setScores({
      bronze: getTierScore(scoreDate, "bronze"),
      silver: getTierScore(scoreDate, "silver"),
      gold: getTierScore(scoreDate, "gold"),
    });
  }, [scoreDate]);

  const completedCount = Object.values(scores).filter(s => s?.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-white/50">Choose your tier</h2>
        {completedCount > 0 && (
          <Badge tone="success" className="text-xs">
            {completedCount}/3 complete
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        {MODES.map(({ mode, label, emoji, duration, description, color, emptyHint }) => {
          const types = MODE_TYPES[mode];
          const count = types.reduce((sum, t) => sum + (exerciseCounts[t] ?? 0), 0);
          const score = scores[mode];
          const isCompleted = score?.completed ?? false;
          const unavailable = enabledModes ? !enabledModes.includes(mode) : count === 0;
          const isSuggested = suggested === mode && !unavailable;

          return (
            <button
              key={mode}
              onClick={() => onSelect(mode)}
              disabled={unavailable}
              className={cn(
                "w-full text-left rounded-2xl border p-4 transition active:scale-[0.98]",
                `bg-gradient-to-br ${color}`,
                isSuggested && "ring-1 ring-accent/50 border-accent/40",
                unavailable && "opacity-50 cursor-not-allowed",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">{emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{label}</span>
                    <span className="text-xs text-white/40">{duration}</span>
                    {isSuggested && (
                      <Badge tone="accent" className="px-1.5 border-0">Recommended</Badge>
                    )}
                    {isCompleted && (
                      <Badge tone="success" className="px-1.5 border-0">✓ Done</Badge>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {unavailable ? emptyHint : description}
                  </p>
                  {score && score.bestScore > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Trophy size={10} className="text-yellow-400" />
                      <span className="text-xs text-yellow-400/80">Best: {score.bestScore}%</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm text-white/40 tabular-nums">
                    {unavailable ? "Unavailable" : count > 0 ? `${count} ready` : "Replay"}
                  </span>
                  {isCompleted ? <RotateCcw size={12} className="text-white/20" /> : isSuggested ? <span className="text-[10px] text-accent-light">Best next</span> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
