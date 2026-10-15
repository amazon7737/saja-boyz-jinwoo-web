# 사건 목록 본문 완료

- claim: collab/active/codex--incident-list/claim.md

## 이벤트
- supersedes collab/journal/2026-10-02-amazon-incident-list-3.md ID 예외 명세·테스트가 사용자 승인 후 구현·검증됨 → review_pending 사유는 해소됐으며 이번 독립 목록 본문 범위는 완료.
- changed src/features/incident-list/incident-list.tsx 빈 ID·예약 ID·잘못된 Unicode는 정보가 남은 비링크 카드와 “상세 정보 없음”을 표시함 → 정상 ID는 기존 인코딩 상세 URL을 유지한다.
- done src/features/incident-list/ 목록·사진 대체·빈 결과·로딩·상대 시각·ID 예외 구현 완료 → 후속 페이지는 IncidentList에 state, incidents, 고정 now를 전달하여 사용한다.
- migrated spec.md/failed-test.md 승인된 계획을 collab/journal/plans/2026-10-02-amazon-incident-list/로 보관 → 이 브랜치에서 Sobaya 실행을 재개하지 말고 후속 기능은 별도 계획으로 진행한다.

## 검증

- 최종 검증 HEAD: `22e9220371c886ff931ff856bd779acfe0a2a299`. 마지막 구현 체크포인트는 `db70d59a244152a6d71a9229e5c97a18e2a85b31`.
- Node 24.19.0 / pnpm 10.34.6에서 전체 13개 테스트, lint·format·typecheck·production build 성공. 목록 6개·기존 필터 4개·기존 셸 스위트 3개를 포함한다.
- pinned Sobaya `83af28d`의 최종 gate 성공. 별도 astra review는 해당 HEAD에 actionable finding이 없다고 판정했다. status=complete, pending=[], dirty=false 및 review.head=HEAD를 공식 status로 확인한 후 plan을 보관했다.
- ID 예외의 브라우저 검증: 잘못된 ID 다섯 카드의 링크·포커스 요소 0개, 안내 표시와 정보 보존, 뒤 정상 카드의 Tab·Enter 이동 성공. 특수문자 ID의 기존 경로 이동도 성공했다.
- 393px 화면에서 정상·예외 목록 가로 넘침 없음, 일반 목록 사진 5개 정상 로드, 콘솔 경고·오류 없음. 소스 해시와 자세한 증거는 collab/active/codex--incident-list/id-safety-verification.md 참고.
- 이 마지막 커밋은 인수인계 문서와 plan 위치만 바꾼다. 소스·실행 테스트·검사 명령은 검증된 HEAD와 동일하다. 최종 리뷰 증거는 보관 디렉터리의 verification.json에 남긴다.

## 남은 것

- dev 대상 PR 검토·머지. 직접 머지하거나 동료에게 별도 메시지를 보내지 않는다.
- /incidents 페이지·loading.tsx 연결, URL 필터와 실제 API 연결은 다음 범위다. 실제 API나 production 상세 화면이 완료됐다고 간주하지 않는다.
- 상세/API 연결 시 정상 ID를 한 번 디코딩하는 계약을 확인한다. 샘플 프리뷰는 제품 라우트나 fixture에 포함되지 않는다.
- 로컬 프리뷰는 3001 포트에서 볼 수 있다. 하네스 실행에는 별도 pinned runtime과 Node24/pnpm10 작업 환경을 사용했다. 기존 doctor 훅 바이트 비교 제한은 actual gate/review 통과와 구분한다.

## 회고

- Brain: 추가 없음. 이번 앱의 경로 예외와 승인·검증 근거를 앱 기록으로 보존했다.
- Skills: 수정 없음.
- Structural: 승인된 ID 링크 생성 경계와 회귀 테스트 1개 추가. 공유 하네스 변경 없음.
- Todos: 루트에 중복 항목을 추가하지 않고 위 후속 범위로 관리한다.
