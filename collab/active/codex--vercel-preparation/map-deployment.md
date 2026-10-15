# Git and live map deployment — 2026-10-14

This checkpoint follows [the initial CLI deployment](deployment.md). The user supplied the map Client ID in the ignored local `.env.local`, explicitly authorized its use, completed GitHub authentication, and signed in to Ncloud for domain registration. The prior missing-key and authentication-wait notes are historical.

## Applied configuration

- Registered only `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` from the local file as a Vercel Config variable for Production and Preview. The file remains ignored with mode 600. No Client Secret or backend credentials were copied into the frontend source or committed.
- Added only `amazon7737/saja-boyz-jinwoo-web` to the existing Vercel GitHub installation's selected repositories, preserving the other selected repositories. Connected it to existing project `prj_kxZjBPwFMza7jiVdFuP9nBrT43Pt`. The pending unrelated GitHub app permission upgrade was not accepted.
- Corrected the connection's initial Production Branch `main` to `dev`. Triggered a Git-source production deployment through the Vercel API: `dpl_7Sj4jtRngvm2qZzuXHdsDhrAXrV6`, `READY`, SHA `20b9471d839fa2b96ca6c1c255890faf27d8367c`. The API reports `source: cli`; `gitSource` and commit metadata prove the Git input. This is not evidence of a Git push event triggering an automatic build.
- Kept the existing Hobby plan, Node 24.x, pnpm 10.34.6, news API address and build settings. Product code and dependencies did not change.
- Ncloud `poem-map` already had Dynamic Map selected and a daily 1,000-request limit. Its Web service URL initially contained only localhost. Preserved localhost and registered the current canonical domain plus the existing fixed account and dev branch aliases. The daily limit and selected APIs were not changed.

## Current domain and diagnosis

The current public site is **https://hyunghyung.vercel.app**. Vercel's project-domains API reports this verified domain, and alias inspection resolves it to the new deployment. During verification the old `saja-boyz-jinwoo.vercel.app` address returned `DEPLOYMENT_NOT_FOUND` although the deployment was still `READY`; the project's actual domain had changed. No old domain was restored and no replacement project or deployment was created to work around it. The deployment's saved `alias` array retained the former name, so project domains and actual HTTP responses were used as the current authority.

Final Ncloud Web service URLs:

- `http://localhost:3000` (preserved)
- `https://hyunghyung.vercel.app`
- `https://saja-boyz-jinwoo-amazon7737s-projects.vercel.app`
- `https://saja-boyz-jinwoo-git-dev-amazon7737s-projects.vercel.app`

The initially added old short domain was removed from Ncloud after the current domain was identified. The fixed account and branch aliases still require Vercel authentication; their protection was not changed. Random per-deployment URLs were not registered.

## Observed verification

- The remote build completed successfully. [Build log](verification/vercel-map-build.log.txt), [filtered deployment and domain metadata](verification/vercel-map-deployment.json).
- Before domain registration, actual Chrome showed Naver authentication-failure tiles and an SDK `Cannot read properties of null (reading 'isArray')` error. This was not treated as a successful map integration.
- After domain registration, actual Chrome on the canonical public URL rendered real Naver tiles, Seoul-area map labels, the NAVER attribution, and the enabled location button. [Screenshot](verification/vercel-map-ready.jpg).
- Map → news list showed the current four articles and the existing generated-image article; returning through the map navigation restored the real tiles. A full page reload also restored the map. The warning/error log for that final reload was empty.
- Independent read-only HTTPS checks confirmed `/`, `/incidents` and `/search` return 200 at the canonical domain. The earlier CLI checkpoint contains the broader news search/detail verification; it is not relabeled as having run on the new domain.
- No precise location permission was granted or location request made, so location allow/deny behavior and mobile-device behavior remain unverified in this live session. No news collection, image generation, report submission, or OCI mutation was performed.
- The preparation checkpoint already records the 70-test suite, lint, types, and production build. This follow-up changes configuration and documentation only and adds the remote-build/browser evidence above; it does not claim a repeat product test run.

## Remaining work

- A future intentional fork `dev` update should verify the push-triggered automatic build and source SHA. Upstream PR merges do not automatically synchronize the fork.
- Actual report intake still requires frontend PR #16 and the separately deployed Go reports API with origin/storage configuration. It was not enabled by this map deployment.
- Domain or Client ID changes require rechecking Ncloud registration; Client ID changes also require a new frontend build. A successful Vercel build alone is not proof of external map authentication.
