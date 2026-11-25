---
branch: fix/incidents-click-area
owner: amazon
started: 2026-11-25
status: done            # active | paused(한동안 안 함, 남이 이어받아도 됨) | done(PR 올림)
goal: fix(list): 사건 목록에서 카드 어디를 눌러도 기사 상세로 이동
next:
base: dev
---

## 메모
- 이슈 #81. /incidents 목록에서 제목 글자만 링크라 본문(요약)을 눌러도 상세로 가지 않는다.
- 제목 링크를 카드 전체로 늘린다. 「기사 원문」 외부 링크는 그대로 따로 눌린다.
