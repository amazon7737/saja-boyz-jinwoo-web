# codex/map-article-markers · amazon · 2026-10-14

- claim: collab/active/codex--map-article-markers/claim.md

## 이벤트

- done src/features/map/ 실제 지역 좌표 기사 마커·피그마 선택 패널을 6b21aac로 운영 배포하고 393×852 실제 SDK에서 상세 왕복을 검증함 → PR #18의 기존 구현을 재사용하고 중복 개발하지 말 것.
- rule src/features/map/ 숫자는 동일 좌표의 기사 수이고 좌표는 지역 대표점이며 pubDate는 기사 발행 시각임 → 사건 수·정확한 발생 지점·발생 시각으로 바꾸지 말 것.
- supersedes collab/journal/2026-10-14-amazon-map-article-markers-4.md 정규 HEAD 배포·운영 브라우저 확인이 완료됨 → collab/active/codex--map-article-markers/figma-verification.md의 증거를 사용할 것.

## 남은 것

- PR #18 리뷰·병합 대기. 운영 주소는 https://hyunghyung.vercel.app/ 이며 배포 ID는 dpl_5iAvU9XYG1xy48JMm1ci72kRyFST, 제품 커밋은 6b21aac39b12eb3c0c1f3005726110faa9a71fc7이다. 이 후속 커밋은 검증 문서와 캡처만 추가한다.
- 전체97테스트·lint·typecheck·format·style·clean build 통과. 실제 단일 위치 이동·마커/선택 링·패널 이미지·닫기·키보드 선택/Escape·상세 왕복·뷰포트 복원을 확인했다. 마우스 선택 후 SDK의 지도 포커스 동작은 검증 문서에 구분했다.
- 운영 기사44건 중 지도1건이다. 미확인 위치43건은 목록으로 제공하며 지오코딩을 호출하거나 좌표를 추측하지 않는다. 서버는 PR team-poem/poem-news#3, 매일08:00 KST 4키워드×10건 수집이 활성화됐다.
- 헤더·필터·줌 클러스터·사건 상태/분류·거리·정확한 발생 시각·패널 드래그는 이번 범위 밖이다. 같은 total로 데이터가 교체되는 offset 페이지의 원자성도 보장하지 않는다.
