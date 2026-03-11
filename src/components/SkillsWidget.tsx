"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Target, ChevronRight } from "lucide-react";
import { prettySkillLabel } from "@/lib/labels";
import { computeSkillBandReadiness, describeCurrentBand, describeNextTarget, getSkillBandStatus } from "@/lib/skillBands";
import Link from "next/link";
import type { LearnerLevel, LearnerSkill } from "@/lib/missionTypes";
import { withBasePath } from "@/lib/paths";

/**
 * Compact skills progress widget for the home page.
 * Shows current CEFR-ready skills plus next threshold focus areas.
 */
export default function SkillsWidget() {
  const learner = useQuery(api.missions.getLearnerProgress, {}) as
    | { skills?: LearnerSkill[]; level?: LearnerLevel | null }
    | undefined;

  const analysis = useMemo(() => {
    const skills = learner?.skills ?? [];
    if (skills.length === 0) return null;

    const levels = ["A1", "A2", "B1", "B2"].map((level) => {
      const rows = skills.filter((skill) => describeCurrentBand(skill.skillKey, skill.points) === `${level} secure`);
      return { level, secure: rows.length };
    });

    const focus = [...skills]
      .map((skill) => {
        const status = getSkillBandStatus(skill.skillKey, skill.points);
        const targetBand = status.nextBand ?? status.currentBand ?? "A1";
        const readiness = computeSkillBandReadiness(skill.skillKey, targetBand, {
          points: skill.points,
          proficiency: skill.proficiency ?? 0,
          confidence: skill.confidence ?? 0,
          evidenceCount: skill.evidenceCount ?? 0,
        });
        return {
          skillKey: skill.skillKey,
          label: prettySkillLabel(skill.skillKey) ?? skill.skillKey,
          nextTarget: describeNextTarget(skill.skillKey, skill.points),
          pct: readiness?.readinessScore ?? status.progressToNextPct ?? 100,
          points: skill.points,
          pointsToNext: status.pointsToNext ?? 0,
          readiness,
        };
      })
      .filter((skill) => skill.nextTarget)
      .sort((a, b) => a.pointsToNext - b.pointsToNext || b.points - a.points)
      .slice(0, 3);

    return {
      levels,
      focus,
      currentLevel: learner?.level?.currentLevel ?? "A1",
    };
  }, [learner?.level?.currentLevel, learner?.skills]);

  if (!analysis || learner === undefined) return null;

  return (
    <Link
      href={withBasePath("/progress")}
      className="block bg-card rounded-2xl border border-white/10 p-4 space-y-3 hover:border-accent/30 transition"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-accent-light" />
          <h2 className="text-sm font-medium text-white/60">Skill Bands</h2>
        </div>
        <ChevronRight size={14} className="text-white/20" />
      </div>

      {/* Level progress bars */}
      <div className="space-y-2">
        {analysis.levels.map((lvl) => (
          <div key={lvl.level} className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-white/50 w-8">{lvl.level}</span>
            <span className="text-[10px] text-white/30 flex-1">
              {lvl.secure} skill{lvl.secure === 1 ? "" : "s"} secure
            </span>
            {analysis.currentLevel === lvl.level && (
              <span className="text-[10px] text-accent-light">current</span>
            )}
          </div>
        ))}
      </div>

      {/* Focus skills */}
      {analysis.focus.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Closest Next Targets</p>
          {analysis.focus.map((skill) => (
            <div key={skill.skillKey} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60 flex-1 truncate">{skill.label}</span>
                <span className="text-[10px] text-white/25">{skill.points} pts</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${skill.pct}%` }} />
              </div>
              <p className="text-[10px] text-white/25">
                {skill.readiness ? `${skill.readiness.readinessScore}% readiness · ` : ""}
                {skill.nextTarget}
              </p>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
