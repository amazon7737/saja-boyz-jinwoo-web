# codex/search-discovery · easter721 · 2026-10-16
- claim: collab/active/codex--search-discovery/claim.md

## 이벤트
- changed src/app/layout.tsx 공통 제목·메타데이터와 사용자 제공 Google 소유권 태그 추가 → 배포 후 Search Console HTML 태그 확인을 실행하고 수동 중복 태그를 추가하지 말 것.
- added src/app/site-metadata.ts 운영 origin·브랜드·공통 PNG·페이지별 메타데이터 구성 제공 → 새 공개 페이지도 운영 canonical과 공유 정보를 일관되게 설정할 것.
- changed src/app/incidents/[id]/page.tsx 요청 단위 조회 공유·기사별 공유 정보·안전한 WebPage/citation 추가 → 기존 no-store·5초 제한·원문 검증·notFound와 공유 흐름을 유지할 것.
- added src/app/archive/page.tsx 페이지별 실제 기사 링크로 과거 수집 경로 제공 → 기존 /incidents 무한 스크롤은 유지하고 raw offset/total을 고유 사건 수로 해석하지 말 것.
- added src/app/robots.ts·src/app/sitemap.ts 공개 수집·최근20행 기반 bounded sitemap 제공 → 전체 기사 sitemap으로 오해하지 말고 전수/커서 API는 서버 후속으로 다룰 것.
- added src/app/about/page.tsx 지도 대표 좌표·기사 발행일·AI 이미지·원문에 대한 실제 설명 제공 → 확인되지 않은 상태·현장 위치·발생 시각을 임의로 주장하지 말 것.
- done src/app/layout.tsx 허브 편집과 소바야 구현·검증 종료, source HEAD 05c26e8 → 최종 계획 보관 커밋 이후 이 브랜치에서 소바야를 다시 실행하지 말 것.

## 남은 것
- dev 대상 PR의 팀 리뷰·머지, 별도 dev→main 배포 후 Search Console 소유권 확인과 sitemap 제출은 사용자/릴리스 담당자가 진행한다. 코멘트·멘션·승인·머지는 수행하지 않았다.
- 기존 린트 경고3개 유지. 사이트맵은 최근 데이터만, offset 아카이브는 새 수집 시 위치가 바뀔 수 있다. docs/search-discovery.md와 evidence/final/에 검증·한계를 기록했다.
- 원본 dev 체크아웃의 기존 next-env.d.ts 변경과 회사 프로젝트는 건드리지 않았다.
