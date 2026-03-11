import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

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

const templateSource = fs.readFileSync(new URL("../convex/exerciseTemplatesData.ts", import.meta.url), "utf8");
const executableTemplateSource = templateSource
  .replace(/^import .*$/m, "")
  .replace(/export const /g, "const ");

const templateContext = { MISSIONS, result: null };
vm.runInNewContext(`${executableTemplateSource}\nresult = EXERCISE_TEMPLATES;`, templateContext);
const entries = templateContext.result;

const sharedPoolSource = fs.readFileSync(new URL("../convex/sharedExercisePool.ts", import.meta.url), "utf8");
const executableSharedPoolSource = ts.transpileModule(sharedPoolSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const sharedPoolContext = { result: null, exports: {}, module: { exports: {} } };
vm.runInNewContext(
  `${executableSharedPoolSource}\nresult = { scoreTemplate: exports.scoreTemplate, selectSharedTemplates: exports.selectSharedTemplates };`,
  sharedPoolContext,
);
const { scoreTemplate, selectSharedTemplates } = sharedPoolContext.result;

test("shared exercise pool covers A1/A2/B1 across core exercise types", () => {
  const expectedLevels = ["A1", "A2", "B1"];
  const requiredTypes = ["srs", "cloze", "word_builder", "pattern_drill", "speed_translation", "error_hunt", "conversation", "reflection"];

  for (const level of expectedLevels) {
    const levelEntries = entries.filter((entry) => entry.level === level);
    assert.ok(levelEntries.length >= 100, `${level} should have a substantial shared template pool`);

    const typeCounts = levelEntries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] ?? 0) + 1;
      return acc;
    }, {});

    for (const type of requiredTypes) {
      assert.ok((typeCounts[type] ?? 0) > 0, `${level} should include ${type} templates`);
    }
  }
});

test("shared exercise pool keeps origin mission metadata for traceability", () => {
  const missionIds = new Set(MISSIONS.filter((mission) => mission.level !== "B2").map((mission) => mission.missionId));
  const originIds = new Set(entries.map((entry) => entry.missionId));

  for (const missionId of missionIds) {
    assert.ok(originIds.has(missionId), `${missionId} should contribute templates to the shared pool`);
  }
});

test("pattern-focused selection prefers templates matching the requested pattern family", () => {
  const templates = [
    {
      level: "A1",
      type: "pattern_drill",
      tier: "standard",
      tags: ["food"],
      errorFocus: ["lexical_gap"],
      variantKey: "requests-match",
      content: {},
      active: true,
    },
    {
      level: "A1",
      type: "conversation",
      tier: "deep",
      tags: ["media"],
      errorFocus: ["off_topic"],
      variantKey: "requests-mismatch",
      content: {},
      active: true,
    },
  ];

  const matchingScore = scoreTemplate(templates[0], {
    level: "A1",
    patternFocus: "requests_and_needs",
    tags: [],
    errorFocus: [],
  });
  const mismatchScore = scoreTemplate(templates[1], {
    level: "A1",
    patternFocus: "requests_and_needs",
    tags: [],
    errorFocus: [],
  });

  assert.ok(matchingScore > mismatchScore, "matching templates should score higher for the requested pattern");

  const selected = selectSharedTemplates(templates, {
    level: "A1",
    patternFocus: "requests_and_needs",
    limit: 1,
    seed: "pattern-test",
  });

  assert.equal(selected[0]?.variantKey, "requests-match");
});
