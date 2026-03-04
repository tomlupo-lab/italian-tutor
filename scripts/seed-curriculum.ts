import { readFileSync } from "fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(CONVEX_URL);

interface Unit {
  unit: number;
  level: string;
  theme: string;
  theme_en: string;
  vocab: { it: string; en: string; example: string }[];
}

function themeToTag(theme: string): string {
  return theme.toLowerCase()
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function main() {
  const units: Unit[] = JSON.parse(
    readFileSync("curriculum/units.json", "utf-8")
  );

  const cards = units.flatMap((u) =>
    u.vocab.map((v) => ({
      it: v.it,
      en: v.en,
      example: v.example,
      tag: themeToTag(u.theme),
      level: u.level,
    }))
  );

  console.log(`Prepared ${cards.length} cards from ${units.length} units`);

  const BATCH_SIZE = 50;
  let totalAdded = 0;
  let totalSkipped = 0;

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    const result = await client.mutation(api.seed.seedCurriculum, { cards: batch });
    totalAdded += result.added;
    totalSkipped += result.skipped;
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: +${result.added} added, ${result.skipped} skipped`);
  }

  console.log(`Done: ${totalAdded} added, ${totalSkipped} skipped`);
}

main().catch(console.error);
