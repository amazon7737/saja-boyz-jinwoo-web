# codex/brand-map-performance · easter721 · 2026-11-20
- claim: collab/active/codex--brand-map-performance/claim.md

## 이벤트
- changed src/proxy.ts src/app/archive/page.tsx 아카이브 문서의 최초 기사 조회 실패 시 재시도 가능한 503을 반환하고 정상 화면 전환을 유지한다 → 문서·RSC·재시도 동작과 빈 결과의 noindex를 함께 확인한다.
- added src/app/article-sitemap.xml/route.ts src/app/article-sitemap/[id]/route.ts 기사 사이트맵 인덱스와 100행 단위 분할 파일을 제공한다 → 오류는 503, 잘못된 주소는 404로 처리하며 기존 사이트맵을 유지한다.
- changed src/features/map/ui/map-home/map-home.tsx 지도 SDK 준비 전에도 받은 기사 카드를 실제 링크로 표시한다 → 지도 준비 후 기존 선택 시트와 로딩 UI를 유지한다.
- changed src/app/(browse)/@background/incidents/page.tsx 목록에 기사 아카이브와 서비스 안내 링크를 제공한다 → 사용 가능한 실제 링크와 키보드 탐색을 유지한다.
- added src/app/og/incidents/[id]/route.tsx 기사 제목·검증된 출처의 PNG 공유 카드를 제공한다 → 기사 상태·버전별 캐시와 렌더 오류 시 공통 이미지 대체를 유지한다.
- added public/llms.txt 서비스 안내와 공개 기사 경로를 제공한다 → 기존 안내의 사실과 링크를 변경할 때 함께 확인한다.

## 남은 것
- 아카이브 문서의 선행 확인 때문에 API 요청이 한 번 추가된다. 선행 확인 성공 직후 본 조회가 실패하면 200 오류 안내가 나오지만 noindex는 붙지 않는다.
- 기사 사이트맵은 offset 기준이라 새 기사 추가 중 조각 사이에 중복이나 누락이 발생할 수 있다. 고정 시점 커서나 전용 API가 제공되면 재검토한다.
- 기사 공유 이미지의 외부 글꼴 요청은 2초 후 공통 이미지로 대체하지만 내부 요청의 즉시 취소는 보장되지 않는다. 배포 환경에서 폰트·이미지 생성 및 플랫폼 캐시를 확인한다.
- 통합 테스트 348개, 포맷·린트 및 프로덕션 빌드를 확인했다. 린트에는 기존 경고 3개가 있다.
