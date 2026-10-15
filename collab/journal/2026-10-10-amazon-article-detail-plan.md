# codex/article-detail · amazon · 2026-10-10
- claim: collab/active/codex--article-detail/claim.md

## 이벤트
- added collab/active/codex--article-detail/next-steps.md 최신 dev에서 기사 단건 API → 상세 화면 → 목록·검색 진입/공유 순서를 정리함 → 상세 선행 API는 아직 미구현이며 새 경로를 사용 가능한 것으로 간주하지 말 것.
- rule src/app/incidents/[id]/ 현재 항상 notFound이며 API에도 기사 ID 단건 조회가 없음 → 목록의 첫 20건만 뒤져 상세를 구현하거나 기사 description을 전문으로 표시하지 말 것.

## 남은 것
- 별도 Go 저장소 poem-news-collector의 codex/article-detail-api 작업 공간에 계약·실행 테스트 5개·한글 설명 검토본·probe 근거를 준비했다. 각 초안은 현재 미구현 경로 때문에 assertion RED이며 기존 서버 race suite와 vet는 통과했다. 제품 코드는 변경하지 않았다.
- 사용자에게 정확한 API 계약과 실행 테스트 승인을 받은 뒤 선행 API를 구현·검증한다. 이어 Figma 상세 노드 확인과 프런트 화면 테스트 초안을 준비한다.
- 프런트 의존성은 Node 24·고정 lockfile로 설치했고 작업 선언 커밋의 format/lint가 통과했다. 프런트 소스가 dev와 같아 이번 문서 작업으로 전체 브라우저 suite를 반복하지 않았다.
- 기존 지도 인증 실패 리뷰 사항은 별도이며 이 브랜치에서 지도 코드를 수정하지 않았다.
- 기존 API 규약 문서 전체 재작성 요청은 사용자가 면제한 사항이다. 이번에는 새 단건 API에 필요한 계약만 제안한다.
