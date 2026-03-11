# Content Review Checklist

Use this checklist when reviewing learner-facing content in Italian Tutor, including:

- curriculum entries and seed content
- practice prompts and drill copy
- hints, corrections, and session summaries
- badges, labels, and instructional UI copy

The goal is not just "correct Italian." The content should also be teachable, fair, natural, and consistent with the app's progression model.

## Review Process

For each content item or batch:

1. Identify the learner level and exercise type.
2. Review the Italian for correctness and naturalness.
3. Review the prompt, expected answer, and feedback together.
4. Mark each section below as `pass`, `needs revision`, or `not applicable`.
5. Capture concrete examples of issues, not just general impressions.

## 1. Pedagogical Accuracy

Check:

- Is the Italian grammatically correct?
- Is the English gloss or explanation accurate?
- Are tense, gender, number, and article choices correct?
- Are irregular forms handled correctly?
- Are grammar notes teaching the right rule rather than an oversimplified or misleading one?

Fail examples:

- Wrong agreement: `la problema` instead of `il problema`
- Misleading gloss: translating `magari` as only `maybe`
- Teaching a pattern as universal when it has common exceptions

## 2. Learner Level Fit

Check:

- Does the item match the intended difficulty?
- Does it assume vocabulary or grammar the learner has not seen yet?
- Is the explanation short enough for the level?
- Does the item test one main concept at a time?

Fail examples:

- Beginner prompt that requires subjunctive or clitic pronouns
- Short vocab drill that secretly depends on advanced sentence parsing
- Explanation packed with grammar jargon for an A1/A2 learner

## 3. Naturalness and Real Usage

Check:

- Would a native speaker plausibly say this in the given context?
- Is the phrasing idiomatic rather than word-for-word from English?
- Are register and tone appropriate for the scenario?
- If the content is intentionally formal or literary, is that made clear?

Fail examples:

- Literal translation that sounds unnatural in Italian
- Dialogue lines that are technically valid but not how people normally speak
- Overuse of explicit subject pronouns where Italian would usually omit them

## 4. Prompt Clarity

Check:

- Is the learner being asked to do one clear task?
- Does the prompt specify whether translation, completion, speaking, or recognition is expected?
- Is there enough context to choose the intended meaning?
- Are instructions concise and unambiguous?

Fail examples:

- Prompt that could require either translation or free response
- English sentence with two possible Italian meanings and no context
- Drill wording that hides what counts as correct

## 5. Acceptable Answer Coverage

Check:

- Are multiple valid answers recognized where appropriate?
- Are synonyms, contractions, and common word-order variants handled fairly?
- Is formality accounted for if both `tu` and `Lei` answers could be valid?
- Are accent and punctuation rules enforced only when pedagogically justified?

Fail examples:

- Only accepting one of several correct prepositions
- Marking `Vorrei` wrong because the seed answer used `Mi piacerebbe`
- Rejecting a valid answer for missing punctuation in a non-punctuation exercise

## 6. Feedback and Correction Quality

Check:

- If the learner is wrong, does the feedback explain why?
- Does the correction identify the real mistake category?
- Are hints useful without giving away the answer too early?
- Do summaries describe performance accurately and constructively?

Fail examples:

- "Incorrect" with no explanation
- Feedback claims a vocab error when the real issue is article agreement
- Hint repeats the prompt without adding useful guidance

## 7. Consistency Across the App

Check:

- Are the same grammar terms used consistently?
- Are the same words translated the same way unless context demands otherwise?
- Do badge labels, summaries, and drill instructions use the same naming conventions?
- Are tense names, proficiency labels, and exercise directions aligned across screens and docs?

Fail examples:

- One screen says "present tense," another says "simple present," and a third says "presente" without reason
- Same vocab item translated differently in parallel beginner lessons without explanation

## 8. Progression and Reinforcement

Check:

- Does the content introduce concepts in a sensible order?
- Are new concepts reinforced later in drills or summaries?
- Is there a reasonable ratio of review to new material?
- Are prerequisite concepts established before dependent ones appear?

Fail examples:

- Introducing object pronouns before learners have enough exposure to basic sentence order
- New vocab appearing once and never being revisited
- A review set that is mostly unseen material

## 9. Cultural and Context Fit

Check:

- Do examples reflect plausible everyday situations?
- Are names, places, and scenarios neutral or intentionally chosen?
- Does the content avoid awkward stereotypes or textbook-only situations?
- If cultural context matters, is it accurate enough to be useful?

Fail examples:

- Unrealistic dialogue that no learner is likely to encounter
- Culturally off advice presented as standard usage everywhere in Italy

## 10. UI Copy Quality

Check:

- Are buttons, labels, badges, and summaries easy to understand quickly?
- Is the wording learner-centered rather than internal/system-oriented?
- Are short strings specific enough to guide the next action?
- Does the tone fit the rest of the app?

Fail examples:

- Badge text that sounds like an internal metric instead of learner feedback
- Session summary labels too vague to be actionable
- Instruction copy that is longer than the task itself

## 11. Data Integrity for Content Records

Use this when reviewing schema-backed content, seed data, or generated records.

Check:

- Is the content tagged with the right direction, level, topic, or grammar area?
- Are required fields complete?
- Do example sentences match the target term or rule?
- Is metadata specific enough to support filtering and spaced review?
- Are duplicate or near-duplicate records intentional?

Fail examples:

- `en_to_it` item whose stored answer is effectively `it_to_en`
- Card examples that use a different sense of the target word than the gloss
- Difficulty tags that do not match the actual content

## 12. Review Output Format

When filing a review, record issues in this structure:

```md
## Item
- Identifier:
- Surface text:
- Exercise type:
- Intended level:

## Findings
- Severity: high | medium | low
- Category:
- Issue:
- Why it matters:
- Suggested revision:
```

## Severity Guide

- High: teaches incorrect Italian, blocks fair grading, or misleads learners materially
- Medium: understandable but unnatural, inconsistent, or poorly leveled
- Low: style, wording, tone, or polish issue that does not change the teaching outcome

## Quick Sign-Off Questions

Before approving content, ask:

- Would I be comfortable teaching this exact phrasing to a learner?
- Would I accept more than one valid answer here?
- If a learner got this wrong, would the feedback help them improve?
- Does this item fit the lesson or drill sequence around it?
- Is the wording consistent with the rest of the app?

If any answer is "no" or "not sure," do not approve without revision.
