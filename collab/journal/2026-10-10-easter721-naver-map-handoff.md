# codex/naver-map-foundation · easter721 · 2026-10-10
- claim: collab/active/codex--naver-map-foundation/claim.md

## 이벤트
- added src/features/map/ui/map-home/ 실제 네이버 SDK 지도·설정 안내·클릭 기반 내 위치·실패 재시도와 관련 테스트 추가 → 지도 기본 흐름은 재사용하고 중복 구현하지 말 것.
- changed src/app/page.tsx 준비 패널을 실제 지도 또는 키 누락 안내로 교체 → 기본 중심은 서울시청이며 사건/사용자 위치로 해석하지 말 것.
- changed src/components/layout/app-shell/app-shell.tsx 홈에서만 지도 위 부유 헤더 배치 → 검색·목록 등 기존 경로 배치와 오류 경계를 유지할 것.
- added docs/map-integration.md NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 설정·재빌드·Web 서비스 URL과 후속 API 범위 기록 → 웹 지도에는 Client Secret을 사용하지 말 것.
- rule src/features/map/ 위치는 클릭 시에만 요청하고 저장/서버 전송하지 않음; 사건 좌표 계약은 아직 없음 → 제목 기반 위치 추정·가짜 사건 마커 없이 기존 API 계약 요청부터 이어갈 것.
- done collab/active/codex--naver-map-foundation/verification.md 전체 40개 테스트·최종 gate·Astra 독립 리뷰 및 실제 지도/위치/오류/반응형 검증 완료 → dev 대상 PR에서 amazon7737 리뷰 후 squash 절차를 따를 것.

## 남은 것
- dev 대상 PR 리뷰와 CI. GitHub 코멘트는 별도 사용자 승인 전 게시하지 않는다.
- amazon7737과 사건 식별자·WGS84 좌표·출처/정확도·좌표 누락 및 분류/발생 시각 계약 확인 후 사건 마커·클러스터·필터·선택 카드/바텀시트 구현.
- 배포 도메인의 Web 서비스 URL 등록과 실제 인증 확인. 로컬 localhost:3000은 실제 지도 인증 성공을 확인했고 개발 서버를 유지한다.
- 승인 계획은 plans/2026-10-10-easter721-naver-map-foundation에 보관한다. 보관 커밋 뒤 이 브랜치에서 sobaya 명령을 다시 실행하지 않는다.
