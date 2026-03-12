export type SharedExerciseTemplate = {
  _id?: string;
  level: string;
  type: string;
  tier: string;
  title?: string | null;
  skillId?: string | null;
  tags: string[];
  errorFocus: string[];
  phase?: string | null;
  patternId?: string | null;
  domain?: string | null;
  variantKey: string;
  content: any;
  active: boolean;
  originMissionId?: string | null;
  checkpointId?: string | null;
};

type SelectorArgs = {
  level: string;
  types?: string[];
  skillIds?: string[];
  patternFocus?: string;
  patternIds?: string[];
  domains?: string[];
  tags?: string[];
  errorFocus?: string[];
  recentVariantKeys?: string[];
  recentFamilies?: string[];
  recentOriginMissionIds?: string[];
  limit: number;
  seed: string;
};

export const PATTERN_FOCUS_SIGNALS: Record<
  string,
  { types?: string[]; tags?: string[]; domains?: string[]; patternIds?: string[]; errorFocus?: string[] }
> = {
  requests_and_needs: {
    types: ["word_builder", "pattern_drill", "speed_translation", "cloze"],
    tags: ["food", "travel", "shopping", "health", "home", "bureaucracy"],
    domains: ["food", "shopping", "health", "bureaucracy", "requests"],
    patternIds: ["polite_request_vorrei", "need_ho_bisogno_di", "ability_posso", "want_voglio"],
    errorFocus: ["lexical_gap", "pragmatic_mismatch", "incomplete_response"],
  },
  movement_and_location: {
    types: ["cloze", "pattern_drill", "speed_translation", "word_builder"],
    tags: ["travel", "transport", "home", "housing"],
    domains: ["travel", "housing", "movement", "location"],
    patternIds: ["movement_vado", "location_essere"],
    errorFocus: ["preposition", "instruction_misread"],
  },
  past_events: {
    types: ["cloze", "pattern_drill", "speed_translation"],
    tags: ["travel", "routine", "work", "social"],
    domains: ["past_events", "routine", "travel", "work", "social"],
    patternIds: ["past_ho_participio", "duration_da"],
    errorFocus: ["verb_tense", "verb_conjugation"],
  },
  preferences_and_opinions: {
    types: ["word_builder", "cloze", "speed_translation", "pattern_drill"],
    tags: ["food", "shopping", "social", "media"],
    domains: ["preferences", "opinions", "food", "shopping", "social", "media"],
    patternIds: ["like_mi_piace", "preference_preferisco", "opinion_secondo_me"],
    errorFocus: ["lexical_choice", "agreement", "off_topic"],
  },
  plans_and_reasons: {
    types: ["pattern_drill", "word_builder", "cloze", "speed_translation"],
    tags: ["planning", "routine", "work", "travel", "social"],
    domains: ["plans", "reasons", "routine", "work", "travel", "social"],
    patternIds: ["plan_penso_di", "future_simple", "explanation_perche", "obligation_devo"],
    errorFocus: ["word_order", "verb_tense", "incomplete_response"],
  },
  conversation_repair: {
    types: ["pattern_drill", "error_hunt", "conversation", "reflection"],
    tags: ["social", "work", "travel", "bureaucracy"],
    domains: ["conversation", "social", "work", "travel", "bureaucracy"],
    patternIds: ["conversation_repair", "ability_posso"],
    errorFocus: ["pragmatic_mismatch", "off_topic", "incomplete_response"],
  },
};

function hasMetadataSignals(template: {
  patternId?: string | null;
  domain?: string | null;
}) {
  return Boolean(template.patternId || template.domain);
}

export function matchesPatternFocusSignals(
  template: {
    type: string;
    tags?: string[];
    errorFocus?: string[];
    patternId?: string | null;
    domain?: string | null;
  },
  patternFocus?: string,
  options?: { skipTypeCheck?: boolean }
) {
  const patternSignals = patternFocus ? PATTERN_FOCUS_SIGNALS[patternFocus] : null;
  if (!patternSignals) return true;

  if (!options?.skipTypeCheck && patternSignals.types?.length && !patternSignals.types.includes(template.type)) return false;

  const metadataMatch =
    Boolean(template.patternId && patternSignals.patternIds?.includes(template.patternId)) ||
    Boolean(template.domain && patternSignals.domains?.includes(template.domain));

  if (hasMetadataSignals(template)) return metadataMatch;

  const tagMatch = (template.tags ?? []).some((tag) => patternSignals.tags?.includes(tag));
  const errorMatch = (template.errorFocus ?? []).some((focus) => patternSignals.errorFocus?.includes(focus));
  return tagMatch || errorMatch;
}

function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function stableShuffle<T>(arr: T[], seed: string): T[] {
  return arr
    .map((item, index) => ({ item, sort: stableHash(`${seed}:${index}`) }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item);
}

function templateFamilyKey(template: SharedExerciseTemplate): string {
  const variant = template.variantKey ?? "";
  const prefixes = ["pattern-", "cloze-", "translation-", "error-", "conversation-", "reflection-", "srs-", "wb-"];
  for (const prefix of prefixes) {
    if (!variant.startsWith(prefix)) continue;
    const tail = variant.slice(prefix.length);
    if (tail.startsWith("fallback-")) return `${template.type}:fallback`;
    const segment = tail.split("-")[0];
    if (segment) return `${template.type}:${segment}`;
  }
  return `${template.type}:${template.title ?? variant ?? "generic"}`;
}

export function scoreTemplate(template: SharedExerciseTemplate, args: Omit<SelectorArgs, "limit" | "seed">) {
  let score = 0;
  const patternSignals = args.patternFocus ? PATTERN_FOCUS_SIGNALS[args.patternFocus] : null;
  const familyKey = templateFamilyKey(template);

  if (template.level === args.level) score += 40;
  if (args.types?.includes(template.type)) score += 20;
  if (args.skillIds?.includes(template.skillId ?? "")) score += 10;

  const tagOverlap = template.tags.filter((tag) => args.tags?.includes(tag)).length;
  score += tagOverlap * 6;

  const errorOverlap = template.errorFocus.filter((focus) => args.errorFocus?.includes(focus)).length;
  score += errorOverlap * 8;

  if (template.patternId && args.patternIds?.includes(template.patternId)) score += 24;
  if (template.domain && args.domains?.includes(template.domain)) score += 14;

  if (patternSignals) {
    if (patternSignals.types?.includes(template.type)) score += 12;

    const patternTagOverlap = template.tags.filter((tag) => patternSignals.tags?.includes(tag)).length;
    score += patternTagOverlap * 5;

    const patternErrorOverlap = template.errorFocus.filter((focus) =>
      patternSignals.errorFocus?.includes(focus)
    ).length;
    score += patternErrorOverlap * 7;

    if (template.patternId && patternSignals.patternIds?.includes(template.patternId)) score += 18;
    if (template.domain && patternSignals.domains?.includes(template.domain)) score += 10;
  }

  if (template.type === "conversation" || template.type === "reflection") score += 2;
  if (args.recentVariantKeys?.includes(template.variantKey)) score -= 28;
  if (args.recentFamilies?.includes(familyKey)) score -= 16;
  if (template.originMissionId && args.recentOriginMissionIds?.includes(template.originMissionId)) score -= 8;

  return score;
}

export function selectSharedTemplates(
  templates: SharedExerciseTemplate[],
  args: SelectorArgs
): SharedExerciseTemplate[] {
  const patternSignals = args.patternFocus ? PATTERN_FOCUS_SIGNALS[args.patternFocus] : null;
  const filtered = templates.filter((template) => {
    if (!template.active) return false;
    if (template.level !== args.level) return false;
    if (args.types && args.types.length > 0 && !args.types.includes(template.type)) return false;
    if (!args.types && patternSignals?.types?.length && !patternSignals.types.includes(template.type)) return false;
    if (args.patternFocus && !matchesPatternFocusSignals(template, args.patternFocus)) return false;
    return true;
  });

  const scored = filtered
    .map((template) => ({
      template,
      score: scoreTemplate(template, args),
      sort: stableHash(`${args.seed}:${template.variantKey}`),
    }))
    .sort((a, b) => b.score - a.score || a.sort - b.sort);

  const deduped: SharedExerciseTemplate[] = [];
  const seenVariantKeys = new Set<string>();
  const seenFamilyKeys = new Set<string>();
  const seenOrigins = new Set<string>();

  for (const row of scored) {
    if (seenVariantKeys.has(row.template.variantKey)) continue;
    const familyKey = templateFamilyKey(row.template);
    if (seenFamilyKeys.has(familyKey) && deduped.length < Math.max(2, args.limit - 1)) continue;
    if (row.template.originMissionId && seenOrigins.has(row.template.originMissionId) && deduped.length < Math.max(3, args.limit - 1)) continue;
    seenVariantKeys.add(row.template.variantKey);
    seenFamilyKeys.add(familyKey);
    if (row.template.originMissionId) seenOrigins.add(row.template.originMissionId);
    deduped.push(row.template);
    if (deduped.length >= args.limit) break;
  }

  return deduped;
}

export function pickFallbackTemplates(
  templates: SharedExerciseTemplate[],
  args: SelectorArgs
): SharedExerciseTemplate[] {
  const exact = selectSharedTemplates(templates, args);
  if (exact.length >= args.limit) return exact;

  const remainder = stableShuffle(
    templates.filter((template) => template.active && template.level === args.level && (!args.types || args.types.includes(template.type))),
    `${args.seed}:fallback`
  ).filter((template) => !exact.some((picked) => picked.variantKey === template.variantKey));

  return [...exact, ...remainder].slice(0, args.limit);
}
