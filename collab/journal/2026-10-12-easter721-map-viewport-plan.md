# codex/map-viewport-persistence · easter721 · 2026-10-12
- claim: collab/active/codex--map-viewport-persistence/claim.md

## 이벤트
- touching src/features/map/ui/map-home/ 지도 재진입 시 중심·확대 수준을 탭 메모리로 복원하는 명세와 신규 테스트 초안 준비 → 같은 지도 생명주기 작업은 이 claim과 조율할 것.
- added collab/active/codex--map-viewport-persistence/spec-proposal.md 서버·브라우저 영구 저장 없이 재진입 복원 범위를 제안함 → 정확 초안 승인 후에만 구현한다.
- done 기존 전체 61개 테스트 통과, 신규 후보 3개 sobaya probe가 중심·확대 초기화에 대한 assertion RED 확인 → probe-result.md와 개별 로그를 참조하며 승인된 테스트나 제품 구현으로 간주하지 말 것.

## 남은 것
- 정확 명세와 헤더·신규 3개 테스트 본문에 대한 사용자 승인. 승인 후 root plan 설치·approve·sobaya loop·독립 review·타입·빌드·브라우저 검증·dev PR 진행.
- 반복 재진입 후보의 첫 probe는 도구가 visit 문자열을 test 선언으로 오인해 ERROR였다. 승인 전 초안에서 호출 인수를 변수로 분리했고 재probe는 behavioral RED다.
- 공식 SDK getCenter/getZoom 문서 확인: https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Map.html . 기존 위치 권한·SDK 오류·UI는 유지한다.
