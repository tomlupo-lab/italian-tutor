import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../convex/progressionCatalog.ts", import.meta.url), "utf8");

function extractArray(name) {
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

const MISSIONS = extractArray("MISSIONS");
const SKILL_TAXONOMY = extractArray("SKILL_TAXONOMY");
const ERROR_TAXONOMY = extractArray("ERROR_TAXONOMY");
const LEVEL_ROADMAPS = extractArray("LEVEL_ROADMAPS");

test("A1 through B1 mission catalog is structurally activation-ready", () => {
  const missionIds = new Set(MISSIONS.map((mission) => mission.missionId));
  const skillKeys = new Set(SKILL_TAXONOMY.map((skill) => skill.skillKey));
  const errorKeys = new Set(ERROR_TAXONOMY.map((error) => error.errorKey));

  const levelCounts = MISSIONS.reduce((acc, mission) => {
    acc[mission.level] = (acc[mission.level] ?? 0) + 1;
    return acc;
  }, {});

  assert.deepEqual(levelCounts, { A1: 8, A2: 7, B1: 7 });

  for (const mission of MISSIONS) {
    assert.equal(mission.active, true, `${mission.missionId} should be active`);
    assert.ok(mission.summary.length > 20, `${mission.missionId} needs a meaningful summary`);
    assert.ok(mission.scenario.length > 20, `${mission.missionId} needs a meaningful scenario`);
    assert.ok(mission.objective.length > 20, `${mission.missionId} needs a meaningful objective`);
    assert.ok(mission.tags.length >= 3, `${mission.missionId} should have at least 3 tags`);
    assert.ok(mission.primarySkills.length >= 3, `${mission.missionId} should train at least 3 skills`);
    assert.ok(mission.checkpoints.length === 4, `${mission.missionId} should have 4 checkpoints`);
    assert.ok(mission.checkpoints.filter((checkpoint) => checkpoint.required).length >= 3, `${mission.missionId} should have at least 3 required checkpoints`);
    assert.ok(mission.exerciseTargets.bronzeReviews >= 35, `${mission.missionId} should have Bronze volume`);
    assert.ok(mission.exerciseTargets.silverDrills >= 20, `${mission.missionId} should have Silver volume`);
    assert.ok(mission.exerciseTargets.goldConversations >= 3, `${mission.missionId} should have Gold volume`);
    assert.ok(mission.exerciseMix.srs > 0, `${mission.missionId} should include SRS`);
    assert.ok(mission.exerciseMix.conversation > 0, `${mission.missionId} should include conversations`);
    assert.ok(mission.exerciseMix.reflection > 0, `${mission.missionId} should include reflection`);

    for (const skillKey of mission.primarySkills) {
      assert.ok(skillKeys.has(skillKey), `${mission.missionId} references unknown skill ${skillKey}`);
    }
    for (const errorKey of mission.errorFocus) {
      assert.ok(errorKeys.has(errorKey), `${mission.missionId} references unknown error focus ${errorKey}`);
    }
    for (const errorKey of mission.criticalErrorTypes) {
      assert.ok(errorKeys.has(errorKey), `${mission.missionId} references unknown critical error ${errorKey}`);
    }
    for (const prerequisite of mission.prerequisites) {
      assert.ok(missionIds.has(prerequisite), `${mission.missionId} references unknown prerequisite ${prerequisite}`);
    }
  }
});

test("roadmaps cover A1 to B2 and point at valid mission IDs", () => {
  const missionIds = new Set(MISSIONS.map((mission) => mission.missionId));
  const skillKeys = new Set(SKILL_TAXONOMY.map((skill) => skill.skillKey));
  const roadmapLevels = Array.from(LEVEL_ROADMAPS, (roadmap) => roadmap.level);

  assert.deepEqual(roadmapLevels, ["A1", "A2", "B1", "B2"]);

  for (const roadmap of LEVEL_ROADMAPS) {
    for (const missionId of roadmap.missionPool) {
      assert.ok(missionIds.has(missionId), `${roadmap.level} roadmap references unknown mission ${missionId}`);
    }
    for (const missionId of roadmap.requiredMissionIds) {
      assert.ok(missionIds.has(missionId), `${roadmap.level} roadmap references unknown required mission ${missionId}`);
    }
    for (const rule of roadmap.skillThresholds) {
      assert.ok(skillKeys.has(rule.skillKey), `${roadmap.level} roadmap references unknown skill ${rule.skillKey}`);
      assert.ok(rule.minPoints > 0, `${roadmap.level} roadmap should use positive point thresholds`);
    }
  }
});
