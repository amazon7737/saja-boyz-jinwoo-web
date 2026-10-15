# codex/recent-searches · easter721 · 2026-10-10
- claim: collab/active/codex--recent-searches/claim.md

## 이벤트
- added docs/map-api-contract.md 지도용 사건 식별·WGS84 위치·정확도/출처·누락·분류/상태·발생 시각과 조회 규약 확인 항목 정리 → 확정된 서버 스키마로 취급하지 말고 실제 명세와 예시를 공유할 것.
- ask @amazon docs/map-api-contract.md 서버 담당자와 지도용 사건 API 계약 및 응답 예시 확인 요청(GitHub 계정 amazon7737) → 기존 기사 키워드 검색 계약은 유지하며 좌표 없는 기사를 임의 위치에 표시하지 않을 것.
- added collab/active/codex--recent-searches/spec-proposal.md Figma 최근 검색 저장·재검색·개별 삭제 명세 초안 → 정확 테스트와 함께 사용자 승인 후 sobaya 구현으로 이어갈 것.
- added collab/active/codex--recent-searches/failed-test-proposal.md 실제 SearchPage 흐름의 신규 5개 테스트와 정확 헤더 초안 → 기존 40개 테스트·helpers·fixtures·명령을 유지할 것.
- added collab/active/codex--recent-searches/probe-result.md 초안 전체 타입 검사 통과와 개별 assertion RED 5건 → 승인 또는 구현 완료로 해석하지 말 것.

## 남은 것
- 정확 명세·헤더·5개 본문에 대한 사용자 승인. 아직 제품 구현이나 승인 기준 등록은 하지 않았다. install이 만든 루트 spec.md·failed-test.md는 템플릿이며 승인 뒤 정확 초안으로 설정한다.
- 승인 후 sobaya Astra 구현 루프, 전체 suite·gate·독립 리뷰·타입/빌드·실제 검색/저장/삭제/재방문·반응형 확인, 계획 보관·인수인계·push·dev 대상 PR과 amazon7737 리뷰 요청.
- GitHub 코멘트는 별도 사용자 승인 전 게시하지 않는다. 이번 서버 규약 요청은 협업 문서와 하네스 저널로 공유한다.
