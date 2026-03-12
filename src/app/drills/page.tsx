"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ExerciseRenderer from "@/components/exercises/ExerciseRenderer";
import ExerciseErrorBoundary from "@/components/exercises/ExerciseErrorBoundary";
import type { Exercise, ExerciseResult } from "@/lib/exerciseTypes";
import { Loader2, RefreshCw, Target, Shuffle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { withBasePath } from "@/lib/paths";
import { prettySkillLabel } from "@/lib/labels";
import {
  normalizePatternPracticeLevel,
  PATTERN_FOCUS_CONFIG,
  type PatternFocusKey,
} from "@/lib/patternFocus";
import { getTodayWarsaw } from "@/lib/date";
import { buildRecoveryCard, recoveryLevelForExercise, recoveryTagForExercise } from "@/lib/recoveryCards";
import Link from "next/link";

type PracticeMode = "errors" | "random" | "typed" | "pattern";

type AnyCard = Record<string, unknown>;

const DRILL_TYPES: { type: string; label: string; emoji: string; description: string }[] = [
  { type: "cloze", label: "Fill-in-blank", emoji: "📝", description: "Fill in the missing word" },
  { type: "word_builder", label: "Word builder", emoji: "🧩", description: "Rebuild useful Italian phrases" },
  { type: "pattern_drill", label: "Pattern drill", emoji: "🔄", description: "Repeat a grammar pattern" },
  { type: "speed_translation", label: "Translation", emoji: "⚡", description: "Respond quickly under time pressure" },
  { type: "error_hunt", label: "Error hunt", emoji: "🔍", description: "Spot and fix mistakes" },
];

function getGenerationCopy(
  mode: PracticeMode | null,
  selectedType: string | null,
  patternFocus: { pattern: PatternFocusKey; level: string } | null,
) {
  if (mode === "pattern" && patternFocus) {
    return {
      title: "Generating drills",
      detail: `AI is building a fresh ${PATTERN_FOCUS_CONFIG[patternFocus.pattern]?.label ?? "pattern"} batch for ${patternFocus.level}.`,
    };
  }
  if (mode === "errors") {
    return {
      title: "Preparing recovery practice",
      detail: "AI is turning your recent mistakes into a focused drill set.",
    };
  }
  if (mode === "typed" && selectedType) {
    const drill = DRILL_TYPES.find((entry) => entry.type === selectedType);
    return {
      title: "Generating drills",
      detail: `AI is preparing a fresh ${drill?.label ?? "drill"} batch.`,
    };
  }
  return {
    title: "Generating drills",
    detail: "AI is building a fresh mixed drill set for you.",
  };
}

export default function DrillsPage() {
  const today = getTodayWarsaw();
  const [mode, setMode] = useState<PracticeMode | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [recoveryFocus, setRecoveryFocus] = useState(false);
  const [patternFocus, setPatternFocus] = useState<{ pattern: PatternFocusKey; level: string } | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Map<string, ExerciseResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allCards = useQuery(api.cards.getAll);
  const learnerState = useQuery(api.learnerState.getSnapshot, {});
  const currentLevel = learnerState?.level?.currentLevel ?? "A1";
  const practiceExercises = useQuery(
    api.exercises.getForPractice,
    selectedType ? { limit: 5, types: [selectedType], level: currentLevel } : { limit: 5, level: currentLevel },
  );
  const bulkAddCards = useMutation(api.cards.bulkAdd);
  const generatePracticeSet = useMutation(api.exercises.generatePracticeSet);

  const recentErrors = useMemo(() => {
    if (!allCards) return [];
    return (allCards as AnyCard[])
      .filter((card) => card.source === "recovery")
      .sort((a, b) => Number(b._creationTime ?? 0) - Number(a._creationTime ?? 0))
      .slice(0, 10);
  }, [allCards]);

  const activeSkillBlockers = useMemo(() => {
    return learnerState?.adaptiveFocus?.blockers ?? [];
  }, [learnerState?.adaptiveFocus?.blockers]);

  const startPractice = useCallback(
    async (selectedMode: PracticeMode, typeFilter?: string) => {
      setCurrent(0);
      setResults(new Map());
      setDone(false);
      setError(null);
      setMode(selectedMode);

      if (selectedMode === "random" || selectedMode === "typed") {
        setSelectedType(typeFilter ?? null);
        if (!typeFilter && practiceExercises && practiceExercises.length > 0) {
          setExercises(practiceExercises as Exercise[]);
        } else if (typeFilter) {
          setLoading(true);
        } else {
          setError("No exercises available for this type. Try another.");
        }
        return;
      }

      setLoading(true);
      try {
        const data = await generatePracticeSet({
          count: 5,
          level: currentLevel,
          types: ["cloze", "pattern_drill", "speed_translation"],
          tags: recentErrors
            .map((card) => (typeof card.tag === "string" ? card.tag : null))
            .filter((tag): tag is string => Boolean(tag)),
          errorFocus: recentErrors
            .map((card) => (typeof card.errorCategory === "string" ? card.errorCategory : null))
            .filter((focus): focus is string => Boolean(focus)),
        });
        setExercises(data as Exercise[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate");
        setMode(null);
      } finally {
        setLoading(false);
      }
    },
    [currentLevel, generatePracticeSet, practiceExercises, recentErrors],
  );

  const startPatternPractice = useCallback(async (pattern: PatternFocusKey, level: string) => {
    const config = PATTERN_FOCUS_CONFIG[pattern];
    if (!config) {
      setError("Unknown pattern focus");
      return;
    }

    setCurrent(0);
    setResults(new Map());
    setDone(false);
    setError(null);
    setMode("pattern");
    setPatternFocus({ pattern, level });

    setLoading(true);
    try {
        const data = await generatePracticeSet({
          count: 5,
          level,
          types: config.types,
          patternFocus: pattern,
          tags: config.tags,
          errorFocus: config.errorFocus,
          includeSrs: config.includeSrs ?? false,
        });
        setExercises(data as Exercise[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
      setMode(null);
      setPatternFocus(null);
    } finally {
      setLoading(false);
    }
  }, [generatePracticeSet]);

  const prevPracticeRef = useRef(practiceExercises);
  useEffect(() => {
    if (!loading || mode !== "typed" || !practiceExercises) return;
    if (practiceExercises === prevPracticeRef.current) return;

    prevPracticeRef.current = practiceExercises;
    if (practiceExercises.length > 0) {
      setExercises(practiceExercises as Exercise[]);
      setLoading(false);
      setError(null);
      return;
    }

    setError("No exercises available for this type. Try another.");
    setLoading(false);
    setMode(null);
  }, [loading, mode, practiceExercises]);

  const currentExercise = exercises[current] ?? null;
  const progress = exercises.length > 0 ? (current / exercises.length) * 100 : 0;

  const handleComplete = useCallback((result: ExerciseResult) => {
    if (!currentExercise) return;

    setResults((prev) => {
      const next = new Map(prev);
      next.set(currentExercise._id, result);
      return next;
    });

    if (current + 1 >= exercises.length) {
      setDone(true);
      const wrongCards: Array<ReturnType<typeof buildRecoveryCard>> = [];
      const allResults = new Map(results);
      allResults.set(currentExercise._id, result);

      for (const [id, entry] of allResults) {
        const exercise = exercises.find((item) => item._id === id);
        if (!exercise) continue;

        if ("correct" in entry && !entry.correct) {
          const content = exercise.content as Record<string, unknown>;
          const sentence = typeof content.sentence === "string" ? content.sentence : null;
          const options = Array.isArray(content.options) ? (content.options as string[]) : null;
          const correctIdx = typeof content.correct === "number" ? content.correct : null;
            if (sentence && options && correctIdx !== null && options[correctIdx]) {
            wrongCards.push(
              buildRecoveryCard({
                it: sentence.split("___").join(options[correctIdx]),
                prompt: sentence,
                example: sentence,
                explanation: `Use ${options[correctIdx]} to complete the sentence correctly.`,
                tag: recoveryTagForExercise(exercise),
                level: recoveryLevelForExercise(exercise),
                phase: exercise.phase,
                patternId: exercise.patternId,
                domain: exercise.domain,
                skillId: exercise.skillId,
                errorCategory: exercise.type,
              }),
            );
          }
        }

        if ("scores" in entry && Array.isArray(entry.scores)) {
          entry.scores.forEach((score, index) => {
            if (score) return;
            const content = exercise.content as Record<string, unknown>;
            const sentences = Array.isArray(content.sentences) ? content.sentences : [];
            const sentence = sentences[index] as Record<string, unknown> | undefined;
            const options = sentence && Array.isArray(sentence.options) ? (sentence.options as string[]) : null;
            const correctIdx = sentence && typeof sentence.correct === "number" ? sentence.correct : null;
            if (options && correctIdx !== null && options[correctIdx]) {
              wrongCards.push(
                buildRecoveryCard({
                  it: options[correctIdx],
                  en: typeof sentence?.source === "string" ? sentence.source : "Practice exercise",
                  prompt: typeof sentence?.source === "string" ? sentence.source : undefined,
                  example: options[correctIdx],
                  tag: recoveryTagForExercise(exercise),
                  level: recoveryLevelForExercise(exercise),
                  phase: exercise.phase,
                  patternId: exercise.patternId,
                  domain: exercise.domain,
                  skillId: exercise.skillId,
                  errorCategory: exercise.type,
                }),
              );
            }
          });
        }
      }

      if (wrongCards.length > 0) {
        bulkAddCards({ cards: wrongCards }).catch(() => {});
      }
    } else {
      setCurrent((value) => value + 1);
    }
  }, [bulkAddCards, current, currentExercise, exercises, results]);

  const handleSkip = useCallback(() => {
    if (current + 1 >= exercises.length) {
      setDone(true);
      return;
    }
    setCurrent((value) => value + 1);
  }, [current, exercises.length]);

  const correctCount = useMemo(() => {
    return Array.from(results.values()).filter((result) => {
      if ("correct" in result && typeof result.correct === "boolean") return result.correct;
      if ("scores" in result && Array.isArray(result.scores)) return result.scores.every(Boolean);
      return false;
    }).length;
  }, [results]);

  const generationCopy = useMemo(
    () => getGenerationCopy(mode, selectedType, patternFocus),
    [mode, selectedType, patternFocus],
  );

  const sessionSummary = useMemo(() => {
    if (mode === "pattern" && patternFocus) {
      return {
        title: `${PATTERN_FOCUS_CONFIG[patternFocus.pattern]?.label ?? "Pattern"} complete`,
        subtitle: `${results.size} focused exercises at ${patternFocus.level}`,
        primary: "Repeat this pattern lane",
      };
    }
    if (mode === "errors") {
      return {
        title: "Mistake practice complete",
        subtitle: `${results.size} recovery exercises completed`,
        primary: "More recovery drills",
      };
    }
    if (mode === "typed" && selectedType) {
      const drill = DRILL_TYPES.find((entry) => entry.type === selectedType);
      return {
        title: `${drill?.label ?? "Drill"} complete`,
        subtitle: `${results.size} exercises completed`,
        primary: "More drills",
      };
    }
    return {
      title: "Drills complete",
      subtitle: `${results.size} exercises completed`,
      primary: "More drills",
    };
  }, [mode, results.size, selectedType, patternFocus]);

  const availableCount = practiceExercises?.length ?? 0;

  useEffect(() => {
    if (mode || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("focus") === "recovery") {
      setRecoveryFocus(true);
      startPractice("errors");
      return;
    }
    const focus = params.get("focus");
    if (focus === "pattern" || focus === "skill") {
      const pattern = (params.get("pattern") ?? params.get("skill")) as PatternFocusKey | null;
      const level = normalizePatternPracticeLevel(params.get("level") ?? undefined);
      if (pattern && PATTERN_FOCUS_CONFIG[pattern]) {
        startPatternPractice(pattern, level);
      }
    }
  }, [mode, startPractice, startPatternPractice]);

  if (!mode || (exercises.length === 0 && !loading)) {
    return (
      <main className="min-h-screen max-w-lg mx-auto px-4 py-6 space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-lg font-semibold">{recoveryFocus ? "Practice mistakes" : patternFocus ? "Learn patterns" : "Drills"}</h1>
          <p className="text-xs text-white/30">
            {recoveryFocus
              ? "Targeted recovery from recent weak spots"
              : patternFocus
                ? "Focused practice for one reusable language lane"
                : "Choose a drill lane or launch a quick mixed set"}
          </p>
        </header>

        {patternFocus && (
          <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-accent-light">Learn patterns</p>
            <p className="text-sm font-medium">
              {patternFocus.level} {PATTERN_FOCUS_CONFIG[patternFocus.pattern]?.label}
            </p>
            <p className="text-xs text-white/50">
              Start a short set matched to this pattern lane.
              {PATTERN_FOCUS_CONFIG[patternFocus.pattern]?.examples?.[0]
                ? ` Example: ${PATTERN_FOCUS_CONFIG[patternFocus.pattern]?.examples[0]}`
                : ""}
            </p>
          </div>
        )}

        {recoveryFocus && (
          <div className="rounded-2xl border border-warn/30 bg-warn/10 p-4 space-y-1">
            <p className="text-[11px] text-warn uppercase tracking-wider">Practice mistakes</p>
            <p className="text-sm font-medium">
              {activeSkillBlockers.length > 0
                ? `Recent weak spots in ${activeSkillBlockers
                    .slice(0, 2)
                    .map((blocker) => prettySkillLabel(blocker.skillKey) ?? blocker.skillKey)
                    .join(" and ")}`
                : recentErrors.length > 0
                  ? `${recentErrors.length} recent errors ready to target`
                  : "Run a focused recovery set"}
            </p>
            <p className="text-xs text-white/50">Stay in recovery here, then go back to review or patterns.</p>
          </div>
        )}

        <section className="space-y-3">
          <button
            onClick={() => startPractice("errors")}
            disabled={recentErrors.length === 0}
            className={cn(
              "w-full text-left rounded-2xl border p-4 transition active:scale-[0.98]",
              "bg-gradient-to-br from-warn/15 to-warn/5 border-warn/20",
              recentErrors.length === 0 && "opacity-40 cursor-not-allowed",
            )}
          >
            <div className="flex items-center gap-3">
              <Target size={24} className="text-warn flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Practice mistakes</span>
                  {recentErrors.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warn/20 text-warn">
                      {recentErrors.length} errors
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5">Target recent weak spots</p>
              </div>
            </div>
          </button>

          {!recoveryFocus ? (
            <>
              <button
                onClick={() => startPractice("random")}
                disabled={availableCount === 0}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 transition active:scale-[0.98]",
                  "bg-gradient-to-br from-accent/15 to-accent/5 border-accent/20",
                  availableCount === 0 && "opacity-40 cursor-not-allowed",
                )}
              >
                <div className="flex items-center gap-3">
                  <Shuffle size={24} className="text-accent-light flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Mixed drills</span>
                      {availableCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-light">
                          {availableCount} ready
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">A quick varied set when you do not want to choose a lane</p>
                  </div>
                </div>
              </button>

              <section className="space-y-3">
                <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider px-1">
                  Or Choose A Drill Type
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={withBasePath("/practice")}
                    className="text-left rounded-2xl border border-white/10 bg-card p-4 transition active:scale-[0.98] hover:border-white/20"
                  >
                    <span className="text-lg">🗂️</span>
                    <p className="text-sm font-medium mt-2">Words review</p>
                    <p className="text-[11px] leading-4 text-white/40 mt-1.5">
                      Review SRS cards and due words
                    </p>
                  </Link>
                  {DRILL_TYPES.map((drill) => (
                    <button
                      key={drill.type}
                      onClick={() => {
                        setSelectedType(drill.type);
                        startPractice("typed", drill.type);
                      }}
                      className="text-left rounded-2xl border border-white/10 bg-card p-4 transition active:scale-[0.98] hover:border-white/20"
                    >
                      <span className="text-lg">{drill.emoji}</span>
                      <p className="text-sm font-medium mt-2">{drill.label}</p>
                      <p className="text-[11px] leading-4 text-white/40 mt-1.5">{drill.description}</p>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-card px-4 py-4 text-sm text-white/55">
              This page stays focused on recovery. Open drill choice is still available from Learn patterns or the regular drills page.
            </div>
          )}
        </section>

        {error && <p className="text-xs text-danger text-center">{error}</p>}
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen max-w-lg mx-auto px-4 flex items-center justify-center">
        <div className="w-full rounded-2xl border border-accent/20 bg-card p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-light">
              AI
            </span>
            <span className="text-xs text-white/35">Shared pool</span>
          </div>
          <Loader2 size={32} className="mx-auto text-accent animate-spin" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{generationCopy.title}</p>
            <p className="text-xs text-white/45">{generationCopy.detail}</p>
          </div>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <CheckCircle size={48} className="text-success" />
        <div className="space-y-1 text-center">
          <h2 className="text-2xl font-bold">{sessionSummary.title}</h2>
          <p className="text-sm text-white/45">{sessionSummary.subtitle}</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-accent-light">{results.size}/{exercises.length}</p>
            <p className="text-xs text-white/40">exercises</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-success">{correctCount}</p>
            <p className="text-xs text-white/40">correct</p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => {
                if (mode === "pattern" && patternFocus) {
                  startPatternPractice(patternFocus.pattern, patternFocus.level);
                  return;
              }
              startPractice(mode);
            }}
            className="w-full px-5 py-3 bg-accent rounded-xl text-sm font-medium hover:bg-accent/80 transition flex items-center justify-center gap-2"
          >
              <RefreshCw size={16} />
              {mode === "errors" ? "More recovery practice" : mode === "pattern" ? "More pattern practice" : sessionSummary.primary}
            </button>
          {mode === "pattern" ? (
            <Link
              href={withBasePath("/patterns")}
              className="w-full px-5 py-3 bg-card rounded-xl border border-white/10 text-sm text-center"
            >
              Choose another pattern
            </Link>
          ) : mode === "errors" ? (
            <Link
              href={withBasePath("/practice")}
              className="w-full px-5 py-3 bg-card rounded-xl border border-white/10 text-sm text-center"
            >
              Review words
            </Link>
          ) : (
            <Link
              href={withBasePath("/drills?focus=recovery")}
              className="w-full px-5 py-3 bg-card rounded-xl border border-white/10 text-sm text-center"
            >
              Practice mistakes
            </Link>
          )}
          <Link
            href={withBasePath("/")}
            className="w-full px-5 py-3 bg-card rounded-xl border border-white/10 text-sm text-center"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  if (!currentExercise) return null;

  return (
    <main className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-white/40 tabular-nums">
          {current + 1}/{exercises.length}
        </span>
      </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-light">
            {currentExercise.type.replace("_", " ")}
          </span>
          <span className="text-xs text-white/20">
            {mode === "errors" ? "Recovery set" : mode === "pattern" ? "Pattern set" : "Drills"}
          </span>
        </div>

      <ExerciseErrorBoundary key={currentExercise._id} onSkip={handleSkip}>
        <ExerciseRenderer
          exercise={currentExercise}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      </ExerciseErrorBoundary>
    </main>
  );
}
