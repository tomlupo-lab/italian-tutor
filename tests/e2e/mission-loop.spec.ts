import { test, expect, type Page } from "@playwright/test";

const CLOZE_ANSWERS: Record<string, string> = {
  "camera è silenziosa.": "La",
  "appartamento in centro.": "un",
  "stazione alle sei.": "alla",
};

const PATTERN_ANSWERS: Record<string, string> = {
  "Vado ___ stazione dopo la riunione.": "alla",
  "Il documento è ___ scrivania.": "sulla",
  "L'appuntamento è ___ maggio.": "a",
  "Ho bisogno di ___ scritta dal responsabile.": "una conferma",
  "Prima di partire controllo ___ esatto.": "il binario",
  "Per chiudere la pratica manca ___ firmato.": "il modulo",
};

const SPEED_ANSWERS: Record<string, string> = {
  "Is the wifi included?": "Il wifi è incluso?",
  "When can I visit the room?": "Quando posso visitare la stanza?",
};

const WORD_BUILDER_ANSWERS: Array<{ prompt: string; words: string[] }> = [
  {
    prompt: "How much is the monthly rent",
    words: ["Quanto", "costa", "l'affitto", "al", "mese"],
  },
  {
    prompt: "Are the bills included in the price",
    words: ["Le", "spese", "sono", "incluse", "nel", "prezzo"],
  },
];

function normalizeExerciseText(text: string) {
  return text.replace(/\u00a0/g, " ").replace(/_+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

async function activateFirstMission(page: Page) {
  await page.goto("/missions");
  await page.getByRole("button", { name: "Set active" }).first().click();
  await expect(page.getByText("Active mission:")).toBeVisible();
}

async function readMissionProgress(page: Page) {
  await expect(page.getByText("Mission progress")).toBeVisible();
  const text = await page.locator("main").innerText();
  const match = text.match(/Mission progress\s+(\d+)\s*\/\s*(\d+)/i);
  if (!match) throw new Error(`Could not parse mission progress from: ${text}`);
  return { done: Number(match[1]), total: Number(match[2]) };
}

async function readTierProgress(page: Page, tier: "Bronze" | "Silver" | "Gold") {
  const button = page.getByRole("button", { name: new RegExp(`${tier} .*PROGRESS`, "i") });
  await expect(button).toBeVisible();
  const label = (await button.innerText()).replace(/\s+/g, " ");
  const match = label.match(/PROGRESS\s+(\d+)\/(\d+)/i);
  if (!match) throw new Error(`Could not parse ${tier} progress from: ${label}`);
  return { done: Number(match[1]), total: Number(match[2]) };
}

async function returnHomeFromSummary(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await expect(page.getByText("Mission progress")).toBeVisible({ timeout: 30000 });
}

async function completeBronze(page: Page, initialMissionDone: number, initialBronzeDone: number) {
  await page.goto("/session/2026-03-10?mode=quick");
  await expect(page.getByText("Bronze Cards")).toBeVisible();
  await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
    for (let i = 0; i < 15; i += 1) {
      const reveal = Array.from(document.querySelectorAll('[role="button"]')).find(
        (element) => element.getAttribute("aria-label") === "Reveal card answer",
      ) as HTMLElement | undefined;
      if (!reveal) throw new Error("Reveal card button not found");
      reveal.click();

      for (let j = 0; j < 15; j += 1) {
        await sleep(120);
        if (Array.from(document.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Good")) {
          break;
        }
      }

      const good = Array.from(document.querySelectorAll("button")).find(
        (button) => button.textContent?.trim() === "Good",
      ) as HTMLButtonElement | undefined;
      if (!good) throw new Error("Good button not found");
      good.click();

      for (let j = 0; j < 40; j += 1) {
        await sleep(150);
        if (document.body.innerText.includes("Session Complete!")) return;
        if (document.body.innerText.includes(" / 15 cards")) break;
      }
    }
  });
  await expect(page.getByRole("heading", { name: "Session Complete!" })).toBeVisible();
  await returnHomeFromSummary(page);
  const mission = await readMissionProgress(page);
  const bronze = await readTierProgress(page, "Bronze");
  expect(mission.done).toBe(initialMissionDone + 15);
  expect(bronze.done).toBe(initialBronzeDone + 15);
}

async function answerWordBuilder(page: Page, mainText: string) {
  const match = WORD_BUILDER_ANSWERS.find(({ prompt }) => mainText.includes(prompt));
  if (!match) {
    throw new Error(`Unknown word builder prompt: ${mainText}`);
  }

  for (const word of match.words) {
    await page.getByRole("button", { name: word, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
}

async function completeSilver(page: Page, initialMissionDone: number, initialSilverDone: number) {
  await page.goto("/session/2026-03-10?mode=standard");
  await expect(page.getByText("Silver Session")).toBeVisible();

  while (!(await page.getByRole("heading", { name: "Session Complete!" }).isVisible().catch(() => false))) {
    if (await page.getByText("Tap sentences that contain errors").isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Il stanza è disponibile subito." }).click();
      await page.getByRole("button", { name: /Continue with 1 flagged/ }).click();
      await page.getByPlaceholder("Type the corrected sentence...").fill("La stanza è disponibile subito.");
      await page.getByRole("button", { name: "Submit corrections" }).click();
      await page.waitForTimeout(3200);
      continue;
    }

    if (await page.getByPlaceholder("Type your answer...").isVisible().catch(() => false)) {
      const mainText = await page.locator("main").innerText();
      const normalizedMainText = normalizeExerciseText(mainText);
      const match = Object.keys(PATTERN_ANSWERS).find((prompt) =>
        normalizedMainText.includes(normalizeExerciseText(prompt)),
      );
      if (!match) throw new Error(`Unknown pattern prompt: ${mainText}`);
      await page.getByPlaceholder("Type your answer...").fill(PATTERN_ANSWERS[match]);
      await page.getByRole("button", { name: "Check" }).click();
      await page.waitForTimeout(900);
      continue;
    }

    const mainText = await page.locator("main").innerText();
    if (mainText.includes("Saving session")) {
      await page.waitForTimeout(1000);
      continue;
    }

    if (mainText.includes("How much is the monthly rent") || mainText.includes("Are the bills included in the price")) {
      await answerWordBuilder(page, mainText);
      await page.waitForTimeout(900);
      continue;
    }

    const speedPrompt = Object.keys(SPEED_ANSWERS).find((prompt) => mainText.includes(prompt));
    if (speedPrompt) {
      await page.getByRole("button", { name: SPEED_ANSWERS[speedPrompt], exact: true }).click();
      await page.waitForTimeout(700);
      continue;
    }

    const clozePrompt = Object.keys(CLOZE_ANSWERS).find((prompt) => mainText.includes(prompt));
    if (clozePrompt) {
      await page.getByRole("button", { name: CLOZE_ANSWERS[clozePrompt], exact: true }).click();
      await page.waitForTimeout(900);
      continue;
    }

    throw new Error(`Unknown Silver state: ${mainText}`);
  }

  await expect(page.getByText("Finish all Silver exercises")).toBeVisible();
  await returnHomeFromSummary(page);
  const mission = await readMissionProgress(page);
  const silver = await readTierProgress(page, "Silver");
  expect(mission.done).toBe(initialMissionDone + 9);
  expect(silver.done).toBe(initialSilverDone + 9);
}

async function completeGold(page: Page, initialMissionDone: number, initialGoldDone: number) {
  await page.goto("/session/2026-03-10?mode=deep");
  await expect(page.getByText("Gold Session")).toBeVisible();
  const assistantAudioButtons = page.getByRole("button", { name: "Play message audio" });

  await page.getByPlaceholder("Scrivi in italiano...").click();
  await page.keyboard.type("Ciao Marco, confronto due annunci. L'affitto, la stanza e il contratto mi interessano. Qual e la zona?");
  await page.keyboard.press("Enter");
  await expect(assistantAudioButtons).toHaveCount(2, { timeout: 20000 });
  await expect(page.getByText("Marco is replying...")).not.toBeVisible({ timeout: 20000 });

  await page.getByPlaceholder("Scrivi in italiano...").click();
  await page.keyboard.type("Nel primo annuncio l'affitto e 550 euro in centro con contratto transitorio. Nel secondo la stanza e in periferia con affitto a 420 euro e contratto annuale.");
  await page.keyboard.press("Enter");
  await expect(assistantAudioButtons).toHaveCount(3, { timeout: 20000 });
  await expect(page.getByRole("button", { name: "End conversation" })).toBeVisible();
  await page.getByRole("button", { name: "End conversation" }).click();

  await page.locator("main button").nth(2).click();
  await page.getByPlaceholder("Write your thoughts...").fill("Confermare le spese e il tempo per decidere era la parte piu difficile.");
  await page.getByRole("button", { name: "Complete Session" }).click();

  await expect(page.getByRole("heading", { name: "Session Complete!" })).toBeVisible();
  await expect(page.getByText("Use at least 2 target phrases in conversation")).toBeVisible();
  await expect(page.locator("span").filter({ hasText: /^3\/2 · met$/ })).toBeVisible();
  await expect(page.locator("span").filter({ hasText: /^2\/4 · missed$/ })).toBeVisible();

  await returnHomeFromSummary(page);
  const mission = await readMissionProgress(page);
  const gold = await readTierProgress(page, "Gold");
  expect(mission.done).toBe(initialMissionDone + 1);
  expect(gold.done).toBe(initialGoldDone + 1);
}

test("A1 mission loop persists Bronze, Silver, and Gold progress end to end", async ({ page }) => {
  await activateFirstMission(page);
  await page.goto("/");
  const missionStart = await readMissionProgress(page);
  const bronzeStart = await readTierProgress(page, "Bronze");
  const silverStart = await readTierProgress(page, "Silver");
  const goldStart = await readTierProgress(page, "Gold");

  await completeBronze(page, missionStart.done, bronzeStart.done);
  await completeSilver(page, missionStart.done + 15, silverStart.done);
  await completeGold(page, missionStart.done + 24, goldStart.done);
});
