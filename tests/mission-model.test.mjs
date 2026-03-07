import test from "node:test";
import assert from "node:assert/strict";

function computeCreditMultiplier(scorePercent, missionMinScore, duplicateSameDay) {
  const qualityMultiplier =
    scorePercent >= missionMinScore
      ? 1
      : scorePercent >= Math.max(55, missionMinScore - 10)
        ? 0.7
        : 0.4;
  const antiFarmMultiplier = duplicateSameDay ? 0.35 : 1;
  return qualityMultiplier * antiFarmMultiplier;
}

function applyCredit(raw, multiplier) {
  if (raw <= 0) return 0;
  return Math.max(0, Math.round(raw * multiplier));
}

function shouldAwardCheckpoint({ scorePercent, minScore, duplicateSameDay, alreadyCompleted }) {
  return !alreadyCompleted && !duplicateSameDay && scorePercent >= minScore;
}

test("credit multiplier keeps full credit on high quality unique session", () => {
  const m = computeCreditMultiplier(82, 78, false);
  assert.equal(m, 1);
  assert.equal(applyCredit(10, m), 10);
});

test("duplicate same-day session gets anti-farming penalty", () => {
  const m = computeCreditMultiplier(82, 78, true);
  assert.equal(m, 0.35);
  assert.equal(applyCredit(10, m), 4);
});

test("low-quality session gets reduced credit even if unique", () => {
  const m = computeCreditMultiplier(60, 78, false);
  assert.equal(m, 0.4);
  assert.equal(applyCredit(10, m), 4);
});

test("checkpoint awarded only when score gate is met and not duplicate", () => {
  assert.equal(
    shouldAwardCheckpoint({
      scorePercent: 78,
      minScore: 75,
      duplicateSameDay: false,
      alreadyCompleted: false,
    }),
    true,
  );

  assert.equal(
    shouldAwardCheckpoint({
      scorePercent: 78,
      minScore: 75,
      duplicateSameDay: true,
      alreadyCompleted: false,
    }),
    false,
  );
});
