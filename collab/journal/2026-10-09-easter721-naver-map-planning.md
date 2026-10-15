# 네이버 지도 홈 준비

## 이벤트
- rule 지도 제공자는 사용자 선택으로 네이버 Maps Dynamic Map 확정 → 카카오 SDK를 추가하지 말 것.
- added collab/active/codex--naver-map-foundation/spec-proposal.md 첫 범위를 지도 표시·내 위치·검색 진입·로딩/오류로 제한한 초안 → 정확 테스트 probe/사용자 승인 전 제품 구현하지 말 것.
- ask @amazon 지도 사건 마커를 위한 사건 ID·WGS84 latitude/longitude·위치 출처/정확도·좌표 누락 정책·조회 범위 계약을 확인해 주세요 → 현재 기사 API에 없는 위치/분류/상태를 프런트에서 추정하지 않고 좌표 없는 기사는 지도에서 제외할 계획입니다.

## 남은 것
- 사용자에게 localhost:3000 Web 서비스 URL 등록 여부 및 배포 도메인을 질문했다. 실제 SDK·타일 인증 검증 전이다.
- 정확 sobaya 테스트 본문·header·probe 결과를 준비하고 승인받은 뒤 구현. 키는 ignored 로컬 환경에만 있고 Client Secret은 저장하지 않았다.
- 제품 코드·테스트·의존성 변경 없음. 신규 워크트리에 pnpm frozen-lockfile 설치 및 Figma 개인 계정 컨텍스트 재조회 완료.
- GitHub 코멘트는 게시하지 않았다. 동료 질문은 하네스 저널로 공유한다.
