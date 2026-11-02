# codex/unify-map-filter-style · amazon · 2026-11-01
- claim: collab/active/codex--unify-map-filter-style/claim.md

## 이벤트
- added src/features/map/ui/map-filter-dropdown/map-filter-dropdown.tsx 기간 기준 트리거·패널·옵션 공통 컴포넌트 → 지도 드롭다운의 시각적 변경은 공통 컴포넌트에서 적용
- changed src/features/map/ui/map-period-filter/map-period-filter.tsx 공통 스타일 컴포넌트 사용 → 기간 선택·활성 강조·설명·닫기·포커스 복귀 유지
- changed src/features/map/ui/map-unavailable-filter/map-unavailable-filter.tsx 기간과 같은 패널·옵션 스타일 사용, 별도 점/체크 장식 제거 → 카테고리·상태 미제공 항목의 disabled와 상태 메뉴의 화면 경계 보정 유지

## 남은 것
- dev 대상 PR 검토 및 머지. PR51의 카테고리 설명 문단과 전체 필터는 변경하지 않음.
- 브라우저 스타일 검증은 합성 지도 설정으로320/393/1440px에서 수행. 뉴스/지도 외부 API를 호출하지 않음.
