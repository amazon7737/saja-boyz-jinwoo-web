# codex/map-article-markers · amazon · 2026-10-14

- claim: collab/active/codex--map-article-markers/claim.md

## 이벤트

- changed src/features/map/ui/map-home/ 사용자 추가 요청에 따라 Figma 18:2348 마커와 19:2990 하단 패널을 원본 SVG로 적용했다 → 동일 좌표 수는 기사 수이며 상태 색·사건 발생 시각·주변 거리를 추측해 붙이지 말 것.
- added src/features/map/ui/map-home/map-article-sheet.tsx 선택 패널은 body 포털로 하단 메뉴 위에 표시하고 실제 기사 이미지·발행 시각·위치 정밀도 안내를 재사용한다 → 선택 중 내부 스크롤과 같은 좌표의 모든 상세 링크를 유지할 것.
- changed src/features/map/ui/map-home/map-home.tsx Enter/Space로 선택 후 패널 닫기에 포커스를 옮기고 닫기/Escape 시 원래 마커에 preventScroll로 복원한다 → SDK 기본 스크롤이나 접근성 이름을 제거하지 말 것.

## 검증과 남은 것

- Canon TDD로 마커 선택 상태, 실제 기사 패널, 키보드/포커스 문제의 RED→GREEN 확인. 전체 22 파일 97 테스트(108.43초), lint/typecheck/build/format/스타일/diff 검사 통과. 독립 소스 검토 완료.
- 첫 샌드박스 포트 차단 실패와 캐시 재현은 제품 변경 없이 해결했다. 검증 상세·Figma 노드/자산 근거는 claim의 figma-verification.md, PR 본문 초안은 pr-description.md.
- 실제 배포 393×852 화면과 SDK 클릭/키보드·기사 상세 왕복은 부모 세션에서 진행한다. 이 저널은 운영 브라우저 검증·배포 완료를 주장하지 않는다.

## 남은 것

- 위 검증과 후속 작업 내용은 유지한다. 필수 저널 절 이름을 보완한 추가 기록이며 제품 동작 변경은 없다.
