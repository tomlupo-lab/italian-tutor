import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
  }
  return _openai;
}

const TOPIC_PROMPTS: Record<string, { name: string; question: string }> = {
  sport: { name: "Sport e fuoriclasse", question: "Chi è il tuo sportivo preferito e perché lo consideri un fuoriclasse?" },
  routine: { name: "La vita quotidiana", question: "Raccontami della tua giornata tipica. Cosa fai dalla mattina alla sera?" },
  food: { name: "Cibo e ristoranti", question: "Qual è il tuo piatto preferito? Ti piace cucinare o preferisci andare al ristorante?" },
  travel: { name: "Viaggi e vacanze", question: "Qual è il viaggio più bello che hai fatto? Dove vorresti andare?" },
  work: { name: "Lavoro e carriera", question: "Cosa fai per lavoro? Come ti trovi? Cosa ti piace del tuo lavoro?" },
  tech: { name: "Tecnologia e futuro", question: "Come pensi che la tecnologia cambierà la nostra vita nei prossimi anni?" },
  health: { name: "Salute e benessere", question: "Cosa fai per mantenerti in forma? Quanto è importante la salute per te?" },
  culture: { name: "Cultura italiana", question: "Cosa ti affascina della cultura italiana? Hai un film o libro italiano preferito?" },
};

function buildSystemPrompt(topicId: string): string {
  const topic = TOPIC_PROMPTS[topicId] || TOPIC_PROMPTS.sport;
  return `You are Marco, an Italian language tutor from Rome. You're patient but direct, with a good sense of humor. You speak Italian by default and switch to English only when the student is stuck. You ask one question at a time, wait for the response, give a brief correction if needed, then ask the next question. Keep corrections short and encouraging. The student is at A2-B1 level.

Current topic: "${topic.name}"
Start with this question: "${topic.question}"

Rules:
- Speak Italian 80-90% of the time
- Ask ONE question, then wait
- If the student makes an error, give a SHORT correction (1-2 sentences max), then move on
- Be encouraging but honest
- Use vocab from the current topic naturally
- After 6-8 exchanges, wrap up with "Ottimo lavoro! Basta per oggi."
- When wrapping up, include a JSON block at the end with this exact format:
\`\`\`json
{"done": true, "errors": [{"original": "...", "corrected": "...", "explanation": "..."}], "newPhrases": ["phrase1", "phrase2"], "grammarTip": "One grammar tip relevant to today's conversation"}
\`\`\``;
}

function buildScenarioPrompt(params: {
  scenarioTitle: string;
  scenarioSetup: string;
  scenarioGoal: string;
  targetPhrases: { it: string; en: string }[];
  grammarFocus: string;
  level: string;
  unitNumber: number;
}): string {
  const phraseList = params.targetPhrases
    .map((p) => `- "${p.it}" (${p.en})`)
    .join("\n");

  return `You are Marco, a friendly Roman guy in his 30s. You're warm, encouraging, witty, and you love helping people learn Italian. You have a slight Roman accent and personality.

## Scenario
You are playing a character in this scenario: "${params.scenarioTitle}"
Setup: ${params.scenarioSetup}
The student's goal: ${params.scenarioGoal}

## Rules
- Stay in character for the scenario. Be natural, like a real conversation.
- Speak Italian appropriate for ${params.level} level
- Use simple, clear Italian. Avoid complex grammar beyond ${params.level}.
- Grammar focus for this unit: ${params.grammarFocus}
- Be warm and encouraging. This is meant to be fun!
- Ask ONE question or make ONE statement at a time, then wait for the student's response
- Keep your responses to 1-3 sentences max

## Target Vocabulary
The student should practice using these phrases from Unit ${params.unitNumber}:
${phraseList}

Try to naturally create situations where the student can use these phrases. If they use a target phrase correctly, acknowledge it naturally (don't be overly enthusiastic about it).

## Error Correction
When the student makes a grammatical error:
1. First, respond naturally to what they said (showing you understood)
2. Then include a subtle correction in your response by using the correct form naturally
3. Also include a JSON block with the correction details:
\`\`\`json
{"correction": {"original": "what they wrote wrong", "corrected": "the correct version", "explanation": "brief explanation in English"}}
\`\`\`

## Ending the Conversation
After 6-8 exchanges (student messages), wrap up naturally ("È stato un piacere parlare con te! Alla prossima!") and include:
\`\`\`json
{"done": true, "errors": [{"original": "...", "corrected": "...", "explanation": "..."}], "newPhrases": ["any new phrases the student learned"], "grammarTip": "one tip about ${params.grammarFocus}"}
\`\`\`

Do NOT start the conversation — the opening line has already been sent. Wait for the student's first message and respond to it.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, topic, lessonType } = body;

    let systemPrompt: string;

    if (body.systemPrompt) {
      // Custom system prompt (from adaptive exercise engine)
      systemPrompt = body.systemPrompt;
    } else if (lessonType === "structured_unit" && body.scenarioTitle) {
      systemPrompt = buildScenarioPrompt({
        scenarioTitle: body.scenarioTitle,
        scenarioSetup: body.scenarioSetup || "",
        scenarioGoal: body.scenarioGoal || "",
        targetPhrases: body.targetPhrases || [],
        grammarFocus: body.grammarFocus || "",
        level: body.level || "A2",
        unitNumber: body.unitNumber || 1,
      });
    } else {
      systemPrompt = buildSystemPrompt(topic || "sport");
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
