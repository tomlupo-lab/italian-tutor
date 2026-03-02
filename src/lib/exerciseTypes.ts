/**
 * Type definitions for exercise content and results.
 * Matches the schemas defined in references/exercises/templates.json.
 */

// ── Exercise modes ────────────────────────────────────────────────────

export type ExerciseMode = "quick" | "standard" | "deep";

/** Which exercise types appear in each mode */
export const MODE_TYPES: Record<ExerciseMode, ExerciseType[]> = {
  quick: ["srs", "cloze", "word_builder", "pattern_drill", "speed_translation"],
  standard: [
    "srs",
    "cloze",
    "word_builder",
    "pattern_drill",
    "speed_translation",
    "error_hunt",
    "conversation",
  ],
  deep: [
    "srs",
    "cloze",
    "word_builder",
    "pattern_drill",
    "speed_translation",
    "error_hunt",
    "conversation",
    "reflection",
  ],
};

// ── Exercise types ────────────────────────────────────────────────────

export type ExerciseType =
  | "srs"
  | "cloze"
  | "word_builder"
  | "pattern_drill"
  | "speed_translation"
  | "error_hunt"
  | "conversation"
  | "reflection";

// ── Content schemas (what the exercise displays) ──────────────────────

export interface SrsContent {
  front: string;
  back: string;
  audio_front?: string;
}

export interface ClozeContent {
  sentence: string;
  blank_index: number;
  options: [string, string, string, string];
  correct: number;
  skill_id?: string;
  hint?: string;
}

export interface WordBuilderContent {
  target_sentence: string;
  scrambled_words: string[];
  translation?: string;
}

export interface PatternDrillSentence {
  template: string;
  blank: string;
  correct: string;
  hint?: string;
}

export interface PatternDrillContent {
  pattern_name: string;
  pattern_description: string;
  sentences: PatternDrillSentence[];
}

export interface SpeedTranslationItem {
  source: string;
  options: [string, string, string, string];
  correct: number;
}

export interface SpeedTranslationContent {
  sentences: SpeedTranslationItem[];
  time_limit_seconds: number;
}

export interface ErrorHuntSentence {
  text: string;
  has_error: boolean;
  error_position?: number;
  corrected?: string;
  explanation?: string;
}

export interface ErrorHuntContent {
  sentences: ErrorHuntSentence[];
}

export interface ConversationContent {
  scenario: string;
  target_phrases: string[];
  grammar_focus?: string;
  difficulty: string;
  system_prompt: string;
}

export interface ReflectionContent {
  prompt: string;
  follow_up?: string;
}

/** Union of all content types */
export type ExerciseContent =
  | SrsContent
  | ClozeContent
  | WordBuilderContent
  | PatternDrillContent
  | SpeedTranslationContent
  | ErrorHuntContent
  | ConversationContent
  | ReflectionContent;

// ── Result schemas (what the exercise produces) ───────────────────────

export interface SrsResult {
  quality: number; // 0-5 SM-2
  time_ms: number;
}

export interface ClozeResult {
  selected: number;
  correct: boolean;
  time_ms: number;
}

export interface WordBuilderResult {
  user_order: number[];
  correct: boolean;
  time_ms: number;
}

export interface PatternDrillResult {
  answers: string[];
  scores: boolean[];
  time_ms: number;
}

export interface SpeedTranslationResult {
  answers: number[]; // -1 for unanswered
  scores: boolean[];
  total_correct: number;
  time_ms: number;
}

export interface ErrorHuntResult {
  identified: boolean[];
  corrections: string[];
  scores: boolean[];
  time_ms: number;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationError {
  original: string;
  corrected: string;
  explanation: string;
}

export interface ConversationResult {
  messages: ConversationMessage[];
  errors: ConversationError[];
  duration_ms: number;
}

export interface ReflectionResult {
  rating: number; // 1-5
  answer: string;
  hardest_exercise?: string;
}

export type ExerciseResult =
  | SrsResult
  | ClozeResult
  | WordBuilderResult
  | PatternDrillResult
  | SpeedTranslationResult
  | ErrorHuntResult
  | ConversationResult
  | ReflectionResult;

// ── Exercise document (from Convex) ──────────────────────────────────

export interface Exercise {
  _id: string;
  date: string;
  type: ExerciseType;
  order: number;
  content: ExerciseContent;
  skillId?: string;
  difficulty: string;
  completed: boolean;
  result?: ExerciseResult;
  source: string;
}

// ── Type-safe content accessor ───────────────────────────────────────

export type ContentMap = {
  srs: SrsContent;
  cloze: ClozeContent;
  word_builder: WordBuilderContent;
  pattern_drill: PatternDrillContent;
  speed_translation: SpeedTranslationContent;
  error_hunt: ErrorHuntContent;
  conversation: ConversationContent;
  reflection: ReflectionContent;
};

export type ResultMap = {
  srs: SrsResult;
  cloze: ClozeResult;
  word_builder: WordBuilderResult;
  pattern_drill: PatternDrillResult;
  speed_translation: SpeedTranslationResult;
  error_hunt: ErrorHuntResult;
  conversation: ConversationResult;
  reflection: ReflectionResult;
};

/** Type-safe content cast */
export function getContent<T extends ExerciseType>(
  exercise: Exercise,
  type: T,
): ContentMap[T] {
  return exercise.content as ContentMap[T];
}
