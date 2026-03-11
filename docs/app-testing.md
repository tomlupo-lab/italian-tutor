# App Testing

This app now has two complementary testing layers:

- Chrome MCP for fast manual verification of real user flows
- Playwright for repeatable end-to-end regression checks

Use both. Chrome MCP is better for exploratory validation and debugging. Playwright is better for stable smoke tests after frontend or backend changes.

Playwright should run against a production-style server by default. This repo previously used `next dev` for e2e, but that proved flaky because Next 15 dev mode intermittently broke `.next` manifests and chunk loading. The default Playwright config now runs `next build && next start`.

## What To Verify First

After meaningful UI or generator changes, verify these flows first:

- home launchpad renders the current `Best next step`
- `/patterns` loads and launches pattern-focused drills
- `/skills` redirects to `/patterns`
- `/missions` can set an active mission
- `/missions/current` shows the three tier actions
- `/drills?focus=recovery` still opens recovery mode

These are the highest-value smoke flows for the current app model.

## Chrome MCP

Use Chrome MCP when you want to click through the app like a user and inspect what is actually rendered.

Good use cases:

- validate copy and CTA changes
- verify redirects and navigation
- confirm recommendation logic on the home screen
- inspect a broken flow after a refactor
- manually check generated drill/session states

Recommended manual smoke flow:

1. Start the app locally.
2. Open `/`.
3. Confirm the home launchpad shows `Best next step`.
4. Open `/patterns`.
5. Pick a level and pattern lane.
6. Launch `Start pattern practice`.
7. Confirm the drills page opens in pattern mode.
8. Open `/missions`.
9. Set an active mission.
10. Open `/missions/current`.
11. Confirm `Review words`, `Do drills`, and `Practice conversation` are available.

Chrome MCP is the right tool when the question is “does the app behave correctly right now?”

## Playwright

Use Playwright when you want the same smoke flow checked automatically on every important change.

Current e2e tests live in [tests/e2e](/home/twilc/projects/italian-tutor/italian-tutor/tests/e2e).

Main commands:

```bash
npm test
```

```bash
npm run test:e2e
```

This does three things:

1. resets app state in Convex
2. builds the app
3. runs Playwright against `next start`

Run Playwright against an already running local server:

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test
```

Run a single spec:

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test tests/e2e/mission-loop.spec.ts
```

Run headed for debugging:

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test --headed
```

If you specifically want to point Playwright at a manually running dev server, use:

```bash
npm run dev
```

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e:dev
```

Use that only for interactive debugging. For reliable regression checks, prefer `npm run test:e2e`.

## Recommended Test Strategy

Use this order after non-trivial changes:

1. `npm test`
2. Chrome MCP manual smoke flow
3. `npm run test:e2e`

That catches:

- pure logic regressions
- UI/copy/navigation issues
- end-to-end flow breakage

## What Playwright Should Cover

Keep the Playwright suite focused on stable product-critical flows, not brittle session internals.

Good candidates:

- home launchpad renders correctly
- `/skills` redirects to `/patterns`
- patterns page launches `/drills?focus=pattern...`
- missions page can activate a mission
- current mission page exposes the three tier actions

Avoid overfitting tests to:

- exact generated exercise content
- unstable copy details beyond key CTA labels
- deep AI conversation/session scoring internals unless explicitly under test

The goal is regression protection, not snapshotting every runtime detail.

## Notes

- If Convex bindings or schema feel stale, run `npx convex dev`.
- If Playwright fails because the app server is not reachable, prefer rerunning `npm run test:e2e` before debugging app logic.
- If you are debugging with `next dev` and local build artifacts under `.next` are in a bad state, restart the dev server before chasing app-level failures.
