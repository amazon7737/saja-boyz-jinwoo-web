# 사건 목록 본문 구현 및 독립 리뷰 결과

- claim: collab/active/codex--incident-list/claim.md

## 이벤트
- supersedes collab/journal/2026-10-02-amazon-incident-list.md 목록 본문은 사용자 승인 후 구현됨 → 아래 검증·리뷰 보류 사항을 현재 상태로 읽을 것.
- supersedes collab/journal/2026-10-02-amazon-incident-list-2.md 포맷·배열 타입 교체안은 사용자 승인 후 적용됨 → 해당 교체 승인 대기는 해소됨.
- added src/features/incident-list/incident-list.tsx IncidentList({state:'ready',incidents,now}) 또는 {state:'loading',now}로 목록 본문을 렌더함 → 페이지·공용 UI·API 연결은 후속 범위이며 현재 production 라우트는 변경하지 않음.
- added collab/active/codex--incident-list/review.id-safety-proposal.md 예약 ID 경로 이탈에 대한 명세·회귀 테스트 초안 → 승인된 구현에 아직 적용하지 않았으며 승인 후 새 기준선으로 진행할 것.
- reply @easter721 docs/work-split.md 분담에 따라 amazon의 목록 본문 claim을 dev fb6022d 기반 codex/incident-list에 공유함 → 공용 UI·필터 어댑터·지도·검색 소유권 유지.
- reply @easter721 PR #1의 공용 기반은 dev의 fb6022d에서 참조함 → 이번 브랜치는 독립 목록 본문까지만 구현하며 라우트·URL·API 최종 인수는 후속 항목으로 유지.

## 검증

- 소스 커밋: `5995c11e6b54b958ed8bffd059323a5b892f2bdd`. 사용자 승인 baseline: `ba204a87dcf61458c83523fc658f705b7a2024f8`.
- 다섯 항목의 공식 checkpoint 완료. 전체 Vitest 12개, lint·format·typecheck·build 성공. pinned Sobaya `83af28d`의 최종 gate 성공.
- 동일 소스의 임시 프리뷰에서 393px 배치·실제 이미지 5개·사진 없음·빈 결과·로딩·키보드 포커스·일반 특수문자 ID 링크 이동 확인. 자세한 치수·해시·제한은 implementation-verification.md에 기록.
- 독립 astra review는 `.`·`..` ID가 `/incidents/`·`/`로 정규화되는 P2를 재현했다. `review_pending`, review receipt 없음. 전체 완료나 승인된 PR로 간주하지 않는다.
- 별도 읽기 전용 검토에서도 단순 `%2E` 치환은 같은 정규화를 받으며 이중 인코딩은 ID 충돌·소비 측 계약 변경을 일으킨다고 확인했다. 기존 계약을 몰래 제한하지 않는다.
- 뉴스 API의 article_id는 SHA-256 hex이나 Incident.id 매핑은 아직 미확정이다. 신규 제안은 빈 ID·예약 ID·잘못된 Unicode 입력에서 카드를 유지하면서 링크 대신 “상세 정보 없음”을 표시한다.
- 신규 후보 incidentUnsafeIds는 공식 probe에서 실제 단언 실패로 RED. 실행 입력의 Prettier 검사 성공. 설명 주석 제거 후 공유 헤더와 새 테스트가 원본과 바이트 일치. 기존 5개 테스트와 명세는 변경하지 않았다.

## 남은 것

- 신규 명세 예외·정확한 테스트·새 기준선에 대한 사용자 결정. 문서: collab/active/codex--incident-list/review.id-safety-proposal.md.
- 승인 후 해당 항목 구현·전체 검사·브라우저 비링크 상태 확인·gate·독립 review를 마친 뒤 plan 보관과 dev 대상 PR 진행. 현재 plan을 보관하지 않았고 PR도 생성하지 않았다.
- 실제 라우트와 URL 필터·API 연결, 상세 소비 측의 ID decode-once 처리는 다음 범위다.
- 로컬 실행은 Node 24.19.0 / pnpm 10.34.6 및 별도 pinned runtime을 사용한다. ZDOTDIR 기반 작업별 환경으로 로그인 셸의 PATH를 고정했다. 루트 하네스·승인 테스트·제한시간을 수정하지 않았다.
- 협업 검사에서 루트 plan 보관 전 항목은 아직 해결되지 않은 정상적인 PR 전 조건이다. 오래된 foundation 브랜치 겹침 알림은 실제 origin/dev 대비 변경 목록과 대조했다. 현재 동료의 같은 파일 편집은 없다.
- doctor의 관리 훅 바이트 비교 제한은 기존에 기록한 진단 실패로 유지한다. 실제 위임 훅 실행 성공과 구별한다.

## 회고

- Brain: 추가 없음. 작업별 실행·리뷰 증거는 이 앱 기록으로 남긴다.
- Skills: 수정 없음.
- Structural: 승인된 Vitest 셸 스위트 연결 외 하네스 변경 없음.
- Todos: 별도 루트 항목을 만들지 않고 위 남은 것에서 관리한다.
