# fix/recent-list-link · amazon · 2026-11-18
- claim: collab/active/fix--recent-list-link/claim.md

## 이벤트
- changed src/app/(browse)/@background/incidents/page.tsx 사건 목록이 `sort=recent` 쿼리를 받으면 최신순으로 조회하고, 없거나 다른 값이면 기존 최근 30일 인기순 → 최신순 목록이 필요하면 `/incidents?sort=recent`로 연결할 것
- changed src/features/article-list/api/load-article-page.ts loadArticlePage(offset, period, sort = 'popular') 세 번째 인자 추가 → 이어 불러오기에서 첫 페이지와 같은 정렬을 넘길 것
- added src/features/article-list/model/article-sort.ts ArticleSort·parseArticleSort → 정렬 값 파싱을 새로 만들지 말고 이걸 쓸 것

## 남은 것
- 목록 화면에는 정렬을 바꾸는 UI가 없다. 지금은 지도 홈 전체보기만 최신순으로 들어간다.
