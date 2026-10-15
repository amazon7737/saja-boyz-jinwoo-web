branch: codex/search-pagination
owner: easter721
started: 2026-10-11
status: done
goal: feat(search): 검색 결과 더 보기와 페이지별 재시도 구현
next: dev 대상 PR의 amazon7737 리뷰 후 squash merge. 목록 페이지네이션은 이번 offset/total 계약을 재사용할 수 있음.
base: dev
---

## 범위
- dev 8786f5b에서 검색 결과 더 보기를 구현한다. 동일 검색어 다음 페이지, 중복 제거, 종료 조건, 로딩·재시도, 검색어 변경 시 초기화만 포함한다.
- 서버의 offset·limit를 재사용하고 비공개 API 기준 주소는 서버에 유지한다. API 스키마·분류·지도·제보 기능은 바꾸지 않는다.
- 사용자가 전과정을 승인했으며 sobaya Astra·전체 suite·독립 리뷰·실제 Chrome·handoff·dev 대상 PR ready 및 amazon7737 리뷰 요청까지 진행한다. GitHub 코멘트·머지는 별도 승인 전 수행하지 않는다.
