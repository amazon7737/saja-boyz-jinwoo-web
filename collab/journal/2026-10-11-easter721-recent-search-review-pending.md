# codex/recent-searches · easter721 · 2026-10-11

- claim: collab/active/codex--recent-searches/claim.md

## 이벤트

- supersedes collab/journal/2026-10-10-easter721-recent-search-implementation-pending.md 버튼 조회 문법은 사용자 승인·반영됐고 복원 정규화와 행 구분선도 보완함 → 이전 조회 문법 승인 대기로 해석하지 말 것. 별도의 Unicode 회귀 테스트 승인과 리뷰 완료는 남아 있음.
- changed src/features/search/ui/recent-searches/recent-searches.tsx 저장값 복원·기록·삭제에 trim·중복 제거·최대 10개를 적용하고 하단 구분선·긴 문자열 말줄임을 보완함 → 같은 로컬 저장 정책을 유지할 것.
- rule collab/active/codex--recent-searches/unicode-test-proposal.md 저장된 고립 surrogate는 encodeURIComponent에서 URIError를 일으킴 → 최근 검색 완성으로 취급하지 말고 정확 명세·신규 회귀 테스트 승인 후 수정할 것.

## 남은 것

- 기존 45개 테스트·Format·Lint의 최종 gate는 코드 변경 없이 통과했다. 최초 gate가 자정을 넘어 기존 harness_loop 한 건이 실패했으며, 시작 날짜로 만든 저널과 종료 시 현재 날짜 검사 사이의 차이를 확인했다. 단독 재검증 및 다시 실행한 전체 gate는 통과했다. 기존 테스트는 변경하지 않았다.
- Astra 독립 리뷰는 review_pending이다. 제품·테스트 HEAD 963b591에서 고립 Unicode surrogate 저장값 때문에 목록 렌더링이 실패하는 결함을 보고했다.
- unicode-test-proposal.md의 정확 회귀 테스트 1개와 명세 추가를 사용자에게 승인 요청했다. 임시 복사본에서 named URIError RED 및 타입 검사 통과를 확인했고, 실제 승인 입력은 그대로 유지했다.
- 승인 후 정확 입력을 커밋하고 approve.sh --replace로 이력을 보존해 신규 항목을 sobaya Astra로 구현한다. 전체 46개 gate·독립 리뷰·타입/빌드 및 실제 Chrome의 malformed Unicode·정상 이모지 시나리오까지 확인해야 한다.
- 현재 /tmp/recent-search-finish-handoff.py는 미실행 초안이며 45개·신규 5개라는 이전 숫자를 포함한다. 다음 인수인계 전에 46개·신규 6개 및 실제 최종 검증 결과로 수정해야 한다. 완료 상태와 review.head=HEAD를 확인한 뒤에만 실행할 것.
- PR #9는 dev 대상 드래프트로 유지한다. 계획 보관·오늘자 최종 저널·claim done·협업 검사·push 후 리뷰 가능한 상태로 바꾼다. GitHub 리뷰어는 amazon7737이며 코멘트는 사용자 사전 승인 후 게시한다.
