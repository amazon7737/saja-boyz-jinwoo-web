# fix/incidents-default-recent · amazon · 2026-11-22
- claim: collab/active/fix--incidents-default-recent/claim.md

## 이벤트
- changed src/features/article-list/model/article-sort.ts parseArticleSort 가 값이 없거나 모르면 'recent' 를 돌려줌 (전에는 'popular') → 인기순이 필요한 링크·호출부는 `?sort=popular` 를 명시할 것
- changed src/features/article-list/api/load-article-page.ts loadArticlePage 의 sort 기본값이 'recent' → 인기순 추가 로드는 sort 를 넘길 것
- changed src/app/(browse)/@background/incidents/page.tsx 다시 시도 링크가 인기순일 때만 `?sort=popular` 를 붙임 → `/incidents?sort=recent` 링크는 그대로 동작하지만 `/incidents` 만으로도 최신순

## 남은 것
- 목록 화면에 최신순/인기순 전환 UI 는 아직 없다 (URL 파라미터로만 전환).
- src/features/map/ui/map-article-carousel/map-article-carousel.tsx 의 `/incidents?sort=recent` 링크는 이제 기본값과 같아 `/incidents` 로 줄일 수 있다 (범위 밖이라 그대로 둠).
