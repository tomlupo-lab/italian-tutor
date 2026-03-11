import type { Exercise, ExerciseMode, FlashcardDirection } from "@/lib/exerciseTypes";

interface DueCard {
  _id: string;
  it: string;
  en: string;
  level?: string;
  tag?: string;
  example?: string;
  direction?: FlashcardDirection;
}

const BRONZE_TOTAL = 20;
const BRONZE_REVIEW_CAP = 3;
const SILVER_TARGET_EFFORT = 10.5;
const SILVER_MAX_EXERCISES = 10;
const SILVER_QUOTAS: Array<{ type: Exercise["type"]; count: number }> = [
  { type: "cloze", count: 2 },
  { type: "word_builder", count: 2 },
  { type: "pattern_drill", count: 2 },
  { type: "speed_translation", count: 2 },
  { type: "error_hunt", count: 1 },
];
const SILVER_EFFORT_BY_TYPE: Partial<Record<Exercise["type"], number>> = {
  cloze: 1,
  word_builder: 1,
  pattern_drill: 1.5,
  speed_translation: 2,
  error_hunt: 2,
};

export const SESSION_BLUEPRINTS: Record<
  ExerciseMode,
  { duration: string; summary: string; sessionLabel: string }
> = {
  bronze: {
    duration: "~5 min",
    summary: "20 cards with up to 3 due-review repeats.",
    sessionLabel: "20-card recall sprint",
  },
  silver: {
    duration: "~10 min",
    summary: "Balanced drill set tuned to about 10 minutes of structured practice.",
    sessionLabel: "8-10 drill practice block",
  },
  gold: {
    duration: "~15 min",
    summary: "One mission conversation plus reflection when available.",
    sessionLabel: "1 conversation checkpoint",
  },
};

function pickUncompletedFirst(exercises: Exercise[]) {
  return [...exercises].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.order - b.order;
  });
}

function toDueCardExercise(date: string, card: DueCard, order: number): Exercise {
  return {
    _id: `card-${card._id}`,
    date,
    type: "srs",
    order,
    content: {
      front: card.it,
      back: card.en,
      tag: card.tag,
      level: card.level,
      example: card.example,
      direction: card.direction ?? "it_to_en",
    },
    difficulty: card.level ?? "A1",
    completed: false,
    source: "seed",
  };
}

export function selectSessionExercises(args: {
  mode: ExerciseMode;
  exercises: Exercise[];
  dueCards?: DueCard[];
  date: string;
}): Exercise[] {
  const ordered = pickUncompletedFirst(args.exercises);

  if (args.mode === "bronze") {
    const missionCards = ordered.filter((exercise) => exercise.type === "srs");
    const reviewCards = (args.dueCards ?? [])
      .slice(0, BRONZE_REVIEW_CAP)
      .map((card, index) => toDueCardExercise(args.date, card, 10_000 + index));
    const missionCount = Math.max(0, BRONZE_TOTAL - reviewCards.length);
    return [...reviewCards, ...missionCards.slice(0, missionCount)];
  }

  if (args.mode === "silver") {
    const selected: Exercise[] = [];
    const selectedIds = new Set<string>();
    let effort = 0;

    for (const quota of SILVER_QUOTAS) {
      const matches = ordered.filter(
        (exercise) =>
          exercise.type === quota.type &&
          !selectedIds.has(exercise._id),
      );
      for (const exercise of matches.slice(0, quota.count)) {
        selected.push(exercise);
        selectedIds.add(exercise._id);
        effort += SILVER_EFFORT_BY_TYPE[exercise.type] ?? 1;
      }
    }

    if (
      effort < SILVER_TARGET_EFFORT &&
      selected.length < SILVER_MAX_EXERCISES
    ) {
      for (const exercise of ordered) {
        if (selectedIds.has(exercise._id)) continue;
        if (!SILVER_EFFORT_BY_TYPE[exercise.type]) continue;
        selected.push(exercise);
        selectedIds.add(exercise._id);
        effort += SILVER_EFFORT_BY_TYPE[exercise.type] ?? 1;
        if (
          effort >= SILVER_TARGET_EFFORT ||
          selected.length >= SILVER_MAX_EXERCISES
        ) {
          break;
        }
      }
    }

    return selected;
  }

  const conversations = ordered.filter((exercise) => exercise.type === "conversation");
  const reflections = ordered.filter((exercise) => exercise.type === "reflection");
  const result: Exercise[] = [];

  if (conversations[0]) result.push(conversations[0]);
  if (reflections[0]) result.push(reflections[0]);
  return result;
}
