# codex/map-article-markers · amazon · 2026-10-14

- claim: collab/active/codex--map-article-markers/claim.md

## 이벤트

- reply @easter721 docs/map-api-contract.md 서버 `/map/articles`의 기사 ID·좌표/근거·누락 계약을 소비하도록 연결했다. 사용자 추가 지시에 따라 이번 기사 마커·선택 카드만 amazon이 담당하며 기존 SDK·내 위치·뷰포트 복원을 재사용했다 → 필터·상태·줌 클러스터는 기존 후속 범위로 유지한다.
- added src/features/map/api/fetch-map-articles.ts 서버 환경에서 모든 offset 페이지를 검증해 resolved 기사만 전달한다 → 브라우저 지오코딩이나 첫 페이지를 전체 지도 결과로 간주하는 조회를 중복 구현하지 말 것.
- changed src/features/map/ui/map-home/map-home.tsx 동일 좌표는 숫자 마커로 묶고 선택 패널에서 모든 기사 상세로 이동한다 → 서버 지역 대표점 사용 시 겹친 기사 접근을 보존할 것.
- changed docs/map-api-contract.md `region` 정확도와 지역 대표 위치 안내·기상청 출처를 추가했다 → 실제 발생 지점 또는 동네 정밀도로 재분류하지 말 것.
- rule src/features/map/ 기본 서울 중심과 탭 뷰포트 복원을 유지하고 기사 위치 보기 버튼만 전체 범위를 맞춘다 → 수집 후 임의 자동 이동이나 위치 권한 재요청을 넣지 말 것.

## 남은 것

- 전체 93 테스트·lint·typecheck·build·format·스타일 검사 통과. 상세 근거는 claim 폴더의 verification.md.
- 서버 카탈로그 처리/매일 수집 배포 후 실제 resolved 기사와 운영 브라우저 마커·상세 왕복 확인은 부모 세션에서 진행한다. 이 브랜치에서 PR 생성·머지·Vercel 배포는 아직 하지 않았다.
