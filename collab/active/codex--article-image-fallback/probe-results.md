# 신규 이미지 오류 입력 — 검증 결과

상태: **새 정확한 입력 승인 전 / 구현 전**. 현재 소스에 필요한 행동이 없음을 확인했으며 전체 GREEN이나 기능 완료로 보고하지 않는다.

- 기능 소스 기준: `7a2672a6941343b5d96546b9ced3546f97393fa5` (실제 기능 소스 fec4823와 동일).
- pinned Sobaya `83af28d`의 probe.sh, Node24.19.0, pnpm10.34.6, Vitest5.0.3, jsdom27.4.0을 사용했다.
- actual 앱 source·package/lock·Vitest 설정·기존21개 테스트는 변경하지 않았다. 격리 임시 clone에만 지원안과 후보 테스트를 설치했다. root spec.md·failed-test.md·승인 state.json은 아직 생성하지 않았다.

## RED와 기존 회귀 검사

| 검사 | 실제 결과 | 증거 |
|---|---|---|
| articleImageErrorPreservesCards | pinned probe exit0=RED. DOM error 후 기존 img가 남아 toBeNull 단언 실패. 누락 import/환경 실패가 아님 | [probe](evidence/probe-error-preserves-cards.txt) |
| articleImageRecoversForNewSource | pinned probe exit0=RED. 첫 이미지 오류 뒤 img가 남아 fallback 선행조건 단언 실패 | [probe](evidence/probe-new-source.txt) |
| 최종 후보2개 + 기존 전체21개 | Vitest exit1, 총23개 중 **기존21 PASS / 신규2 기대대로 FAIL**, skip 없음 | [실제 JSON](evidence/candidate-suite.json), [로그](evidence/candidate-suite.txt) |
| typecheck / lint / format | 모두 exit0, 새 테스트 파일을 실제 include한 격리 복사본 기준 | [타입](evidence/candidate-typecheck.txt), [lint](evidence/candidate-lint.txt), [포맷](evidence/candidate-format.txt) |
| plan 표현과 검토본 | pinned plan.awk가 미체크2항목·정확한 target/header/body로 파싱. 설명 주석만 제거하면 실행3블록 byte-exact | [원문](failed-test.draft.md), [검토본](review.md) |
| 실제 HTTP404 브라우저 | 합성 fixture의 news200 → image404를 실제 Chrome이 요청. 깨진80×80 img와 AI 캡션이 남음을 확인 | [관찰 기록](evidence/browser-red.md), [화면](evidence/browser-image404-red-393.jpg) |

전체 suite 로그의 @solp/feat--checkout 경고는 기존 협업 하네스 테스트가 만든 fixture 출력이며 실제 동료 편집 충돌 증거가 아니다.

## 독립 초안 검토

정적 NodeList를 오류 전 저장한 뒤 검사하면 재정렬을 놓치거나 교체된 옛 DOM을 검사할 수 있다는 지적을 반영했다. 오류 뒤 현재 DOM을 재조회하고 A/B/C 순서를 명시적으로 단언한다. 최종 보강본을 다시 probe·전체 suite·정적 검사했고, 별도 컨텍스트의 재검토에서 추가 조치할 지적은 없었다. [검토 기록](evidence/draft-review.json). 이는 새 테스트가 합당하다는 검토이며 구현 완료 리뷰가 아니다.

jsdom은 실제 이미지 다운로드·픽셀 배치·hydration을 입증하지 않는다. 실제 브라우저 RED는 현재 결함의 증거이며, 구현 후 정상/404/손상 이미지와 모바일·데스크톱을 다시 확인해야 한다.

## 승인 이후

[review.md](review.md)의 명세·새 테스트2개·공통 헤더·jsdom 지원안을 승인받으면 정확한 파일을 새 baseline에 기록한다. 이전 API8개와 기존13개 승인을 다시 요청하지 않는다. 구현 후 전체23개 GREEN·빌드·최종 gate·현재 HEAD 독립 리뷰가 필요하다.

## 회고

Brain: 기존 승인 preflight·증거 보존 원칙 적용, 루트 brain 변경 없음.
Skills: 변경 없음.
Structural: 승인 입력 해시·주석 복원 비교·현재 DOM 순서 단언으로 검토 가능한 초안과 증거를 보존.
Todos: 더 보기·공용 UI·상세·제보·수집·배포의 미정 경계는 pagination-ui-proposal.md와 integration-status.md에 기록.
