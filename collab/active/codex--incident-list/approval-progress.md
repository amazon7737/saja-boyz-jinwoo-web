# 승인 후 실행 준비 기록

2026-10-02 사용자의 “승인한다”로 기존 명세 제안·정확한 테스트 5개·빈 소스·전체 테스트 연결 지원과 spec.md 작성 허용을 확인했다.

## 적용한 것
- spec.md에 승인된 목록 본문 범위와 동작을 옮겼다. 후속 명세 변경은 사용자 결정을 따른다.
- failed-test.md에는 최초 승인된 헤더·본문을 그대로 보관한다. 포맷 교체본은 추가 승인 전까지 별도 파일에 둔다.
- 승인된 빈 IncidentList와 기존 셸 스위트 3개를 보존하는 Vitest 지원을 준비했다. 기능 구현은 아직 시작하지 않았다.
- AGENTS Test / package.json scripts.test는 승인한 정확한 단일 Vitest 명령으로 변경했다.
- 팀 lock 83af28d의 분리된 런타임을 /Users/kangminkim/.codex/worktrees/jinwoo-pinned-runtime/sobaya에 준비했다. 공유 루트 코드·lock을 변경하지 않았다.
- 기존 협업 pre-commit이 앱 .git/hooks/pre-commit에 설치한 표준 Sobaya 훅을 호출하도록 연결했다. 실제 호출에서 workspace 검사·format·lint가 실행되어 종료 0을 확인했다. 빈 source의 미사용 _props 경고 1개는 구현 시 해소될 준비 상태다.
- 실제 pnpm test 전체 실행: Vitest 2파일·7테스트 통과(기존 필터 4개 및 기존 셸 스위트 3묶음). 106.11초. 목록 기능은 아직 이 전체 suite에 materialize하지 않았다.

## 포맷 교체 검토

승인 전 포맷 확인이 누락되어 원본 헤더·긴 단언문 일부가 Prettier 규칙에 맞지 않음을 발견했다.
failed-test.formatting-proposal.md 및 review.formatting-proposal.md는 줄바꿈과 후행 쉼표만 정리한 별도 교체안이다.
모든 입력·기대값·정규식·항목 수는 같으며, 전체 검토 주석을 제거하면 제안된 실행 코드와 정확히 일치한다.
교체 테스트의 합성 파일은 Prettier 검사를 통과했다. 사람에게 해당 교체의 추가 승인을 요청했으며, 승인 전 원본이나 baseline을 대체하지 않는다.

## 실제 RED

승인된 빈 컴포넌트 준비 후 팀 lock의 공식 probe로 포맷 교체안의 다섯 항목을 실행했다.
incidentCards / incidentImages / incidentEmpty / incidentLoading / incidentTimeBoundaries 모두 실행된 단언 실패로 RED, probe 종료 0이었다.
목록 구현 코드나 가짜 mock으로 실패를 숨기지 않았다. 임시 프로브 파일은 정리했다.

## 알려진 환경 한계

doctor는 기존 협업 .githooks 래퍼와 표준 훅의 바이트 비교 때문에 실패한다. 이 값을 성공으로 기록하지 않는다.
협업→Sobaya 위임 자체는 위 실제 pre-commit 실행으로 별도 검증했다. 최종 gate와 독립 review는 아직 실행 전이다.
분리 런타임에서 처음 doctor를 실행할 때는 과거 brain/index.md가 stale하여 먼저 실패했다. 해당 분리 checkout에서 공식 brain-index.sh로 생성 인덱스만 갱신했다. 공유 루트와 런타임 실행 소스는 그대로다.
