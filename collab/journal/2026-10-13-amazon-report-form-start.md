# 제보 UI 구현 시작 · amazon · 2026-10-13

- claim: collab/active/codex--report-form/claim.md

## 이벤트

- supersedes docs/drafts/report-form/proposal.md 제보 UI 우선 범위와 정확한 신규 테스트 6개를 사용자가 승인함 → PR #15에서 승인 baseline을 등록하고 순차 구현한다.
- touching src/app/report/page.tsx 제보 입력·검증·첨부 선택 UI 구현 착수 → 공용 AppShell·지도·검색·서버 API는 유지한다.

## 남은 것

- 승인된 6개 항목의 checkpoint, 전체 suite·타입·빌드, 실제 브라우저 입력/파일 재선택 확인, final gate와 독립 리뷰.
- 실제 접수 API와 서버 저장은 별도 결정 대상이며 이번 완료 기준이 아니다.
