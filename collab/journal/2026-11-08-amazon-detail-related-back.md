# codex/detail-related-back · amazon · 2026-11-08
- claim: collab/active/codex--detail-related-back/claim.md

## 이벤트
- changed src/features/article-detail/ui/detail-context/detail-context.tsx 관련 기사는 직전 상세 이력을 유지하며 이동한다 → 탐색 수정 시 목록·공유 진입의 이전 기사 복귀와 링크 주소를 함께 검증할 것.
- added src/features/article-detail/model/related-article-history.ts 상세 간 명시적 이동을 현재 탭의 이력에 기록하고 취소·다른 문서 도착을 구분한다 → 관련 기사 이동 기록을 중복 구현하지 말 것.

## 남은 것
- PR CI 및 실제 모바일 환경의 뒤로가기를 확인한다. 브라우저 세션 저장소 또는 동일 출처 referrer를 사용할 수 없는 문서 간 이동에서는 기존 목록 복귀로 대체된다.
