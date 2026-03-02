"use client";

import { cn } from "@/lib/cn";

interface MilestoneBarProps {
  name: string;
  rating: number; // 0-4
  level: string;
}

const RATING_COLORS = [
  "bg-danger",     // 0
  "bg-warn",       // 1
  "bg-yellow-400", // 2
  "bg-accent",     // 3
  "bg-success",    // 4
];

export default function MilestoneBar({ name, rating, level }: MilestoneBarProps) {
  const pct = (rating / 4) * 100;
  const color = RATING_COLORS[Math.min(Math.round(rating), 4)];

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs truncate">{name}</span>
          <span className="text-[10px] text-white/30">{level}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-white/40 tabular-nums w-6 text-right">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
