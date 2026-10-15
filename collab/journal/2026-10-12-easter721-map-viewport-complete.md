# codex/map-viewport-persistence · easter721 · 2026-10-12
- claim: collab/active/codex--map-viewport-persistence/claim.md

## 이벤트
- added src/features/map/model/map-viewport.ts 현재 clientId의 마지막 지도 중심·확대 수준을 런타임 메모리 한 건으로 보관함 → 지도 이동 상태는 이 모듈을 재사용하며 브라우저 영구 저장이나 사건 좌표 계약으로 해석하지 말 것.
- changed src/features/map/ui/map-home/map-home.tsx 정상 정리 전 SDK 중심·확대를 캡처하고 재진입 시 복원함 → 기존 SDK·위치 권한·오류 재시도·UI 유지, 새로고침은 서울 기본 위치다.
- rule docs/map-integration.md 탭 메모리의 지도 복원 범위와 내 위치 응답 비저장을 구분함 → 복귀 때 위치 권한을 자동 요청하거나 마커·위치 응답을 저장하지 말 것.
- done sobaya 64개 테스트·Format/Lint gate와 독립 review, 격리 타입·빌드 및 실제 Chrome 3개 너비 검증 통과 → verification.md와 evidence/의 적용 HEAD·fixture 범위를 확인할 것.

## 남은 것
- dev PR 리뷰와 squash merge. GitHub 코멘트 게시와 머지는 별도 승인 전 하지 않는다.
- 주소·장소 검색은 다음 별도 기능. 사건 마커·필터·클러스터는 지도 API 계약이 먼저다.
