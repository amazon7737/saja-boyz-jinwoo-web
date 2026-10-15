# 기사 API 연결 초안 검증 기록

2026-10-04. 현재 기록은 승인 전 후보 테스트와 지원 설정의 사전 검증이며, API 연결 구현 완료나 최종 gate 통과를 의미하지 않는다.

## 기준과 격리

- 앱 기준 커밋: `3502e66` (PR #2의 `71da47d` + 이 브랜치의 claim만 추가).
- 임시 프로브 복사본: `/private/tmp/jinwoo-article-api-probe.vkynwp`.
- 팀 lock의 Sobaya `83af28d`에 있는 `tdd-set/bin/probe.sh` 사용.
- 임시 복사본에 제안한 Vitest 별칭 설정만 적용했다. 새 프로덕션 구현이나 빈 구현 stub을 추가하지 않았다.
- 실제 앱의 src·기존 테스트·Vitest 설정·spec.md는 바꾸지 않았다. 승인 기준선도 기록하지 않았다.

## 정확한 후보 프로브

| 항목 | 최종 프로브 결과 | 최초로 확인된 실패 |
| --- | --- | --- |
| articleApiRequest | RED, exit 0 | expected "vi.fn()" to be called 1 times, but got 0 times |
| articleCardsIdentityAndPublication | RED, exit 0 | expected [] to have a length of 2 but got +0 |
| articleTextAndSourceSafety | RED, exit 0 | expected [] to have a length of 1 but got +0 |
| articleImageStates | RED, exit 0 | expected [] to have a length of 1 but got +0 |
| articleEmpty | RED, exit 0 | expected null not to be null |
| articleErrors | RED, exit 0 | expected null not to be null |
| articleRequestTimeout | RED, exit 0 | expected null not to be null |
| articleLoading | RED, exit 0 | expected undefined to be type of 'function' |

각 후보는 첫 실패에서 멈춘다. 표는 모든 분기·반복 입력이 각각 실패했다는 증거가 아니다. 구현 후 각 전체 본문과 기존 전체 스위트를 통과해야 한다. 로딩 후보는 실제 loading.tsx를 발견하는 glob이 비어 있다는 단언에서 실패하며, 존재하지 않는 import 오류를 RED로 기록한 것이 아니다.

## 지원·정적 검사

- 제안한 Vitest 설정으로 기존 전체 스위트 **13/13 PASS** (기존 셸 테스트 3개 포함, 112.22초). 이후 설정이나 기존 테스트는 변경하지 않았다.
- 최종 8개 후보를 모두 조립한 파일에서 `pnpm run typecheck`, `pnpm run format:check`, `pnpm run lint` PASS.
- 초기 타입 사전 검사에서 설치되지 않은 `vite/client` 직접 참조를 발견했다. 후보에서 제거하고 현재 Vitest가 제공하는 glob과 런타임 모듈 검증을 사용했다. 이 수정은 승인 전 초안에만 적용했다.
- pinned `plan.awk`로 8개 항목·대상·헤더·본문을 파싱해 원본과 바이트 단위로 일치하는지 확인했다. 모든 항목은 미체크 상태다.
- 독립 수락 검토에서 total 오표시 방지·잘못된 숫자 엔티티·접근성 영역 연결을 보강했고, 최종 명세/테스트 사이의 추가 충돌은 발견되지 않았다.

## 파일 해시

- `spec.proposal.md`: SHA-256 `51a08bf52a1bb9aab042bb46b70b7e64b2fe989592b0007a8adcde629d97d3dc`
- `failed-test.draft.md`: SHA-256 `f2ac51f00dc56c9e73cc90b6c5a862bbcdaf15ef749d60ab35146e25704a76c5`
- `support.proposal.md`: SHA-256 `a7c81f1436e3df6adff95814165c1ad55bd1d6f653f03ff7e4bfe864cd0cbbc0`

## 아직 검증하지 않은 것

- 새 기사 화면은 구현 전이다. 실제 API를 표시하는 브라우저·이미지 실패·원문 이동·화면 크기별 동작은 다음 구현 단계에서 검증한다.
- 후보의 fetch mock은 실제 네트워크·CORS·운영 API 성능을 보증하지 않는다. timeout 후보는 7초의 관측 한도 전에 요청이 abort되고 오류 화면으로 바뀌는 것을 요구하며, 정확히 5,000ms의 시계 일치를 보증하지 않는다.
- 정적 이미지 속성 검사로 CSS 치수나 이미지 다운로드 성공을 주장하지 않는다.
- 기존 Figma 대조 결과는 `design-check.md`에 기록했다. 새 기사 라우트의 디자인 일치는 별도 검증 대상이다.
- 반영 전 필요한 승인 입력은 `review.md`의 전체 코드와 `spec.proposal.md`다. 승인 후 원본을 변경하지 않고 spec.md/failed-test.md/지원 설정에 적용하고 기준선을 기록한다.

## 최종 검토본 대조

- `review.md`의 10개 코드 블록에서 추가한 `// 검토:` 설명 줄만 제거하면 계획의 공통 헤더·8개 본문·지원 설정과 바이트 단위로 일치한다.
- 설명의 정확성을 별도 작성 컨텍스트와 작업 담당자가 점검했다.
- 검토본 SHA-256: `3318c5d222c01b58c75e272734eb230911315f95338203180d0bf4e6c9cccca8`.
