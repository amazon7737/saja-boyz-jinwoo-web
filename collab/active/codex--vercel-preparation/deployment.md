# Personal fork deployment — 2026-10-14

The user explicitly authorized a personal GitHub fork and deployment on the existing Vercel Hobby plan. This extends the earlier preparation scope; [completion.md](completion.md) records the earlier pre-deployment checkpoint and is not evidence of the later cloud state.

## Source and target

- Fork: `amazon7737/saja-boyz-jinwoo-web`, repository ID `1418346545`, parent `team-poem/saja-boyz-jinwoo`. The old personal `saja-boyz-jinwoo` URL redirects to the organization repository, so a distinct fork name was used.
- Fork default branch: `dev`. Source SHA: `20b9471d839fa2b96ca6c1c255890faf27d8367c`, identical to upstream dev. Upstream main remains unchanged; PRs #16 and #17 remain open and are not included in the deployed source.
- Vercel Hobby account: `amazon7737s-projects`, `team_DZUBHc6UWEocDUpnKBMQQDlM`.
- Project: `saja-boyz-jinwoo`, `prj_kxZjBPwFMza7jiVdFuP9nBrT43Pt`.
- Deployment: `dpl_FoNCkNEuynjwDPY64TrPTeWxhgNJ`, source `cli`, target `production`, state `READY`.
- Stable URL: https://saja-boyz-jinwoo.vercel.app ; news listing: https://saja-boyz-jinwoo.vercel.app/incidents . The account-qualified alias is https://saja-boyz-jinwoo-amazon7737s-projects.vercel.app .

## Configuration and verification

- Native Next.js with Node 24.x, `pnpm install --frozen-lockfile`, `pnpm run build`, default Next output. Preview and Production have `NEWS_API_BASE_URL` pointing to the existing HTTPS OCI API and `ENABLE_EXPERIMENTAL_COREPACK=1`.
- The clean temporary clone was created from the personal fork's dev branch. CLI-generated `.gitignore` changes were restored before upload; `.vercel/` was excluded locally. The dry-run upload manifest excluded `.env.local` and `.vercel/`; only the tracked `.env.example` was included. No backend secrets or OIDC credentials were uploaded as source or committed.
- Vercel remote build succeeded with pnpm 10.34.6 and Next.js 16.3.8/Turbopack. [Build log](verification/vercel-build.log.txt), [filtered deployment metadata](verification/vercel-deployment.json), [HTTPS checks](verification/vercel-http.json).
- Actual Chrome on the public aliases showed four articles matching the current OCI response. The existing generated image loaded with natural dimensions 1024×1024 from the OCI HTTPS image route; the three articles without generated images displayed their fallback.
- Browser navigation passed: list to detail, original-article link visible, browser Back to list, direct detail entry and reload on the short stable alias, and UI keyword search for `현대엔지니어링` returning the expected article. Browser warning/error log was empty for the observed flow. No uploads, report submissions, news collection or image generation were performed.
- `/report` showed the current dev form with `제보 접수 준비 중`. `/` showed `지도 설정이 필요합니다` because no map Client ID was available. These are explicit incomplete integrations, not passed live-map or report-intake tests.
- Product source and tests did not change in this deployment task. The earlier full 70-test suite, lint, types and local production build evidence remains in [completion.md](completion.md). This checkpoint adds remote build and live-browser evidence without claiming the unmerged PR #16 suite was deployed.

## Remaining requirements and learning

- The MCP project creation call failed with scoped 403; the authenticated CLI created the same explicitly scoped project successfully. Creating it with Git integration initially failed because the Vercel GitHub app could not access the new fork. No duplicate Vercel project was created.
- The existing Vercel GitHub installation was found under the personal account, but GitHub required passkey confirmation before its repository settings were accessible. The user was asked to complete that authentication; the browser tab was left for handoff. Project Git link is currently null. CLI deployment is complete; Git push auto-deployment is not configured.
- Once authentication is complete, allow only the intended fork while preserving existing repository permissions, connect it to this existing Vercel project, set Production Branch to dev and verify the resulting source SHA. Do not recreate the project, upgrade the plan or merge upstream branches to work around connection requirements.
- The map Client ID was not found in frontend local env files. The user was asked for its value or file path. Do not substitute the Naver news-search Client ID. Register the actual stable deployment hostname in the Ncloud Maps application, set the public map Client ID, then rebuild and verify map tiles and geolocation flows.
- Upstream merges do not synchronize a fork. The Korean guide records the explicit fork sync and redeploy sequence. The distinction between a successful CLI deployment, Git auto-deployment and optional provider configuration is the useful lesson for the next handoff; no broader harness or application refactor is needed.
