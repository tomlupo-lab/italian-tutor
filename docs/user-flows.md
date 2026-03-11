# User Flows

## Purpose

This document describes the main learner flows in Italian Tutor and how they support a continuous learning loop.

It is a product and design reference for:

- home screen decisions
- practice recommendations
- mission/scenario flow
- recovery flow
- future UX changes

This document is not a backend contract. It explains how the app should feel and what each flow is supposed to do for learning.

## Core Learning Loop

Italian Tutor is built around a continuous loop:

1. review what is due
2. practice reusable language
3. use that language in integrated scenarios
4. detect weak spots
5. repair those weak spots
6. return to review and reuse

In short:

- `Review` keeps language alive
- `Patterns` build reusable language
- `Missions` test integrated use
- `Recovery` fixes what broke

## Main Flows

## 1. Review Flow

### Typical path

- open Home
- `Best next step` recommends `Review words`
- open review practice
- complete due cards
- continue to patterns, recovery, or mission

### Learning role

This flow reinforces retention.

It exists to:

- keep high-frequency words and chunks active
- maintain recall speed
- strengthen long-term memory

### Feedback loop contribution

- the learner rates recall quality
- the app sees what is stable and what is weak
- review results influence what needs more work later

## 2. Recovery Flow

### Typical path

- open Home or finish a session
- choose `Practice mistakes`
- open a recovery-focused drill set
- complete a short repair block
- return to review, patterns, or mission

### Learning role

This flow reinforces correction.

It exists to:

- turn recent failures into focused follow-up
- stop recurring mistakes from becoming habits
- clean up weak spots before they compound

### Feedback loop contribution

This is the tightest correction loop in the app:

- make mistake
- surface weak spot
- practice it again soon

Recovery should be short, direct, and linked to real recent errors.

## 3. Pattern Flow

### Typical path

- open Home
- choose `Patterns`
- pick CEFR level
- pick a pattern lane
- complete a focused short set
- reuse the language later in missions or drills

### Learning role

This flow reinforces reusable production.

It exists to:

- build automaticity around high-yield sentence frames
- improve transfer across multiple scenarios
- support fast functional Italian, not isolated grammar trivia

### Feedback loop contribution

- the learner practices one language family repeatedly
- the app sees whether that language holds across formats
- later mission or recovery performance shows whether the pattern is truly usable

This is the main bridge between isolated study and practical use.

## 4. Mission Flow

### Typical path

- open Home
- choose `Continue mission` or open current mission
- choose Bronze, Silver, or Gold practice
- launch a session
- complete scenario-linked work
- return to home or targeted follow-up

### Learning role

This flow reinforces integration.

It exists to:

- combine vocabulary, grammar, comprehension, and response
- test whether learning is usable in realistic situations
- provide a motivating scenario context

### Tier roles

- Bronze: refresh recall that supports the mission
- Silver: do focused drills that support the mission
- Gold: use language in a more integrated scenario or conversation

### Feedback loop contribution

- missions expose where language breaks under pressure
- weak performance should feed back into recovery or pattern practice
- strong performance confirms that training is transferring into usable ability

## 5. Free Drill Flow

### Typical path

- open Drills directly
- choose mixed drills or one drill type
- complete a short set

### Learning role

This flow reinforces variety and volume.

It exists to:

- support extra reps without committing to a mission
- let the learner choose a format quickly
- provide flexibility when the learner wants practice but not structure

### Feedback loop contribution

This flow has a weaker loop than recovery or pattern practice, but it still:

- produces repetition
- maintains momentum
- reveals performance trends in familiar exercise formats

## 6. Mission Selection Flow

### Typical path

- open Missions
- scan missions by CEFR level
- activate one mission
- continue from current mission page

### Learning role

This flow reinforces direction.

It exists to:

- give the learner a current challenge
- anchor practice in a meaningful context
- prevent the app from feeling like disconnected exercise buckets

### Feedback loop contribution

Mission selection gives the rest of the loop a target:

- review supports the mission
- patterns support the mission
- recovery clears blockers that show up during the mission

## Recommended Daily Loop

The most natural daily loop for the current app is:

1. review due cards if needed
2. fix mistakes if recovery is active
3. do one pattern lane
4. do one mission or scenario session

This sequence works because:

- review protects memory
- recovery fixes fragile areas
- patterns build reusable language
- missions test integrated use

## Home Screen Intent

The home screen should behave like a launchpad, not a dashboard.

Its main job is to help the learner answer:

- what should I practice right now?

The current recommendation order is:

1. `Practice mistakes` when critical weak spots are active
2. `Review words` when due cards exist
3. `Continue mission` when a mission is active and ready
4. `Learn patterns` when there is no stronger immediate need

## Product Principle

Each flow should have a distinct job.

The app works best when:

- review is for retention
- recovery is for correction
- patterns are for reusable language
- missions are for integrated use

If two flows start doing the same job, the UX becomes noisy and the learning loop weakens.
