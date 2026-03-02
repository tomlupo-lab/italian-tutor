"use client";

import type { ExerciseMode } from "@/lib/exerciseTypes";
import { MODE_TYPES } from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { Zap, Monitor, Brain } from "lucide-react";

interface ModeSelectorProps {
  /** Number of exercises available per type (from Convex exercises.getByDate) */
  exerciseCounts: Record<string, number>;
  onSelect: (mode: ExerciseMode) => void;
  /** Suggested mode based on time of day */
  suggested?: ExerciseMode;
}

const MODES: {
  mode: ExerciseMode;
  label: string;
  duration: string;
  icon: typeof Zap;
  description: string;
  color: string;
}[] = [
  {
    mode: "quick",
    label: "Quick",
    duration: "5 min",
    icon: Zap,
    description: "SRS, cloze, vocab drills",
    color: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30",
  },
  {
    mode: "standard",
    label: "Standard",
    duration: "10-15 min",
    icon: Monitor,
    description: "Full exercises + conversation",
    color: "from-accent/20 to-accent/5 border-accent/30",
  },
  {
    mode: "deep",
    label: "Deep",
    duration: "15-20 min",
    icon: Brain,
    description: "Everything + reflection",
    color: "from-purple-500/20 to-purple-600/5 border-purple-500/30",
  },
];

function getSuggestedMode(): ExerciseMode {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "standard";
  if (hour >= 12 && hour < 18) return "standard";
  return "quick"; // evenings
}

export default function ModeSelector({
  exerciseCounts,
  onSelect,
  suggested,
}: ModeSelectorProps) {
  const suggestedMode = suggested ?? getSuggestedMode();

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-white/50 px-1">
        Choose your session
      </h2>
      <div className="space-y-2">
        {MODES.map(({ mode, label, duration, icon: Icon, description, color }) => {
          const types = MODE_TYPES[mode];
          const count = types.reduce(
            (sum, t) => sum + (exerciseCounts[t] ?? 0),
            0,
          );
          const isSuggested = mode === suggestedMode;

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
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{label}</span>
                    <span className="text-xs text-white/40">{duration}</span>
                    {isSuggested && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
                        Suggested
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{description}</p>
                </div>
                <span className="text-sm text-white/40 tabular-nums flex-shrink-0">
                  {count} ex
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
