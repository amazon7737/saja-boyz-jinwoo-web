# 제보 입력 검토안 · amazon · 2026-10-13

- claim: collab/active/codex--report-form/claim.md

## 이벤트

- added docs/drafts/report-form/proposal.md 기존 분담에서 amazon 제보 기능이 남아 있음을 확인하고 UI 우선 검토안을 준비함 → 제보 담당 배정이 없어졌거나 이미 구현됐다고 해석하지 말 것.
- added docs/drafts/report-form/failed-test.draft.md 신규 테스트 6개와 정확한 설명 검토본을 준비함 → 모두 승인 전이며 기존 소스·승인 테스트·API 계약은 바뀌지 않음.
- rule docs/drafts/report-form/verification.md 실제 접수 API·첨부 저장 방식은 미결정이며 현재 단계는 검토용 Draft PR → 입력 확인을 접수 성공으로 표시하거나 이 PR을 완성 기능으로 취급하지 말 것.

## 남은 것

- 사용자에게 UI·입력 검증·첨부 선택 우선과 Go 서버 실제 접수 포함 중 범위를 질문했으며 답변 대기 중이다.
- 정확한 명세·테스트 승인이 필요하다. approved baseline·worker·final gate·완료 리뷰는 실행하지 않았다.
- 기존 전체 suite 61개 PASS. 신규 후보 6개는 개별 probe에서 실제 assertion RED. 초안 타입·lint PASS. 독립 초안 리뷰 보완을 반영했다.
- 다음 작업자는 docs/drafts/report-form/proposal.md, review.ko.md, verification.md를 읽고 승인된 범위만 진행한다. 기존 테스트를 고치지 않는다.
- 실제 파일 선택·재선택, 버튼 기본 제출 차단, 좁은 화면 배치는 구현 후 브라우저로 확인해야 한다.
- GitHub의 amazon PR #2/#3/#4/#10/#12는 병합 완료. 열린 #14는 easter721 지도 작업이며 이 브랜치에서 수정하지 않는다.
- `SOBAYA_ROOT`를 전체 테스트 프로세스에 주입하면 fixture 검증을 오염시킬 수 있다. 협업 wrapper에만 고정 런타임을 지정하고 실제 runner는 절대 경로와 `env -u SOBAYA_ROOT`로 실행한다.
