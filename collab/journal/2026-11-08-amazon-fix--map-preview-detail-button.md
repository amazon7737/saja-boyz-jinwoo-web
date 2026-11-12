# fix/map-preview-detail-button · amazon · 2026-11-08
- claim: collab/active/fix--map-preview-detail-button/claim.md

## 이벤트
- changed src/features/map/ui/map-home/map-article-sheet.tsx 단일 기사 미리보기의 자세히 보기 버튼이 스크롤 영역 아래에 sticky 로 고정됨 → 이 버튼을 다른 위치로 옮기거나 footer 로 바꿀 때 접힌 시트에서도 보이는지 유지할 것
- added src/proxy-navigation.test.ts map-sheet-test-fixture 와 mapPreviewKeepsDetailButtonVisibleWhenContentOverflows → 지도 미리보기 시트 배치 회귀는 이 fixture 로 검증할 것

## 남은 것
- 버튼 뒤로 본문이 스크롤되며 둥근 모서리 바깥으로 글자가 살짝 비친다. 시안에 하단 배경 띠가 있으면 그에 맞춰 보강.
