import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { MISSIONS } from "./progressionCatalog";

type GeneratedRow = {
  date: string;
  type: string;
  order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  skillId: string;
  missionId: string;
  tier: "bronze" | "silver" | "gold";
  difficulty: string;
  source: string;
  completed: boolean;
  checkpointId?: string;
  variantKey?: string;
};

function warsawToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

/** Deterministic hash for stable, date-based shuffling */
function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function stableShuffle<T>(arr: T[], seed: string): T[] {
  return arr
    .map((item, i) => ({ item, sort: stableHash(seed + i) }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.item);
}

function authoredCountForType(entries: GeneratedRow[], type: string) {
  return entries.filter((entry) => entry.type === type).length;
}

// ── Vocab banks by tag ──────────────────────────────────────────────
const TAG_VOCAB: Record<string, Array<{ it: string; en: string; example?: string }>> = {
  home: [
    { it: "l'appartamento", en: "the apartment", example: "L'appartamento e vicino alla metro." },
    { it: "l'affitto", en: "the rent", example: "Quanto costa l'affitto al mese?" },
    { it: "il contratto", en: "the contract", example: "Il contratto dura dodici mesi." },
    { it: "il proprietario", en: "the landlord", example: "Il proprietario arriva tra poco." },
    { it: "la stanza", en: "the room", example: "La stanza e luminosa e silenziosa." },
    { it: "il bagno", en: "the bathroom", example: "Il bagno e privato o condiviso?" },
    { it: "la cucina", en: "the kitchen", example: "La cucina e condivisa con un altro inquilino." },
    { it: "il soggiorno", en: "the living room", example: "Il soggiorno e gia arredato." },
    { it: "le spese", en: "the extra monthly costs", example: "Le spese mensili sono incluse?" },
    { it: "il deposito cauzionale", en: "the security deposit", example: "Il deposito cauzionale e di due mensilita." },
    { it: "il quartiere", en: "the neighborhood", example: "Il quartiere e tranquillo la sera." },
    { it: "il piano", en: "the floor of a building", example: "L'appartamento e al terzo piano." },
  ],
  food: [
    { it: "il menù", en: "the menu" },
    { it: "il conto", en: "the bill" },
    { it: "il piatto", en: "the dish" },
    { it: "il cameriere", en: "the waiter" },
    { it: "l'antipasto", en: "the appetizer" },
    { it: "il primo", en: "the first course" },
    { it: "il secondo", en: "the second course" },
    { it: "il dolce", en: "the dessert" },
    { it: "il vino", en: "the wine" },
    { it: "l'acqua", en: "the water" },
    { it: "la prenotazione", en: "the reservation" },
    { it: "il coperto", en: "the cover charge" },
  ],
  travel: [
    { it: "il treno", en: "the train" },
    { it: "il biglietto", en: "the ticket" },
    { it: "il binario", en: "the platform" },
    { it: "la partenza", en: "the departure" },
    { it: "l'arrivo", en: "the arrival" },
    { it: "lo sciopero", en: "the strike" },
    { it: "la coincidenza", en: "the connection" },
    { it: "la stazione", en: "the station" },
    { it: "l'orario", en: "the timetable" },
    { it: "il ritardo", en: "the delay" },
    { it: "la fermata", en: "the stop" },
    { it: "il viaggio", en: "the trip" },
  ],
  work: [
    { it: "l'ufficio", en: "the office" },
    { it: "la riunione", en: "the meeting" },
    { it: "il collega", en: "the colleague" },
    { it: "il progetto", en: "the project" },
    { it: "la pausa", en: "the break" },
    { it: "il capo", en: "the boss" },
    { it: "il lavoro", en: "the work/job" },
    { it: "la scrivania", en: "the desk" },
    { it: "la mail", en: "the email" },
    { it: "il compito", en: "the task" },
    { it: "lo stipendio", en: "the salary" },
    { it: "il contratto", en: "the contract" },
  ],
  shopping: [
    { it: "il negozio", en: "the shop" },
    { it: "la taglia", en: "the size" },
    { it: "il prezzo", en: "the price" },
    { it: "lo sconto", en: "the discount" },
    { it: "il camerino", en: "the fitting room" },
    { it: "la cassa", en: "the register" },
    { it: "la carta", en: "the card" },
    { it: "i contanti", en: "the cash" },
    { it: "il vestito", en: "the dress/suit" },
    { it: "le scarpe", en: "the shoes" },
    { it: "la borsa", en: "the bag" },
    { it: "il cambio", en: "the exchange" },
  ],
  health: [
    { it: "la farmacia", en: "the pharmacy" },
    { it: "la medicina", en: "the medicine" },
    { it: "la ricetta", en: "the prescription" },
    { it: "il dolore", en: "the pain" },
    { it: "la febbre", en: "the fever" },
    { it: "il mal di testa", en: "the headache" },
    { it: "la pastiglia", en: "the pill" },
    { it: "i sintomi", en: "the symptoms" },
    { it: "l'allergia", en: "the allergy" },
    { it: "il medico", en: "the doctor" },
    { it: "la visita", en: "the visit/checkup" },
    { it: "la dose", en: "the dose" },
  ],
  social: [
    { it: "l'appuntamento", en: "the appointment/date" },
    { it: "l'invito", en: "the invitation" },
    { it: "l'amico", en: "the friend" },
    { it: "la festa", en: "the party" },
    { it: "il fine settimana", en: "the weekend" },
    { it: "il messaggio", en: "the message" },
    { it: "il compleanno", en: "the birthday" },
    { it: "la cena", en: "the dinner" },
    { it: "il bar", en: "the bar/café" },
    { it: "il regalo", en: "the gift" },
    { it: "il programma", en: "the plan" },
    { it: "il posto", en: "the place" },
  ],
  routine: [
    { it: "la sveglia", en: "the alarm" },
    { it: "la colazione", en: "the breakfast" },
    { it: "il pranzo", en: "the lunch" },
    { it: "la mattina", en: "the morning" },
    { it: "il pomeriggio", en: "the afternoon" },
    { it: "la sera", en: "the evening" },
    { it: "la notte", en: "the night" },
    { it: "l'abitudine", en: "the habit" },
    { it: "la giornata", en: "the day" },
    { it: "l'orario", en: "the schedule" },
    { it: "il tempo libero", en: "the free time" },
    { it: "la spesa", en: "the groceries" },
  ],
};

// ── Cloze templates by grammar focus ────────────────────────────────
const CLOZE_BANK: Array<{
  sentence: string;
  options: [string, string, string, string];
  correct: number;
  hint: string;
  focus: string[];
}> = [
  // Article / Gender / Number
  { sentence: "Vorrei ___ caffè, per favore.", options: ["un", "una", "uno", "un'"], correct: 0, hint: "masculine singular", focus: ["article_gender_number"] },
  { sentence: "___ casa è molto bella.", options: ["La", "Il", "Lo", "Le"], correct: 0, hint: "feminine singular", focus: ["article_gender_number"] },
  { sentence: "Ho comprato ___ zaino nuovo.", options: ["uno", "un", "una", "un'"], correct: 0, hint: "'zaino' starts with z", focus: ["article_gender_number"] },
  { sentence: "___ studentessa è brava.", options: ["L'", "La", "Lo", "Le"], correct: 0, hint: "feminine + vowel → elision", focus: ["article_gender_number"] },
  { sentence: "Abbiamo visto ___ amici.", options: ["degli", "dei", "delle", "gli"], correct: 0, hint: "masc plural partitive + vowel", focus: ["article_gender_number"] },
  // Prepositions
  { sentence: "Vado ___ stazione.", options: ["alla", "nella", "sulla", "dalla"], correct: 0, hint: "direction → a + la", focus: ["preposition"] },
  { sentence: "Il libro è ___ tavolo.", options: ["sul", "nel", "al", "dal"], correct: 0, hint: "on top of → su + il", focus: ["preposition"] },
  { sentence: "Vengo ___ Milano.", options: ["da", "di", "a", "in"], correct: 0, hint: "origin → da", focus: ["preposition"] },
  { sentence: "Abito ___ Italia.", options: ["in", "a", "da", "di"], correct: 0, hint: "country → in", focus: ["preposition"] },
  { sentence: "Il treno parte ___ binario 3.", options: ["dal", "al", "nel", "sul"], correct: 0, hint: "from → da + il", focus: ["preposition"] },
  // Verb conjugation
  { sentence: "Io ___ italiano.", options: ["parlo", "parli", "parla", "parlano"], correct: 0, hint: "1st person -are", focus: ["verb_conjugation"] },
  { sentence: "Loro ___ al ristorante.", options: ["vanno", "va", "vai", "andiamo"], correct: 0, hint: "3rd plural andare", focus: ["verb_conjugation"] },
  { sentence: "Tu ___ l'italiano?", options: ["capisci", "capisco", "capisce", "capite"], correct: 0, hint: "2nd person -ire (isc)", focus: ["verb_conjugation"] },
  { sentence: "Noi ___ la cena alle otto.", options: ["prepariamo", "preparano", "preparo", "preparate"], correct: 0, hint: "1st plural -are", focus: ["verb_conjugation"] },
  { sentence: "Lei ___ molto bene.", options: ["cucina", "cucino", "cucini", "cucinano"], correct: 0, hint: "3rd person -are", focus: ["verb_conjugation"] },
  // Verb tense
  { sentence: "Ieri ___ al cinema.", options: ["sono andato", "vado", "andrò", "andavo"], correct: 0, hint: "yesterday → passato prossimo", focus: ["verb_tense"] },
  { sentence: "Domani ___ a Roma.", options: ["andrò", "sono andato", "andavo", "vado"], correct: 0, hint: "tomorrow → future", focus: ["verb_tense"] },
  { sentence: "Da piccolo ___ sempre al parco.", options: ["andavo", "sono andato", "andrò", "vado"], correct: 0, hint: "habitual past → imperfetto", focus: ["verb_tense"] },
  // Lexical choice
  { sentence: "Mi ___ molto la pizza.", options: ["piace", "piacce", "piaccio", "piaciono"], correct: 0, hint: "piacere + singular noun", focus: ["lexical_choice"] },
  { sentence: "Ho ___ di un consiglio.", options: ["bisogno", "voglia", "paura", "fame"], correct: 0, hint: "need → avere bisogno", focus: ["lexical_choice"] },
  // Agreement
  { sentence: "Le ragazze sono molto ___.", options: ["brave", "bravo", "bravi", "brava"], correct: 0, hint: "fem plural adj", focus: ["agreement"] },
  { sentence: "I libri ___ sono interessanti.", options: ["italiani", "italiano", "italiana", "italiane"], correct: 0, hint: "masc plural adj", focus: ["agreement"] },
];

// ── Word builder templates ──────────────────────────────────────────
const WORD_BUILDER_BANK: Array<{
  target: string;
  translation: string;
  tags: string[];
}> = [
  { target: "Vorrei prenotare un tavolo per due", translation: "I'd like to book a table for two", tags: ["food"] },
  { target: "A che ora parte il treno", translation: "What time does the train leave", tags: ["travel"] },
  { target: "Quanto costa l'affitto al mese", translation: "How much is the rent per month", tags: ["home"] },
  { target: "Mi può dare il conto per favore", translation: "Can you give me the bill please", tags: ["food"] },
  { target: "Dove si trova la fermata", translation: "Where is the stop", tags: ["travel"] },
  { target: "Ho bisogno di una medicina", translation: "I need a medicine", tags: ["health"] },
  { target: "Posso provare questa taglia", translation: "Can I try this size", tags: ["shopping"] },
  { target: "A che ora ci vediamo domani", translation: "What time do we meet tomorrow", tags: ["social"] },
  { target: "La riunione è alle dieci", translation: "The meeting is at ten", tags: ["work"] },
  { target: "Mi scusi non ho capito bene", translation: "Excuse me I didn't understand well", tags: ["general"] },
  { target: "Potrebbe parlare più lentamente", translation: "Could you speak more slowly", tags: ["general"] },
  { target: "Il mio volo è in ritardo", translation: "My flight is delayed", tags: ["travel"] },
  { target: "Dov'è la farmacia più vicina", translation: "Where is the nearest pharmacy", tags: ["health"] },
  { target: "Vorrei cambiare questo vestito", translation: "I'd like to exchange this dress", tags: ["shopping"] },
  { target: "Come si arriva alla stazione", translation: "How do you get to the station", tags: ["travel"] },
  { target: "Di solito mi sveglio alle sette", translation: "Usually I wake up at seven", tags: ["routine"] },
];

// ── Pattern drill templates ─────────────────────────────────────────
const PATTERN_DRILLS: Array<{
  name: string;
  description: string;
  sentences: Array<{ template: string; blank: string; correct: string; hint: string }>;
  focus: string[];
}> = [
  {
    name: "Present tense -are verbs",
    description: "Conjugate regular -are verbs in the present tense",
    sentences: [
      { template: "Io ___ italiano ogni giorno.", blank: "___", correct: "parlo", hint: "parlare, io" },
      { template: "Tu ___ la pasta?", blank: "___", correct: "cucini", hint: "cucinare, tu" },
      { template: "Lui ___ al bar.", blank: "___", correct: "lavora", hint: "lavorare, lui" },
      { template: "Noi ___ musica.", blank: "___", correct: "ascoltiamo", hint: "ascoltare, noi" },
    ],
    focus: ["verb_conjugation"],
  },
  {
    name: "Prepositions of place",
    description: "Choose the correct preposition for location/direction",
    sentences: [
      { template: "Il gatto è ___ il tavolo.", blank: "___", correct: "sotto", hint: "under" },
      { template: "La farmacia è ___ alla banca.", blank: "___", correct: "accanto", hint: "next to" },
      { template: "Il ristorante è ___ la piazza.", blank: "___", correct: "in", hint: "in/on (square)" },
      { template: "Vado ___ casa.", blank: "___", correct: "a", hint: "to (home)" },
    ],
    focus: ["preposition"],
  },
  {
    name: "Passato prossimo with essere",
    description: "Verbs of motion/change take essere as auxiliary",
    sentences: [
      { template: "Maria ___ a Roma ieri.", blank: "___", correct: "è andata", hint: "andare, lei" },
      { template: "I ragazzi ___ presto.", blank: "___", correct: "sono arrivati", hint: "arrivare, loro (m)" },
      { template: "Tu ___ tardi.", blank: "___", correct: "sei partito", hint: "partire, tu (m)" },
      { template: "Le ragazze ___ a casa.", blank: "___", correct: "sono tornate", hint: "tornare, loro (f)" },
    ],
    focus: ["verb_tense"],
  },
  {
    name: "Articulated prepositions",
    description: "Combine preposition + article",
    sentences: [
      { template: "Il libro è ___ studente.", blank: "___", correct: "dello", hint: "di + lo" },
      { template: "Vado ___ cinema.", blank: "___", correct: "al", hint: "a + il" },
      { template: "Torno ___ vacanza.", blank: "___", correct: "dalla", hint: "da + la" },
      { template: "La chiave è ___ cassetto.", blank: "___", correct: "nel", hint: "in + il" },
    ],
    focus: ["preposition", "article_gender_number"],
  },
];

// ── Speed translation prompts ───────────────────────────────────────
const SPEED_TRANSLATION_BANK: Array<{
  tags: string[];
  sentences: Array<{ source: string; options: [string, string, string, string]; correct: number }>;
}> = [
  {
    tags: ["travel"],
    sentences: [
      { source: "What platform does the train leave from?", options: ["Da quale binario parte il treno?", "Quanto costa il treno?", "Dov'è il biglietto del treno?", "Il treno arriva domani?"], correct: 0 },
      { source: "The train is delayed by twenty minutes.", options: ["Il treno è in ritardo di venti minuti.", "Il treno parte alle venti minuti.", "Il treno è sul binario venti.", "Il treno costa venti minuti."], correct: 0 },
      { source: "I need a ticket for Rome.", options: ["Ho bisogno di un biglietto per Roma.", "Vorrei una stanza a Roma.", "Cerco un tavolo per Roma.", "Posso cambiare Roma?"], correct: 0 },
    ],
  },
  {
    tags: ["food", "social"],
    sentences: [
      { source: "I would like a table for two.", options: ["Vorrei un tavolo per due.", "Vorrei il conto per due.", "Cerco due menù per favore.", "Posso pagare in due?"], correct: 0 },
      { source: "Can we see the menu?", options: ["Possiamo vedere il menù?", "Possiamo pagare il menù?", "Vediamo il tavolo adesso?", "Prendiamo due menù domani?"], correct: 0 },
      { source: "The bill, please.", options: ["Il conto, per favore.", "Il menù, per favore.", "La prenotazione, per favore.", "La cucina, per favore."], correct: 0 },
    ],
  },
  {
    tags: ["home", "shopping"],
    sentences: [
      { source: "How much is the monthly rent?", options: ["Quanto costa l'affitto al mese?", "Quanto costa la stanza oggi?", "Quanto è grande il contratto?", "Quanto dura il quartiere?"], correct: 0 },
      { source: "Are utilities included?", options: ["Le spese sono incluse?", "Le scarpe sono incluse?", "La cucina è chiusa?", "Le chiavi sono aperte?"], correct: 0 },
      { source: "Can I try this size?", options: ["Posso provare questa taglia?", "Posso cambiare questa stazione?", "Posso vedere questo contratto?", "Posso pagare questa camicia?"], correct: 0 },
    ],
  },
  {
    tags: ["health", "work"],
    sentences: [
      { source: "I have had a headache since this morning.", options: ["Ho mal di testa da stamattina.", "Ho un treno da stamattina.", "Ho il conto da stamattina.", "Ho un ufficio da stamattina."], correct: 0 },
      { source: "How often do I take this medicine?", options: ["Ogni quanto prendo questa medicina?", "Quanto costa questa medicina?", "Dove metto questa medicina?", "Quando parte questa medicina?"], correct: 0 },
      { source: "The meeting starts at ten.", options: ["La riunione inizia alle dieci.", "La riunione costa alle dieci.", "La riunione cambia alle dieci.", "La riunione parla alle dieci."], correct: 0 },
    ],
  },
];

// ── Error hunt sets ─────────────────────────────────────────────────
const ERROR_HUNT_BANK: Array<{
  focus: string[];
  sentences: Array<{
    text: string;
    has_error: boolean;
    corrected: string;
    explanation: string;
  }>;
}> = [
  {
    focus: ["article_gender_number", "agreement"],
    sentences: [
      { text: "La mio camera e piccola ma luminosa.", has_error: true, corrected: "La mia camera è piccola ma luminosa.", explanation: "Possessive and accented verb form are wrong." },
      { text: "I biglietti sono sul tavolo.", has_error: false, corrected: "I biglietti sono sul tavolo.", explanation: "The sentence is already correct." },
      { text: "Le ragazze sono molto simpatico.", has_error: true, corrected: "Le ragazze sono molto simpatiche.", explanation: "Adjective must agree in feminine plural." },
    ],
  },
  {
    focus: ["preposition", "instruction_misread"],
    sentences: [
      { text: "Vado in stazione alle otto.", has_error: true, corrected: "Vado alla stazione alle otto.", explanation: "Direction to a place needs articulated preposition." },
      { text: "Il treno parte dal binario tre.", has_error: false, corrected: "Il treno parte dal binario tre.", explanation: "The sentence is already correct." },
      { text: "Scendo alla prossima fermata e cambio in Roma.", has_error: true, corrected: "Scendo alla prossima fermata e cambio a Roma.", explanation: "Cities usually take a, not in." },
    ],
  },
  {
    focus: ["verb_tense", "verb_conjugation"],
    sentences: [
      { text: "Ieri vado al lavoro in autobus.", has_error: true, corrected: "Ieri sono andato al lavoro in autobus.", explanation: "Completed past event needs passato prossimo." },
      { text: "Domani partiamo presto.", has_error: false, corrected: "Domani partiamo presto.", explanation: "The sentence is already correct." },
      { text: "Noi prende il treno alle sette.", has_error: true, corrected: "Noi prendiamo il treno alle sette.", explanation: "Verb conjugation must match noi." },
    ],
  },
  {
    focus: ["lexical_choice", "lexical_gap", "negation_reversal"],
    sentences: [
      { text: "Non ho nessun fame adesso.", has_error: true, corrected: "Non ho fame adesso.", explanation: "The phrase avere fame does not take nessun here." },
      { text: "Mi serve una medicina senza zucchero.", has_error: false, corrected: "Mi serve una medicina senza zucchero.", explanation: "The sentence is already correct." },
      { text: "Devi prendere questa pastiglia mai a stomaco vuoto.", has_error: true, corrected: "Non devi prendere questa pastiglia a stomaco vuoto.", explanation: "Negation placement changes the safety meaning." },
    ],
  },
];

// ── Conversation scenarios ──────────────────────────────────────────
const CONVERSATION_BANK: Array<{
  scenario: string;
  target_phrases: string[];
  grammar_focus: string;
  system_prompt: string;
  tags: string[];
  difficulty: string;
}> = [
  {
    scenario: "You're at a restaurant in Rome ordering dinner for two. Your guest is vegetarian.",
    target_phrases: ["Vorrei", "per favore", "senza", "il conto", "posso avere"],
    grammar_focus: "conditional + polite requests",
    system_prompt: "You are a waiter at a Roman trattoria. Be helpful, speak naturally in Italian. If the student errs, model the correct form.",
    tags: ["food", "restaurant"],
    difficulty: "A1",
  },
  {
    scenario: "At Florence train station, your train is cancelled due to a strike. Find an alternative.",
    target_phrases: ["A che ora", "il binario", "andata e ritorno", "in ritardo", "la coincidenza"],
    grammar_focus: "questions + time expressions",
    system_prompt: "You are a ticket agent at Firenze SMN. Some trains are delayed. Help the student, speak naturally in Italian.",
    tags: ["travel"],
    difficulty: "A1",
  },
  {
    scenario: "Visiting an apartment in Milan. Ask the landlord about rent, utilities, and contract.",
    target_phrases: ["Quanto costa", "le spese", "il contratto", "incluso", "quando"],
    grammar_focus: "questions + numbers + conditions",
    system_prompt: "You are a landlord showing a €800/month apartment. Utilities separate. Be friendly but businesslike. Speak Italian.",
    tags: ["home", "housing"],
    difficulty: "A1",
  },
  {
    scenario: "At a pharmacy late at night with a headache and fever. Describe symptoms and understand instructions.",
    target_phrases: ["Ho mal di", "da quanto tempo", "la dose", "ogni", "prima di"],
    grammar_focus: "body parts + frequency + time",
    system_prompt: "You are a pharmacist. Be caring, ask about allergies, explain dosage clearly. Speak Italian.",
    tags: ["health"],
    difficulty: "A1",
  },
  {
    scenario: "Meeting your partner's Italian parents for the first time at a family dinner.",
    target_phrases: ["Piacere", "molto gentile", "da quanto tempo", "mi piace", "complimenti"],
    grammar_focus: "formal/informal register",
    system_prompt: "You are the parent. Be warm but slightly formal. Ask about work, interests, Italian learning. Speak naturally.",
    tags: ["social"],
    difficulty: "A1",
  },
  {
    scenario: "At a clothing store trying to find a birthday gift. You need a specific size and color.",
    target_phrases: ["Cerco", "la taglia", "un altro colore", "quanto costa", "posso provare"],
    grammar_focus: "demonstratives + colors + sizes",
    system_prompt: "You are a shop assistant. Be helpful, suggest alternatives. Speak Italian naturally.",
    tags: ["shopping"],
    difficulty: "A1",
  },
  {
    scenario: "Your first day at an Italian office. Introduce yourself and ask about the schedule.",
    target_phrases: ["Mi chiamo", "a che ora", "la riunione", "il progetto", "dove si trova"],
    grammar_focus: "introductions + time + location",
    system_prompt: "You are a colleague welcoming the new person. Be friendly, show them around. Speak Italian.",
    tags: ["work"],
    difficulty: "A1",
  },
];

// ── Generator mutation ──────────────────────────────────────────────
export const generateExercises = mutation({
  args: {
    date: v.optional(v.string()),
    missionId: v.optional(v.string()),
    replaceExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const date = args.date ?? warsawToday();

    // Resolve active mission
    let missionId = args.missionId;
    if (!missionId) {
      const active = await ctx.db
        .query("userMissionProgress")
        .withIndex("by_learner_active", (q) =>
          q.eq("learnerId", "local").eq("active", true)
        )
        .first();
      missionId = active?.missionId;
    }
    if (!missionId) {
      return { generated: 0, message: "No active mission" };
    }

    const existingForMissionDate = await ctx.db
      .query("exercises")
      .withIndex("by_date", (q) => q.eq("date", date))
      .filter((q) => q.eq(q.field("missionId"), missionId))
      .collect();

    if (args.replaceExisting) {
      for (const row of existingForMissionDate) {
        await ctx.db.delete(row._id);
      }
    } else if (existingForMissionDate.length > 0) {
      return { generated: 0, message: "Exercises already exist for this mission/date" };
    }

    const mission = MISSIONS.find((m) => m.missionId === missionId);
    if (!mission) {
      return { generated: 0, message: `Mission ${missionId} not in catalog` };
    }

    const seed = date + missionId;
    const rows: GeneratedRow[] = [];
    let order = 0;

    const authoredLibrary = await ctx.db
      .query("missionExerciseLibrary")
      .withIndex("by_mission_order", (q) => q.eq("missionId", missionId))
      .collect();

    const authoredRows = stableShuffle(
      authoredLibrary.filter((entry) => entry.active),
      seed + "authored"
    ).map((entry, index) => ({
      date,
      type: entry.type,
      order: index,
      content: entry.content,
      skillId: entry.skillId ?? "task_completion",
      missionId,
      tier: entry.tier,
      difficulty: entry.level,
      source: "mission_topup",
      completed: false,
      checkpointId: entry.checkpointId,
      variantKey: entry.variantKey,
    }));

    rows.push(...authoredRows);
    order = rows.length;

    // ── SRS flashcards (Bronze) ─────────────────────────────────
    const vocabPool: Array<{ it: string; en: string; example?: string; tag: string }> = [];
    const seen = new Set<string>();
    for (const tag of mission.tags) {
      for (const v of TAG_VOCAB[tag] ?? []) {
        if (!seen.has(v.it)) {
          seen.add(v.it);
          vocabPool.push({ ...v, tag });
        }
      }
    }
    const shuffledVocab = stableShuffle(vocabPool, seed + "srs");
    const srsCount = Math.max(0, Math.min(mission.exerciseMix.srs - authoredCountForType(rows, "srs"), shuffledVocab.length, 12));
      for (let i = 0; i < srsCount; i++) {
        rows.push({
          date,
          type: "srs",
          order: order++,
          content: {
            front: shuffledVocab[i].it,
            back: shuffledVocab[i].en,
            example: shuffledVocab[i].example ?? shuffledVocab[i].it,
            tag: shuffledVocab[i].tag,
            direction: "it_to_en",
            level: mission.level,
          },
        skillId: "vocab_core",
        missionId,
        tier: "bronze",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }

    // ── Cloze (Silver) ──────────────────────────────────────────
    const relevantCloze = stableShuffle(
      CLOZE_BANK.filter((c) =>
        c.focus.some((f) => mission.errorFocus.includes(f))
      ),
      seed + "cloze"
    );
    const clozeCount = Math.max(0, Math.min(mission.exerciseMix.cloze - authoredCountForType(rows, "cloze"), relevantCloze.length, 6));
    for (let i = 0; i < clozeCount; i++) {
      const t = relevantCloze[i];
      rows.push({
        date,
        type: "cloze",
        order: order++,
        content: {
          sentence: t.sentence,
          blank_index: 0,
          options: t.options,
          correct: t.correct,
          hint: t.hint,
        },
        skillId: "grammar_forms",
        missionId,
        tier: "silver",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }

    // ── Word builder (Silver) ───────────────────────────────────
    const relevantWB = stableShuffle(
      WORD_BUILDER_BANK.filter(
        (w) =>
          w.tags.some((t) => mission.tags.includes(t)) ||
          w.tags.includes("general")
      ),
      seed + "wb"
    );
    const wbCount = Math.max(0, Math.min(mission.exerciseMix.wordBuilder - authoredCountForType(rows, "word_builder"), relevantWB.length, 4));
    for (let i = 0; i < wbCount; i++) {
      const t = relevantWB[i];
      const words = t.target.split(" ");
      const scrambled = stableShuffle(words, seed + "wbs" + i);
      rows.push({
        date,
        type: "word_builder",
        order: order++,
        content: {
          target_sentence: t.target,
          scrambled_words: scrambled,
          translation: t.translation,
        },
        skillId: "grammar_syntax",
        missionId,
        tier: "silver",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }

    // ── Pattern drills (Silver) ─────────────────────────────────
    const relevantPD = stableShuffle(
      PATTERN_DRILLS.filter((p) =>
        p.focus.some((f) => mission.errorFocus.includes(f))
      ),
      seed + "pd"
    );
    const pdCount = Math.max(0, Math.min(mission.exerciseMix.patternDrill - authoredCountForType(rows, "pattern_drill"), relevantPD.length, 3));
    for (let i = 0; i < pdCount; i++) {
      const t = relevantPD[i];
      rows.push({
        date,
        type: "pattern_drill",
        order: order++,
        content: {
          pattern_name: t.name,
          pattern_description: t.description,
          sentences: t.sentences,
        },
        skillId: "grammar_forms",
        missionId,
        tier: "silver",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }

    // ── Speed translation (Silver) ──────────────────────────────
    const relevantST = stableShuffle(
      SPEED_TRANSLATION_BANK.filter((set) =>
        set.tags.some((tag) => mission.tags.includes(tag))
      ),
      seed + "st"
    );
    const stCount = Math.max(0, Math.min(mission.exerciseMix.speedTranslation - authoredCountForType(rows, "speed_translation"), relevantST.length, 3));
    for (let i = 0; i < stCount; i++) {
      const t = relevantST[i];
      rows.push({
        date,
        type: "speed_translation",
        order: order++,
        content: {
          sentences: t.sentences,
          time_limit_seconds: 30,
        },
        skillId: "listening_literal",
        missionId,
        tier: "silver",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }

    // ── Error hunt (Silver) ──────────────────────────────────────
    const relevantEH = stableShuffle(
      ERROR_HUNT_BANK.filter((set) =>
        set.focus.some((focus) => mission.errorFocus.includes(focus))
      ),
      seed + "eh"
    );
    const ehCount = Math.max(0, Math.min(mission.exerciseMix.errorHunt - authoredCountForType(rows, "error_hunt"), relevantEH.length, 3));
    for (let i = 0; i < ehCount; i++) {
      const t = relevantEH[i];
      rows.push({
        date,
        type: "error_hunt",
        order: order++,
        content: {
          sentences: t.sentences,
        },
        skillId: "reading_comprehension",
        missionId,
        tier: "silver",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }

    // ── Conversation (Gold) ─────────────────────────────────────
    const relevantConv = stableShuffle(
      CONVERSATION_BANK.filter((c) =>
        c.tags.some((t) => mission.tags.includes(t))
      ),
      seed + "conv"
    );
    const convCount = Math.max(0, Math.min(mission.exerciseMix.conversation - authoredCountForType(rows, "conversation"), relevantConv.length, 2));
    for (let i = 0; i < convCount; i++) {
      const t = relevantConv[i];
      rows.push({
        date,
        type: "conversation",
        order: order++,
        content: {
          scenario: t.scenario,
          target_phrases: t.target_phrases,
          grammar_focus: t.grammar_focus,
          difficulty: mission.level,
          system_prompt: t.system_prompt,
        },
        skillId: "speaking_fluency",
        missionId,
        tier: "gold",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }

    // ── Reflection (Gold) ───────────────────────────────────────
    if (mission.exerciseMix.reflection > authoredCountForType(rows, "reflection")) {
      rows.push({
        date,
        type: "reflection",
        order: order++,
        content: {
          prompt: `Reflect on your "${mission.title}" mission progress. What was the most challenging part today?`,
          follow_up: "What strategy will you use to improve next time?",
        },
        skillId: "task_completion",
        missionId,
        tier: "gold",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }

    // Insert all — use bulkCreate-style dedup by (date, type, order)
    for (const row of rows) {
      const existing = await ctx.db
        .query("exercises")
        .withIndex("by_date", (q) => q.eq("date", row.date))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), row.type),
            q.eq(q.field("order"), row.order)
          )
        )
        .first();
      if (!existing) {
        await ctx.db.insert("exercises", {
          date: row.date,
          type: row.type,
          order: row.order,
          content: row.content,
          completed: row.completed,
          skillId: row.skillId,
          missionId: row.missionId,
          checkpointId: row.checkpointId,
          tier: row.tier as "bronze" | "silver" | "gold",
          variantKey: row.variantKey,
          difficulty: row.difficulty,
          source: row.source,
        });
      }
    }

    return {
      generated: rows.length,
      missionId,
      breakdown: {
        srs: rows.filter((r) => r.type === "srs").length,
        cloze: rows.filter((r) => r.type === "cloze").length,
        word_builder: rows.filter((r) => r.type === "word_builder").length,
        pattern_drill: rows.filter((r) => r.type === "pattern_drill").length,
        speed_translation: rows.filter((r) => r.type === "speed_translation").length,
        error_hunt: rows.filter((r) => r.type === "error_hunt").length,
        conversation: rows.filter((r) => r.type === "conversation").length,
        reflection: rows.filter((r) => r.type === "reflection").length,
      },
    };
  },
});
