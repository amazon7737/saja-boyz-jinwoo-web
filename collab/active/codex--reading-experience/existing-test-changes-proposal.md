# 기존 테스트7개 변경 정확 초안

승인 전에는 src 테스트를 수정하지 않는다. proposed-tests/ 전체 파일과 diff가 정확 승인 대상이다. 버튼 없는 요구에 따라 관찰자 트리거로 이관하고 기존 데이터 계약 검증을 모두 유지한다. Sobaya가 7개 테스트를 항목별로 다시 추가·검증하도록 승인 후 선택된 본문만 baseline에서 분리한다. 다른106개는 유지한다.

## src/app/incidents/article-list-pagination.test.ts

[article-list-pagination.test.ts](proposed-tests/article-list-pagination.test.ts) · [정확 차이](proposed-tests/article-list-pagination.test.ts.diff)

## src/features/search/ui/search-results/search-results.test.ts

[search-results.test.ts](proposed-tests/search-results.test.ts) · [정확 차이](proposed-tests/search-results.test.ts.diff)

## src/app/search/recommendation-loading.test.ts

[recommendation-loading.test.ts](proposed-tests/recommendation-loading.test.ts) · [정확 차이](proposed-tests/recommendation-loading.test.ts.diff)
