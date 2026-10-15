# 사건 목록 초안 검증 기록

2026-10-02, 기준 dev fb6022d. Node 24.19.0 / Vitest 5.0.3.
루트 probe 관련 파일은 팀 lock 83af28d와 동일하다. 승인·구현 루프는 실행하지 않았다.

## 목록 기능 프로브

- 최종 초안의 공유 헤더와 incidentCards를 tdd-set/bin/probe.sh로 실행했다.
- 결과: ERROR, 종료 2. `Cannot find module './incident-list'`, 실행된 테스트 0개.
- 목록 모듈이 없는 준비 상태이므로 기능 RED로 인정하지 않는다. 나머지 네 항목도 동일한 import에 의존하여 반복 실행하지 않았다.
- 원인을 숨기는 mock이나 임의 구현을 넣지 않았다. 빈 컴포넌트 준비안은 proposal.md와 review.md의 승인 대상이다.
- 실제 신규 기능은 아직 실행·검증되지 않았다. 승인 후 준비 소스를 만들고 각 항목의 실제 RED부터 확인한다.

## 기존 전체 스위트 연결 지원

runtime-support.draft.md의 정확한 runHarness 도우미와 각 테스트를 공식 probe로 실행했다.

| 지원 테스트 | 결과 | 소요 |
| --- | --- | --- |
| harness_hooks | GREEN — 기존 hooks 셸 스위트 성공 | 19.89초 |
| harness_loop | GREEN — 기존 loop 셸 스위트 성공 | 59.53초 |
| harness_sobaya | GREEN — 기존 sobaya 셸 스위트 성공 | 25.95초 |

probe는 GREEN일 때 종료 1을 반환한다. 이 세 개는 기존 검사를 보존하는 지원이며 새 실패 기능 항목에 넣지 않았다.
loop 출력의 @solp 중첩 알림은 테스트 fixture 내부 시나리오이며 실제 동료 파일 충돌이 아니다.
임시 프로브 테스트는 종료 후 정리되었으며 실제 src에는 테스트 지원이나 구현을 설치하지 않았다.

## 환경 검사

- 원격 fetch 성공. dev fb6022d, 우리 변경 영역에 동료 WIP 충돌 없음.
- 협업 핸들 amazon / rerere / .githooks 활성화. 우리 claim을 codex/incident-list에 커밋·push했다.
- doctor: workspace checks와 루트 훅 확인 후 앱 .githooks/pre-commit이 관리 훅과 동일하지 않아 실패.
- 기존 .git/hooks/pre-commit 위임 대상은 아직 설치되지 않았다. 정확한 로컬 연결안은 runtime-support.draft.md 참조.
- spec.md 없음, 승인 baseline 없음. 사람 소유 명세를 자동 작성하거나 approve.sh를 실행하지 않았다.

## 독립 초안 검토

별도 읽기 전용 리뷰에서 부분 문자열 시각 비교·입력 순서·상태 영역 연결 공백 세 개를 찾았다.
정확한 time 쌍 비교, 뒤집은 입력 검증, status 요소 내부 검사로 수정했다.
추가로 설치된 React SSR이 dateTime 속성 이름을 그대로 출력하는 것을 독립 리뷰와 직접 렌더로 확인했다.
readTimes를 대소문자 무관 매칭으로 바꾸고 소문자 datetime만 요구하는 중복 단언을 제거했다.
이 마지막 검토 변경 뒤에는 동일한 미구현 모듈 오류를 반복 실행하지 않았다. 새 기능 RED 증거는 여전히 없다.
검토본은 새 `// 검토:` 주석만 제거하면 실행 원본 코드가 그대로 복원되는지 비교했다.
이 검토는 구현 완료 review가 아니며, 구현 후 최종 HEAD 기준 독립 review를 별도로 수행해야 한다.
