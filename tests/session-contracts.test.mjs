import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  computeTierCredits,
  evaluateGoldContract,
  getConversationMetrics,
} = require("../src/lib/sessionContracts.js");

test("tier credits are computed from the frozen session slice, not a later recomputed mission slice", () => {
  const originalBronzeSession = Array.from({ length: 15 }, (_, index) => ({
    _id: `card-${index + 1}`,
    type: "srs",
  }));
  const laterRecomputedSlice = [{ _id: "card-1", type: "srs" }];
  const results = new Map(originalBronzeSession.map((exercise) => [exercise._id, { quality: 3 }]));

  assert.deepEqual(computeTierCredits(originalBronzeSession, results), {
    bronzeCredit: 15,
    silverCredit: 0,
    goldCredit: 0,
  });
  assert.deepEqual(computeTierCredits(laterRecomputedSlice, results), {
    bronzeCredit: 1,
    silverCredit: 0,
    goldCredit: 0,
  });
});

test("gold credits count the original conversation and reflection pair from the started session", () => {
  const originalGoldSession = [
    { _id: "conv-original", type: "conversation", content: { target_phrases: ["l'affitto", "il contratto"] } },
    { _id: "reflection-original", type: "reflection" },
  ];
  const results = new Map([
    ["conv-original", { user_turns: 2, target_phrases_used: ["l'affitto", "il contratto"], messages: [] }],
    ["reflection-original", { rating: 3, answer: "ok" }],
  ]);

  assert.deepEqual(computeTierCredits(originalGoldSession, results), {
    bronzeCredit: 0,
    silverCredit: 0,
    goldCredit: 2,
  });
});

test("gold contract metrics use saved phrase and turn counters from the conversation result", () => {
  const exercises = [
    {
      _id: "conv-1",
      type: "conversation",
      content: { target_phrases: ["l'affitto", "la stanza", "il contratto"] },
    },
    {
      _id: "reflection-1",
      type: "reflection",
      content: {},
    },
  ];
  const results = new Map([
    [
      "conv-1",
      {
        user_turns: 2,
        target_phrases_used: ["l'affitto", "la stanza", "il contratto"],
        messages: [
          { role: "user", content: "l'affitto e il contratto" },
          { role: "assistant", content: "ok" },
          { role: "user", content: "la stanza e in centro" },
        ],
      },
    ],
    ["reflection-1", { rating: 3, answer: "ok" }],
  ]);

  assert.deepEqual(getConversationMetrics(exercises, results), {
    usedTargets: 3,
    userTurns: 2,
    completedAll: true,
  });
});

test("gold contract distinguishes completion credit from checkpoint pass", () => {
  const exercises = [
    {
      _id: "conv-1",
      type: "conversation",
      content: { target_phrases: ["l'affitto", "la stanza", "il contratto"] },
    },
    { _id: "reflection-1", type: "reflection", content: {} },
  ];
  const results = new Map([
    [
      "conv-1",
      {
        user_turns: 2,
        target_phrases_used: ["l'affitto", "la stanza", "il contratto"],
        messages: [
          { role: "user", content: "l'affitto" },
          { role: "assistant", content: "ok" },
          { role: "user", content: "la stanza e il contratto" },
        ],
      },
    ],
    ["reflection-1", { rating: 3, answer: "ok" }],
  ]);

  assert.deepEqual(evaluateGoldContract(exercises, results), {
    usedTargets: 3,
    userTurns: 2,
    completedAll: true,
    checkpointPassed: false,
    contractStatus: "partial",
  });
});
