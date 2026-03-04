import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
  }
  return _openai;
}

interface CorrectionCard {
  it: string;
  en: string;
  errorCategory?: string;
}

interface EnrichedCard {
  it: string;
  en: string;
}

/**
 * Takes correction cards with weak explanations and returns enriched versions
 * with proper grammar explanations from OpenAI.
 */
export async function POST(req: NextRequest) {
  try {
    const { cards } = (await req.json()) as { cards: CorrectionCard[] };
    if (!cards?.length) {
      return NextResponse.json({ enriched: [] });
    }

    // Batch up to 10 cards per request to keep costs down
    const batch = cards.slice(0, 10);

    const prompt = `You are an Italian grammar expert helping A2-B1 learners.

For each correction card below, write a concise but helpful explanation in English (1-2 sentences max) that explains WHY the Italian form is correct. Include the grammar rule or pattern.

Cards:
${batch.map((c, i) => `${i + 1}. Italian: "${c.it}" | Current explanation: "${c.en}" | Category: ${c.errorCategory || "general"}`).join("\n")}

Respond with a JSON array of objects, each with "index" (1-based) and "explanation" (the improved explanation). Example:
[{"index": 1, "explanation": "The verb 'organizzare' keeps double Z in all conjugations: organizzo, organizzi, organizza."}]

Only return the JSON array, no other text.`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content || "[]";
    // Extract JSON from response (handle markdown code blocks)
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const enrichments: { index: number; explanation: string }[] = JSON.parse(jsonStr);

    const enriched: EnrichedCard[] = batch.map((card, i) => {
      const match = enrichments.find((e) => e.index === i + 1);
      return {
        it: card.it,
        en: match?.explanation || card.en,
      };
    });

    return NextResponse.json({ enriched });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Enrich errors:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
