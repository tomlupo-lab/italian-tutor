import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../convex/fastTrackDocsContent.ts", import.meta.url), "utf8");

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

const FAST_TRACK_DOCS_CONTENT = extractArray("FAST_TRACK_DOCS_CONTENT");

const EXPECTED_PHASE_BY_LEVEL = {
  A1: "phase_1",
  A2: "phase_2",
  B1: "phase_3",
};

const PATTERN_RULES = {
  identity_essere: {
    levels: ["A1"],
    domains: ["identity"],
  },
  location_essere: {
    levels: ["A1"],
    domains: ["location"],
  },
  movement_vado: {
    levels: ["A1", "A2"],
    domains: ["movement"],
  },
  want_voglio: {
    levels: ["A1"],
    domains: ["food", "shopping", "study", "work"],
  },
  polite_request_vorrei: {
    levels: ["A1"],
    domains: ["restaurant", "shopping"],
  },
  ability_posso: {
    levels: ["A1"],
    domains: ["requests", "restaurant", "shopping"],
  },
  obligation_devo: {
    levels: ["A2"],
    domains: ["study", "work"],
  },
  need_ho_bisogno_di: {
    levels: ["A1", "A2"],
    domains: ["food", "health", "requests", "time"],
  },
  like_mi_piace: {
    levels: ["A2", "B1"],
    domains: ["preferences"],
  },
  preference_preferisco: {
    levels: ["A2", "B1"],
    domains: ["preferences"],
  },
  past_ho_participio: {
    levels: ["A2", "B1"],
    domains: ["narration", "past_events"],
  },
  plan_penso_di: {
    levels: ["A2", "B1"],
    domains: ["plans"],
  },
  future_simple: {
    levels: ["B1"],
    domains: ["plans"],
  },
  explanation_perche: {
    levels: ["A2", "B1"],
    domains: ["reasons"],
  },
  opinion_secondo_me: {
    levels: ["B1"],
    domains: ["opinions"],
  },
  conversation_repair: {
    levels: ["A1"],
    domains: ["conversation", "requests"],
  },
};

test("fast-track docs content stays aligned with current pattern lanes", () => {
  const seenItalian = new Set();

  for (const entry of FAST_TRACK_DOCS_CONTENT) {
    assert.equal(entry.phase, EXPECTED_PHASE_BY_LEVEL[entry.level], `${entry.it} should use the expected phase for ${entry.level}`);
    assert.equal(entry.example, entry.it, `${entry.it} should remain a chunk-first example`);
    assert.equal(entry.sourceRef, "docs/content.txt", `${entry.it} should keep its source ref`);
    assert.ok(!seenItalian.has(entry.it), `${entry.it} should not be duplicated`);
    seenItalian.add(entry.it);

    const rule = PATTERN_RULES[entry.patternId];
    assert.ok(rule, `${entry.it} uses unknown patternId ${entry.patternId}`);
    assert.ok(rule.levels.includes(entry.level), `${entry.it} uses ${entry.patternId} at unsupported level ${entry.level}`);
    assert.ok(rule.domains.includes(entry.domain), `${entry.it} uses ${entry.patternId} with unsupported domain ${entry.domain}`);
  }
});
