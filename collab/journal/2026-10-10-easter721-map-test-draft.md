# 네이버 지도 정확 테스트 초안

## 이벤트
- added collab/active/codex--naver-map-foundation/failed-test-proposal.md 실제 HomePage를 렌더하는 지도 테스트 6개와 SDK/위치 fixture 정확 초안 → 사용자 승인 후 sobaya로 구현하고 기존 34개 테스트 유지.
- added collab/active/codex--naver-map-foundation/probe-result.md 실행된 테스트 6개의 assertion RED → 환경 준비 오류는 RED 근거에서 제외하며 실제 네이버 인증/타일 성공과 구별할 것.

## 남은 것
- 정확 명세·헤더·테스트 초안 승인, sobaya baseline 설치/승인 후 워커 구현·전체 gate·독립 리뷰·실제 네이버 지도 Chrome 확인 및 dev 대상 PR.
- 현재 제품 홈은 준비 화면이다. 지도 구현이나 실제 인증 성공으로 보고하지 않는다. 개발 서버 localhost:3000은 실행 중.
- next dev가 추가한 AGENTS.md/next-env.d.ts 생성 변경은 기능에 섞지 않고 되돌렸다. 주 클론의 기존 로컬 변경은 건드리지 않았다.
- GitHub 코멘트는 사용자 별도 승인 전 게시하지 않음.
