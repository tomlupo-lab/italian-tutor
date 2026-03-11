import { getTodayWarsaw } from "@/lib/date";
import type { Exercise, ExerciseContent, ExerciseType } from "@/lib/exerciseTypes";

export type SkillFocusKey =
  | "vocabulary"
  | "grammar"
  | "listening"
  | "reading"
  | "speaking"
  | "conversation";

export type SkillCoverageTone = "strong" | "solid" | "growing";

type SkillExerciseTemplate = {
  type: ExerciseType;
  skillId: string;
  content: ExerciseContent;
  minLevel?: "A1" | "A2" | "B1" | "B2";
};

export const SKILL_FOCUS_META: Record<
  SkillFocusKey,
  {
    label: string;
    description: string;
    coverageLabel: string;
    coverageTone: SkillCoverageTone;
    coverageNote: string;
  }
> = {
  vocabulary: {
    label: "Vocabulary",
    description: "Word recall and usage patterns",
    coverageLabel: "Strong",
    coverageTone: "strong",
    coverageNote: "Dense authored practice across all selected levels.",
  },
  grammar: {
    label: "Grammar",
    description: "Forms, agreement, and sentence patterns",
    coverageLabel: "Strong",
    coverageTone: "strong",
    coverageNote: "Best-supported deliberate practice lane in the app.",
  },
  listening: {
    label: "Listening",
    description: "Literal understanding and quick recognition",
    coverageLabel: "Solid",
    coverageTone: "solid",
    coverageNote: "Good literal coverage, lighter inference coverage.",
  },
  reading: {
    label: "Reading",
    description: "Meaning extraction from short texts",
    coverageLabel: "Solid",
    coverageTone: "solid",
    coverageNote: "Useful authored comprehension sets with practical text.",
  },
  speaking: {
    label: "Speaking",
    description: "Response building and expression under pressure",
    coverageLabel: "Growing",
    coverageTone: "growing",
    coverageNote: "Authored core batches exist, but this track is still expanding.",
  },
  conversation: {
    label: "Conversation",
    description: "Interaction flow and pragmatic moves",
    coverageLabel: "Growing",
    coverageTone: "growing",
    coverageNote: "Focused mission-style practice exists, but breadth is still lighter.",
  },
};

const LEVEL_ORDER = { A1: 0, A2: 1, B1: 2, B2: 3 } as const;
const LEVEL_ROTATION = { A1: 0, A2: 1, B1: 2, B2: 3 } as const;

const SKILL_BATCHES: Record<SkillFocusKey, SkillExerciseTemplate[]> = {
  vocabulary: [
    {
      type: "srs",
      skillId: "vocab_core",
      content: {
        front: "la prenotazione",
        back: "the reservation",
        example: "Abbiamo una prenotazione per due persone.",
        tag: "food",
        direction: "it_to_en",
      },
    },
    {
      type: "srs",
      skillId: "vocab_core",
      content: {
        front: "il quartiere",
        back: "the neighborhood",
        example: "Il quartiere è tranquillo la sera.",
        tag: "home",
        direction: "it_to_en",
      },
    },
    {
      type: "cloze",
      skillId: "vocab_core",
      content: {
        sentence: "Vorrei confermare ___ per domani sera.",
        blank_index: 0,
        options: ["la prenotazione", "il binario", "la farmacia", "il rimborso"],
        correct: 0,
        hint: "You want to confirm a booking.",
      },
    },
    {
      type: "word_builder",
      skillId: "vocab_core",
      content: {
        target_sentence: "Il quartiere è vicino alla stazione",
        scrambled_words: ["stazione", "quartiere", "alla", "è", "Il", "vicino"],
        translation: "The neighborhood is near the station",
      },
    },
    {
      type: "speed_translation",
      skillId: "vocab_core",
      content: {
        sentences: [
          {
            source: "The bill, please.",
            options: [
              "Il conto, per favore.",
              "La stanza, per favore.",
              "Il binario, per favore.",
              "La taglia, per favore.",
            ],
            correct: 0,
          },
          {
            source: "Is the rent included?",
            options: [
              "L'affitto è incluso?",
              "L'affitto è occupato?",
              "L'affitto è in ritardo?",
              "L'affitto è chiuso?",
            ],
            correct: 0,
          },
          {
            source: "Where is the platform?",
            options: [
              "Dov'è il binario?",
              "Dov'è il dolce?",
              "Dov'è il tavolo?",
              "Dov'è lo sconto?",
            ],
            correct: 0,
          },
        ],
        time_limit_seconds: 30,
      },
    },
    {
      type: "srs",
      skillId: "vocab_core",
      minLevel: "A2",
      content: {
        front: "il rimborso",
        back: "the refund",
        example: "Vorrei chiedere un rimborso.",
        tag: "money",
        direction: "it_to_en",
      },
    },
    {
      type: "speed_translation",
      skillId: "vocab_core",
      minLevel: "B1",
      content: {
        sentences: [
          {
            source: "The agency asks for a commission.",
            options: [
              "L'agenzia chiede una commissione.",
              "L'agenzia cerca una riunione.",
              "L'agenzia perde una connessione.",
              "L'agenzia cambia una prenotazione.",
            ],
            correct: 0,
          },
          {
            source: "I need the invoice by email.",
            options: [
              "Mi serve la fattura via email.",
              "Mi serve la fermata via email.",
              "Mi serve la visita via email.",
              "Mi serve la misura via email.",
            ],
            correct: 0,
          },
          {
            source: "The budget is quite limited.",
            options: [
              "Il budget è abbastanza limitato.",
              "Il budget è abbastanza rumoroso.",
              "Il budget è abbastanza incluso.",
              "Il budget è abbastanza condiviso.",
            ],
            correct: 0,
          },
        ],
        time_limit_seconds: 35,
      },
    },
  ],
  grammar: [
    {
      type: "cloze",
      skillId: "grammar_forms",
      content: {
        sentence: "Cerco ___ appartamento in centro.",
        blank_index: 0,
        options: ["un", "una", "uno", "un'"],
        correct: 0,
        hint: "Use the masculine singular article.",
      },
    },
    {
      type: "cloze",
      skillId: "grammar_forms",
      content: {
        sentence: "Domani ___ il contratto insieme.",
        blank_index: 0,
        options: ["firmiamo", "firmo", "firme", "firmano"],
        correct: 0,
        hint: "Use the noi form.",
      },
    },
    {
      type: "pattern_drill",
      skillId: "grammar_forms",
      content: {
        pattern_name: "Polite requests with potere",
        pattern_description: "Use modal forms to make requests sound natural.",
        sentences: [
          {
            template: "Lei ___ ripetere, per favore?",
            blank: "could",
            correct: "può",
            hint: "formal singular",
          },
          {
            template: "Mi ___ dire l'indirizzo esatto?",
            blank: "can",
            correct: "può",
            hint: "formal request",
          },
          {
            template: "___ parlare più lentamente?",
            blank: "can you",
            correct: "Può",
            hint: "same formal pattern",
          },
        ],
      },
    },
    {
      type: "pattern_drill",
      skillId: "grammar_syntax",
      content: {
        pattern_name: "Avere bisogno di",
        pattern_description: "Keep the fixed expression intact in useful sentences.",
        sentences: [
          {
            template: "Ho bisogno ___ un documento.",
            blank: "of",
            correct: "di",
            hint: "fixed preposition",
          },
          {
            template: "Abbiamo bisogno ___ più tempo.",
            blank: "of",
            correct: "di",
            hint: "same structure",
          },
          {
            template: "Hai bisogno ___ una mano?",
            blank: "of",
            correct: "di",
            hint: "same expression again",
          },
        ],
      },
    },
    {
      type: "error_hunt",
      skillId: "grammar_forms",
      content: {
        sentences: [
          {
            text: "Le spese sono incluso nel prezzo.",
            has_error: true,
            error_position: 15,
            corrected: "Le spese sono incluse nel prezzo.",
            explanation: "Spese is feminine plural, so the adjective must agree.",
          },
          {
            text: "Domani andiamo in ufficio presto.",
            has_error: false,
            explanation: "This sentence is correct.",
          },
          {
            text: "Io hanno bisogno di aiuto.",
            has_error: true,
            error_position: 3,
            corrected: "Io ho bisogno di aiuto.",
            explanation: "The first person singular of avere is ho.",
          },
        ],
      },
    },
    {
      type: "cloze",
      skillId: "grammar_syntax",
      minLevel: "A2",
      content: {
        sentence: "Se avessi più tempo, ___ tutto oggi.",
        blank_index: 0,
        options: ["farei", "faccio", "farò", "facessi"],
        correct: 0,
        hint: "Use the conditional for a hypothetical result.",
      },
    },
    {
      type: "error_hunt",
      skillId: "grammar_syntax",
      minLevel: "B1",
      content: {
        sentences: [
          {
            text: "Se arriva il proprietario, lo chiamo subito.",
            has_error: false,
            explanation: "This future-real condition is correct.",
          },
          {
            text: "Vorrei sapere se potrei avere più informazioni.",
            has_error: false,
            explanation: "This polite layered request is correct.",
          },
          {
            text: "Quando finisco, ti chiamerò ieri sera.",
            has_error: true,
            error_position: 28,
            corrected: "Quando finisco, ti chiamerò stasera.",
            explanation: "The future verb does not fit with ieri sera.",
          },
        ],
      },
    },
  ],
  listening: [
    {
      type: "speed_translation",
      skillId: "listening_literal",
      content: {
        sentences: [
          {
            source: "The train is delayed by twenty minutes.",
            options: [
              "Il treno è in ritardo di venti minuti.",
              "Il treno è chiuso per venti minuti.",
              "Il treno è pieno di venti minuti.",
              "Il treno è pronto di venti minuti.",
            ],
            correct: 0,
          },
          {
            source: "The kitchen is shared.",
            options: [
              "La cucina è condivisa.",
              "La cucina è privata.",
              "La cucina è compresa.",
              "La cucina è lontana.",
            ],
            correct: 0,
          },
          {
            source: "Can we move the appointment to tomorrow?",
            options: [
              "Possiamo spostare l'appuntamento a domani?",
              "Possiamo trovare l'appuntamento a domani?",
              "Possiamo chiudere l'appuntamento a domani?",
              "Possiamo perdere l'appuntamento a domani?",
            ],
            correct: 0,
          },
        ],
        time_limit_seconds: 30,
      },
    },
    {
      type: "speed_translation",
      skillId: "listening_literal",
      content: {
        sentences: [
          {
            source: "I only have cash today.",
            options: [
              "Oggi ho solo contanti.",
              "Oggi ho solo contatto.",
              "Oggi ho solo sconto.",
              "Oggi ho solo ritardo.",
            ],
            correct: 0,
          },
          {
            source: "The pharmacy is still open.",
            options: [
              "La farmacia è ancora aperta.",
              "La farmacia è ancora chiusa.",
              "La farmacia è ancora lontana.",
              "La farmacia è ancora cara.",
            ],
            correct: 0,
          },
          {
            source: "We need to change trains in Bologna.",
            options: [
              "Dobbiamo cambiare treno a Bologna.",
              "Dobbiamo confermare treno a Bologna.",
              "Dobbiamo trovare treno a Bologna.",
              "Dobbiamo perdere treno a Bologna.",
            ],
            correct: 0,
          },
        ],
        time_limit_seconds: 30,
      },
    },
    {
      type: "cloze",
      skillId: "listening_inference",
      content: {
        sentence: "Se preferisce, possiamo ___ a domani mattina.",
        blank_index: 0,
        options: ["rimandare", "chiudere", "pagare", "entrare"],
        correct: 0,
        hint: "The speaker is suggesting postponing politely.",
      },
    },
    {
      type: "cloze",
      skillId: "listening_inference",
      content: {
        sentence: "Mi dispiace, oggi sono pieno: possiamo ___ più tardi.",
        blank_index: 0,
        options: ["sentirci", "mangiare", "dormire", "scrivere"],
        correct: 0,
        hint: "The speaker cannot talk now but proposes reconnecting later.",
      },
    },
    {
      type: "speed_translation",
      skillId: "listening_literal",
      content: {
        sentences: [
          {
            source: "The landlord is arriving at six.",
            options: [
              "Il proprietario arriva alle sei.",
              "Il proprietario parte alle sei.",
              "Il proprietario cambia alle sei.",
              "Il proprietario torna alle sei.",
            ],
            correct: 0,
          },
          {
            source: "Do you want sparkling or still water?",
            options: [
              "Vuole acqua frizzante o naturale?",
              "Vuole acqua veloce o naturale?",
              "Vuole acqua completa o naturale?",
              "Vuole acqua vicina o naturale?",
            ],
            correct: 0,
          },
          {
            source: "The meeting starts in five minutes.",
            options: [
              "La riunione comincia tra cinque minuti.",
              "La riunione finisce tra cinque minuti.",
              "La riunione torna tra cinque minuti.",
              "La riunione scende tra cinque minuti.",
            ],
            correct: 0,
          },
        ],
        time_limit_seconds: 30,
      },
    },
    {
      type: "speed_translation",
      skillId: "listening_inference",
      minLevel: "A2",
      content: {
        sentences: [
          {
            source: "I'm afraid we're fully booked tonight.",
            options: [
              "Mi dispiace, siamo al completo per stasera.",
              "Mi dispiace, siamo in ritardo per stasera.",
              "Mi dispiace, siamo in cucina per stasera.",
              "Mi dispiace, siamo in viaggio per stasera.",
            ],
            correct: 0,
          },
          {
            source: "If you want, I can put your name on the waiting list.",
            options: [
              "Se vuole, posso mettere il suo nome in lista d'attesa.",
              "Se vuole, posso trovare il suo nome in cucina.",
              "Se vuole, posso spostare il suo nome in farmacia.",
              "Se vuole, posso perdere il suo nome in ufficio.",
            ],
            correct: 0,
          },
          {
            source: "That means the next available slot is Monday.",
            options: [
              "Questo vuol dire che il primo posto libero è lunedì.",
              "Questo vuol dire che il primo posto libero è chiuso.",
              "Questo vuol dire che il primo posto libero è caro.",
              "Questo vuol dire che il primo posto libero è lontano.",
            ],
            correct: 0,
          },
        ],
        time_limit_seconds: 35,
      },
    },
    {
      type: "cloze",
      skillId: "listening_inference",
      minLevel: "B1",
      content: {
        sentence: "Allora facciamo così: io le mando tutto per email e lei mi ___ sapere.",
        blank_index: 0,
        options: ["fa", "dà", "porta", "prende"],
        correct: 0,
        hint: "The implied phrase is 'let me know'.",
      },
    },
  ],
  reading: [
    {
      type: "error_hunt",
      skillId: "reading_comprehension",
      content: {
        sentences: [
          {
            text: "Il museo apre alle 9 e chiude alle 18.",
            has_error: false,
            explanation: "This opening-hours notice is correct.",
          },
          {
            text: "Biglietti disponibile solo online.",
            has_error: true,
            error_position: 10,
            corrected: "Biglietti disponibili solo online.",
            explanation: "Biglietti is plural, so the adjective must be plural too.",
          },
          {
            text: "È vietato fumare vicino all'ingresso.",
            has_error: false,
            explanation: "This prohibition sign is correct.",
          },
        ],
      },
    },
    {
      type: "error_hunt",
      skillId: "reading_comprehension",
      content: {
        sentences: [
          {
            text: "La ricevuta va conservato fino al controllo.",
            has_error: true,
            error_position: 19,
            corrected: "La ricevuta va conservata fino al controllo.",
            explanation: "Ricevuta is feminine singular, so the participle must agree.",
          },
          {
            text: "Lo sportello 4 è chiuso per pausa pranzo.",
            has_error: false,
            explanation: "This office notice is correct.",
          },
          {
            text: "Per informazioni, chiamare dopo le quattordici.",
            has_error: false,
            explanation: "This instruction is correct.",
          },
        ],
      },
    },
    {
      type: "cloze",
      skillId: "reading_comprehension",
      content: {
        sentence: "Ingresso riservato ___ clienti dell'hotel.",
        blank_index: 0,
        options: ["ai", "dei", "nei", "sui"],
        correct: 0,
        hint: "Reserved to the guests/customers.",
      },
    },
    {
      type: "cloze",
      skillId: "reading_comprehension",
      content: {
        sentence: "Per il reso, conservi ___ scontrino.",
        blank_index: 0,
        options: ["lo", "la", "gli", "le"],
        correct: 0,
        hint: "Scontrino is masculine singular.",
      },
    },
    {
      type: "error_hunt",
      skillId: "reading_comprehension",
      content: {
        sentences: [
          {
            text: "Si prega di attendere il proprio turno.",
            has_error: false,
            explanation: "This waiting-room instruction is correct.",
          },
          {
            text: "Documento richiesti al momento dell'ingresso.",
            has_error: true,
            error_position: 10,
            corrected: "Documenti richiesti al momento dell'ingresso.",
            explanation: "The plural noun should be documenti.",
          },
          {
            text: "Pagamento con carta disponibile sopra i dieci euro.",
            has_error: false,
            explanation: "This payment note is correct.",
          },
        ],
      },
    },
    {
      type: "cloze",
      skillId: "reading_comprehension",
      minLevel: "A2",
      content: {
        sentence: "In caso di ritardo, avvisi la reception ___ telefono.",
        blank_index: 0,
        options: ["per", "con", "da", "su"],
        correct: 0,
        hint: "Use the phrase 'by phone'.",
      },
    },
    {
      type: "error_hunt",
      skillId: "reading_comprehension",
      minLevel: "B1",
      content: {
        sentences: [
          {
            text: "La domanda va presentata entro venerdì alle 12.",
            has_error: false,
            explanation: "This deadline notice is correct.",
          },
          {
            text: "Si accettano soltanto pagamento elettronico.",
            has_error: true,
            error_position: 22,
            corrected: "Si accettano soltanto pagamenti elettronici.",
            explanation: "Both noun and adjective should be plural here.",
          },
          {
            text: "Per urgenze, scrivere direttamente al responsabile.",
            has_error: false,
            explanation: "This instruction is correct.",
          },
        ],
      },
    },
  ],
  speaking: [
    {
      type: "pattern_drill",
      skillId: "speaking_accuracy",
      content: {
        pattern_name: "Clarifying what you need",
        pattern_description: "Build short accurate requests under pressure.",
        sentences: [
          {
            template: "Mi serve ___ singola per due notti.",
            blank: "a room",
            correct: "una camera",
            hint: "feminine singular noun phrase",
          },
          {
            template: "Vorrei ___ il prezzo finale.",
            blank: "to know",
            correct: "sapere",
            hint: "use the infinitive after vorrei",
          },
          {
            template: "Può ___ più lentamente, per favore?",
            blank: "speak",
            correct: "parlare",
            hint: "infinitive after può",
          },
        ],
      },
    },
    {
      type: "word_builder",
      skillId: "speaking_accuracy",
      content: {
        target_sentence: "Vorrei confermare l'appuntamento per domani mattina",
        scrambled_words: ["domani", "mattina", "Vorrei", "l'appuntamento", "per", "confermare"],
        translation: "I would like to confirm the appointment for tomorrow morning",
      },
    },
    {
      type: "pattern_drill",
      skillId: "pronunciation",
      content: {
        pattern_name: "Stress-friendly chunks",
        pattern_description: "Repeat common spoken chunks with clean rhythm.",
        sentences: [
          {
            template: "Mi ___, non ho capito.",
            blank: "excuse",
            correct: "scusi",
            hint: "short chunk used in speech",
          },
          {
            template: "Può ___ più lentamente?",
            blank: "speak",
            correct: "parlare",
            hint: "keep the phrase smooth",
          },
          {
            template: "Va bene, allora ___ domani.",
            blank: "see you",
            correct: "ci sentiamo",
            hint: "common spoken closing",
          },
        ],
      },
    },
    {
      type: "conversation",
      skillId: "speaking_fluency",
      content: {
        scenario: "You are calling a landlord to ask for a room viewing tomorrow evening.",
        target_phrases: ["Vorrei fissare una visita", "È ancora disponibile?", "Domani sera va bene?"],
        grammar_focus: "polite requests and scheduling",
        difficulty: "A2",
        system_prompt:
          "You are an Italian landlord speaking naturally on the phone. Ask concise follow-up questions and respond like a real person arranging a viewing.",
      },
    },
    {
      type: "reflection",
      skillId: "speaking_accuracy",
      content: {
        prompt: "Which phrase today felt hardest to say quickly and accurately?",
        follow_up: "Write the corrected version you want to reuse next time.",
      },
    },
    {
      type: "conversation",
      skillId: "speaking_fluency",
      minLevel: "A2",
      content: {
        scenario: "You are checking into a small hotel and need to solve a booking mix-up at the front desk.",
        target_phrases: ["Ho una prenotazione a nome di", "Forse c'è un errore", "Cosa possiamo fare?"],
        grammar_focus: "clarification and repair",
        difficulty: "A2",
        system_prompt:
          "You are a hotel receptionist. Be helpful but realistic, ask for the booking name, and work through the problem naturally.",
      },
    },
    {
      type: "pattern_drill",
      skillId: "speaking_accuracy",
      minLevel: "B1",
      content: {
        pattern_name: "Negotiating a practical solution",
        pattern_description: "Keep your proposal clear and structured.",
        sentences: [
          {
            template: "Se per lei va bene, ___ domani mattina.",
            blank: "we could do it",
            correct: "potremmo farlo",
            hint: "offer a workable solution",
          },
          {
            template: "In alternativa, ___ una videochiamata.",
            blank: "we could arrange",
            correct: "potremmo organizzare",
            hint: "suggest another option",
          },
          {
            template: "Per me sarebbe meglio ___ dopo pranzo.",
            blank: "to meet",
            correct: "vederci",
            hint: "state your preference directly",
          },
        ],
      },
    },
  ],
  conversation: [
    {
      type: "conversation",
      skillId: "pragmatics",
      content: {
        scenario: "You are arriving late to dinner with friends. Explain the delay politely and suggest how to catch up.",
        target_phrases: ["Scusate il ritardo", "Arrivo tra dieci minuti", "Ordinate pure senza di me"],
        grammar_focus: "apologies and social coordination",
        difficulty: "A2",
        system_prompt:
          "You are an Italian friend waiting at a restaurant. React naturally, ask one follow-up question, and keep the exchange social and realistic.",
      },
    },
    {
      type: "conversation",
      skillId: "task_completion",
      content: {
        scenario: "You need to reschedule a bureaucratic appointment because a document is missing.",
        target_phrases: ["Mi manca un documento", "Vorrei spostare l'appuntamento", "Qual è la prima data disponibile?"],
        grammar_focus: "practical requests and clarification",
        difficulty: "B1",
        system_prompt:
          "You are a clerk at a public office. Stay firm but helpful, ask for missing details, and help the learner complete the task.",
      },
    },
    {
      type: "pattern_drill",
      skillId: "pragmatics",
      content: {
        pattern_name: "Softening requests",
        pattern_description: "Use polite openings before asking for help.",
        sentences: [
          {
            template: "___, avrei una domanda.",
            blank: "excuse me",
            correct: "Mi scusi",
            hint: "a polite opener",
          },
          {
            template: "Se possibile, ___ cambiare l'orario.",
            blank: "I would like to",
            correct: "vorrei",
            hint: "soft request language",
          },
          {
            template: "La ringrazio ___ l'aiuto.",
            blank: "for",
            correct: "per",
            hint: "fixed phrase",
          },
        ],
      },
    },
    {
      type: "speed_translation",
      skillId: "task_completion",
      content: {
        sentences: [
          {
            source: "Could we find a compromise?",
            options: [
              "Potremmo trovare un compromesso?",
              "Potremmo chiudere un compromesso?",
              "Potremmo perdere un compromesso?",
              "Potremmo salire un compromesso?",
            ],
            correct: 0,
          },
          {
            source: "I need a written confirmation.",
            options: [
              "Mi serve una conferma scritta.",
              "Mi serve una conferma larga.",
              "Mi serve una conferma lontana.",
              "Mi serve una conferma urgente.",
            ],
            correct: 0,
          },
          {
            source: "What is the correct procedure?",
            options: [
              "Qual è la procedura corretta?",
              "Qual è la prenotazione corretta?",
              "Qual è la farmacia corretta?",
              "Qual è la misura corretta?",
            ],
            correct: 0,
          },
        ],
        time_limit_seconds: 35,
      },
    },
    {
      type: "reflection",
      skillId: "pragmatics",
      content: {
        prompt: "When did you sound too direct or too vague in the conversation?",
        follow_up: "Rewrite one line so it sounds more natural and polite.",
      },
    },
    {
      type: "conversation",
      skillId: "pragmatics",
      minLevel: "A2",
      content: {
        scenario: "You need to ask a flatmate to lower the noise without sounding aggressive.",
        target_phrases: ["Ti volevo chiedere una cosa", "Potresti abbassare un po' la musica?", "Domani mi alzo presto"],
        grammar_focus: "softening and explaining a request",
        difficulty: "A2",
        system_prompt:
          "You are an Italian flatmate. React naturally, not defensively, and keep the exchange realistic and social.",
      },
    },
    {
      type: "reflection",
      skillId: "task_completion",
      minLevel: "B1",
      content: {
        prompt: "Did you complete the practical goal of the interaction clearly enough?",
        follow_up: "Rewrite one line to make the request or next step more explicit.",
      },
    },
  ],
};

export function getPregeneratedSkillExercises(
  skill: SkillFocusKey,
  level: string,
  count = 5,
): Exercise[] {
  const normalizedLevel =
    level === "A1" || level === "A2" || level === "B1" || level === "B2" ? level : "A1";
  const targetLevelOrder = LEVEL_ORDER[normalizedLevel];
  const templates = (SKILL_BATCHES[skill] ?? []).filter((template) => {
    const minLevel = template.minLevel ?? "A1";
    return LEVEL_ORDER[minLevel] <= targetLevelOrder;
  });
  const rotation = LEVEL_ROTATION[normalizedLevel] % Math.max(templates.length, 1);
  const orderedTemplates = templates.length > count
    ? [...templates.slice(rotation), ...templates.slice(0, rotation)]
    : templates;
  const date = getTodayWarsaw();

  return orderedTemplates.slice(0, count).map((template, index) => ({
    _id: `skill-${skill}-${level}-${index}-${date}`,
    date,
    type: template.type,
    order: index,
    content: template.type === "conversation"
      ? { ...template.content, difficulty: level }
      : template.content,
    skillId: template.skillId,
    difficulty: level,
    completed: false,
    source: "seed",
  }));
}
