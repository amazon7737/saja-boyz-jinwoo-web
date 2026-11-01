---
branch: codex/rolling-search-headlines
owner: amazon
started: 2026-11-01
status: done
goal: feat(search): 조회수 상위 기사 제목을 검색 안내에 롤링 표시
next: 서버 PR14 선행 배포 후 dev 대상 프런트 PR 검토·머지
base: dev
---

## 메모
- 조회수 상위3건의 제목을 무작위 순서로 순환 표시한다.
- 사용자 승인으로 한국시간 오늘 고유 조회수 TOP3 서버 API를 별도 PR14에 추가했다.
