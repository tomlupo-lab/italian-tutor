import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
  }
  return _openai;
}

interface ErrorContext {
  it: string;
  en: string;
  errorCategory?: string;
  example?: string;
}

/**
 * Generates practice exercises from recent errors or for general practice.
 * Returns exercises in the same schema as the exercise engine.
 *
 * Supports types: cloze, pattern_drill, speed_translation
 * (These work best for AI generation — word_builder needs careful ordering,
 * error_hunt needs realistic Italian errors, conversation/reflection are separate flows)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const errors: ErrorContext[] = body.errors || [];
    const count: number = body.count || 5;
    const types: string[] = body.types || ["cloze", "pattern_drill", "speed_translation"];
    const level: string = body.level || "A2";

    const errorContext = errors.length > 0
      ? `\n\nThe student recently made these mistakes — generate exercises that target these weak areas:
${errors.map((e, i) => `${i + 1}. "${e.it}" (${e.en}) [${e.errorCategory || "general"}]${e.example ? ` Example: "${e.example}"` : ""}`).join("\n")}`
      : "";

    const prompt = `You are an Italian language exercise generator for ${level} level learners.

Generate exactly ${count} exercises. Mix the following types: ${types.join(", ")}.${errorContext}

For each exercise, use one of these exact JSON schemas:

**cloze** — Fill in the blank with 4 options:
{"type": "cloze", "content": {"sentence": "Italian sentence with ___ for blank", "blank_index": 0, "options": ["correct", "wrong1", "wrong2", "wrong3"], "correct": 0, "hint": "English hint"}}
Note: "correct" is the INDEX (0-3) of the correct option. Shuffle the correct answer position randomly.

**pattern_drill** — Grammar pattern with 3 fill-in sentences:
{"type": "pattern_drill", "content": {"pattern_name": "Pattern Name", "pattern_description": "Brief description", "sentences": [{"template": "Sentence with ___ blank", "blank": "what goes in blank", "correct": "correct answer", "hint": "hint"}, ...]}}

**speed_translation** — Translate from English with 4 Italian options:
{"type": "speed_translation", "content": {"sentences": [{"source": "English sentence", "options": ["correct Italian", "wrong1", "wrong2", "wrong3"], "correct": 0}], "time_limit_seconds": 30}}
Note: "correct" is the INDEX (0-3). Include 3-4 sentences per exercise. Shuffle correct answer positions.

Rules:
- Use natural, everyday Italian appropriate for ${level}
- Each exercise should teach something useful
- Vary the vocabulary and grammar points
- For options, make distractors plausible (common mistakes)
- If targeting errors, create exercises around those specific patterns

Return a JSON array of exercise objects. Only return the JSON array, no other text.`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content || "[]";
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const exercises = JSON.parse(jsonStr);

    // Add order and metadata to each exercise
    const enriched = exercises.map((ex: { type: string; content: unknown }, i: number) => ({
      _id: `practice-${Date.now()}-${i}`,
      date: new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" }),
      type: ex.type,
      order: i,
      content: ex.content,
      difficulty: level,
      completed: false,
      source: "ai-practice",
    }));

    return NextResponse.json({ exercises: enriched });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Generate practice:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
