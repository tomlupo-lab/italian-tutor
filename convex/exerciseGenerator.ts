import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { MISSIONS } from "./progressionCatalog";

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

// ── Vocab banks by tag ──────────────────────────────────────────────
const TAG_VOCAB: Record<string, Array<{ it: string; en: string }>> = {
  home: [
    { it: "l'appartamento", en: "the apartment" },
    { it: "l'affitto", en: "the rent" },
    { it: "il contratto", en: "the contract" },
    { it: "il proprietario", en: "the landlord" },
    { it: "la stanza", en: "the room" },
    { it: "il bagno", en: "the bathroom" },
    { it: "la cucina", en: "the kitchen" },
    { it: "il soggiorno", en: "the living room" },
    { it: "le spese", en: "the expenses/bills" },
    { it: "il deposito", en: "the deposit" },
    { it: "il quartiere", en: "the neighborhood" },
    { it: "il piano", en: "the floor/story" },
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


// ── Speed Translation templates ─────────────────────────────────────
const SPEED_TRANSLATION_BANK: Array<{
  sentences: Array<{ source: string; options: [string, string, string, string]; correct: number }>;
  time_limit: number;
  tags: string[];
}> = [
  { sentences: [
    { source: "I would like a coffee", options: ["Vorrei un caffè", "Voglio un caffè", "Ho un caffè", "Prendo caffè"], correct: 0 },
    { source: "Where is the station?", options: ["Dov'è la stazione?", "Come è la stazione?", "Qual è la stazione?", "Quando è la stazione?"], correct: 0 },
    { source: "How much does it cost?", options: ["Quanto costa?", "Come costa?", "Perché costa?", "Dove costa?"], correct: 0 },
    { source: "I don't understand", options: ["Non capisco", "Non parlo", "Non sento", "Non vedo"], correct: 0 },
    { source: "Can you help me?", options: ["Può aiutarmi?", "Può parlarmi?", "Può sentirmi?", "Può trovarmi?"], correct: 0 },
  ], time_limit: 60, tags: ["general"] },
  { sentences: [
    { source: "The bill, please", options: ["Il conto, per favore", "Il menù, per favore", "Il piatto, per favore", "La carta, per favore"], correct: 0 },
    { source: "I'd like to book a table", options: ["Vorrei prenotare un tavolo", "Vorrei comprare un tavolo", "Vorrei vedere un tavolo", "Vorrei pulire un tavolo"], correct: 0 },
    { source: "What do you recommend?", options: ["Cosa consiglia?", "Cosa cucina?", "Cosa compra?", "Cosa mangia?"], correct: 0 },
    { source: "Is service included?", options: ["Il servizio è incluso?", "Il coperto è pagato?", "La mancia è data?", "Il prezzo è fisso?"], correct: 0 },
  ], time_limit: 60, tags: ["food"] },
  { sentences: [
    { source: "What time does the train leave?", options: ["A che ora parte il treno?", "Dove va il treno?", "Come è il treno?", "Quanto costa il treno?"], correct: 0 },
    { source: "I need a return ticket", options: ["Ho bisogno di un biglietto andata e ritorno", "Voglio un biglietto solo andata", "Cerco un biglietto gratis", "Prendo un biglietto vecchio"], correct: 0 },
    { source: "Which platform?", options: ["Quale binario?", "Quale treno?", "Quale stazione?", "Quale città?"], correct: 0 },
    { source: "The flight is delayed", options: ["Il volo è in ritardo", "Il volo è cancellato", "Il volo è partito", "Il volo è arrivato"], correct: 0 },
  ], time_limit: 60, tags: ["travel"] },
  { sentences: [
    { source: "I have a headache", options: ["Ho mal di testa", "Ho mal di pancia", "Ho mal di schiena", "Ho mal di denti"], correct: 0 },
    { source: "I need a prescription", options: ["Ho bisogno di una ricetta", "Ho bisogno di una medicina", "Ho bisogno di un dottore", "Ho bisogno di un ospedale"], correct: 0 },
    { source: "Do you have any allergies?", options: ["Ha qualche allergia?", "Ha qualche medicina?", "Ha qualche problema?", "Ha qualche dolore?"], correct: 0 },
  ], time_limit: 60, tags: ["health"] },
  { sentences: [
    { source: "Can I try this on?", options: ["Posso provare questo?", "Posso comprare questo?", "Posso vedere questo?", "Posso tenere questo?"], correct: 0 },
    { source: "Do you have a larger size?", options: ["Ha una taglia più grande?", "Ha un colore più grande?", "Ha un prezzo più grande?", "Ha uno sconto più grande?"], correct: 0 },
    { source: "Do you accept cards?", options: ["Accettate carte?", "Accettate contanti?", "Accettate buoni?", "Accettate assegni?"], correct: 0 },
  ], time_limit: 60, tags: ["shopping"] },
  { sentences: [
    { source: "What time is the meeting?", options: ["A che ora è la riunione?", "Dove è la riunione?", "Come è la riunione?", "Perché è la riunione?"], correct: 0 },
    { source: "The project is on schedule", options: ["Il progetto è in orario", "Il progetto è in ritardo", "Il progetto è cancellato", "Il progetto è finito"], correct: 0 },
  ], time_limit: 45, tags: ["work"] },
  { sentences: [
    { source: "What are you doing this weekend?", options: ["Cosa fai questo fine settimana?", "Dove vai questo fine settimana?", "Come stai questo fine settimana?", "Quando esci questo fine settimana?"], correct: 0 },
    { source: "Happy birthday!", options: ["Buon compleanno!", "Buona fortuna!", "Buon viaggio!", "Buona notte!"], correct: 0 },
    { source: "I had a great time", options: ["Mi sono divertito molto", "Mi sono annoiato molto", "Mi sono stancato molto", "Mi sono perso molto"], correct: 0 },
  ], time_limit: 60, tags: ["social"] },
  { sentences: [
    { source: "I usually wake up at seven", options: ["Di solito mi sveglio alle sette", "Di solito mi addormento alle sette", "Di solito mangio alle sette", "Di solito esco alle sette"], correct: 0 },
    { source: "I'm going grocery shopping", options: ["Vado a fare la spesa", "Vado a fare un viaggio", "Vado a fare una passeggiata", "Vado a fare il bagno"], correct: 0 },
  ], time_limit: 45, tags: ["routine"] },
];

// ── Error Hunt templates ────────────────────────────────────────────
const ERROR_HUNT_BANK: Array<{
  sentences: Array<{ text: string; has_error: boolean; corrected?: string; explanation?: string }>;
  focus: string[];
}> = [
  { sentences: [
    { text: "Io parlo italiano molto bene.", has_error: false },
    { text: "Lei va al scuola ogni giorno.", has_error: true, corrected: "Lei va a scuola ogni giorno.", explanation: "'andare a scuola' — no article needed" },
    { text: "Noi mangiamo la pizza.", has_error: false },
    { text: "Il ragazze sono brave.", has_error: true, corrected: "Le ragazze sono brave.", explanation: "'ragazze' is feminine plural → 'le'" },
    { text: "Ho comprato un libro interessante.", has_error: false },
  ], focus: ["article_gender_number", "preposition"] },
  { sentences: [
    { text: "Ieri sono andato al cinema.", has_error: false },
    { text: "Maria ha andato a Roma.", has_error: true, corrected: "Maria è andata a Roma.", explanation: "'andare' takes essere; feminine → andata" },
    { text: "Abbiamo mangiato bene.", has_error: false },
    { text: "I bambini hanno uscito presto.", has_error: true, corrected: "I bambini sono usciti presto.", explanation: "'uscire' takes essere; plural → usciti" },
    { text: "Ho letto un bel libro.", has_error: false },
  ], focus: ["verb_tense", "verb_conjugation"] },
  { sentences: [
    { text: "Vorrei un caffè, per favore.", has_error: false },
    { text: "Mi piacciono la pizza.", has_error: true, corrected: "Mi piace la pizza.", explanation: "Singular noun → piace (not piacciono)" },
    { text: "Posso avere il conto?", has_error: false },
    { text: "Voglio andare in il parco.", has_error: true, corrected: "Voglio andare nel parco.", explanation: "in + il = nel (articulated preposition)" },
  ], focus: ["lexical_choice", "preposition"] },
  { sentences: [
    { text: "La mia amica è molto simpatica.", has_error: false },
    { text: "Io ho bisogna di aiuto.", has_error: true, corrected: "Io ho bisogno di aiuto.", explanation: "'bisogno' is masculine noun, not 'bisogna'" },
    { text: "Andiamo al ristorante stasera.", has_error: false },
    { text: "Le scarpe è molto belle.", has_error: true, corrected: "Le scarpe sono molto belle.", explanation: "Plural subject → sono (not è)" },
  ], focus: ["agreement", "lexical_choice"] },
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
  },
  handler: async (ctx, args) => {
    const date = args.date ?? warsawToday();

    // Don't overwrite existing exercises
    const existing = await ctx.db
      .query("exercises")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();
    if (existing.length > 0) {
      return { generated: 0, message: "Exercises already exist for this date" };
    }

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

    const mission = MISSIONS.find((m) => m.missionId === missionId);
    if (!mission) {
      return { generated: 0, message: `Mission ${missionId} not in catalog` };
    }

    const seed = date + missionId;
    const rows: Array<{
      date: string;
      type: string;
      order: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: any;
      skillId: string;
      missionId: string;
      tier: "quick" | "standard" | "deep";
      difficulty: string;
      source: string;
      completed: boolean;
    }> = [];
    let order = 0;

    // ── SRS flashcards (Bronze) ─────────────────────────────────
    const vocabPool: Array<{ it: string; en: string }> = [];
    const seen = new Set<string>();
    for (const tag of mission.tags) {
      for (const v of TAG_VOCAB[tag] ?? []) {
        if (!seen.has(v.it)) {
          seen.add(v.it);
          vocabPool.push(v);
        }
      }
    }
    const shuffledVocab = stableShuffle(vocabPool, seed + "srs");
    const srsCount = Math.min(mission.exerciseMix.srs, shuffledVocab.length, 12);
    for (let i = 0; i < srsCount; i++) {
      rows.push({
        date,
        type: "srs",
        order: order++,
        content: { front: shuffledVocab[i].it, back: shuffledVocab[i].en },
        skillId: "vocab_core",
        missionId,
        tier: "quick",
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
    const clozeCount = Math.min(mission.exerciseMix.cloze, relevantCloze.length, 6);
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
        tier: "standard",
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
    const wbCount = Math.min(mission.exerciseMix.wordBuilder, relevantWB.length, 4);
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
        tier: "standard",
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
    const pdCount = Math.min(mission.exerciseMix.patternDrill, relevantPD.length, 3);
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
        tier: "standard",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }


    // ── Speed translation (Silver) ──────────────────────────────
    const relevantST = stableShuffle(
      SPEED_TRANSLATION_BANK.filter((s) => s.tags.some((t) => mission.tags.includes(t)) || s.tags.includes("general")),
      seed + "st",
    );
    const stCount = Math.min(mission.exerciseMix.speedTranslation, relevantST.length, 3);
    for (let i = 0; i < stCount; i++) {
      const t = relevantST[i];
      rows.push({ date, type: "speed_translation", order: order++, content: { sentences: stableShuffle(t.sentences, seed + "sts" + i).slice(0, 5), time_limit_seconds: t.time_limit }, skillId: "vocab_core", missionId, tier: "standard", difficulty: mission.level, source: "seed", completed: false });
    }

    // ── Error hunt (Silver) ─────────────────────────────────────
    const relevantEH = stableShuffle(
      ERROR_HUNT_BANK.filter((e) => e.focus.some((f) => mission.errorFocus.includes(f))),
      seed + "eh",
    );
    const ehCount = Math.min(mission.exerciseMix.errorHunt, relevantEH.length, 2);
    for (let i = 0; i < ehCount; i++) {
      const t = relevantEH[i];
      rows.push({ date, type: "error_hunt", order: order++, content: { sentences: stableShuffle(t.sentences, seed + "ehs" + i) }, skillId: "grammar_forms", missionId, tier: "standard", difficulty: mission.level, source: "seed", completed: false });
    }

    // ── Conversation (Gold) ─────────────────────────────────────
    const relevantConv = stableShuffle(
      CONVERSATION_BANK.filter((c) =>
        c.tags.some((t) => mission.tags.includes(t))
      ),
      seed + "conv"
    );
    const convCount = Math.min(mission.exerciseMix.conversation, relevantConv.length, 2);
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
        tier: "deep",
        difficulty: mission.level,
        source: "seed",
        completed: false,
      });
    }

    // ── Reflection (Gold) ───────────────────────────────────────
    if (mission.exerciseMix.reflection > 0) {
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
        tier: "deep",
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
          tier: row.tier as "quick" | "standard" | "deep",
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
