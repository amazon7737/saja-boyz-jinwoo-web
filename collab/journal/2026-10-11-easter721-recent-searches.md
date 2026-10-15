# codex/recent-searches · easter721 · 2026-10-11

- claim: collab/active/codex--recent-searches/claim.md

## 이벤트

- supersedes collab/journal/2026-10-11-easter721-recent-search-review-pending.md Unicode 보완 승인·구현·전체 검증 및 독립 리뷰를 완료함 → 이전 승인 대기로 해석하지 말 것.
- supersedes collab/journal/2026-10-10-easter721-recent-search-implementation-pending.md 조회 문법 변경은 사용자 승인·반영 및 전체 검증을 완료함 → 승인 대기나 미완료 검증으로 해석하지 말 것.
- added src/features/search/ui/recent-searches/recent-searches.tsx Figma 최근 검색 복원·실행 기록·재검색·개별 삭제를 로컬 저장으로 연결함 → 중복 구현하지 말고 기존 GET 검색 URL을 사용할 것.
- rule src/features/search/ui/recent-searches/recent-searches.tsx 저장값은 고립 surrogate 제외·정상 이모지 보존·trim·문자열 검증·최신 순 중복 제거·최대 10개를 적용하며 저장소 오류는 기사 검색을 중단하지 않음 → 주소 검색이나 지도 사건 좌표로 취급하지 말 것.
- rule src/features/search/ui/recent-searches/recent-searches.test.ts jsdom의 & 포함 CSS 속성 선택자 결함 때문에 승인된 aria-label 직접 비교를 사용함 → 조회 문법을 무심코 되돌리지 말 것.
- done collab/active/codex--recent-searches/verification.md 전체 46개 테스트·Format·Lint·타입·프로덕션 빌드·Chrome·Astra 독립 리뷰를 완료함 → 증거와 리뷰 HEAD 13d125a7e156f6168d04c03acc4cf9f164d5c5d6를 확인할 것.

## 남은 것

- PR #9 리뷰 후 dev에 squash merge하고 브랜치를 삭제한다. GitHub 리뷰어는 amazon7737이며 코멘트 게시에는 사용자 사전 승인이 필요하다.
- docs/map-api-contract.md의 지도용 좌표·분류·발생 시각 등은 아직 확인 항목이다. API에 없는 위치나 사건 정보를 만들어 채우지 않는다.
- 자정에 걸친 기존 harness_loop 실패는 수정 없이 재검증에서 해소됐다. 이 기능 PR에서는 기존 하네스 테스트를 변경하지 않았다.
