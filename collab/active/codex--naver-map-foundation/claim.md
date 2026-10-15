branch: codex/naver-map-foundation
owner: easter721
started: 2026-10-09
status: done
goal: feat(map): 네이버 지도 홈과 내 위치 기본 흐름 구현
next: dev 대상 PR의 amazon7737 리뷰 대기; 사건 좌표 API 계약 이후 마커·필터 연결
base: dev
---
## 범위
- 사용자 선택 네이버 Maps Dynamic Map. 지도 홈 표시·검색 진입·내 위치·SDK 로딩/실패·위치 권한 실패 처리.
- Figma 18:2348과 45:3317을 조회해 첫 지도 화면의 근거를 기록한다. 기존 AppShell·검색·목록·오류 경계 유지.
- 위치 API가 없는 실제 기사에 사건 좌표·분류·상태를 추정하지 않는다. 사건 마커·클러스터·필터·핫한 사건·상세 바텀시트는 좌표/사건 API 계약 후속.
- 예정 파일: src/app/page.tsx, src/features/map/, 필요할 때 src/components/layout/app-shell/, .env.example, docs/map-integration.md 및 신규 지도 테스트.
- 전달받은 Client ID는 로컬 ignored 환경변수로만 설정. Client Secret은 브라우저·소스·로그·문서·커밋에 기록하지 않음.
- 새 제품 의존성·전역 store·공유 사건 스키마 변경 없음. 기존 전체 테스트 명령과 테스트 파일 유지.
- 구현은 정확 명세·테스트 승인 이후 sobaya로 진행. GitHub 코멘트는 별도 승인 전 게시하지 않음.
