import type { Exercise } from "@/lib/exerciseTypes";
import { deriveCardCurriculum } from "../../convex/curriculumMetadata";

type RecoveryCardDraft = {
  it: string;
  en?: string;
  example?: string;
  prompt?: string;
  explanation?: string;
  tag?: string;
  level?: string;
  phase?: string;
  patternId?: string;
  domain?: string;
  skillId?: string;
  errorCategory?: string;
};

const ALLOWED_TAGS = new Set([
  "basics",
  "bureaucracy",
  "food",
  "health",
  "home",
  "planning",
  "routine",
  "shopping",
  "social",
  "time",
  "travel",
  "work",
]);

const EXERCISE_ERROR_KEY_MAP: Record<string, string | undefined> = {
  cloze: "verb_conjugation",
  word_order: "word_order",
  grammar_pattern: "verb_tense",
  translation: "lexical_choice",
  error_recognition: "agreement",
  conversation: "incomplete_response",
  srs_review: undefined,
  pattern_drill: "verb_tense",
  speed_translation: "lexical_choice",
  error_hunt: "agreement",
};

export function normalizeRecoveryErrorKey(category?: string): string | undefined {
  if (!category) return undefined;
  return EXERCISE_ERROR_KEY_MAP[category] ?? category;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function inferRecoveryTag(text: string, fallback?: string): string | undefined {
  if (fallback && ALLOWED_TAGS.has(fallback)) return fallback;

  const sample = text.toLowerCase();

  if (/\b(treno|binario|stazione|aeroporto|volo|check-in|biglietto|taxi|metro|fermata)\b/.test(sample)) return "travel";
  if (/\b(appartamento|stanza|affitto|coinquilino|cucina|bagno|salotto|balcone|quartiere|trasloco)\b/.test(sample)) return "home";
  if (/\b(caff[eè]|ristorante|conto|pane|pasta|pizza|vino|acqua|cameriere|formaggio|dolce)\b/.test(sample)) return "food";
  if (/\b(farmacia|medico|febbre|mal di testa|sciroppo|ricetta|allergi|dolore|stomaco)\b/.test(sample)) return "health";
  if (/\b(taglia|sconto|prezzo|cassa|camerino|giacca|scarpe|maglietta|reso|contante)\b/.test(sample)) return "shopping";
  if (/\b(ufficio|riunione|progetto|collega|capo|curriculum|colloquio|password|wifi|computer|programma)\b/.test(sample)) return "work";
  if (/\b(domani|ieri|settimana|mese|appuntamento|alle\b|mattina|sera|pomeriggio|ritardo)\b/.test(sample)) return "time";
  if (/\b(perch[eé]|potrei|dovrei|andr[oò]|sar[aà]|avr[oò]|prossimo anno|tra due)\b/.test(sample)) return "planning";
  if (/\b(ragazzo|ragazza|matrimonio|fidanz|amici|chiacchiere|invito|conoscer|fidar)\b/.test(sample)) return "social";
  if (/\b(imparo|italiano|capito|ripetere|scrive|dice|aiutare|scusi|piacere)\b/.test(sample)) return "basics";
  if (/\b(modulo|sportello|permesso|ricevuta|firma|pratica|documento|ufficio competente)\b/.test(sample)) return "bureaucracy";

  return fallback;
}

export function recoveryTagForExercise(exercise: Exercise): string | undefined {
  const skillId = exercise.skillId ?? "";
  if (skillId.includes("vocab") || skillId.includes("fluency")) return "basics";
  if (skillId.includes("preposition") || skillId.includes("task_completion")) return "travel";
  if (skillId.includes("pragmatic")) return "social";
  if (skillId.includes("listening")) return "routine";
  return undefined;
}

export function recoveryLevelForExercise(exercise: Exercise): string | undefined {
  return exercise.difficulty ?? undefined;
}

export function buildRecoveryCard(draft: RecoveryCardDraft) {
  const corrected = normalizeWhitespace(draft.it);
  const prompt = draft.prompt ? normalizeWhitespace(draft.prompt) : undefined;
  const example = draft.example ? normalizeWhitespace(draft.example) : undefined;
  const explanation = draft.explanation ? normalizeWhitespace(draft.explanation) : undefined;
  const combined = [corrected, prompt, example, explanation].filter(Boolean).join(" ");
  const tag = inferRecoveryTag(combined, draft.tag);
  const curriculum = deriveCardCurriculum({
    it: corrected,
    prompt,
    example,
    tag,
    level: draft.level,
    phase: draft.phase,
    patternId: draft.patternId,
    domain: draft.domain,
  });

  return {
    it: corrected,
    en: draft.en ?? "Say the corrected sentence in Italian.",
    prompt,
    example,
    explanation: explanation ?? "Recall and say the corrected Italian sentence.",
    tag,
    level: draft.level,
    phase: curriculum.phase,
    patternId: curriculum.patternId,
    domain: curriculum.domain,
    source: "recovery" as const,
    skillId: draft.skillId,
    errorCategory: normalizeRecoveryErrorKey(draft.errorCategory),
  };
}
