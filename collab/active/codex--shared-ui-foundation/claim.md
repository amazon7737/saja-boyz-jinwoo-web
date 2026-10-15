---
branch: codex/shared-ui-foundation
owner: easter721
started: 2026-10-01
status: active
goal: feat(ui): sobaya로 Figma 공용 UI 다시 구현
next: src/ public/ failed-test.md docs/sobaya-recovery.md
base: dev
---

## 메모
- 2026-10-01 사용자 요청: 기존 UI 구현을 모두 제거하고 최초 개발환경에서 sobaya로 다시 개발. 초기 scaffold·pnpm·협업 하네스·Figma 분석·분담은 보존.
- 2026-10-01 사용자 정정: 실제 개발은 sobaya로 수행해야 함. 연결을 복구하고 기존 PR의 완료 판정을 보류함.
- 사용자 승인 분담: easter721은 공용 UI·데이터 계약 선행 PR 후 지도·검색·필터·마커·사건 바텀시트 구현.
- amazon은 사건 목록(/incidents)·상세(/incidents/[id])·공유·제보(/report)와 화면별 CSS 담당. 아직 상대의 작업 시작은 확인되지 않음.
- 이 선행 PR은 공용 검색 헤더·필터·배지·하단 메뉴·안정된 사건 계약을 제공. 지도 SDK·뉴스 API·제보 저장과 최종 화면 구현은 후속 범위.
- sobaya 미연결 상태이므로 직접 구현 후 pnpm 검사 루프를 collab.sh run으로 실행.
