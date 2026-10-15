branch: codex/article-list-pagination
owner: amazon
started: 2026-10-11
status: done
goal: feat(articles): 기사 목록 더 보기와 페이지별 재시도 구현
next: 승인 항목 3개 구현·61개 테스트·타입/빌드·Chrome·독립 리뷰 완료. dev 대상 PR에서 사람의 리뷰와 병합을 기다린다.
base: dev
---

## 범위
- `/incidents`의 기존 첫 페이지·카드·상세 연결을 유지하고 다음 페이지·중복 제거·로딩·재시도를 추가한다.
- 머지된 PR #11의 공용 fetchArticleList(keyword?, offset)와 total 계약을 재사용한다. 검색·지도·제보·서버 API·의존성 변경은 포함하지 않는다.
- 명세·정확 테스트 3개는 사용자 승인 후 구현했다. 승인 기록은 approval.md, 검증 근거는 verification.ko.md에 있다.
