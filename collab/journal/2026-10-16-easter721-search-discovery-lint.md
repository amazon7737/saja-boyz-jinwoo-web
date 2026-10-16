# 검색·공유 기반 작업 — 승인 린트 수정

## 이벤트
- changed src/app/layout.tsx root metadataBase·브랜드 제목·OG/Twitter 공유 이미지 기반 추가, 렌더 UI는 동일 → 후속 화면 metadata에서 상세 canonical을 홈으로 상속하지 말 것.
- added src/app/site-metadata.ts 운영 origin·브랜드·공유 이미지 상수 → 새 metadata는 이 상수를 사용하고 임의 Host/프리뷰 주소를 정규 URL로 사용하지 말 것.
- rule collab/active/codex--search-discovery/lint-fix-approval.md 사용자 승인으로 테스트 module 변수명만 routeModule로 변경 → 기대값/fixture/전체 테스트 명령은 유지.

## 남은 것
- 첫 metadata 구현은 소바야 RED 뒤 진행됐으나 승인 테스트의 Next lint 오류에서 전체 checkpoint가 중단됐다. 사용자 정확 수정 승인으로 새 baseline을 등록하고 전체 검증을 이어간다.
- source/test 변경을 기존 dev에 통합한 것으로 보지 말 것. PR/운영 배포 전이며 기사별 metadata·크롤링/아카이브·서비스 설명·최종 검증은 남아 있다.
