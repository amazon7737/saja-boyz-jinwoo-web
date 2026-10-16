#!/bin/bash
set -eu
d=$(mktemp -d)
trap 'rm -rf "$d"' EXIT
cat > "$d/prompt"
cat >> "$d/prompt" <<'DIAGNOSIS'
Coordinator diagnosis for the SAME approved final entry (not new acceptance): the previous worker implemented only initial skeletons + map SDK spinner. That is insufficient for spec.md. The current source is preserved and current entry remains active/unchecked with its executed RED receipt. Finish ALL remaining approved UI requirements now, source only, before returning done. No tests/headers/fixtures/plans/commands may change.

Read the source and complete these concrete remaining items:
1. SearchResults/PaginatedArticleList pending still render visible text-only paragraphs. Use appropriate two-card skeletons below retained existing cards; search skeleton must be text-card layout, not an image-list card. Keep exactly one accessible busy status with the existing "추가 기사를 불러오는 중이에요" text sr-only. Empty/error/end contracts unchanged.
2. Initial list currently adds px-4 in IncidentList loading on top of AppShell px-4: remove this double gutter for the loading branch so skeleton and real card left edges both16px. Keep ready/empty legacy behavior. Search loading should reserve its search-bar/result geometry; detail skeleton should match actual navigation/header/title190px-image/body gutters. No fake links/articles/images/status content.
3. MapHome locating button still only shows its crosshair during aria-busy=true; show LoadingSpinner in the same44px button while locating (do not alter native geolocation/SDK/error/camera logic). SDK spinner already exists.
4. ReportPage submit still uses only "접수 중" text. Add compact LoadingSpinner while preserving52px button height/width and accessible "접수 중" name, aria-busy and form locking, files, idempotency, deadlines, receipts and Suspensive boundary. Visible loading should be spinner rather than a standalone sentence. Add existing ui-control/ui-primary press treatment only where appropriate.
5. Match approved readability: list/search cards12px separation; improve title/body/date line height only modestly (e.g. title14/20, summary12/18, metadata11/16). Keep existing line-clamp counts, actual article data and safety helpers. Audit measured good report/detail large gaps; do not arbitrarily enlarge everything.
6. Add restrained per-card appearance (about160ms opacity+translateY4px) on genuinely mounted cards, plus existing1.4s skeleton pulse and spinner. ALL motion must stop under reduced-motion; no height/margin animations, no dependencies/stagger/autoscroll. Use explicit scoped classes, preserve SDK marker transforms and existing menu/dropdown positioning.
7. Current retry button is conditional on failed, but setFailed(false) at retry start unmounts the focused control. Keep the SAME retry button mounted/disabled during a manual retry so keyboard focus survives pending. A small retrying flag / optional manual parameter is sufficient. Do not show retry buttons during normal automatic loading, do not keep a load-more button, do not auto-retry errors. Preserve raw offsets/one-flight/end/active guards. A plain focused native disabled button retains focus in actual Chrome (coordinator verified). Do not change tests.
8. Preserve current nav gap8, >=44 contained search controls, min36 chips+6px gaps, reserved compact pending slot and exact status text. Existing seven replacement tests and both new tests are immutable.
Run focused jsdom tests (article-list-pagination/search-results/loading-feedback/map-home/report-form and relevant cheap tests), targeted source formatting/lint. Parent owns full suite/default build and actual Chrome QA. No full suite, Next builds or socket-dependent recommendation integration in worker.

DIAGNOSIS
/bin/bash collab/active/codex--reading-experience/execution-adapter.sh < "$d/prompt"
