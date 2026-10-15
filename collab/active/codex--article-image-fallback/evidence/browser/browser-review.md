# Image fallback: actual-browser evidence

Verified 2026-10-05, 11:38–11:44 UTC (20:38–20:44 KST). Browser: Chrome, controlled only with CUA. This is observed browser evidence, not a claim that this reviewer ran the approved test suite.

## Revision and build

- Worktree: `/Users/kangminkim/lunch/sobaya/apps/saja-boyz-jinwoo-codex--article-image-fallback`
- Source HEAD: `1b8805391c12bc342e8e57419cd9fc8e141cf705`
- Existing production build ID: `OWbzFd4lTer-d0zTE9Ulj`
- Four relevant source SHA-256 values are in `source-sha256.txt`; read before and after observations and unchanged.
- Final `git status --short` contained only root-owned untracked `collab/active/codex--article-image-fallback/evidence/implementation/` and `verification.md`. No source or approved test change by this browser reviewer. No build or official test command run by this reviewer.
- Fixture app: `http://127.0.0.1:3004/incidents`, same existing production build; API `http://127.0.0.1:39072`.
- Real app: `http://127.0.0.1:3005/incidents`, same build; API `https://poem-news.168.107.37.12.sslip.io`.

## Directly observed results

| Case | Observation | Evidence |
|---|---|---|
| Synthetic success, 393×852 | Two labeled synthetic articles. First image loaded (natural size 1024×1024), displayed 80×80 with AI caption. Second has 80×80 “이미지 없음”. | `fixture-success-393.jpg`; JSON state `fixture-success-initial` |
| Actual HTTP 404 image, 393×852 | Failed first image removed from DOM. AI caption removed. Existing 80×80 “이미지 없음” placeholder visible. Both cards, titles, body text, publication labels/times, and source hrefs preserved. | `image404-fallback-393.jpg`; JSON state `fixture-image404`; fixture image requests 5 and 6 completed HTTP 404 |
| Actual HTTP 200 invalid JPEG, 393×852 | After image decode failure, first img and AI caption removed; 80×80 placeholder visible. Both cards and non-image content/hrefs preserved. | `image-damaged-fallback-393.jpg`; JSON state `fixture-image-damaged-settled`; fixture image request 8 completed HTTP 200 |
| Success restored by reload | Fixture mode restored to success, then app reloaded. First image loaded again (natural size 1024×1024), 80×80 and AI caption visible. Other card/content unchanged. | `fixture-success-restored-393.jpg`; image request 10 completed HTTP 200 |
| Real API, desktop 1440×1000 | Four real articles. First ready image loads at natural 1024×1024 and renders 80×80. Other three 80×80 placeholders. Centered 608px cards. | `real-api-desktop-1440.jpg`; JSON state `real-api-desktop` |
| Real API, mobile 393×852 | Same four articles, source hrefs and publication times. 361px cards at x=16. Ready image and three placeholders stay 80×80; all four cards visible. | `real-api-mobile-393.jpg`; JSON state `real-api-mobile` |

Every settled observation had document scroll width equal to client width, no role=alert, one header, one navigation, and an empty captured warn/error console log list. Screenshots were directly viewed before visual judgments. No hydration error or duplicate UI was observed on these production page loads. Expected HTTP 404 is independently confirmed by server logs even though it was absent from captured console messages.

For both failure modes, card geometry remained stable except first card height changed from 123px to 122px after its AI caption was removed. Image/placeholder remains 80×80. The second card remains 122px tall. No horizontal overflow or visible broken-image icon remains in either settled failure screenshot.

## Real article content and links

Fresh desktop/mobile DOM observations matched exactly for title, body, ISO datetime, KST publication label and source href. Full strings are retained in `browser-observations.json`.

| Article | Publication KST | ISO datetime | Source href |
|---|---|---|---|
| 현대엔지니어링, 8700억 군산 AI 데이터센터 수주 | 2026-09-28 13:34 | 2026-09-28T04:34:00.000Z | https://www.kfenews.co.kr/news/articleView.html?idxno=665334 |
| [오늘의 날씨] 전국 맑고 한낮 31도…일교차 최대 15도 | 2026-09-20 00:01 | 2026-09-19T15:01:00.000Z | https://news.tf.co.kr/read/livingculture/2367973.htm |
| [내일 날씨] 전국 낮밤 기온차 15도… | 2026-09-19 22:46 | 2026-09-19T13:46:00.000Z | https://www.mhns.co.kr/news/articleView.html?idxno=761064 |
| [전국 자역별 오늘의 날씨 및 내일날씨]25호 태풍 두쥐안… | 2026-09-19 18:16 | 2026-09-19T09:16:00.000Z | http://www.economytalk.kr/news/articleView.html?idxno=424232 |

## Fixture integrity and limits

- Only local synthetic fixture files/mode were changed. No remote POST or source-page write was performed. The real API was used by the app through GET requests.
- `fixture/server.mjs` explicitly returns invalid JPEG bytes with `Content-Type: image/jpeg` in `image-damaged` mode; this is a browser decode error, not an injected JS error or mocked React state. `fixture/requests.ndjson` retains every request and response completion for the run.
- `content-comparison.json` records exact DOM data comparisons across success, HTTP404, invalidJPEG, restored success, and desktop/mobile real API.
- An early damaged-mode observation saw a streaming/loading transition with hidden SSR geometry. It is retained as `fixture-image-damaged-streaming-intermediate-not-result` and is not counted as the settled result. The settled screenshot was taken afterward.
- Reload restoration is **not** same-mounted-component new-src verification. That behavior is covered by the approved DOM tests executed by the root/harness, not by this browser run.
- No deterministic pre-hydration error race was instrumented. We observed actual production SSR/client page loads, final image-error behavior, and captured console output; precise event ordering is unverified.
- External source articles were not opened again in this focused image-fallback run. Href preservation is directly verified.
- This run does not repeat earlier empty/error/retry/article-list tests or prove arbitrary network/browser conditions.

## Cleanup and preview

- Temporary fixture app session `44698` (port3004/PID40655) stopped; API session `98033` (port39072/PID36398) stopped. Listener check confirms both ports are free.
- Existing fixture port39071/PID43555 preserved. Old port3002 was already absent before this task; this reviewer did not stop it.
- Real API app **still running on port3005, PID44977, exec session40841**. Preview: http://127.0.0.1:3005/incidents
- Chrome tab236339479 returned to the normal real API list and marked deliverable. Temporary viewport override reset; temporary fixture tab closed. Fixture mode left `success`.

The browser observations found no blocking defect in the requested image-failure/normal-image scope.
