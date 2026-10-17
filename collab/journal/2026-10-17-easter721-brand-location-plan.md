# codex/brand-location · easter721 · 2026-10-17
- claim: collab/active/codex--brand-location/claim.md

## 이벤트
- touching src/features/map/ui/map-home/map-home.tsx 첫 지도 진입의 자동 위치 조회·권한 복구와 복귀 뷰포트를 연결할 예정 → 같은 동작을 중복 구현하지 말고 현재 claim 범위를 참고할 것.
- touching src/features/map/model/map-viewport.ts 저장된 메모리 뷰포트와 최초 위치 흐름을 구분할 수 있도록 점검 중 → 저장소·서버 위치 수집 없이 기존 복귀 계약을 유지할 것.
- added collab/active/codex--brand-location/proposed-assets 기존 승인 로고 심벌 기반 SVG·ICO16/32/48·Apple180 아이콘 초안 → 별도 로고를 생성하지 말고 승인 후 정확 파일을 사용할 것.

## 남은 것
- 명세와 기존 위치 검사2개의 정확 교체안 승인 뒤 소바야 구현·전체121개 회귀·실제 브라우저/아이콘 검증·dev PR까지 진행한다. 현재 제품 코드와 원본 테스트는 수정하지 않았다.
- 초안은 포맷·린트·타입 통과, 검증용 probe에서 기존 SDK4개PASS/자동 위치2개만RED. 임시 probe 테스트는 제거했다.
- 원본 dev의 next-env.d.ts 수정과 이전 승인 브랜치를 보존한다. 패키지·잠금 파일·하네스 변경 없음.
