# Curriculum Content Model

## Purpose

This document defines the content metadata and quality contract for learner-facing curriculum items in Italian Tutor.

It bridges:

- the progression logic in [fast-italian-roadmap.md](/home/twilc/projects/italian-tutor/italian-tutor/docs/fast-italian-roadmap.md)
- the reusable language units in [core-italian-sentence-patterns.md](/home/twilc/projects/italian-tutor/italian-tutor/docs/core-italian-sentence-patterns.md)
- the QA process in [content-review-checklist.md](/home/twilc/projects/italian-tutor/italian-tutor/docs/content-review-checklist.md)

Use this document when designing, tagging, generating, or auditing:

- SRS cards
- drills
- practice prompts
- hints and corrections
- mission-linked exercise content

## Core Principle

Each content item should be describable as:

- teaching or reinforcing a specific phase of the fast roadmap
- built around one or more reusable sentence patterns or grammar targets
- tied to a practical communicative function
- valid for a clear learner level and context

If a content item cannot be placed cleanly in that model, it is likely under-specified or pedagogically weak.

This document is an authoring, generation, and audit reference. It does not imply that the product must hard-gate mission access based on all of this metadata.

## Required Metadata

Every learner-facing content item should have or imply the following fields.

### Curriculum fields

- `phase`
  - `phase_1`
  - `phase_2`
  - `phase_3`
- `cefr`
  - `A1`
  - `A2`
  - `B1`
- `grammarFocus`
  Examples:
  - `present_tense`
  - `modal_verbs`
  - `passato_prossimo`
  - `imperfetto`
  - `future`
  - `comparatives`
  - `relative_clauses`
- `vocabDomains`
  Examples:
  - `food`
  - `travel`
  - `housing`
  - `work`
  - `routine`
  - `health`
  - `shopping`
  - `social`
- `communicativeFunction`
  Examples:
  - `introduce_self`
  - `ask_for_help`
  - `order_politely`
  - `describe_location`
  - `report_past_event`
  - `state_preference`
  - `explain_reason`
  - `state_future_plan`

### Pattern fields

- `patternId`
  This should point to a canonical pattern family from [core-italian-sentence-patterns.md](/home/twilc/projects/italian-tutor/italian-tutor/docs/core-italian-sentence-patterns.md).
- `targetForm`
  The core chunk, sentence frame, or structure being practiced.
- `substitutionSlots`
  The learner-editable or swappable elements inside the pattern.
- `prerequisitePatterns`
  A list of simpler patterns that should already be known.
- `prerequisiteGrammar`
  Any grammar the learner must already command to make the item fair.

### Delivery fields

- `exerciseType`
  Examples:
  - `srs`
  - `cloze`
  - `word_builder`
  - `pattern_drill`
  - `speed_translation`
  - `error_hunt`
  - `conversation`
  - `reflection`
- `taskType`
  Examples:
  - `recognition`
  - `production`
  - `guided_production`
  - `correction`
  - `listening_decode`
- `promptMode`
  Examples:
  - `it_to_en`
  - `en_to_it`
  - `audio_to_text`
  - `fill_gap`
  - `speak_response`
- `feedbackMode`
  Examples:
  - `show_answer`
  - `explain_rule`
  - `show_variants`
  - `classify_error`

### Quality fields

- `naturalnessLevel`
  - `high`
  - `acceptable`
  - `review_needed`
- `reuseValue`
  - `high`
  - `medium`
  - `low`
- `teachesReusableLanguage`
  - `true`
  - `false`

## Pattern Canonicalization

To make audits and generation consistent, early patterns should have stable IDs.

Recommended pattern IDs:

- `identity_essere`
- `duration_da`
- `location_essere`
- `movement_vado`
- `want_voglio`
- `polite_request_vorrei`
- `ability_posso`
- `obligation_devo`
- `need_ho_bisogno_di`
- `like_mi_piace`
- `preference_preferisco`
- `past_ho_participio`
- `plan_penso_di`
- `future_simple`
- `explanation_perche`
- `opinion_secondo_me`
- `description_e_aggettivo`
- `relative_clause_che`
- `opinion_penso_che`

## Level And Phase Rules

### Phase 1

Allowed center of gravity:

- present tense
- `essere`
- `avere`
- modal verbs
- articles
- basic prepositions
- top-priority sentence patterns

Avoid unless strongly justified:

- advanced pronoun handling
- hidden tense contrast
- complex multi-clause prompts
- abstract opinion tasks

### Phase 2

Allowed expansion:

- `passato prossimo`
- reflexives
- direct object pronouns
- comparatives
- service and problem-solving interactions

Avoid unless explicitly scaffolded:

- dense formal register
- complex reasoning tasks
- long explanations with multiple constraints

### Phase 3

Allowed expansion:

- `imperfetto`
- future
- conditional
- relative clauses
- connected explanations
- simple argumentation

Use caution with:

- subjunctive-heavy prompts
- highly abstract social commentary
- advanced register shifts unless the mission clearly requires them

## Exercise-Type Guidance

### SRS

Must:

- teach reusable language
- have a clean front/back relationship
- avoid storing metadata as the answer

### Cloze

Must:

- test one main target at a time
- be solvable from level-appropriate context
- avoid multiple equally plausible answers unless intentionally supported

### Pattern drill

Must:

- clearly expose the reusable frame
- allow meaningful substitutions
- reinforce automaticity, not trivia

### Word builder / translation

Must:

- use phrases the learner is likely to need
- prefer natural Italian over literal word mapping
- accept fair variants where appropriate

### Conversation

Must:

- rely on language already established by the roadmap phase
- score task success separately from stretch-language ambition when possible
- not quietly require grammar far beyond the stated level, even if the app is only filtering missions by CEFR level

## SRS-Specific Contract

Allowed primary answer types:

- true gloss
- usable translation
- reusable sentence chunk
- clear grammatical completion

Disallowed primary answer types:

- internal metadata
- correction traces like `wrong -> correct`
- labels such as `Practice: ...`
- generic placeholders like `Error correction`

## Review And Audit Usage

When reviewing or auditing content:

1. identify the intended phase and CEFR band
2. identify the pattern family or grammar target
3. identify the communicative function
4. check whether the exercise type is appropriate for that target
5. check whether the content teaches reusable language

## Minimal Example Content Record

```json
{
  "phase": "phase_1",
  "cefr": "A1",
  "grammarFocus": ["modal_verbs"],
  "vocabDomains": ["food"],
  "communicativeFunction": "order_politely",
  "patternId": "polite_request_vorrei",
  "targetForm": "Vorrei un cappuccino.",
  "substitutionSlots": ["bevanda"],
  "prerequisitePatterns": ["identity_essere"],
  "prerequisiteGrammar": ["articles"],
  "exerciseType": "srs",
  "taskType": "production",
  "promptMode": "en_to_it",
  "feedbackMode": "show_variants",
  "naturalnessLevel": "high",
  "reuseValue": "high",
  "teachesReusableLanguage": true
}
```

## Summary

This content model exists to keep curriculum decisions, generated content, and QA aligned.

In short:

- the roadmap defines progression
- the pattern doc defines reusable language units
- this document defines content structure and metadata
- the checklist defines how to judge quality
