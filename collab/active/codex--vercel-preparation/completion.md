# Vercel preparation verification

Checked on 2026-10-14. Product source, tests, lockfile, package scripts and Next configuration are unchanged from `origin/dev` at `20b9471`.

## Changes and evidence

- Added the Korean [deployment guide](../../../docs/vercel-deployment.md) and its README entry point.
- Ignored `.vercel/`. Before the edit, `git check-ignore .vercel/project.json` did not match; afterwards both project metadata and downloaded environment files match the new rule.
- Fresh `pnpm install --frozen-lockfile` passed in this worktree with Node 24.19.0 and pnpm 10.34.6. Dependencies are local, not a link to another checkout. The existing lockfile did not change.
- `pnpm run check` passed: ESLint, type generation/TypeScript, 18 test files / 70 tests, and the default Turbopack production build. See [check output](verification/check.log.txt).
- `pnpm run format:check`, explicit Prettier check of the deployment guide, and `git diff --check` passed.
- Production API read-only checks: `/health` returned 200/ok, `/news?limit=1&offset=0` returned total 4 with the expected article and image fields, `/openapi.json` contained news/map routes and no `/reports` route. No collection, image generation or report submission was requested.
- Actual Chrome against the production Next build loaded all four articles, an existing image with HTTP 200, the selected article detail and a direct detail URL, and a UI keyword search with the same article. `/report` rendered its form without submission. No page errors. See [browser result](verification/browser.json) and screenshots alongside it. The owned browser and local server were stopped.
- The [first browser attempt](verification/browser-first-attempt.json) stopped because the temporary probe used the list link label `기사 원문` on the detail page, whose actual accessible name is `기사 원문 보기`. Correcting that locator preserved the original-link assertion and made the same flow pass. No application change or test assertion removal was involved. The corrected diagnostic script is preserved as [text](verification/browser-check.mjs.txt).
- Independent read-only review found no material mismatch between the guide and the Next/Go contracts.

## Deployment boundaries

- The source in `main` is older than all feature PRs #1–#15. Verify `dev` in Preview and use a separate integration PR for `dev → main`; this preparation did not merge branches.
- PR #16 remains open at `7cf4d32`. Its 81-test suite was verified in the prior feature; this preparation verifies the current dev's 70-test suite and does not claim PR #16 is included.
- The production OpenAPI currently lacks `/reports`; backend merge does not prove deployment. Report activation requires the frontend merge, backend deployment, persistent storage and exact-origin CORS.
- Vercel project listing did not show this frontend. The connector could list projects but team detail returned a scoped 403; read-only CLI fallback successfully confirmed `amazon7737s-projects` (Hobby). No project was created/linked, no environment variables uploaded, and no deployment was performed.
- Naver Maps was intentionally unconfigured in this isolated build. The production map Client ID and allowed deployment domain must be set and checked on the actual Preview/Production URLs.

## Learning and next decision

The default Turbopack build works with worktree-local dependencies; the earlier shared `node_modules` symlink failure does not require a production webpack override. Build success alone is insufficient: branch provenance, environment scope and provider origins remain release inputs. These facts are encoded in the deployment guide rather than duplicated in a new brain note. Next work is selecting the Vercel target and wiring a dev Preview, followed by the documented domain checks; no product feature expansion is needed for this preparation.
