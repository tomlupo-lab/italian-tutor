import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const metadataSource = fs.readFileSync(new URL("../convex/curriculumMetadata.ts", import.meta.url), "utf8");
const executableMetadataSource = ts.transpileModule(metadataSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const metadataContext = { exports: {}, module: { exports: {} }, result: null };
vm.runInNewContext(
  `${executableMetadataSource}\nresult = { deriveCardCurriculum: exports.deriveCardCurriculum, phaseForLevel: exports.phaseForLevel };`,
  metadataContext,
);

const recoverySource = fs.readFileSync(new URL("../src/lib/recoveryCards.ts", import.meta.url), "utf8");
const executableRecoverySource = ts.transpileModule(
  recoverySource
    .replace(/^import type .*$/gm, "")
    .replace(/^import \{ deriveCardCurriculum \} from .*$/gm, ""),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
).outputText;
const recoveryContext = {
  exports: {},
  module: { exports: {} },
  deriveCardCurriculum: metadataContext.result.deriveCardCurriculum,
  result: null,
};
vm.runInNewContext(
  `${executableRecoverySource}\nresult = { buildRecoveryCard: exports.buildRecoveryCard };`,
  recoveryContext,
);
const { buildRecoveryCard } = recoveryContext.result;

test("recovery cards preserve explicit curriculum metadata from exercises", () => {
  const card = buildRecoveryCard({
    it: "Vorrei un tavolo per due.",
    level: "A1",
    phase: "phase_1",
    patternId: "polite_request_vorrei",
    domain: "food",
    tag: "food",
    errorCategory: "translation",
  });

  assert.equal(card.phase, "phase_1");
  assert.equal(card.patternId, "polite_request_vorrei");
  assert.equal(card.domain, "food");
  assert.equal(card.errorCategory, "lexical_choice");
});

test("recovery cards derive curriculum metadata when explicit fields are missing", () => {
  const card = buildRecoveryCard({
    it: "Ho bisogno di un medico.",
    example: "Scusi, ho bisogno di un medico.",
    level: "A1",
    tag: "health",
    errorCategory: "conversation",
  });

  assert.equal(card.phase, metadataContext.result.phaseForLevel("A1"));
  assert.ok(card.patternId);
  assert.ok(card.domain);
  assert.equal(card.domain, "health");
  assert.equal(card.errorCategory, "incomplete_response");
});
