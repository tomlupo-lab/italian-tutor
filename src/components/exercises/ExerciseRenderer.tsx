"use client";

import type { Exercise, ExerciseResult, ExerciseType } from "@/lib/exerciseTypes";
import FlashcardExercise from "./FlashcardExercise";
import ClozeSprintExercise from "./ClozeSprintExercise";
import WordBuilderExercise from "./WordBuilderExercise";
import PatternDrillExercise from "./PatternDrillExercise";
import SpeedTranslationExercise from "./SpeedTranslationExercise";
import ErrorHuntExercise from "./ErrorHuntExercise";
import ConversationExercise from "./ConversationExercise";
import ReflectionExercise from "./ReflectionExercise";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyContent = Record<string, any>;

/**
 * Normalizes exercise content from alternative schemas (e.g. nightly batch)
 * into the format expected by exercise components.
 */
function normalizeContent(type: ExerciseType, raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const c = raw as AnyContent;

  switch (type) {
    case "word_builder": {
      // Nightly: { tokens, correct_order, translation }
      // Expected: { scrambled_words, target_sentence, translation }
      if ("tokens" in c && !("scrambled_words" in c)) {
        const tokens = c.tokens as string[];
        const order = (c.correct_order as number[]) ?? tokens.map((_, i) => i);
        const target = order.map((i) => tokens[i]).join(" ");
        // Shuffle tokens for the exercise (Fisher-Yates)
        const shuffled = [...tokens];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // If shuffle produced the correct order, swap first two
        if (shuffled.join(" ") === target && shuffled.length > 1) {
          [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
        }
        return { scrambled_words: shuffled, target_sentence: target, translation: c.translation };
      }
      return raw;
    }

    case "pattern_drill": {
      // Nightly: { pattern, sentences: [{ sentence, blank, options }] }
      // Expected: { pattern_name, pattern_description, sentences: [{ template, blank, correct, hint }] }
      if ("pattern" in c && !("pattern_name" in c)) {
        const sentences = (c.sentences as AnyContent[])?.map((s) => ({
          template: s.sentence ?? s.template ?? "",
          blank: s.blank ?? "",
          correct: s.blank ?? s.correct ?? "",
          hint: s.hint ?? "",
        }));
        return {
          pattern_name: c.pattern as string,
          pattern_description: (c.description ?? c.pattern) as string,
          sentences,
        };
      }
      return raw;
    }

    case "speed_translation": {
      // Nightly individual: { source, options, correct } (no sentences wrapper)
      // Expected: { sentences: [{ source, options, correct }], time_limit_seconds }
      if ("source" in c && !("sentences" in c)) {
        return {
          sentences: [{ source: c.source, options: c.options, correct: c.correct }],
          time_limit_seconds: 30,
        };
      }
      return raw;
    }

    case "reflection": {
      // Nightly: { question, options }
      // Expected: { prompt, follow_up? }
      if ("question" in c && !("prompt" in c)) {
        return { prompt: c.question, follow_up: c.follow_up };
      }
      return raw;
    }

    default:
      return raw;
  }
}

interface ExerciseRendererProps {
  exercise: Exercise;
  onComplete: (result: ExerciseResult) => void;
  onSkip?: () => void;
}

export default function ExerciseRenderer({
  exercise,
  onComplete,
  onSkip,
}: ExerciseRendererProps) {
  const { type } = exercise;
  const content = normalizeContent(type, exercise.content);

  switch (type) {
    case "srs":
      return <FlashcardExercise content={content} onComplete={onComplete} />;
    case "cloze":
      return <ClozeSprintExercise content={content} onComplete={onComplete} />;
    case "word_builder":
      return <WordBuilderExercise content={content} onComplete={onComplete} />;
    case "pattern_drill":
      return <PatternDrillExercise content={content} onComplete={onComplete} />;
    case "speed_translation":
      return <SpeedTranslationExercise content={content} onComplete={onComplete} />;
    case "error_hunt":
      return <ErrorHuntExercise content={content} onComplete={onComplete} />;
    case "conversation":
      return <ConversationExercise content={content} onComplete={onComplete} />;
    case "reflection":
      return <ReflectionExercise content={content} onComplete={onComplete} />;
    default:
      return (
        <div className="bg-card rounded-2xl border border-white/10 p-6 text-center">
          <p className="text-white/50">
            Exercise type &ldquo;{type}&rdquo; not yet implemented
          </p>
          {onSkip && (
            <button
              onClick={onSkip}
              className="mt-4 px-4 py-2 bg-white/10 rounded-xl text-sm"
            >
              Skip
            </button>
          )}
        </div>
      );
  }
}
