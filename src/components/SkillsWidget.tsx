"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import Link from "next/link";

interface Milestone {
  skillId: string;
  name: string;
  level: string;
  category: string;
  rating: number;
  active: boolean;
}

const RATING_COLORS = [
  "bg-white/10",   // 0
  "bg-warn",       // 1
  "bg-yellow-400", // 2
  "bg-accent",     // 3
  "bg-success",    // 4
];

/**
 * Compact skills progress widget for the home page.
 * Shows A2 mastery bar + top 3 weakest skills.
 */
export default function SkillsWidget() {
  const milestones = useQuery(api.milestones.getAll) as Milestone[] | undefined;

  const analysis = useMemo(() => {
    if (!milestones) return null;
    const active = milestones.filter((m) => m.active);
    if (active.length === 0) return null;

    // A2 mastery
    const a2 = active.filter((m) => m.level === "A2");
    const a2Mastered = a2.filter((m) => m.rating >= 2).length;

    // Overall progress per level
    const levels = ["A1", "A2", "B1"].map((level) => {
      const skills = active.filter((m) => m.level === level);
      if (!skills.length) return null;
      const avg = skills.reduce((s, m) => s + m.rating, 0) / skills.length;
      const mastered = skills.filter((m) => m.rating >= 3).length;
      return { level, total: skills.length, avg: Math.round(avg * 10) / 10, mastered, pct: Math.round((mastered / skills.length) * 100) };
    }).filter(Boolean);

    // Top 3 weakest active skills (lowest non-zero first, then zeros)
    const weakest = [...active]
      .sort((a, b) => {
        // Prioritize skills with some rating (being worked on) over untouched
        if (a.rating > 0 && b.rating === 0) return -1;
        if (a.rating === 0 && b.rating > 0) return 1;
        return a.rating - b.rating;
      })
      .slice(0, 3);

    return {
      a2Mastered,
      a2Total: a2.length,
      a2Pct: a2.length > 0 ? Math.round((a2Mastered / a2.length) * 100) : 0,
      levels,
      weakest,
      totalActive: active.length,
    };
  }, [milestones]);

  if (!analysis || milestones === undefined) return null;

  return (
    <Link
      href="/progress"
      className="block bg-card rounded-2xl border border-white/10 p-4 space-y-3 hover:border-accent/30 transition"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-accent-light" />
          <h2 className="text-sm font-medium text-white/60">Skills Progress</h2>
        </div>
        <ChevronRight size={14} className="text-white/20" />
      </div>

      {/* Level progress bars */}
      <div className="space-y-2">
        {analysis.levels.map((lvl) =>
          lvl ? (
            <div key={lvl.level} className="flex items-center gap-3">
              <span className="text-xs font-medium text-white/50 w-6">{lvl.level}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(lvl.pct, lvl.avg > 0 ? 5 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-white/30 w-10 text-right">
                {lvl.mastered}/{lvl.total}
              </span>
            </div>
          ) : null,
        )}
      </div>

      {/* Weakest skills */}
      {analysis.weakest.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Focus areas</p>
          {analysis.weakest.map((skill) => {
            const color = RATING_COLORS[Math.min(Math.round(skill.rating), 4)];
            return (
              <div key={skill.skillId} className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", color)} />
                <span className="text-xs text-white/60 flex-1 truncate">{skill.name}</span>
                <span className="text-[10px] text-white/25">{skill.level}</span>
              </div>
            );
          })}
        </div>
      )}
    </Link>
  );
}
