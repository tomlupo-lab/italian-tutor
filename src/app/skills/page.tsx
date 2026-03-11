"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Brain, Ear, Languages, MessageSquare, PenSquare, SpellCheck } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DashboardShell } from "@/components/layout/ScreenShell";
import { cn } from "@/lib/cn";
import type { LearnerLevel } from "@/lib/missionTypes";
import { SKILL_FOCUS_META, type SkillFocusKey } from "@/lib/skillPracticeCatalog";

const LEVELS = ["A1", "A2", "B1", "B2"] as const;

const SKILL_OPTIONS = [
  { key: "vocabulary", icon: Languages },
  { key: "grammar", icon: SpellCheck },
  { key: "listening", icon: Ear },
  { key: "reading", icon: Brain },
  { key: "speaking", icon: PenSquare },
  { key: "conversation", icon: MessageSquare },
] as const;

export default function SkillsPage() {
  const learner = useQuery(api.missions.getLearnerProgress, {}) as
    | { level?: LearnerLevel | null }
    | undefined;

  const currentLevel = learner?.level?.currentLevel ?? "A1";
  const [selectedLevel, setSelectedLevel] = useState<string>(currentLevel);
  const [selectedSkill, setSelectedSkill] = useState<SkillFocusKey>("grammar");

  const selectedSkillMeta = SKILL_FOCUS_META[selectedSkill];

  return (
    <DashboardShell contentClassName="gap-6">
      <section className="rounded-2xl border border-white/10 bg-card p-5 space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-accent-light">Build skills</p>
        <h1 className="text-lg font-semibold">Deliberate practice by level and focus</h1>
        <p className="text-sm text-white/45">
          Choose a level and one focus area, then start a targeted drill batch.
        </p>
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-semibold">Choose level</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSelectedLevel(level)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-medium transition",
                selectedLevel === level
                  ? "border-accent/30 bg-accent/20 text-accent-light"
                  : "border-white/10 bg-card text-white/70 hover:bg-white/[0.03]",
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-semibold">Choose focus</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {SKILL_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = option.key === selectedSkill;
            const meta = SKILL_FOCUS_META[option.key];
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedSkill(option.key)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-accent/30 bg-accent/10"
                    : "border-white/10 bg-card hover:bg-white/[0.03]",
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon size={18} className={selected ? "text-accent-light" : "text-white/50"} />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">{meta.label}</p>
                    <p className="text-xs text-white/45">{meta.description}</p>
                    <p className="text-[11px] text-white/35">{meta.coverageNote}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Selection</p>
          <p className="text-sm font-semibold">
            {selectedLevel} • {selectedSkillMeta.label}
          </p>
          <p className="text-[11px] text-white/35 pt-1">{selectedSkillMeta.coverageNote}</p>
        </div>
        <Link
          href={`/drills?focus=skill&level=${selectedLevel}&skill=${selectedSkill}`}
          className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/20 px-4 py-2 text-sm font-medium text-accent-light"
        >
          Start drills
          <ArrowRight size={16} />
        </Link>
      </section>
    </DashboardShell>
  );
}
