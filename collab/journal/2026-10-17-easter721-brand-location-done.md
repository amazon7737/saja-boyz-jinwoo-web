# codex/brand-location · easter721 · 2026-10-17
- claim: collab/active/codex--brand-location/claim.md

## 이벤트
- changed src/features/map/ui/map-home/map-home.tsx 첫 진입 위치 요청을 SDK와 병행하며 StrictMode 중복·드래그 후 자동 재이동을 방지한다 → 위치 버튼을 별도 최초 진입 트리거로 연결하지 말 것.
- changed src/features/map/model/map-viewport.ts hasMapViewport로 메모리 복귀 위치를 우선한다 → 좌표 영구 저장 없이 기존 복귀 계약을 사용할 것.
- changed src/features/map/ui/map-home/map-home.tsx SDK 스크립트의 실제 로드 완료만 재사용하며 위치/기사 안내를 세로 배치한다 → SDK 로딩 중인 script 존재만으로 초기화하지 말 것.
- added src/app/icon.svg 승인 심벌 기반 SVG·ICO16/32/48·Apple180px을 파일 메타데이터로 제공한다 → 수동 중복 icon 링크를 추가하지 말 것.
- done codex/brand-location 전체121개·빌드·브라우저14개·독립 리뷰 통과 → dev PR에서 검토 가능.

## 남은 것
- dev PR 타인 리뷰·머지·운영 배포는 별도 절차. 운영 반영 후 아이콘 캐시 및 실제 모바일 권한 UI 확인 가능.
- 의존성·하네스·API·기존 SEO 계약은 변경하지 않았다.
