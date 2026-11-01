# codex/hide-category-unavailable · amazon · 2026-11-01
- claim: collab/active/codex--hide-category-unavailable/claim.md

## 이벤트
- changed src/features/map/ui/map-unavailable-filter/map-unavailable-filter.tsx 카테고리의 분류 정보 미제공 설명을 화면에서 숨기고 스크린리더 설명은 유지 → 분류 API 연동 전 비활성 선택 정책 유지
- changed src/features/map/ui/map-all-filters/map-all-filters.tsx 전체 필터의 같은 카테고리 설명도 시각적으로 숨김 → 상태 정보 미제공 문구와 나머지 필터 동작 유지

## 남은 것
- dev 대상 PR 검토 및 머지. 운영 배포는 이번 작업에 포함하지 않음.
