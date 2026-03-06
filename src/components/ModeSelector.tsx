"use client";

import type { ExerciseMode } from "@/lib/exerciseTypes";
import { MODE_TYPES } from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { Trophy, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";

interface ModeSelectorProps {
  exerciseCounts: Record<string, number>;
  onSelect: (mode: ExerciseMode) => void;
  suggested?: ExerciseMode;
  date?: string;
  /** Total session completions per mode (e.g. { quick: 5, standard: 3, deep: 1 }) */
  sessionCounts?: Record<string, number>;
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
  return raw ? JSON.parse(raw) : {};
}

function getTierScore(date: string, mode: string): TierScore | null {
  const data = loadTierScores();
  return data[date]?.[mode] ?? null;
}

const MODES: {
  mode: ExerciseMode;
  label: string;
  emoji: string;
  duration: string;
  description: string;
  color: string;
}[] = [
  {
    mode: "quick",
    label: "Bronze",
    emoji: "🥉",
    duration: "~5 min",
    description: "SRS flashcard review",
    color: "from-amber-700/20 to-amber-800/5 border-amber-600/30",
  },
  {
    mode: "standard",
    label: "Silver",
    emoji: "🥈",
    duration: "~10 min",
    description: "Cloze, drills, translation, error hunt",
    color: "from-slate-400/20 to-slate-500/5 border-slate-400/30",
  },
  {
    mode: "deep",
    label: "Gold",
    emoji: "🥇",
    duration: "~15 min",
    description: "Conversation with Marco + reflection",
    color: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30",
  },
];

export default function ModeSelector({
  exerciseCounts,
  onSelect,
  date,
  sessionCounts,
}: ModeSelectorProps) {
  const [scores, setScores] = useState<Record<string, TierScore | null>>({});
  const scoreDate = date ?? new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

  useEffect(() => {
    setScores({
      quick: getTierScore(scoreDate, "quick"),
      standard: getTierScore(scoreDate, "standard"),
      deep: getTierScore(scoreDate, "deep"),
    });
  }, [scoreDate]);

  const completedCount = Object.values(scores).filter(s => s?.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-white/50">Choose your level</h2>
        {completedCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">
            {completedCount}/3 complete
          </span>
        )}
      </div>
      <div className="space-y-2">
        {MODES.map(({ mode, label, emoji, duration, description, color }) => {
          const types = MODE_TYPES[mode];
          const count = types.reduce((sum, t) => sum + (exerciseCounts[t] ?? 0), 0);
          const score = scores[mode];
          const isCompleted = score?.completed ?? false;

          return (
            <button
              key={mode}
              onClick={() => onSelect(mode)}
              disabled={count === 0}
              className={cn(
                "w-full text-left rounded-2xl border p-4 transition active:scale-[0.98]",
                `bg-gradient-to-br ${color}`,
                count === 0 && "opacity-40 cursor-not-allowed",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">{emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{label}</span>
                    <span className="text-xs text-white/40">{duration}</span>
                    {isCompleted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/20 text-success">
                        ✓ Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{description}</p>
                  {score && score.bestScore > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Trophy size={10} className="text-yellow-400" />
                      <span className="text-xs text-yellow-400/80">Best: {score.bestScore}%</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm text-white/40 tabular-nums">{count} ex</span>
                  {isCompleted && <RotateCcw size={12} className="text-white/20" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
