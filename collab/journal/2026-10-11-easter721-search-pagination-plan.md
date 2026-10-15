# 검색 더 보기 계획

## 이벤트

- touching src/features/article-list/api/fetch-articles.ts 기본 호출을 보존하면서 offset 선택 인자와 raw total 반환을 추가할 예정 → 목록에서도 재사용할 수 있으며 목록 페이지네이션 UI는 이번 범위가 아님.
- rule src/features/search/ 다음 offset은 중복 제거 전 원본 행 수 누적값을 사용하고 total을 고유 기사 수로 표시하지 않음 → 중복 페이지에서 카드 수 기준 이동으로 바꾸지 말 것.

## 남은 것

- 승인된 더 보기 범위의 신규 4개 초안은 행동 RED와 타입 검사를 통과했다. 사용자 전과정 승인에 따라 sobaya Astra로 구현·전체 suite·독립 리뷰·Chrome 검증 후 dev 대상 PR을 준비한다.
- 초기 원격 브랜치는 dev와 동일한 빈 참조였고 PR이 존재하지 않아 머지 여부 검사 오탐이 났다. 신규 claim 커밋을 확인한 후 최초 push만 의도한 신규 push로 진행했다.
