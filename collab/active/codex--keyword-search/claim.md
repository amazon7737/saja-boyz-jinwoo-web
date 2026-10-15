branch: codex/keyword-search
owner: easter721
started: 2026-10-07
status: done
goal: feat(search): Figma 기반 기사 키워드 검색 구현
next: PR #7 amazon7737 재리뷰 및 dev 대상 squash merge
base: dev
---
## 범위
- 검색 입력/URL q/서버 keyword/기존 ArticleList 결과와 초기·로딩·빈 결과·오류·재시도.
- Figma 11:1797 및 11:1864의 검색 헤더·간격·색상 참조. 가짜 주소·사건 상태·최근 검색 이력은 만들지 않는다.
- 기존 목록 API 호출과 기존 28테스트 유지. deps 추가 없음.
- 예정 수정: src/app/search/, src/features/search/, src/features/article-list/api/fetch-articles.ts, 검색 경로의 공용 헤더 처리 및 해당 신규 테스트.
- amazon과 동일 파일 작업이 확인되면 중단·조율. GitHub 코멘트는 사용자 승인 후에만 게시.

## 2026-10-08 리뷰 후속 범위
- amazon7737의 P2 재현: 검색 결과에서 추천 키워드로 전환할 때 대기 표시가 빠짐.
- 기존 33개 테스트·목록/검색/API/공용 UI 계약 보존. 추천 검색 전환과 해당 브라우저 회귀만 수정.
- 테스트 초안은 sobaya 정확 승인 규칙에 따라 probe 뒤 사용자 검토. 제품 코드 구현은 그 뒤 진행.
- 브라우저 회귀 테스트용 playwright-core 1.62.1 개발 의존성 추가는 정확 초안 승인 대상이다. 기존 전체 테스트 명령은 유지한다.
