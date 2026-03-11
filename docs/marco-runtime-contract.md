# Marco Runtime Contract

## Purpose

This document defines the operational contract between the Italian Tutor app and Marco-style generation/analysis logic.

It is narrower than the product/system reference:

- `docs/marco-app-alignment-spec.md` explains architecture and ownership
- this document explains runtime events, generation jobs, and artifact ingestion

## Runtime Principles

- Convex remains the source of truth for learner progression
- Marco-style generation reacts to learner state; it does not own mission truth
- generation should be inventory-aware and mission-aware
- recovery generation should be triggered by actual learner weakness, not by calendar slots

## Canonical Ownership Boundary

### App / Convex owns

- active mission
- mission progress
- checkpoint completion
- level unlock state
- cards
- sessions
- exercise inventory

### Marco owns

- generating exercises
- generating recovery drills
- generating card candidates from mistakes
- summarizing error trends
- summarizing skill trends
- proposing next content to top up

Marco output is advisory/artifact-producing. It is not canonical progression state.

## Runtime Jobs

### 1. Event-Driven Mission Top-Up

Trigger when:

- active mission inventory is empty
- runnable inventory for a mission tier is low
- mission changes
- checkpoint completion creates a new content need

Current app entrypoints already trigger generation from:

- Home
- Current Mission

Expected output:

- new mission-scoped exercises with source `mission_topup`
- correct mission metadata:
  - `missionId`
  - `checkpointId`
  - `tier`
  - `generationReason`
  - `variantKey`
  - `staleAfter`

### 2. Recovery Drill Generation

Trigger when:

- learner enters `Practice mistakes`
- active mission is blocked by critical errors
- recent errors cluster around specific skill areas

Expected output:

- drill batches with source `recovery`
- error/category linkage that explains why this set exists

### 3. Card Growth / Recovery Card Generation

Trigger when:

- learner finishes a session with wrong answers
- learner makes conversation corrections worth retention

Expected output:

- card writes or card upserts using:
  - `seed`
  - `mission_topup`
  - `recovery`
  - `manual`

Current migration note:

- legacy card source values have been migrated out of persisted data
- canonical card source values are now:
  - `seed`
  - `mission_topup`
  - `recovery`
  - `manual`

### 4. Daily Maintenance

Trigger:

- once per day

Purpose:

- detect low inventory
- expire stale variants
- archive exhausted content
- keep recovery availability healthy

This is maintenance. It must not reintroduce weekly batch planning.

### 5. Analytics Refresh

Trigger:

- daily or several times per day

Purpose:

- update error trend summaries
- update learner-facing skill trend summaries
- feed future generation priorities

This should not create user-facing weekly plans.

## Event Payload: App -> Marco

Recommended shape:

```json
{
  "eventType": "session_completed",
  "learnerId": "default",
  "timestamp": "2026-03-08T17:00:00+01:00",
  "activeMission": {
    "missionId": "a1-bar-caffe-order",
    "level": "A1",
    "status": "active",
    "checkpointId": "place-basic-order"
  },
  "missionProgress": {
    "bronze": 6,
    "silver": 2,
    "gold": 1,
    "criticalErrorsCount": 1
  },
  "recentSession": {
    "sessionId": "abc123",
    "mode": "silver",
    "score": 81,
    "errors": ["preposition", "article_gender_number"],
    "phrasesUsed": ["vorrei", "per favore"]
  },
  "inventory": {
    "quickReady": 12,
    "standardReady": 2,
    "deepReady": 0,
    "recoveryReady": 3
  },
  "dueCards": 14
}
```

Notes:

- event payloads are input state snapshots
- they must not be treated as permission to overwrite canonical mission truth

## Artifact Payload: Marco -> App

Recommended shape:

```json
{
  "requestId": "req_123",
  "generatedAt": "2026-03-08T17:00:04+01:00",
  "artifacts": {
    "exercises": [
      {
        "missionId": "a1-bar-caffe-order",
        "checkpointId": "place-basic-order",
        "tier": "silver",
        "type": "pattern_drill",
        "difficulty": "A1",
        "source": "mission_topup"
      }
    ],
    "cards": [
      {
        "it": "al tavolo",
        "en": "at the table",
        "source": "recovery",
        "errorCategory": "preposition"
      }
    ]
  },
  "signals": {
    "skills": [
      { "skillKey": "pragmatics", "delta": 1 }
    ],
    "errors": [
      { "errorKey": "preposition", "delta": 2 }
    ]
  },
  "summary": {
    "reason": "deep inventory empty and learner blocked on prepositions",
    "recommendedNextTier": "silver"
  }
}
```

Notes:

- the app ingests artifacts
- the app may display summary/recommendation text
- the app remains the final owner of progression state

## Current Code Mapping

### Generation triggers

- mission top-up:
  - `convex/exerciseGenerator.ts`
  - `src/app/page.tsx`
  - `src/app/missions/current/page.tsx`

### Recovery generation

- `src/app/api/generate-practice/route.ts`
- `src/app/drills/page.tsx`

### Learner result extraction

- `src/hooks/useExerciseSession.ts`

### Analytics surfaces

- `src/hooks/useProgressAnalytics.ts`
- `src/app/progress/page.tsx`

## Compatibility Notes

- exercise inventory is already mission-aware
- recovery flow is already event/state-driven
- card source migration has been completed; runtime writes now use only the newer source labels

## Operational Rule

If a future job or integration proposal reintroduces:

- weekly plans
- Sunday batch generation
- nightly lesson patching as the primary delivery model

it conflicts with the current app contract and should be rejected or rewritten.
