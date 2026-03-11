export type PatternFocusKey =
  | "requests_and_needs"
  | "movement_and_location"
  | "past_events"
  | "preferences_and_opinions"
  | "plans_and_reasons"
  | "conversation_repair";

export interface PatternFocusMeta {
  label: string;
  description: string;
  coverageNote: string;
  preview: string;
  examples: string[];
  types: string[];
  tags?: string[];
  errorFocus?: string[];
  includeSrs?: boolean;
}

export const PATTERN_FOCUS_CONFIG: Record<PatternFocusKey, PatternFocusMeta> = {
  requests_and_needs: {
    label: "Requests and needs",
    description: "Useful frames for asking, ordering, and stating what you need.",
    coverageNote: "High-yield for food, travel, shopping, health, and bureaucracy.",
    preview: "polite requests, useful chunks, and fast substitutions",
    examples: ["Vorrei un cappuccino.", "Ho bisogno di aiuto.", "Posso pagare con carta?"],
    types: ["word_builder", "pattern_drill", "speed_translation", "cloze"],
    tags: ["food", "travel", "shopping", "health", "home", "bureaucracy"],
    errorFocus: ["lexical_gap", "pragmatic_mismatch", "incomplete_response"],
    includeSrs: true,
  },
  movement_and_location: {
    label: "Movement and location",
    description: "Frames for where you are, where you are going, and how to get there.",
    coverageNote: "Best for travel, housing, station, and city-navigation scenarios.",
    preview: "prepositions, directions, and location patterns",
    examples: ["Sono a casa.", "Vado in Italia.", "Dov'è la stazione?"],
    types: ["cloze", "pattern_drill", "speed_translation", "word_builder"],
    tags: ["travel", "transport", "home", "housing"],
    errorFocus: ["preposition", "instruction_misread"],
    includeSrs: true,
  },
  past_events: {
    label: "Past events",
    description: "Core narration patterns for saying what happened.",
    coverageNote: "Useful for daily recap, travel stories, and conversation follow-up.",
    preview: "passato prossimo, time markers, and quick retelling",
    examples: ["Ho lavorato molto.", "Ho visto un film.", "Ieri ho preso il treno."],
    types: ["cloze", "pattern_drill", "speed_translation"],
    tags: ["travel", "routine", "work", "social"],
    errorFocus: ["verb_tense", "verb_conjugation"],
    includeSrs: false,
  },
  preferences_and_opinions: {
    label: "Preferences and opinions",
    description: "Frames for likes, choices, and simple viewpoints.",
    coverageNote: "Best for social, food, shopping, and early discussion practice.",
    preview: "likes, preferences, and opinion starters",
    examples: ["Mi piace questa città.", "Preferisco il treno.", "Secondo me è troppo caro."],
    types: ["word_builder", "cloze", "speed_translation", "pattern_drill"],
    tags: ["food", "shopping", "social", "media"],
    errorFocus: ["lexical_choice", "agreement", "off_topic"],
    includeSrs: true,
  },
  plans_and_reasons: {
    label: "Plans and reasons",
    description: "Frames for future plans, intentions, and explanations.",
    coverageNote: "High value for routine planning, work, and travel coordination.",
    preview: "future plans, because-clauses, and intention frames",
    examples: ["Domani vado a Roma.", "Penso di studiare di più.", "Studio italiano perché mi piace."],
    types: ["pattern_drill", "word_builder", "cloze", "speed_translation"],
    tags: ["planning", "routine", "work", "travel", "social"],
    errorFocus: ["word_order", "verb_tense", "incomplete_response"],
    includeSrs: false,
  },
  conversation_repair: {
    label: "Conversation repair",
    description: "Reusable responses for clarifying, correcting, and keeping exchanges moving.",
    coverageNote: "Useful when you get stuck or need to recover gracefully in missions.",
    preview: "clarification moves, response repair, and pragmatic control",
    examples: ["Può ripetere?", "Non ho capito bene.", "Secondo me possiamo fare così."],
    types: ["pattern_drill", "error_hunt", "conversation", "reflection"],
    tags: ["social", "work", "travel", "bureaucracy"],
    errorFocus: ["pragmatic_mismatch", "off_topic", "incomplete_response"],
    includeSrs: false,
  },
};
