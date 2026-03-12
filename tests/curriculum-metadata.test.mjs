import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function extractArray(source, name) {
  const match = source.match(new RegExp(`(?:export const|const) ${name}(?::[^=]+)? = \\[`));
  assert.ok(match, `${name} should exist`);
  const start = match.index + match[0].length - 1;
  let depth = 0;
  let end = -1;
  for (let i = start; i < source.length; i += 1) {
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
  return vm.runInNewContext(`(${source.slice(start, end + 1)})`);
}

function extractObject(source, name) {
  const match = source.match(new RegExp(`export const ${name}(?::[^=]+)? = \\{`));
  assert.ok(match, `${name} should exist`);
  const start = match.index + match[0].length - 1;
  let depth = 0;
  let end = -1;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  assert.notEqual(end, -1, `${name} object should close`);
  return vm.runInNewContext(`(${source.slice(start, end + 1)})`);
}

const metadataSource = fs.readFileSync(new URL("../convex/curriculumMetadata.ts", import.meta.url), "utf8");
const executableMetadataSource = ts.transpileModule(metadataSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const metadataContext = { exports: {}, module: { exports: {} }, result: null };
vm.runInNewContext(
  `${executableMetadataSource}\nresult = { CURRICULUM_PATTERN_IDS: exports.CURRICULUM_PATTERN_IDS, deriveCardCurriculum: exports.deriveCardCurriculum, deriveMissionTargetPatternIds: exports.deriveMissionTargetPatternIds, deriveTemplateCurriculum: exports.deriveTemplateCurriculum, phaseForLevel: exports.phaseForLevel };`,
  metadataContext,
);
const {
  CURRICULUM_PATTERN_IDS,
  deriveCardCurriculum,
  deriveMissionTargetPatternIds,
  phaseForLevel,
} = metadataContext.result;

const progressionSource = fs.readFileSync(new URL("../convex/progressionCatalog.ts", import.meta.url), "utf8");
const MISSIONS = extractArray(progressionSource, "MISSIONS");

const templateSource = fs.readFileSync(new URL("../convex/exerciseTemplatesData.ts", import.meta.url), "utf8");
const executableTemplateSource = templateSource
  .replace(/^import .*$/gm, "")
  .replace(/export const /g, "const ");
const templateContext = { MISSIONS, deriveTemplateCurriculum: metadataContext.result.deriveTemplateCurriculum, result: null };
vm.runInNewContext(`${executableTemplateSource}\nresult = EXERCISE_TEMPLATES;`, templateContext);
const EXERCISE_TEMPLATES = templateContext.result;

const fastTrackSource = fs.readFileSync(new URL("../convex/fastTrackDocsContent.ts", import.meta.url), "utf8");
const executableFastTrackSource = ts.transpileModule(fastTrackSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const fastTrackContext = { exports: {}, module: { exports: {} }, result: null };
vm.runInNewContext(
  `${executableFastTrackSource}\nresult = { FAST_TRACK_DOCS_CONTENT: exports.FAST_TRACK_DOCS_CONTENT, FAST_TRACK_DOCS_SEED_CARDS: exports.FAST_TRACK_DOCS_SEED_CARDS };`,
  fastTrackContext,
);
const { FAST_TRACK_DOCS_CONTENT, FAST_TRACK_DOCS_SEED_CARDS } = fastTrackContext.result;

const seedSource = fs.readFileSync(new URL("../convex/seed.ts", import.meta.url), "utf8");
const BASE_VOCAB = extractArray(seedSource, "baseVocab");

const patternSource = fs.readFileSync(new URL("../src/lib/patternFocus.ts", import.meta.url), "utf8");
const PATTERN_PRACTICE_LEVELS = extractArray(patternSource, "PATTERN_PRACTICE_LEVELS");
const PATTERN_FOCUS_CONFIG = extractObject(patternSource, "PATTERN_FOCUS_CONFIG");

test("docs-derived seed cards retain explicit curriculum metadata", () => {
  assert.equal(FAST_TRACK_DOCS_SEED_CARDS.length, FAST_TRACK_DOCS_CONTENT.length);

  for (const card of FAST_TRACK_DOCS_SEED_CARDS) {
    assert.ok(card.phase, `${card.it} should retain phase`);
    assert.ok(card.patternId, `${card.it} should retain patternId`);
    assert.ok(card.domain, `${card.it} should retain domain`);
    assert.ok(CURRICULUM_PATTERN_IDS.includes(card.patternId), `${card.it} uses unknown pattern ${card.patternId}`);
  }
});

test("base vocab cards can derive valid curriculum metadata", () => {
  for (const card of BASE_VOCAB) {
    const curriculum = deriveCardCurriculum(card);
    assert.equal(curriculum.phase, phaseForLevel(card.level), `${card.it} should map to the correct phase`);
    assert.ok(curriculum.domain, `${card.it} should derive a domain`);
    assert.ok(curriculum.patternId, `${card.it} should derive a patternId`);
    assert.ok(CURRICULUM_PATTERN_IDS.includes(curriculum.patternId), `${card.it} uses unknown pattern ${curriculum.patternId}`);
  }
});

test("generated exercise templates expose valid curriculum metadata", () => {
  for (const entry of EXERCISE_TEMPLATES) {
    assert.ok(entry.phase, `${entry.variantKey} should include phase`);
    assert.ok(entry.domain, `${entry.variantKey} should include domain`);
    assert.ok(entry.patternId, `${entry.variantKey} should include patternId`);
    assert.equal(entry.phase, phaseForLevel(entry.level), `${entry.variantKey} should align phase with ${entry.level}`);
    assert.ok(CURRICULUM_PATTERN_IDS.includes(entry.patternId), `${entry.variantKey} uses unknown pattern ${entry.patternId}`);
  }
});

test("missions derive valid target pattern ids", () => {
  for (const mission of MISSIONS.filter((entry) => entry.level !== "B2")) {
    const targetPatternIds = deriveMissionTargetPatternIds({
      level: mission.level,
      tags: mission.tags,
      errorFocus: mission.errorFocus,
    });
    assert.ok(targetPatternIds.length > 0, `${mission.missionId} should derive target patterns`);
    for (const patternId of targetPatternIds) {
      assert.ok(
        CURRICULUM_PATTERN_IDS.includes(patternId),
        `${mission.missionId} uses unknown mission pattern ${patternId}`,
      );
    }
  }
});

test("supported pattern lanes have template-level metadata coverage by level", () => {
  for (const level of PATTERN_PRACTICE_LEVELS) {
    const templatesAtLevel = EXERCISE_TEMPLATES.filter((entry) => entry.level === level);
    assert.ok(templatesAtLevel.length > 0, `Expected templates at ${level}`);

    for (const [patternKey, config] of Object.entries(PATTERN_FOCUS_CONFIG)) {
      const covered = templatesAtLevel.some((entry) =>
        (config.patternIds ?? []).includes(entry.patternId) ||
        (config.domains ?? []).includes(entry.domain),
      );
      assert.ok(covered, `${patternKey} should have template metadata coverage at ${level}`);
    }
  }
});
