export const CURRICULUM_PHASES = ["phase_1", "phase_2", "phase_3"] as const;
export type CurriculumPhase = (typeof CURRICULUM_PHASES)[number];

export const CURRICULUM_PATTERN_IDS = [
  "ability_posso",
  "conversation_repair",
  "description_e_aggettivo",
  "duration_da",
  "explanation_perche",
  "future_simple",
  "identity_essere",
  "like_mi_piace",
  "location_essere",
  "movement_vado",
  "need_ho_bisogno_di",
  "obligation_devo",
  "opinion_secondo_me",
  "past_ho_participio",
  "plan_penso_di",
  "polite_request_vorrei",
  "preference_preferisco",
  "relative_clause_che",
  "want_voglio",
] as const;

export type CurriculumPatternId = (typeof CURRICULUM_PATTERN_IDS)[number];

const LEVEL_PHASE_MAP: Record<string, CurriculumPhase> = {
  A1: "phase_1",
  A2: "phase_2",
  B1: "phase_3",
  B2: "phase_3",
};

const DOMAIN_BY_TAG: Record<string, string> = {
  basics: "conversation",
  bureaucracy: "bureaucracy",
  food: "food",
  health: "health",
  home: "housing",
  housing: "housing",
  media: "media",
  money: "money",
  negotiation: "negotiation",
  neighborhood: "housing",
  pharmacy: "health",
  planning: "plans",
  restaurant: "food",
  routine: "routine",
  safety: "health",
  shopping: "shopping",
  social: "social",
  tech: "work",
  time: "time",
  transport: "travel",
  travel: "travel",
  work: "work",
};

const TAG_TO_PATTERNS: Record<string, CurriculumPatternId[]> = {
  basics: ["conversation_repair", "identity_essere", "want_voglio"],
  bureaucracy: ["polite_request_vorrei", "conversation_repair", "ability_posso"],
  food: ["polite_request_vorrei", "need_ho_bisogno_di", "want_voglio"],
  health: ["need_ho_bisogno_di", "ability_posso", "conversation_repair"],
  home: ["location_essere", "movement_vado", "polite_request_vorrei"],
  housing: ["location_essere", "movement_vado", "polite_request_vorrei"],
  media: ["opinion_secondo_me", "explanation_perche", "conversation_repair"],
  money: ["polite_request_vorrei", "preference_preferisco", "plan_penso_di"],
  negotiation: ["opinion_secondo_me", "plan_penso_di", "explanation_perche"],
  neighborhood: ["location_essere", "movement_vado", "opinion_secondo_me"],
  pharmacy: ["need_ho_bisogno_di", "ability_posso", "conversation_repair"],
  planning: ["plan_penso_di", "future_simple", "explanation_perche"],
  restaurant: ["polite_request_vorrei", "ability_posso", "need_ho_bisogno_di"],
  routine: ["duration_da", "future_simple", "past_ho_participio"],
  safety: ["ability_posso", "conversation_repair", "need_ho_bisogno_di"],
  shopping: ["polite_request_vorrei", "preference_preferisco", "ability_posso"],
  social: ["conversation_repair", "preference_preferisco", "like_mi_piace", "opinion_secondo_me"],
  tech: ["plan_penso_di", "explanation_perche", "obligation_devo"],
  time: ["future_simple", "duration_da", "past_ho_participio"],
  transport: ["movement_vado", "ability_posso", "conversation_repair"],
  travel: ["movement_vado", "location_essere", "ability_posso"],
  work: ["obligation_devo", "plan_penso_di", "explanation_perche"],
};

const ERROR_TO_PATTERN: Record<string, CurriculumPatternId> = {
  agreement: "description_e_aggettivo",
  article_gender_number: "description_e_aggettivo",
  incomplete_response: "conversation_repair",
  instruction_misread: "movement_vado",
  lexical_choice: "polite_request_vorrei",
  lexical_gap: "need_ho_bisogno_di",
  negation_reversal: "ability_posso",
  off_topic: "opinion_secondo_me",
  pragmatic_mismatch: "conversation_repair",
  preposition: "movement_vado",
  verb_conjugation: "past_ho_participio",
  verb_tense: "past_ho_participio",
  word_order: "plan_penso_di",
};

function normalizeText(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function phaseForLevel(level?: string): CurriculumPhase | undefined {
  if (!level) return undefined;
  return LEVEL_PHASE_MAP[level] ?? undefined;
}

export function domainForTag(tag?: string): string | undefined {
  if (!tag) return undefined;
  return DOMAIN_BY_TAG[tag] ?? tag;
}

export function domainsForTags(tags?: string[]) {
  return Array.from(new Set((tags ?? []).map((tag) => domainForTag(tag)).filter(Boolean))) as string[];
}

function inferPatternIdFromText(sample: string): CurriculumPatternId | undefined {
  if (sample.includes("secondo me")) return "opinion_secondo_me";
  if (sample.includes("mi piace")) return "like_mi_piace";
  if (sample.includes("preferisc")) return "preference_preferisco";
  if (sample.includes("perche")) return "explanation_perche";
  if (sample.includes("penso di")) return "plan_penso_di";
  if (sample.includes("vorrei")) return "polite_request_vorrei";
  if (sample.includes("posso")) return "ability_posso";
  if (sample.includes("devo")) return "obligation_devo";
  if (sample.includes("ho bisogno di") || sample.includes("mi serve")) return "need_ho_bisogno_di";
  if (sample.includes("voglio")) return "want_voglio";
  if (/\b(ho|sono)\s+[a-z']+(ato|uto|ito|ata|uta|ita|ati|uti|iti|ate|ute|ite)\b/.test(sample)) {
    return "past_ho_participio";
  }
  if (/\b(andro|andro'|andrò|sara|sara'|sarà|faro|faro'|farò|avro|avro'|avrò|verro|verro'|verrò|potro|potro'|potrò|dovro|dovro'|dovrò)\b/.test(sample)) {
    return "future_simple";
  }
  if (/^sono (a|in)\b/.test(sample) || sample.includes("abito a")) return "location_essere";
  if (/^(vado|vengo|torno|parto|arrivo)\b/.test(sample) || sample.includes("prendere il treno")) {
    return "movement_vado";
  }
  if (/^sono\b/.test(sample)) return "identity_essere";
  if (sample.includes("come si dice") || sample.includes("non ho capito") || sample.includes("puo ripetere") || sample.includes("puoi ripetere")) {
    return "conversation_repair";
  }
  return undefined;
}

function inferPatternIdFromSignals(args: {
  tag?: string;
  type?: string;
  errorFocus?: string[];
  level?: string;
}): CurriculumPatternId {
  const focusPattern = args.errorFocus?.map((focus) => ERROR_TO_PATTERN[focus]).find(Boolean);
  if (focusPattern) return focusPattern;

  if (args.type === "conversation" || args.type === "reflection") return "conversation_repair";
  if (args.type === "pattern_drill") return args.level === "A1" ? "ability_posso" : "past_ho_participio";

  switch (args.tag) {
    case "travel":
    case "transport":
    case "home":
    case "housing":
      return "movement_vado";
    case "shopping":
    case "bureaucracy":
    case "health":
    case "food":
    case "restaurant":
      return "polite_request_vorrei";
    case "planning":
    case "money":
    case "negotiation":
    case "work":
      return "plan_penso_di";
    case "social":
    case "media":
      return "opinion_secondo_me";
    case "routine":
    case "time":
      return args.level === "A1" ? "ability_posso" : "future_simple";
    default:
      return "conversation_repair";
  }
}

export function inferPatternId(args: {
  it?: string;
  example?: string;
  prompt?: string;
  tag?: string;
  type?: string;
  errorFocus?: string[];
  level?: string;
  patternId?: string;
}): CurriculumPatternId {
  if (args.patternId && (CURRICULUM_PATTERN_IDS as readonly string[]).includes(args.patternId)) {
    return args.patternId as CurriculumPatternId;
  }

  const sample = normalizeText([args.it, args.example, args.prompt].filter(Boolean).join(" "));
  const fromText = inferPatternIdFromText(sample);
  if (fromText) return fromText;

  return inferPatternIdFromSignals(args);
}

export function deriveCardCurriculum(card: {
  it: string;
  example?: string;
  prompt?: string;
  tag?: string;
  level?: string;
  phase?: string;
  patternId?: string;
  domain?: string;
}) {
  return {
    phase: (card.phase as CurriculumPhase | undefined) ?? phaseForLevel(card.level),
    patternId: inferPatternId(card),
    domain: card.domain ?? domainForTag(card.tag),
  };
}

export function deriveTemplateCurriculum(args: {
  title?: string;
  level: string;
  type: string;
  tags?: string[];
  errorFocus?: string[];
  content?: any;
  phase?: string;
  patternId?: string;
  domain?: string;
}) {
  const primaryTag = args.tags?.[0];
  const sampleText =
    typeof args.content?.front === "string"
      ? args.content.front
      : typeof args.content?.target_sentence === "string"
        ? args.content.target_sentence
        : typeof args.content?.pattern_name === "string"
          ? args.content.pattern_name
          : typeof args.content?.scenario === "string"
            ? args.content.scenario
            : typeof args.content?.prompt === "string"
              ? args.content.prompt
              : typeof args.title === "string"
                ? args.title
                : undefined;

  return {
    phase: (args.phase as CurriculumPhase | undefined) ?? phaseForLevel(args.level),
    patternId: inferPatternId({
      it: sampleText,
      example: typeof args.content?.example === "string" ? args.content.example : undefined,
      prompt: typeof args.content?.sentence === "string" ? args.content.sentence : undefined,
      tag: primaryTag,
      type: args.type,
      errorFocus: args.errorFocus,
      level: args.level,
      patternId: args.patternId,
    }),
    domain: args.domain ?? domainForTag(primaryTag),
  };
}

export function deriveMissionTargetPatternIds(args: {
  level: string;
  tags?: string[];
  errorFocus?: string[];
}) {
  const ordered: CurriculumPatternId[] = [];
  const push = (patternId?: CurriculumPatternId) => {
    if (patternId && !ordered.includes(patternId)) ordered.push(patternId);
  };

  for (const focus of args.errorFocus ?? []) {
    push(ERROR_TO_PATTERN[focus]);
  }

  for (const tag of args.tags ?? []) {
    for (const patternId of TAG_TO_PATTERNS[tag] ?? []) push(patternId);
  }

  if (args.level === "A1") {
    ["polite_request_vorrei", "ability_posso", "movement_vado"].forEach((patternId) =>
      push(patternId as CurriculumPatternId)
    );
  }
  if (args.level === "A2") {
    ["plan_penso_di", "past_ho_participio"].forEach((patternId) =>
      push(patternId as CurriculumPatternId)
    );
  }
  if (args.level === "B1") {
    ["opinion_secondo_me", "explanation_perche", "future_simple"].forEach((patternId) =>
      push(patternId as CurriculumPatternId)
    );
  }

  return ordered.slice(0, 6);
}
