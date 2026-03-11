import fs from "node:fs";
import process from "node:process";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

function loadEnv(path = ".env.local") {
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function extractStrings(value, path = "content", acc = []) {
  if (typeof value === "string") {
    acc.push({ path, value });
    return acc;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => extractStrings(item, `${path}[${index}]`, acc));
    return acc;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      extractStrings(nested, `${path}.${key}`, acc);
    }
  }
  return acc;
}

function addFinding(findings, severity, category, scope, ref, detail) {
  findings.push({ severity, category, scope, ref, detail });
}

const KNOWN_CONTAMINATION_PATTERNS = [
  {
    regex: /vado in stazione alle sei/i,
    severity: "high",
    category: "contamination",
    detail: "Contains the known contaminated sentence that should have been removed.",
  },
  {
    regex: /vado a appuntamento alle sei/i,
    severity: "high",
    category: "awkward_italian",
    detail: "Contains the known malformed replacement sentence with missing contraction.",
  },
];

const AWKWARD_ITALIAN_PATTERNS = [
  {
    regex: /\ba appuntamento\b/i,
    detail: "Possible missing contraction before vowel after preposition.",
  },
  {
    regex: /\b(a|di|da|in|su)\s+il\b/i,
    detail: "Possible missing articulated preposition.",
  },
  {
    regex: /\bqual e\b/i,
    detail: "ASCII fallback without apostrophe/accent in learner-facing Italian.",
  },
  {
    regex: /\bc'e\b/i,
    detail: "ASCII fallback for c'e in learner-facing Italian.",
  },
];

const FORMAL_MARKERS = [
  /\bLei\b/,
  /\bLa\b/,
  /\bLe\b/,
  /\bpuò\b/i,
  /\bpotrebbe\b/i,
  /\bdesidera\b/i,
  /\bsi accomodi\b/i,
];

const INFORMAL_MARKERS = [
  /\btu\b/i,
  /\bti\b/i,
  /\bte\b/i,
  /\bciao\b/i,
  /\bvuoi\b/i,
  /\bpuoi\b/i,
  /\bdai\b/i,
  /\bdimmi\b/i,
];

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function auditCard(card, findings) {
  const ref = `card:${card._id}`;
  if (!card.level) addFinding(findings, "medium", "missing_level", "card", ref, "Card is missing CEFR level.");
  if (!card.tag) addFinding(findings, "medium", "missing_tag", "card", ref, "Card is missing tag.");
  if (!card.example) addFinding(findings, "medium", "missing_example", "card", ref, "Card is missing example.");
  if (card.source === "recovery" && !card.explanation) {
    addFinding(findings, "medium", "missing_explanation", "card", ref, "Recovery card is missing explanation.");
  }

  const texts = [card.it, card.en, card.example, card.prompt, card.explanation].filter(Boolean);
  const combined = texts.join("\n");

  for (const pattern of KNOWN_CONTAMINATION_PATTERNS) {
    if (pattern.regex.test(combined)) {
      addFinding(findings, pattern.severity, pattern.category, "card", ref, pattern.detail);
    }
  }
}

function validateOptionsArray(findings, scope, ref, items, sentencePath) {
  if (!Array.isArray(items.options) || items.options.length !== 4) {
    addFinding(findings, "high", "broken_shape", scope, ref, `${sentencePath} should have exactly 4 options.`);
    return;
  }
  if (typeof items.correct !== "number" || items.correct < 0 || items.correct >= items.options.length) {
    addFinding(findings, "high", "broken_answer_key", scope, ref, `${sentencePath} has invalid correct index.`);
  }
}

function auditExerciseShape(row, findings, scope) {
  const ref = `${scope}:${row._id}`;
  const content = row.content;
  if (!content || typeof content !== "object") {
    addFinding(findings, "high", "broken_shape", scope, ref, "Content payload is missing or not an object.");
    return;
  }

  switch (row.type) {
    case "cloze":
      if (typeof content.sentence !== "string" && !Array.isArray(content.sentences)) {
        addFinding(findings, "high", "broken_shape", scope, ref, "Cloze content is missing sentence data.");
      }
      if (Array.isArray(content.options)) validateOptionsArray(findings, scope, ref, content, "content");
      break;
    case "pattern_drill":
      if (!Array.isArray(content.sentences) || content.sentences.length === 0) {
        addFinding(findings, "high", "broken_shape", scope, ref, "Pattern drill has no sentences.");
        break;
      }
      content.sentences.forEach((sentence, index) => {
        if (!sentence?.template || !sentence?.correct) {
          addFinding(findings, "high", "broken_shape", scope, ref, `content.sentences[${index}] is missing template or correct answer.`);
        }
      });
      break;
    case "speed_translation":
      if (!Array.isArray(content.sentences) || content.sentences.length === 0) {
        addFinding(findings, "high", "broken_shape", scope, ref, "Speed translation has no sentences.");
        break;
      }
      content.sentences.forEach((sentence, index) => validateOptionsArray(findings, scope, ref, sentence, `content.sentences[${index}]`));
      break;
    case "error_hunt":
      if (!Array.isArray(content.sentences) || content.sentences.length === 0) {
        addFinding(findings, "high", "broken_shape", scope, ref, "Error hunt has no sentences.");
        break;
      }
      content.sentences.forEach((sentence, index) => {
        if (sentence?.has_error && (!sentence.corrected || sentence.corrected === sentence.text)) {
          addFinding(findings, "high", "broken_answer_key", scope, ref, `content.sentences[${index}] is marked wrong without a distinct correction.`);
        }
      });
      break;
    case "conversation":
      if (!Array.isArray(content.target_phrases) || content.target_phrases.length === 0) {
        addFinding(findings, "medium", "weak_content", scope, ref, "Conversation is missing target phrases.");
      }
      if (!content.system_prompt) {
        addFinding(findings, "high", "broken_shape", scope, ref, "Conversation is missing system prompt.");
      }
      if (!content.opening_line && !content.scenario) {
        addFinding(findings, "medium", "weak_content", scope, ref, "Conversation is missing both opening line and scenario framing.");
      }
      break;
    default:
      break;
  }
}

function auditLanguageStrings(row, findings, scope) {
  const ref = `${scope}:${row._id}`;
  const strings = extractStrings(row.content ?? row).filter((entry) => entry.value.trim());
  const combined = strings.map((entry) => entry.value).join("\n");

  for (const pattern of KNOWN_CONTAMINATION_PATTERNS) {
    if (pattern.regex.test(combined)) {
      addFinding(findings, pattern.severity, pattern.category, scope, ref, pattern.detail);
    }
  }

  for (const pattern of AWKWARD_ITALIAN_PATTERNS) {
    const hit = strings.find((entry) => pattern.regex.test(entry.value));
    if (hit) {
      addFinding(findings, "medium", "awkward_italian", scope, ref, `${pattern.detail} (${hit.path})`);
    }
  }

  const mixedRegisterEntry = strings.find(
    (entry) => hasAny(entry.value, FORMAL_MARKERS) && hasAny(entry.value, INFORMAL_MARKERS)
  );
  if (mixedRegisterEntry) {
    addFinding(findings, "medium", "mixed_register", scope, ref, `Formal and informal markers appear in the same string (${mixedRegisterEntry.path}).`);
  }
}

function summarize(findings) {
  const bySeverity = {};
  const byCategory = {};
  for (const finding of findings) {
    bySeverity[finding.severity] = (bySeverity[finding.severity] ?? 0) + 1;
    byCategory[finding.category] = (byCategory[finding.category] ?? 0) + 1;
  }
  return { bySeverity, byCategory };
}

function formatReport(corpus, findings) {
  const summary = summarize(findings);
  const topFindings = findings
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity] || a.category.localeCompare(b.category);
    })
    .slice(0, 40);

  const lines = [];
  lines.push(`# Live Content Audit`);
  lines.push("");
  lines.push(`- cards: ${corpus.cards.length}`);
  lines.push(`- exercises: ${corpus.exercises.length}`);
  lines.push(`- exerciseTemplates rows: ${corpus.exerciseTemplates.length}`);
  lines.push(`- findings: ${findings.length}`);
  lines.push("");
  lines.push(`## Findings by Severity`);
  for (const severity of ["high", "medium", "low"]) {
    lines.push(`- ${severity}: ${summary.bySeverity[severity] ?? 0}`);
  }
  lines.push("");
  lines.push(`## Findings by Category`);
  for (const [category, count] of Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${category}: ${count}`);
  }
  lines.push("");
  lines.push(`## Sample Findings`);
  if (topFindings.length === 0) {
    lines.push(`- none`);
  } else {
    for (const finding of topFindings) {
      lines.push(`- [${finding.severity}] ${finding.scope} ${finding.ref}: ${finding.category} - ${finding.detail}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const writePathArg = process.argv.find((arg) => arg.startsWith("--write="));
  loadEnv();
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  const corpus = await client.query(api.contentAudit.exportCorpus, {});
  const findings = [];

  for (const card of corpus.cards) auditCard(card, findings);
  for (const exercise of corpus.exercises) {
    auditExerciseShape(exercise, findings, "exercise");
    auditLanguageStrings(exercise, findings, "exercise");
  }
  for (const row of corpus.exerciseTemplates) {
    auditExerciseShape(row, findings, "template");
    auditLanguageStrings(row, findings, "template");
  }

  const report = formatReport(corpus, findings);
  if (writePathArg) {
    fs.writeFileSync(writePathArg.slice("--write=".length), report, "utf8");
  }
  process.stdout.write(`${report}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
