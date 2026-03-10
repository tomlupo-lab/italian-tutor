# AGENTS.md

## Project Overview

Italian Tutor is a Next.js App Router application for Italian language practice. It uses:

- Next.js 15
- React 19
- Tailwind CSS
- Convex for app data
- OpenAI for chat, TTS, STT, and exercise generation

Primary app code lives in `src/`.
Convex functions and schema live in `convex/`.

## Local Development

Use Node.js 20+.

Install and run:

```bash
npm install
npx convex dev
npm run dev
```

Open `http://localhost:3000/`.

## Required Environment

The app expects `.env.local` in the repo root.

Required values:

```env
OPENAI_API_KEY=...
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
NEXT_PUBLIC_BASE_PATH=/
```

Useful additional values:

```env
NEXT_PUBLIC_CONVEX_SITE_URL=https://<deployment>.convex.site
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
CONVEX_DEPLOYMENT=dev:<deployment>
```

Notes:

- `NEXT_PUBLIC_CONVEX_URL` must be the `.convex.cloud` URL, not `.convex.site`.
- `NEXT_PUBLIC_BASE_PATH` defaults to `/tutor` in `next.config.js`. For local development, prefer `/`.

## Important Structure

- `src/app/` contains routes, layouts, and API handlers.
- `src/app/api/` contains OpenAI-backed server routes.
- `src/app/ConvexClientProvider.tsx` initializes the Convex client.
- `convex/` contains queries, mutations, seed data, and schema.
- `tests/*.test.mjs` contains the current automated tests.

## Commands

- Dev server: `npm run dev`
- Production build: `npm run build`
- Production start: `npm run start`
- Tests: `npm test`

If Convex types or generated API bindings look stale, run:

```bash
npx convex dev
```

## Change Guidelines

- Preserve the existing App Router structure.
- Do not hardcode `.convex.site` into the Convex React client.
- Be careful with `NEXT_PUBLIC_BASE_PATH`; route and asset behavior depend on it.
- Prefer small, targeted changes over broad refactors unless requested.
- Keep API keys and secrets out of committed files.

## Verification Expectations

For changes that affect runtime behavior, verify at least one of:

- `npm test`
- `npm run build`
- `npm run dev`

For Convex-related changes, verify that the app still boots with `.env.local` populated and `npx convex dev` running.
