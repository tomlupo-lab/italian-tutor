# Sprint Closeout

## Completed

- Audited and trimmed the live seeded inventory.
- Rebalanced default cards toward practical A1-B1 chunks and pattern-friendly examples.
- Normalized live seed taxonomy onto the runtime domain set.
- Added curriculum metadata to live cards, templates, and generated exercises: `phase`, `patternId`, and `domain`.
- Preserved docs-derived metadata in the seed path and backfilled runtime content.
- Added metadata-backed pattern coverage and a live curriculum audit surface.
- Normalized recovery cards into reusable chunk-first repair cards.
- Aligned recovery cards and mission generation with curriculum metadata.
- Added explicit mission target patterns and used them in shared-template selection.
- Fixed recovery review writes in `cards:bulkAdd` and verified the live drill-to-recovery path in-browser.

## Verification

- `npm test`
- `npm run build`
- `npx convex dev --once`
- `npx convex run missions:seedCatalog`
- `npx convex run seed:repairRecoveryCards`
- Live Chrome MCP sanity pass across home, patterns, curriculum audit, missions, and pattern drills

## Residual Notes

- `Playwright` instability is still best handled by running e2e against `next build && next start`.
- `.vscode/settings.json` remains an unrelated local-only change and is intentionally not included in sprint commits.
