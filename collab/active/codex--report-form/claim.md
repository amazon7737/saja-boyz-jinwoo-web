---
branch: codex/report-form
owner: amazon
started: 2026-10-13
status: active
goal: feat(report): 제보 입력 검증과 첨부 선택 화면 구현
next: PR #15 리뷰에 따라 제보 CSS Module을 Tailwind로 전환하고 스타일 안내 문서·CI 검사를 정리한다.
base: dev
---

## 메모

- 2026-10-13 사용자가 solp721의 PR 리뷰 반영을 요청했다. src/app/report/page.tsx와 해당 CSS Module, docs/work-split.md·architecture.md·code-conventions.md, .github/workflows/app-check.yml 및 스타일 검사 스크립트가 수정 범위다. 기존 동작·승인 테스트·보관된 명세는 유지하는 별도 구조 변경이다.
- 사용자 지시: amazon에게 배정된 개발을 순차적으로 PR까지 진행하고, 남은 배정이 없으면 종료한다.
- dev 78ebbc8까지 반영했다. 목록·이미지 대체·상세·목록 페이지네이션과 easter721의 지도 위치 복원 PR #14는 이미 병합됐다.
- 승인된 제보 UI 항목 6개를 구현했다. 전체 70개 테스트·타입·빌드·Chrome 화면 검증과 98cb67d의 최종 gate·독립 리뷰를 통과했다.
- 실제 접수 API·첨부 저장·인증·검토 정책은 확정되지 않았다. 접수 성공을 가장하거나 임의의 제출 API를 호출하지 않는다.
- 이전 API 규약 대조 요청은 사용자가 제외한 사항으로 이번 루프에 포함하지 않는다.
- 2026-10-13 사용자가 제보 UI 우선 범위와 정확한 테스트 검토본을 승인했다. 실제 접수·서버 저장은 이번 범위에 포함하지 않는다.
- 최종 검증과 검토 사항은 collab/journal/2026-10-13-amazon-report-form-complete.md 및 이 claim의 evidence/에 기록한다.
