"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ExerciseRenderer from "@/components/exercises/ExerciseRenderer";
import ExerciseErrorBoundary from "@/components/exercises/ExerciseErrorBoundary";
import type { Exercise, ExerciseResult } from "@/lib/exerciseTypes";
import { Loader2, RefreshCw, Target, Shuffle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiPath, withBasePath } from "@/lib/paths";
import { prettySkillLabel } from "@/lib/labels";
import { getPregeneratedSkillExercises, type SkillFocusKey } from "@/lib/skillPracticeCatalog";
import { getTodayWarsaw } from "@/lib/date";
import Link from "next/link";

const SKILL_FOCUS_CONFIG: Record<string, { label: string; types: string[] }> = {
  vocabulary: {
    label: "Vocabulary",
    types: ["cloze", "word_builder", "speed_translation"],
  },
  grammar: {
    label: "Grammar",
    types: ["cloze", "pattern_drill", "error_hunt"],
  },
  listening: {
    label: "Listening",
    types: ["speed_translation", "cloze"],
  },
  reading: {
    label: "Reading",
    types: ["cloze", "error_hunt", "speed_translation"],
  },
  speaking: {
    label: "Speaking",
    types: ["pattern_drill", "speed_translation"],
  },
  conversation: {
    label: "Conversation",
    types: ["pattern_drill", "error_hunt", "speed_translation"],
  },
};

type PracticeMode = "errors" | "random" | "typed" | "skill";

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
  skillFocus: { skill: string; level: string } | null,
) {
  if (mode === "skill" && skillFocus) {
    return {
      title: "Generating drills",
      detail: `AI is building a fresh ${SKILL_FOCUS_CONFIG[skillFocus.skill]?.label ?? "skill"} batch for ${skillFocus.level}.`,
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
  const [skillFocus, setSkillFocus] = useState<{ skill: string; level: string } | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Map<string, ExerciseResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allCards = useQuery(api.cards.getAll);
  const learnerProgress = useQuery(api.missions.getLearnerProgress, {});
  const practiceExercises = useQuery(
    api.exercises.getForPractice,
    selectedType ? { limit: 5, types: [selectedType] } : { limit: 5 },
  );
  const bulkAddCards = useMutation(api.cards.bulkAdd);

  const recentErrors = useMemo(() => {
    if (!allCards) return [];
    return (allCards as AnyCard[])
      .filter((card) => card.source === "recovery")
      .sort((a, b) => Number(b._creationTime ?? 0) - Number(a._creationTime ?? 0))
      .slice(0, 10);
  }, [allCards]);

  const activeSkillBlockers = useMemo(() => {
    return learnerProgress?.missions?.find((mission) => mission.active)?.skillBlockers ?? [];
  }, [learnerProgress?.missions]);

  const startPractice = useCallback(
    async (selectedMode: PracticeMode, typeFilter?: string) => {
      setCurrent(0);
      setResults(new Map());
      setDone(false);
      setError(null);
      setMode(selectedMode);

      if (selectedMode === "random" || selectedMode === "typed") {
        if (typeFilter) setSelectedType(typeFilter);
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
        const res = await fetch(apiPath("/api/generate-practice"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            count: 5,
            level: "A2",
            errors: recentErrors.map((card) => ({
              it: String(card.it ?? ""),
              en: String(card.en ?? ""),
              errorCategory: typeof card.errorCategory === "string" ? card.errorCategory : undefined,
              example: typeof card.example === "string" ? card.example : undefined,
            })),
            types: ["cloze", "pattern_drill", "speed_translation"],
          }),
        });

        if (!res.ok) throw new Error("Failed to generate exercises");
        const data = await res.json();
        setExercises(data.exercises);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate");
        setMode(null);
      } finally {
        setLoading(false);
      }
    },
    [practiceExercises, recentErrors],
  );

  const startSkillPractice = useCallback(async (skill: string, level: string) => {
    const config = SKILL_FOCUS_CONFIG[skill];
    if (!config) {
      setError("Unknown skill focus");
      return;
    }

    setCurrent(0);
    setResults(new Map());
    setDone(false);
    setError(null);
    setMode("skill");
    setSkillFocus({ skill, level });

    const authored = getPregeneratedSkillExercises(skill as SkillFocusKey, level, 5);
    if (authored.length > 0) {
      setExercises(authored);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiPath("/api/generate-practice"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: 5,
          level,
          types: config.types,
          errors: [],
        }),
      });

      if (!res.ok) throw new Error("Failed to generate focused drills");
      const data = await res.json();
      setExercises(data.exercises);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
      setMode(null);
      setSkillFocus(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const wrongCards: { it: string; en: string; source: "recovery"; errorCategory: string }[] = [];
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
            wrongCards.push({
              it: sentence.split("___").join(options[correctIdx]),
              en: `Practice: ${options[correctIdx]}`,
              source: "recovery",
              errorCategory: exercise.type,
            });
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
              wrongCards.push({
                it: options[correctIdx],
                en: (typeof sentence?.source === "string" ? sentence.source : "Practice exercise"),
                source: "recovery",
                errorCategory: exercise.type,
              });
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
    () => getGenerationCopy(mode, selectedType, skillFocus),
    [mode, selectedType, skillFocus],
  );

  const sessionSummary = useMemo(() => {
    if (mode === "skill" && skillFocus) {
      return {
        title: `${SKILL_FOCUS_CONFIG[skillFocus.skill]?.label ?? "Skill"} complete`,
        subtitle: `${results.size} focused exercises at ${skillFocus.level}`,
        primary: "Repeat this skill",
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
  }, [mode, results.size, selectedType, skillFocus]);

  const availableCount = practiceExercises?.length ?? 0;

  useEffect(() => {
    if (mode || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("focus") === "recovery") {
      setRecoveryFocus(true);
      startPractice("errors");
      return;
    }
    if (params.get("focus") === "skill") {
      const skill = params.get("skill");
      const level = params.get("level") ?? "A1";
      if (skill && SKILL_FOCUS_CONFIG[skill]) {
        startSkillPractice(skill, level);
      }
    }
  }, [mode, startPractice, startSkillPractice]);

  if (!mode || (exercises.length === 0 && !loading)) {
    return (
      <main className="min-h-screen max-w-lg mx-auto px-4 py-6 space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-lg font-semibold">{recoveryFocus ? "Practice mistakes" : "Drills"}</h1>
          <p className="text-xs text-white/30">
            {recoveryFocus ? "Targeted recovery from recent weak spots" : "Free practice by drill type"}
          </p>
        </header>

        {skillFocus && (
          <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-accent-light">Build skills</p>
            <p className="text-sm font-medium">
              {skillFocus.level} {SKILL_FOCUS_CONFIG[skillFocus.skill]?.label}
            </p>
            <p className="text-xs text-white/50">Focused drill batch ready.</p>
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
            <p className="text-xs text-white/50">Best first move before open practice.</p>
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
                    <p className="text-xs text-white/40 mt-0.5">A varied drill set across formats</p>
                  </div>
                </div>
              </button>

              <section className="space-y-3">
                <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider px-1">
                  Choose Drill Type
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={withBasePath(`/session/${today}?mode=bronze`)}
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
              Open drills stay available from <span className="text-white">Build skills</span> or the regular drills page.
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
            <span className="text-xs text-white/35">Live generation</span>
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
              if (mode === "skill" && skillFocus) {
                startSkillPractice(skillFocus.skill, skillFocus.level);
                return;
              }
              startPractice(mode);
            }}
            className="w-full px-5 py-3 bg-accent rounded-xl text-sm font-medium hover:bg-accent/80 transition flex items-center justify-center gap-2"
          >
              <RefreshCw size={16} />
              {mode === "errors" ? "More recovery practice" : sessionSummary.primary}
            </button>
          {mode === "skill" ? (
            <Link
              href={withBasePath("/skills")}
              className="w-full px-5 py-3 bg-card rounded-xl border border-white/10 text-sm text-center"
            >
              Choose another skill
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
          {mode === "errors" ? "Recovery set" : mode === "skill" ? "Build skills" : "Drills"}
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
