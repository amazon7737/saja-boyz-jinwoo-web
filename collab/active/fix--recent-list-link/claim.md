---
branch: fix/recent-list-link
owner: amazon
started: 2026-11-18
status: active
goal: fix(list): 최근 보도 기사 전체보기를 최신순 목록으로 연결
next:
base: dev
---

## 메모
- 사건 목록(/incidents)은 기본이 최근 30일 인기순이라, 지도 홈의 "🔥 최근 보도 기사 → 전체보기"에서 날짜가 뒤섞여 보였다.
- 기본 인기순은 유지하고 `?sort=recent`일 때만 최신순으로 조회한다.
