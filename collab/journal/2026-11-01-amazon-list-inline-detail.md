# codex/list-inline-detail · amazon · 2026-11-01
- claim: collab/active/codex--list-inline-detail/claim.md

## 이벤트
- changed src/features/article-detail/ui/article-route-host/article-route-host.tsx 목록에서 연 상세를 AppShell main 안에 렌더링하고 기존 목록은 숨긴 채 보존 → 목록을 inert 처리하지 말고 페이지·스크롤·포커스 복귀 유지
- added src/features/article-detail/ui/detail-sheet/detail-inline.tsx 목록 상세의 일반 본문 프레임·목록 복귀·Escape 제공 → 목록 상세에 dialog/body lock/focus trap/드래그 핸들을 다시 넣지 말 것
- changed src/features/article-detail/ui/detail-sheet/detail-sheet.tsx 목록의 intercepted 상세만 inline으로 분기 → 지도·검색·보관함·직접 유입과 지역 선택의 기존 시트 수명주기 유지
- changed docs/ui-contract.md 사용자 요청에 따라 목록 진입 상세를 시트 정책의 예외로 기록 → 과거 보관 명세의 모든 목록 시트 문장보다 현재 계약 우선

## 남은 것
- dev 대상 PR 검토 및 머지. 서버 API와 직접 공유 URL은 변경하지 않음. 운영 배포는 이번 요청 범위에 포함하지 않음.
