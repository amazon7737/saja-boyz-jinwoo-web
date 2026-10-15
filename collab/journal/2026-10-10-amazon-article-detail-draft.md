# codex/article-detail · amazon · 2026-10-10

- claim: collab/active/codex--article-detail/claim.md

## 이벤트

- added docs/drafts/article-detail/ 기사 상세·목록/검색 진입·기본 공유/링크 복사 명세와 정확한 테스트 검토본을 준비함 → 승인 후 이 브랜치에서 구현하며 현재 제품 코드는 변경하지 않음.
- changed collab/active/codex--article-detail/next-steps.md 선행 GET /news/{article_id} API는 Go 527532c로 OCI 배포 완료했으며 실제 응답을 재확인함 → 목록과 동일한 article_id·article·image_status·image_url을 단건 조회에 사용할 것.
- touching src/features/article-list/ui/article-card/article-card.tsx 승인 뒤 제목의 내부 상세 링크를 추가할 예정 → 검색 페이지·최근 검색어·공유 fetch-articles.ts는 이번 작업에서 수정하지 않음.

## 남은 것

- 정확한 신규 8개 테스트, 기존 4개 대체안, 새 명세 등록에 대한 사용자 검토가 필요하다. 제품 작업·검증 완료 후 dev 대상 PR 생성은 이미 요청받았다.
- 기존 테스트는 상세 링크 금지와 첫 링크가 원문이라는 과거 가정을 포함한다. 이를 안전하게 대체하는 정확한 패치를 준비했으며 아직 실제 파일에 적용하지 않았다.
- 전체 기존 테스트 40개 PASS. 신규 probe 8개 RED, 대체안 probe 4개 GREEN. 독립 초안 리뷰에서 지적한 타입·안전 URL·클립보드 완료 시점·중첩 링크 검증을 반영했다.
- 완료 gate·독립 구현 리뷰·PR 생성은 아직 하지 않았다. 초안 결과를 제품 완료로 간주하지 않는다.
