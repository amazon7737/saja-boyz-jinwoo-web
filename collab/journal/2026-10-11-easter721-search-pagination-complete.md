# 검색 더 보기 완료

## 이벤트

- changed src/features/article-list/api/fetch-articles.ts 선택적 offset 인자와 원본 total 반환을 추가했고 기존 호출의 offset=0/limit=20을 유지함 → 목록 더 보기 구현 시 재사용하고 total을 고유 기사 수로 표시하지 말 것.
- added src/features/search/ 검색 결과 더 보기·누적 중복 제거·페이지별 오류/재시도·검색어 변경 초기화를 구현함 → 같은 검색 흐름을 중복 구현하지 말 것.
- rule src/features/search/ 다음 offset은 중복 제거 전 성공 응답의 원본 행 수를 누적하고 빈 다음 페이지 또는 최신 total 도달 시 종료함 → 화면 카드 수로 계산하지 말 것.
- done collab/active/codex--search-pagination/verification.md 전체 58개 테스트·gate·Astra 독립 리뷰·타입·빌드·Chrome 검증 완료 → 리뷰 HEAD dc483848849960a0fd6d9d8f9965dc81511e3b95와 보관된 계획을 확인할 것.

## 남은 것

- dev 대상 PR에서 amazon7737 리뷰 후 squash merge 및 브랜치 삭제. GitHub 코멘트 게시·머지는 별도 사용자 승인 전 하지 않는다.
- 목록 더 보기는 별도 작업이며 기존 목록 화면은 변경하지 않았다. 좌표 API·자동 수집·Swagger 세부 규약 확인도 별도로 진행한다.
