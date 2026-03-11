/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as backfillMissingDirections from "../backfillMissingDirections.js";
import type * as cardRemediation from "../cardRemediation.js";
import type * as cards from "../cards.js";
import type * as exerciseGenerator from "../exerciseGenerator.js";
import type * as exercises from "../exercises.js";
import type * as missionExerciseLibraryData from "../missionExerciseLibraryData.js";
import type * as missions from "../missions.js";
import type * as progressionCatalog from "../progressionCatalog.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  backfillMissingDirections: typeof backfillMissingDirections;
  cardRemediation: typeof cardRemediation;
  cards: typeof cards;
  exerciseGenerator: typeof exerciseGenerator;
  exercises: typeof exercises;
  missionExerciseLibraryData: typeof missionExerciseLibraryData;
  missions: typeof missions;
  progressionCatalog: typeof progressionCatalog;
  seed: typeof seed;
  sessions: typeof sessions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
