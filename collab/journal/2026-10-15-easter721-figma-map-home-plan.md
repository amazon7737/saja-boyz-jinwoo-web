# 지도 홈 Figma 구현 준비

## 이벤트
- touching src/features/map/ dev119172a 기반 codex/figma-map-home에서 고정 지역 숫자 원·기사 carousel·필터 구현을 선언함 → 지도 UI·필터 동시 수정 전 이 claim을 확인할 것
- rule collab/active/codex--figma-map-home/all-screen-gaps.md 검색·공유·목록·선택 필터·제보 원본 모두 개인 Figma MCP로 정상 조회됨 → 연결 장애로 판단하지 말고 화면별 남은 차이와 실제 데이터 계약을 구분할 것
- ask @amazon docs/map-api-contract.md 지도 카테고리·상태 선택과 카드 배지에 필요한 안정적 region_id/대표점·category/status enum/unknown·인기 정렬 계약 문서화 필요. 현재 OpenAPI/실제82건에는 해당 분류·상태 없음 → 필드 제공 여부와 계약 확정 후 공유할 것

## 남은 것
- 명세·신규7개 테스트·기존3개 테스트의 정확 변경 초안 승인 대기. 신규 probe7개 RED, 기존102개 PASS. 제품 소스는 미변경.
- 승인 뒤 baseline을 커밋해 Sobaya 승인·순차 구현·전체 gate·독립 리뷰·Naver SDK 실제 브라우저/Figma 비교·dev PR.
- 기간은 실제 발행일 필터. 분류·진행 상태는 미제공 사유/선택불가를 보이는 안이며 실제 선택45:3317과 같다고 주장하지 않음.
- 제보 본문은 amazon7737의 report-figma-polish 영역으로 이번 브랜치에서 만지지 않음. GitHub 코멘트는 사용자가 문구를 먼저 승인해야 게시.
