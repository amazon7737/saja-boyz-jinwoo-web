# codex/figma-experience-rebuild · easter721 · 2026-11-06
- claim: collab/active/codex--figma-experience-rebuild/claim.md

## 이벤트
- changed src/proxy.ts 공유 문서 rewrite가 원본 서버 URL을 사용한다 → skipProxyUrlNormalize 설정과 원본·위조 헤더 회귀를 유지할 것.
- changed src/features/article-list/ui/article-card/article-card.tsx 목록에 실제 발행 상대 시간을 표시하고 원문 링크를 보존한다 → 정렬·원문·이미지 계약을 변경하지 말 것.
- changed src/features/map/ui/map-home/map-home.tsx 선택 미리보기 중 지도 제어를 감추고 선택 마커를 동기화한다 → 닫기·필터·지도 갱신 시 선택과 포커스 복구를 함께 확인할 것.
- changed src/features/map/ui/map-home/map-article-marker.ts 한 건 선택은 점, 다건 선택은 개수와 테두리로 표시한다 → 지역 대표 위치의 정확도 안내를 유지할 것.
- removed src/app/(browse)/@background/incidents/loading.tsx NoJS에서 목록이 숨겨진 채 남지 않도록 서버 로딩 경계를 제거했다 → 목록 이동의 대기는 ListLink를 재사용하고 직접 문서 진입은 서버 응답을 기다린다.
- added src/components/layout/list-link/list-link.tsx 목록 이동 대기와 스켈레톤을 연결한다 → 고정 /incidents 링크에 재사용하고 수정키·NoJS 동작을 유지할 것.
- changed src/components/layout/app-shell/app-shell.tsx 고정 하단 메뉴가 콘텐츠 제어를 가리지 않도록 스크롤 여백을 적용했다 → 지도 미리보기와 검색 전용 화면에는 각각의 제어 표시 조건을 유지할 것.
- done codex/figma-experience-rebuild PR 62의 추가 화면 대조와 로컬 검증을 마쳤다 → GitHub 원격 검사와 리뷰를 확인할 것.

## 남은 것
- 운영 일간 인기 API는 2026-11-06 확인 시 404다. 서버 배포 후 실제 순위 표시를 확인한다.
- 목록·지도 필터의 미제공 분류와 제보 주소 검색·지도 핀에는 서버 데이터 또는 위치 검색 계약이 필요하다.
- Vercel 배포 환경의 공유 문서 rewrite와 실제 네이버 지도·모바일 실기기의 터치·위치 권한·스크린리더는 확인하지 못했다.
- 직접 공유 상세에서 느린 전체 문서 이동 시 로딩 DOM 생성은 확인했지만 실제 페인트는 확인하지 못했다.
- GitHub Actions는 확인 시 대기 중이고 리뷰가 다시 필요하다. PR 댓글과 리뷰 요청은 사용자 승인 전 게시하지 않는다.
