import type { ExerciseMode } from "./exerciseTypes";

export interface InventoryStatusResult {
  status: "ready" | "recovery_only" | "empty";
  counts: {
    quickReady: number;
    standardReady: number;
    deepReady: number;
    recoveryReady: number;
    totalReady: number;
  };
}

export function inventoryToExerciseCounts(
  inventory: InventoryStatusResult | null | undefined,
  dueCards: number,
): Record<string, number> {
  const counts = inventory?.counts;
  // All type keys present so ModeSelector sum via MODE_TYPES works correctly
  return {
    srs: Math.max(counts?.quickReady ?? 0, dueCards),
    cloze: counts?.standardReady ?? 0,
    word_builder: 0,
    pattern_drill: 0,
    speed_translation: 0,
    error_hunt: 0,
    conversation: counts?.deepReady ?? 0,
    reflection: 0,
  };
}

export function modeAvailable(
  mode: ExerciseMode,
  inventory: InventoryStatusResult | null | undefined,
  dueCards: number,
): boolean {
  const counts = inventory?.counts;
  if (mode === "quick") return Math.max(counts?.quickReady ?? 0, dueCards) > 0;
  if (mode === "standard") return (counts?.standardReady ?? 0) > 0;
  return (counts?.deepReady ?? 0) > 0;
}

export function pickRunnableMode(
  preferred: ExerciseMode,
  inventory: InventoryStatusResult | null | undefined,
  dueCards: number,
): ExerciseMode | null {
  const fallbackOrder: ExerciseMode[] =
    preferred === "deep"
      ? ["deep", "standard", "quick"]
      : preferred === "standard"
        ? ["standard", "quick", "deep"]
        : ["quick", "standard", "deep"];

  for (const mode of fallbackOrder) {
    if (modeAvailable(mode, inventory, dueCards)) return mode;
  }
  return null;
}
