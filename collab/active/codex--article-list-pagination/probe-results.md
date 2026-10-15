# 기사 목록 페이지네이션 — 초안 검증

2026-10-11 · 기준 dev `e1ef3ca`, 작업 선언 `0896145` · 제품 구현 전.

## 기존 동작

- 변경 없는 전체 suite: **15개 파일, 58개 테스트 통과**. 근거: [baseline-suite.txt](evidence/baseline-suite.txt).
- 첫 실행은 샌드박스에서 로컬 HTTP listen이 `EPERM`으로 거부되어 기존 Chrome 회귀 테스트 1개가 90초 제한에 걸렸다. loopback listen으로 환경 원인을 확인하고, 같은 suite를 로컬 서버/Chrome 실행이 가능한 환경에서 다시 실행해 전부 통과했다. 테스트·명령·시간 제한은 수정하지 않았다.
- 로그의 `components/ui/button.tsx / @solp(feat--checkout)` 충돌 문구는 협업 하네스 테스트 fixture의 출력이다. 현재 협업 digest에서는 실제 동시 편집 충돌이 없었다.

## 새 행동 테스트

| 항목 | 현재 결과 | 직접 확인한 실패 |
| --- | --- | --- |
| articleListMoreAppendsWithRawOffsetsAndFirstSeenIdentity | RED | 첫 페이지 표시 후 `더 보기` 버튼이 없음 |
| articleListMorePendingFailuresAndRetryPreserveArticles | RED | 추가 조회를 시작할 `더 보기` 버튼이 없음 |
| articleListMoreStopsOnEmptyPageAndDoesNotOfferFinishedLists | RED | 후속 빈 페이지를 조회할 `더 보기` 버튼이 없음 |

팀 고정 Sobaya `83af28d`의 `probe.sh`를 `collab.sh run`으로 실행했다. 각 후보는 일시적인 테스트 파일로 실행한 뒤 제거했다. [probe-1](evidence/probe-1.txt), [probe-2](evidence/probe-2.txt), [probe-3](evidence/probe-3.txt).

세 항목 모두 실제 AssertionError로 실패했다. import 누락·미구현 함수 참조·타입 오류를 RED로 간주하지 않았다. 첫 실패 뒤의 분기들은 아직 실행되지 않았으므로 구현 후 각각의 전체 통과가 필요하다.

## 승인 전 검사

- 공유 헤더 + 1번, + 2번, + 3번의 누적 단계별로 Prettier·ESLint·TypeScript 통과. [1단계](evidence/preflight-1.txt), [2단계](evidence/preflight-2.txt), [3단계](evidence/preflight-3.txt).
- 검토본의 설명 주석만 제거하면 헤더·테스트 원본 4개 블록이 byte 단위로 일치한다. [무결성 기록](evidence/review-integrity.json).
- 독립 읽기 리뷰에서 새 페이지 내부에 처음 등장한 ID의 중복도 검증하도록 보강했다. 최종 초안에 추가 지적 없음. [리뷰 기록](evidence/draft-review.md).
- 제품 소스·기존 테스트·의존성·spec.md·failed-test.md 변경 없음. 새 테스트는 초안이며 아직 승인/설치하지 않았다.

## 다음 검증

사용자가 이 명세와 정확한 테스트를 승인하면 구현을 진행한다. 승인한 각 항목마다 전체 suite를 검증하고, 타입·빌드·실제 Chrome(목록 더 보기/재시도/상세 이동/반응형), 최종 gate·독립 완료 리뷰 후 dev 대상 PR을 연다.
