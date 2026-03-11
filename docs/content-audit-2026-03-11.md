# Content Audit - 2026-03-11

Scope:

- unpublished changes on `main` relative to `origin/main`
- learner-facing content and copy
- recovery-card quality
- copy-to-behavior consistency

Verification run during audit:

- `npm test` -> passed
- `npm run build` -> passed

## Findings

### 1. High - Recovery cards still save weak back-side content

Category:

- feedback quality
- prompt clarity
- acceptable answer coverage

Issue:

Recovery cards are often saved with back-side text that is not a real meaning or teachable gloss. Depending on exercise type, the learner may later review cards whose English side is:

- a hint
- a label like `Practice: <answer>`
- a trace like `wrong -> correct`
- a generic phrase like `Error correction`

Why it matters:

These cards do not function as clean SRS study material. They blur the difference between meaning, correction, and metadata, so the learner is asked to remember artifacts of the exercise instead of useful language.

Examples in code:

- [useExerciseSession.ts:160](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/hooks/useExerciseSession.ts#L160)
- [useExerciseSession.ts:194](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/hooks/useExerciseSession.ts#L194)
- [useExerciseSession.ts:212](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/hooks/useExerciseSession.ts#L212)
- [useExerciseSession.ts:233](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/hooks/useExerciseSession.ts#L233)
- [drills/page.tsx:262](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/app/drills/page.tsx#L262)
- [practice/page.tsx:40](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/app/practice/page.tsx#L40)

Suggested revision:

- Store a true gloss or learner-useful explanation on the back of recovery cards.
- Keep error metadata in dedicated fields, not in the review prompt itself.
- If the app wants to preserve the mistake trace, show it as supplemental feedback or example text rather than the main answer side.

### 2. Medium - `Include new cards` does not match actual behavior

Category:

- UI copy quality
- prompt clarity

Issue:

The toggle label says `Include new cards`, but the actual query behavior enables `includeAll`, which includes all matching cards regardless of due status, not specifically newly introduced cards.

Why it matters:

The learner is told they are widening review slightly, but the app is actually switching from due-only review to the full matching pool. That is a copy-to-behavior mismatch and can distort expectations about session difficulty and purpose.

Examples in code:

- [practice/page.tsx:192](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/app/practice/page.tsx#L192)
- [practice/page.tsx:208](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/app/practice/page.tsx#L208)
- [cards.ts:283](/home/botops/openclaw/.openclaw/repos/italian-tutor/convex/cards.ts#L283)
- [cards.ts:298](/home/botops/openclaw/.openclaw/repos/italian-tutor/convex/cards.ts#L298)

Suggested revision:

- Rename the toggle to something behaviorally accurate, such as `Review all matching cards`.
- If the intended behavior really is "new cards only," then the data/query layer needs an explicit definition of newness and a dedicated filter.

### 3. Medium - Skills page promise about current level is not reliably true

Category:

- UI copy quality
- consistency

Issue:

The page says it is defaulting to the learner's current level, but `selectedLevel` is initialized before learner progress finishes loading and is not updated afterward.

Why it matters:

Many learners will see `A1` selected even if their real level is higher. That makes the guidance misleading and can push learners into the wrong practice set.

Examples in code:

- [skills/page.tsx:31](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/app/skills/page.tsx#L31)
- [skills/page.tsx:49](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/app/skills/page.tsx#L49)

Suggested revision:

- Sync `selectedLevel` after learner progress loads, unless the user has already changed it manually.
- Or weaken the copy so it does not promise automatic defaulting if that behavior is not guaranteed.

### 4. Medium - Source-label rename appears to lack data migration

Category:

- data integrity
- consistency

Issue:

The branch renames card sources from legacy values such as `builtin`, `lesson`, and `correction` to `seed`, `mission_topup`, and `recovery`, but this audit did not find a migration for existing stored records.

Inference:

If persisted records still carry legacy values, recovery-specific screens and summaries may fail to include them because the new UI filters only on `recovery`.

Why it matters:

Learners may lose visibility into prior mistakes or see incomplete summaries, even though the underlying cards still exist.

Examples in code:

- [schema.ts:126](/home/botops/openclaw/.openclaw/repos/italian-tutor/convex/schema.ts#L126)
- [cards.ts:108](/home/botops/openclaw/.openclaw/repos/italian-tutor/convex/cards.ts#L108)
- [drills/page.tsx:107](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/app/drills/page.tsx#L107)
- [SessionSummary.tsx:90](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/components/SessionSummary.tsx#L90)

Suggested revision:

- Add an explicit data migration for legacy card source values.
- Or keep compatibility checks in UI/query code until production data is migrated.

### 5. Low - `Have conversation` is awkward UI English

Category:

- UI copy quality
- naturalness

Issue:

The mission tier label `Have conversation` is not idiomatic English.

Why it matters:

This is a visible primary action label. The meaning is clear, but the phrasing feels unfinished and weakens product polish.

Examples in code:

- [missions/current/page.tsx:27](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/app/missions/current/page.tsx#L27)
- [missions/current/page.tsx:262](/home/botops/openclaw/.openclaw/repos/italian-tutor/src/app/missions/current/page.tsx#L262)

Suggested revision:

- Change to `Have a conversation` or `Practice conversation`.

## Overall Assessment

The branch improves a large amount of learner-facing navigation and framing. Labels like `Practice mistakes`, `Review words`, and the revised skills-page descriptions are generally clearer than the previous wording.

The main unresolved quality risk is not surface copy. It is the pedagogical quality of recovery cards, which are still being generated from exercise artifacts rather than consistently teachable review content.

## Recommended Next Steps

1. Fix recovery-card payloads first.
2. Align misleading UI labels with actual behavior.
3. Add legacy-source migration or compatibility handling.
4. Do a second-pass copy polish on mission-tier wording and similar action labels.
