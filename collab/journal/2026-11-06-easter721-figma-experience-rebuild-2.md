# codex/figma-experience-rebuild · easter721 · 2026-11-06
- claim: collab/active/codex--figma-experience-rebuild/claim.md

## 이벤트
- changed src/proxy.ts 공유 기사 문서는 내부 Pages Router에서 기사 한 번의 조회 결과로 200·404·503을 결정한다 → 문서와 App Router 내부 이동의 경계를 함께 유지할 것.
- added src/app/api/incidents/[id]/location/route.ts 공유·목록·검색 상세의 위치와 같은 지역 기사를 검증된 지도 응답으로 제공한다 → 기사별 위치 조회를 중복 구현하지 말고 전체 지도 페이지 순회·시간 제한을 고려할 것.
- added src/features/map/ui/map-home/naver-map-sdk.ts 지도 홈과 상세가 SDK 로더를 공유한다 → 로더를 새로 삽입하지 말고 각 구독 해제·재시도 계약을 유지할 것.
- changed src/app/api/search-headlines/route.ts 일간 순위의 정제된 제목과 항목을 함께 제공하고 중복 ID를 제거한다 → 검색 안내와 인기 카드가 동일한 순위를 재사용할 것.
- added src/app/api/search-suggestions/route.ts 검색 결과로 입력 중 기사 제안과 카드에 필요한 정제 필드만 제공한다 → 최신 입력만 표시하고 요청 취소를 유지할 것.
- added src/features/search/ui/article-preview-card/article-preview-card.tsx 검색 인기·일치 기사 공통 카드 → 같은 형태의 카드에서 재사용할 것.
- changed src/features/article-detail/ui/detail-sheet/detail-sheet.tsx 전환 중 터치·취소·포인터 캡처 해제를 처리한다 → 시트 높이 전환을 변경할 때 실제 터치 회귀 검사를 유지할 것.
- changed src/features/search/ui/search-form/search-form.module.css 검색창 전용 포커스·검색 아이콘 스타일을 분리했다 → 화면 전용 규칙을 전역 CSS에 추가하지 말 것.
- done codex/figma-experience-rebuild PR 62에 현재 변경을 반영했다 → 리뷰와 원격 검사를 확인할 것.

## 남은 것
- 운영 일간 인기 API는 2026-11-06 확인 시 404다. 서버 기능 배포 후 실제 순위 표시를 확인한다.
- 지도 카테고리·목록 기간/카테고리와 제보 주소 검색·지도 핀은 필요한 데이터·위치 검색 계약이 없어 비활성 또는 미연결이다.
- 상세 좌표는 클라이언트에서 지도 기사 전체 응답을 조회한다. 기사별 서버 계약과 응답량이 정해지면 성능 및 초기 HTML 제공 방식을 다시 확인한다.
- Vercel 문서 rewrite·응답 상태와 실제 네이버 지도·모바일 실기기 터치·위치 권한·스크린리더는 로컬 검증 범위 밖이다.
- GitHub Actions 검사는 확인 시 대기 중이며 PR 리뷰가 다시 필요하다. PR 댓글과 리뷰 요청은 사용자 승인 전 게시하지 않는다.
