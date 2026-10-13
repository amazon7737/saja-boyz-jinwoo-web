---
branch: codex/report-submission
owner: amazon
started: 2026-10-13
status: active
goal: feat(report): 실제 제보 접수와 서버 저장 연결
next: 기존 제보 UI를 재사용해 접수 API·저장·첨부·응답 계약과 정확한 테스트 초안을 준비한다.
base: codex/report-form
---

## 메모

- 2026-10-13 사용자가 실제 제보 접수를 amazon이 맡는다고 diff에 기록하고 작업을 시작하도록 지시했다.
- PR #15의 UI·검증·첨부 선택·Tailwind 구현(e045e01)을 재사용한다. 이 PR이 dev에 병합되기 전에는 그 브랜치 위에 쌓아 중복 구현을 피한다.
- 프런트 접수 흐름은 team-poem/saja-boyz-jinwoo, Go 접수 API·파일 저장은 team-poem/poem-news의 codex/report-intake에서 준비한다.
- 현재 착수는 담당 선언·계약·테스트 초안 작성이다. 새 접수 정책과 실행 테스트는 아직 승인 전이며 기존 승인 테스트·명세는 바꾸지 않는다.
- 실제 접수·서버 저장은 기존 '입력 확인' UI와 별도의 후속 작업이다. 접수한 제보를 검증된 뉴스로 자동 공개하지 않는다.
- 지도·검색·공용 UI와 뉴스 수집·이미지 생성은 이번 기능에 포함하지 않는다.
