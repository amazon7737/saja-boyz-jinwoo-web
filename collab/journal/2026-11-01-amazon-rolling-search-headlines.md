# codex/rolling-search-headlines · amazon · 2026-11-01
- claim: collab/active/codex--rolling-search-headlines/claim.md

## 이벤트
- added src/app/api/search-headlines/route.ts 서버 오늘 TOP3 응답을 검증·정리해 제목만 제공하는 프런트 API → NEWS_API_BASE_URL 기존 설정 재사용, 서버 PR14 먼저 배포
- added src/features/search/model/use-rolling-search-prompt.ts 앱 공유 Provider에서 제목3개 무작위 순서·5초 순환·빈 결과/실패 대체·요청/타이머 정리 → 검색 안내를 추가할 때 공유 훅 사용, 제목마다 재조회하지 말 것
- changed src/app/layout.tsx 공유 Provider를 루트에 배치 → 소비 컴포넌트별 별도 조회 금지, 앱 진입 시1회 조회
- changed src/components/layout/search-header/search-header.tsx 검색 헤더에 기사 제목 검색하기 표시 → 검색 링크와 고정 접근성 이름 유지
- changed src/features/search/ui/search-form/search-form.tsx 빈 입력창 placeholder 연결 → 입력값·제출/최근 검색 동작 유지

## 남은 것
- 서버 https://github.com/team-poem/poem-news/pull/14 선행 배포. 프런트는 서버 미배포·조회기록 없음에서 기존 기본 안내를 표시한다.
- dev 대상 PR 검토 및 머지. 운영 배포·운영 조회수 생성은 이번 작업에 포함하지 않는다.
