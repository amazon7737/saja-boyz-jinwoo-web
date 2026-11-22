---
branch: fix/incidents-default-recent
owner: amazon
started: 2026-11-22
status: active          # active | paused(한동안 안 함, 남이 이어받아도 됨) | done(PR 올림)
goal: fix(list): 사건 목록 기본 정렬을 인기순에서 최신순으로 변경
next:
base: dev
---

## 메모
- 사용자가 /incidents 기본 정렬을 최근 30일 인기순에서 최신 날짜순으로 바꾸길 요청했다. 인기순은 `?sort=popular` 로 유지.
