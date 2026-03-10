import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function extractArray(source, name) {
  const match = source.match(new RegExp(`export const ${name}(?::[^=]+)? = \\[`));
  assert.ok(match, `${name} should exist`);
  const start = match.index;
  const arrayStart = start + match[0].length - 1;
  let depth = 0;
  let end = -1;
  for (let i = arrayStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  assert.notEqual(end, -1, `${name} array should close`);
  return vm.runInNewContext(`(${source.slice(arrayStart, end + 1)})`);
}

const progressionSource = fs.readFileSync(new URL("../convex/progressionCatalog.ts", import.meta.url), "utf8");
const MISSIONS = extractArray(progressionSource, "MISSIONS");

const librarySource = fs.readFileSync(new URL("../convex/missionExerciseLibraryData.ts", import.meta.url), "utf8");
const executableLibrarySource = librarySource
  .replace(/^import .*$/m, "")
  .replace(/export const /g, "const ");

const libraryContext = { MISSIONS, result: null };
vm.runInNewContext(`${executableLibrarySource}\nresult = MISSION_EXERCISE_LIBRARY;`, libraryContext);
const entries = libraryContext.result;

test("authored library covers every A1/A2/B1 mission with multi-tier content", () => {
  const missionIds = MISSIONS.filter((mission) => mission.level !== "B2").map((mission) => mission.missionId);

  for (const missionId of missionIds) {
    const missionEntries = entries.filter((entry) => entry.missionId === missionId);
    assert.ok(missionEntries.length >= 20, `${missionId} should have a substantial authored library`);

    const typeCounts = missionEntries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] ?? 0) + 1;
      return acc;
    }, {});

    assert.ok((typeCounts.srs ?? 0) >= 30, `${missionId} should have authored Bronze cards`);
    assert.ok((typeCounts.cloze ?? 0) >= 6, `${missionId} should have authored cloze drills`);
    assert.ok((typeCounts.word_builder ?? 0) >= 6, `${missionId} should have authored word builders`);
    assert.ok((typeCounts.pattern_drill ?? 0) >= 4, `${missionId} should have authored pattern drills`);
    assert.ok((typeCounts.speed_translation ?? 0) >= 4, `${missionId} should have authored speed translations`);
    assert.ok((typeCounts.error_hunt ?? 0) >= 4, `${missionId} should have authored error hunts`);
    assert.ok((typeCounts.conversation ?? 0) >= 3, `${missionId} should have authored Gold conversations`);
    assert.ok((typeCounts.reflection ?? 0) >= 1, `${missionId} should have authored reflection`);
  }
});
