# sobaya 연결 복구와 승인 전 상태

> 최신 상태: 기존 공용 UI 코드·자산·추가 테스트를 제거하고 src를 초기 main scaffold로 복원했다. 새 명세·검사 계약은 docs/sobaya-restart-approval.md, 정확한 테스트 초안은 해당 브랜치 claim 폴더의 failed-test.draft.md에서 확인한다. 4개 초안은 sobaya probe에서 실제 RED를 확인했다. brain index 오류는 공식 도구로 해소했고, doctor의 현재 실패는 협업 훅을 sobaya 단독 훅으로 인정하지 않는 호환 문제다.

협업 하네스는 작업 선언·충돌·저널을 관리한다. 개발은 반드시 `collab.sh run`으로 감싼 sobaya `approve → loop → gate → review` 절차로 수행한다. 일반 `pnpm run check` 실행은 sobaya 개발 루프를 대체하지 않는다.

## 현재 상태

- sobaya를 앱의 형제 폴더 `../sobaya`에 설치하고 공식 attach 어댑터로 연결했다. 다른 위치는 `SOBAYA_ROOT` 환경 변수로 지정한다.
- 팀 버전은 `harness/sobaya.lock`의 `83af28db653c29a54be880ae49671725b6bbbcc4`이다.
- 기존 협업 `.githooks/pre-commit`은 sobaya 앱 pre-commit을 이어서 실행한다.
- PR #1은 sobaya로 구현한 결과가 아니다. 기존 코드와 일반 검사 결과는 보존하되 PR을 초안으로 전환했고 sobaya 완료 판정은 보류했다.
- `spec.md`는 설치 템플릿이며 사용자 소유다. `failed-test.md`도 승인된 계획이 아니다. 승인 상태는 아직 없다.

## 확인된 준비 문제

1. sobaya의 Test 명령 파서는 `pnpm test`를 지원하지 않는다. npm으로 되돌리지 않는다. 현재 `pnpm test`는 Vitest와 하네스 쉘 검사 모두를 실행하므로 단순히 Vitest만 지정하면 전체 검사가 누락된다.
2. 새 sobaya 클론의 doctor는 brain index 검사에서 실패한다. 공식 index 생성 도구로 원인을 정리한 뒤 doctor를 다시 실행해야 한다.
3. 사용자 검토를 받은 명세·정확한 테스트 본문·검사 명령 계약이 없다. 임의로 `approve.sh`를 실행하지 않는다.

## 다음 승인안

명세 범위는 PR #1의 공용 검색 헤더·필터·배지·하단 메뉴와 URL 계약으로 한정한다. 전체 지도·목록·상세·제보 화면은 후속 작업이다.

pnpm은 패키지 관리와 일반 명령에 계속 사용한다. sobaya의 Test 계약은 직접 로컬 Vitest 실행으로 연결하되, Vitest에서 기존 하네스 쉘 스위트 3개도 실행하는 지원 테스트를 포함해 전체 검사 범위를 보존하는 안을 준비한다. 지원 테스트와 필터 정상·잘못된 값·초기화·기간 경계 테스트의 정확한 본문을 사용자에게 보여준 뒤 승인을 받아야 한다.

승인 전에는 구현을 진행하지 않는다. 기존 코드의 이미 통과하는 항목은 sobaya의 ALREADY GREEN 체크포인트로 처리하고, 과거 구현을 RED부터 수행했다고 보고하지 않는다. 마지막 gate와 독립 review까지 완료한 뒤에만 PR을 준비 완료로 바꾼다.
