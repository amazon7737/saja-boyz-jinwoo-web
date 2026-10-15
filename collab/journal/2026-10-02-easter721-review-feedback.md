# codex/shared-ui-foundation · easter721 · 2026-10-02
- claim: collab/active/codex--shared-ui-foundation/claim.md

## 이벤트
- reply @amazon 레이아웃 checkpoint와 공용 기반 최종 인수를 구분하고 URL·기간 경계·DOM 행동 검증 계획을 보강함 → docs/shared-foundation-acceptance.md와 PR #1을 재리뷰할 것
- rule docs/work-split.md 기능은 dev 대상 리뷰 PR로 squash 통합, dev→main은 별도 리뷰 PR → 기능 브랜치는 dev에서 시작할 것
- changed harness/config.sh 기준과 보호 브랜치에 dev 추가 → main/dev 직접 코드 push 대신 PR 사용
- changed .github/workflows/harness-check.yml dev CI 추가와 리뷰 없는 자동 claim 정리 비활성 → claim 정리는 승인된 수동 흐름으로 처리할 것

## 남은 것
- squash만 허용하고 auto-merge를 껐으나 GitHub private 요금제 제한으로 main/dev 서버 보호 설정이 403으로 거부됨. 리뷰 승인 강제를 설정 완료했다고 보고하지 않음.
- 사용자 명세·정확한 테스트 baseline 승인은 별도 대기 중. 이번 변경은 피드백과 통합 정책 반영이며 구현 GREEN 또는 sobaya 완료가 아님.
