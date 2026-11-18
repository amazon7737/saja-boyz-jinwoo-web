# codex/adaptive-skeletons · easter721 · 2026-11-12
- claim: collab/active/codex--adaptive-skeletons/claim.md

## 이벤트
- changed src/components/feedback/article-skeleton.tsx 전체 화면 대기와 추가 로딩의 카드 수를 구분하고 인기 기사에는 실제 순위 개수를 전달한다 → 새 호출부에서도 전체 화면 대기와 부분 로딩을 구분할 것.
- changed src/features/map/ui/map-home/map-home-loading.tsx 지도 초기 대기와 기사 데이터가 있는 SDK 대기가 같은 반응형 카드 스켈레톤을 사용한다 → 지도 오류·빈 결과에서는 카드 대기를 표시하지 않을 것.
- changed src/components/feedback/list-navigation-pending.tsx 목록 이동 대기 배경이 앱 셸 너비를 덮는다 → 탐색 중 원래 화면이 여백으로 비치지 않게 유지할 것.
- rule src/proxy-navigation.test.ts 로딩 대기 화면은 모바일·데스크톱과 낮은 화면에서 카드 영역과 응답 완료 후 전환을 검증한다 → 화면 크기나 로딩 경계를 바꾸면 이 검사를 유지할 것.

## 남은 것
- 검색 주소 직접 진입은 NoJS 본문 보존을 위해 기존처럼 서버 응답을 기다린다. 로딩 경계를 다시 추가하려면 NoJS 검색 결과와 포커스 동작을 함께 검증해야 한다.
- 원격 PR 검사와 리뷰를 확인한다.
