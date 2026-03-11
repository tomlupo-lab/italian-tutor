import type { ExerciseMode } from "./exerciseTypes";

export interface InventoryStatusResult {
  status: "ready" | "recovery_only" | "replay_only" | "empty";
  counts: {
    quickReady: number;
    standardReady: number;
    deepReady: number;
    recoveryReady: number;
    totalReady: number;
    quickTotal?: number;
    standardTotal?: number;
    deepTotal?: number;
    totalExisting?: number;
  };
}

export function inventoryToExerciseCounts(
  inventory: InventoryStatusResult | null | undefined,
  dueCards: number,
): Record<string, number> {
  const counts = inventory?.counts;
  return {
    srs: Math.max(counts?.quickReady ?? 0, dueCards),
    cloze: counts?.standardReady ?? 0,
    conversation: counts?.deepReady ?? 0,
  };
}

export function modeAvailable(
  mode: ExerciseMode,
  inventory: InventoryStatusResult | null | undefined,
  dueCards: number,
): boolean {
  const counts = inventory?.counts;
  if (mode === "bronze") return Math.max(counts?.quickReady ?? 0, dueCards) > 0;
  if (mode === "silver") return (counts?.standardReady ?? 0) > 0;
  return (counts?.deepReady ?? 0) > 0;
}

export function pickRunnableMode(
  preferred: ExerciseMode,
  inventory: InventoryStatusResult | null | undefined,
  dueCards: number,
): ExerciseMode | null {
  const fallbackOrder: ExerciseMode[] =
    preferred === "gold"
      ? ["gold", "silver", "bronze"]
      : preferred === "silver"
        ? ["silver", "bronze", "gold"]
        : ["bronze", "silver", "gold"];

  for (const mode of fallbackOrder) {
    if (modeAvailable(mode, inventory, dueCards)) return mode;
  }
  return null;
}
