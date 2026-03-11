"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Compass,
  MessageSquareQuote,
  Route,
  Sparkles,
  TimerReset,
  Type,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DashboardShell } from "@/components/layout/ScreenShell";
import { cn } from "@/lib/cn";
import { withBasePath } from "@/lib/paths";
import type { LearnerLevel } from "@/lib/missionTypes";
import { PATTERN_FOCUS_CONFIG, type PatternFocusKey } from "@/lib/patternFocus";

const LEVELS = ["A1", "A2", "B1", "B2"] as const;

const PATTERN_OPTIONS = [
  { key: "requests_and_needs", icon: Type },
  { key: "movement_and_location", icon: Compass },
  { key: "past_events", icon: TimerReset },
  { key: "preferences_and_opinions", icon: Sparkles },
  { key: "plans_and_reasons", icon: Route },
  { key: "conversation_repair", icon: MessageSquareQuote },
] as const satisfies ReadonlyArray<{ key: PatternFocusKey; icon: unknown }>;

export default function PatternsPage() {
  const learner = useQuery(api.missions.getLearnerProgress, {}) as
    | { level?: LearnerLevel | null }
    | undefined;

  const currentLevel = learner?.level?.currentLevel ?? "A1";
  const [selectedLevel, setSelectedLevel] = useState<string>(currentLevel);
  const [selectedPattern, setSelectedPattern] = useState<PatternFocusKey>("requests_and_needs");

  const selectedPatternMeta = PATTERN_FOCUS_CONFIG[selectedPattern];

  return (
    <DashboardShell contentClassName="gap-6">
      <section className="rounded-2xl border border-white/10 bg-card p-5 space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-accent-light">Learn patterns</p>
        <h1 className="text-lg font-semibold">Choose the pattern lane to train next</h1>
        <p className="text-sm text-white/45">
          Build reusable Italian with one focused lane, then carry it into drills and missions.
        </p>
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-semibold">Level</h2>
          <p className="mt-1 text-xs text-white/40">
            Start from your current level, then adjust only if you want easier review or harder stretch work.
          </p>
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
          <h2 className="text-sm font-semibold">Choose a pattern lane</h2>
          <p className="mt-1 text-xs text-white/40">
            Pick one reusable language family and train it across a few short formats.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {PATTERN_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = option.key === selectedPattern;
            const meta = PATTERN_FOCUS_CONFIG[option.key];
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedPattern(option.key)}
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
                    <p className="text-[11px] text-white/35">You will train with {meta.preview}.</p>
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
            {selectedLevel} • {selectedPatternMeta.label}
          </p>
          <p className="pt-1 text-[11px] text-white/35">{selectedPatternMeta.coverageNote}</p>
          <p className="text-[11px] text-white/35">
            5 drills • {selectedLevel} • {selectedPatternMeta.preview}
          </p>
          <p className="text-[11px] text-white/35">
            Examples: {selectedPatternMeta.examples.slice(0, 2).join(" • ")}
          </p>
        </div>
        <Link
          href={withBasePath(`/drills?focus=pattern&level=${selectedLevel}&pattern=${selectedPattern}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/20 px-4 py-2 text-sm font-medium text-accent-light"
        >
          Start pattern practice
          <ArrowRight size={16} />
        </Link>
      </section>
    </DashboardShell>
  );
}
