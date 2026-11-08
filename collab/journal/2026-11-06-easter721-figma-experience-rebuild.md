# codex/figma-experience-rebuild · easter721 · 2026-11-06
- claim: collab/active/codex--figma-experience-rebuild/claim.md

## 이벤트
- changed src/proxy.ts 기사 문서 GET·HEAD 사전 조회의 HTTP 오류·연결 실패·타임아웃은 503 오류 경로로 연결하고 실제 404 및 RSC 이동은 기존 분기를 유지함 → 상세 진입을 변경할 때 상태 코드와 원래 URL 재시도를 함께 확인할 것.
- added src/app/article-unavailable/[id]/route.ts 직접 진입 장애 시 독립 503 HTML과 Retry-After·no-store를 반환함 → 오류 UI를 변경할 때 JavaScript 없는 복구와 내부 오류 비노출을 유지할 것.
- added public/article-detail/error-retry.js 503 문서의 재시도 대기·중복 방지와 취소 후 복구를 제공함 → 수정키 새 탭과 브라우저 기본 링크 동작을 유지할 것.

## 남은 것
- Proxy 사전 조회가 200이지만 본문이 유효하지 않거나 이후 별도 상세 조회만 실패하면 여전히 200·noindex 오류 화면이 될 수 있다. 두 조회를 안전하게 단일화하거나 최종 렌더 응답의 상태를 조정하는 설계가 필요하다.
- 직접 진입 503은 별도 HTML/CSS와 전체 문서 탐색 재시도를 사용한다. 앱 내부 RSC의 React 오류 화면과 동일한 기반은 아니며 실제 Vercel 환경에서 상태·CSP·자산과 모바일 접근성을 확인해야 한다.
- Navigation API가 없는 브라우저는 영구 잠김을 피하려고 30초 후 재시도를 다시 허용한다. 30초를 넘는 정상 대기에서는 중복 차단도 풀리는 점을 고려해야 한다.
- 운영 백엔드의 인기순·단건 좌표·카테고리 계약 및 PR의 나머지 피그마 화면 대조는 앞선 저널의 미완료 항목을 따른다.
