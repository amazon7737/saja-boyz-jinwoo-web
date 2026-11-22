# codex/brand-map-performance · easter721 · 2026-11-20
- claim: collab/active/codex--brand-map-performance/claim.md

## 이벤트
- changed public/brand/hyunghyung.svg public/brand/symbol.svg Figma의 워드마크와 심벌을 헤더·앱 아이콘에 적용했다 → 비율과 원본을 유지하고 생성 스크립트로 파생 아이콘을 갱신한다.
- changed src/app/site-metadata.ts 공유 이미지는 Figma 기반 /og/site-v2.png를 사용한다 → 홈과 기사 공유 메타데이터를 함께 유지하며 이전 /og/site.png 주소도 보존한다.
- changed src/features/article-detail/ui/article-route-host/article-route-host.tsx 지도 방문 이후 목록·검색 전환에서도 인스턴스를 유지하고 미방문 화면에서는 지도 코드를 지연 로딩한다 → 직접 진입·포커스·상세 맥락·서버 렌더링을 함께 확인한다.
- changed src/features/map/ui/map-home/map-home.tsx 지도 복귀 시 뷰포트와 기간 기준을 갱신하고 크기 불변 시 중복 처리를 건너뛴다 → 숨김 복귀와 실제 크기 변경은 계속 갱신한다.
- changed src/features/article-detail/model/detail-location-context.tsx 상세 위치 그룹은 기사 배열이나 ID 변경 시 다시 계산한다 → 시트 높이 변경만으로 불필요하게 재계산하지 않는다.

## 남은 것
- Figma 앱이 재연결 경고를 표시해 추출한 현재 화면이 서버의 최신 버전과 동기화됐는지는 확인하지 못했다. 로고·심벌·썸네일 원본 노드는 각각 805:235, 805:349, 805:232다.
- 카카오톡 등에서 이전 페이지 메타데이터가 캐시됐다면 배포 후 공유 미리보기와 캐시 초기화를 확인한다.
- 통합 테스트 321개와 빌드·포맷·린트가 통과했다. 린트에는 기존 경고 3개가 있다. 지도 생성 횟수 비교는 테스트용 Naver SDK 기준이며 실제 타일 비용은 측정하지 않았다.
