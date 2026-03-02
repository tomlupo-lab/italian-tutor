"use client";

import type { Exercise, ExerciseResult } from "@/lib/exerciseTypes";
import FlashcardExercise from "./FlashcardExercise";
import ClozeSprintExercise from "./ClozeSprintExercise";
import WordBuilderExercise from "./WordBuilderExercise";
import PatternDrillExercise from "./PatternDrillExercise";
import SpeedTranslationExercise from "./SpeedTranslationExercise";
import ErrorHuntExercise from "./ErrorHuntExercise";
import ConversationExercise from "./ConversationExercise";
import ReflectionExercise from "./ReflectionExercise";

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
  const { type, content } = exercise;

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
