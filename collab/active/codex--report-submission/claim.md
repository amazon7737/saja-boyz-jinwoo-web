---
branch: codex/report-submission
owner: amazon
started: 2026-10-13
status: active
goal: feat(report): 실제 제보 접수와 서버 저장 연결
next: 승인된 프런트 교체 기준선과 9개 새 항목을 Sobaya 체크포인트로 구현·검증한다. 서버 통합 검증·PR은 최종 gate와 독립 리뷰 뒤 조정한다.
base: codex/report-form
---

## 메모

- 2026-10-13 사용자가 실제 제보 접수를 amazon이 맡는다고 diff에 기록하고 작업을 시작하도록 지시했다.
- PR #15의 UI·검증·첨부 선택·Tailwind 구현(e045e01)을 재사용한다. 이 PR이 dev에 병합되기 전에는 그 브랜치 위에 쌓아 중복 구현을 피한다.
- 프런트 접수 흐름은 team-poem/saja-boyz-jinwoo, Go 접수 API·파일 저장은 team-poem/poem-news의 codex/report-intake에서 준비한다.
- 현재 착수는 담당 선언·계약·테스트 초안 작성이다. 새 접수 정책과 실행 테스트는 아직 승인 전이며 기존 승인 테스트·명세는 바꾸지 않는다.
- 실제 접수·서버 저장은 기존 '입력 확인' UI와 별도의 후속 작업이다. 접수한 제보를 검증된 뉴스로 자동 공개하지 않는다.
- 지도·검색·공용 UI와 뉴스 수집·이미지 생성은 이번 기능에 포함하지 않는다.
- 사용자 선택은 익명 접수 + 첨부 저장이다. docs/report-submission-contract.md와 docs/drafts/report-submission/에서 계약·기준선 교체·주석 검토본·probe 근거를 볼 수 있다. 실제 접수 구현은 아직 시작하지 않았다.

- 2026-10-13 사용자가 최종 계약·기준선 교체·프런트 9개/서버 8개 테스트를 명시적으로 승인했다. approval.md에 정확한 입력 해시와 채택 상태를 기록했다. 이전 승인 전 메모는 이 기록으로 후속 갱신된다.
