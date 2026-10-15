# codex/figma-map-home · easter721 · 2026-10-15
- claim: collab/active/codex--figma-map-home/claim.md

## 이벤트
- added src/features/map/model 지역 그룹은 고유 article_id와 서버 region label+대표 좌표를 사용한다 → 줌 클러스터나 임의 구/동 병합으로 바꾸지 말 것.
- changed src/features/map/ui 지도 숫자 원·실제 기사 carousel·발행일 기간 필터·밝은 전체 필터가 연결됐다 → SDK/카메라/출처와 작은 화면 배치를 유지할 것.
- changed src/app/globals.css 전용 ui-클래스에120~190ms 모션을 추가했다 → 전역 transition을 씌우지 말고 reduced-motion과 disabled 제외를 유지할 것.
- added src/features/search/ui/search-result-card 검색 전용 텍스트 카드와 안전한 강조를 사용한다 → GET/최근 검색/더 보기/원문 계약을 유지할 것.
- changed src/app/search/page.tsx native 검색 지우기를 복구했다 → URL keyword가 없는 제출 전 입력의 지우기도 숨기지 말 것.
- changed src/features/article-list/ui 목록 정보 계층·80px 이미지/AI 표기와 상세190px 사진/본문/공유를 정리했다 → 이미지 실패·실제 발행일·복귀/공유 복구를 유지할 것.
- rule docs/map-api-contract.md category/status/popularity·주소 매치·타임라인·인용수는 서버 미제공이다 → 예시 사건 메타데이터를 생성해 일치로 보고하지 말 것.
- reply @amazon 서버 region 정확도와 기상청 대표점 출처를 그대로 소비했다 → 실제 발생 지점/주소 정밀도로 재분류하지 않았음.
- ask @amazon docs/map-api-contract.md region_id·분류/상태 enum·인기/정렬·상세 타임라인/위치 계약의 제공 여부를 문서화해 주세요 → 실제 필터/배지 연결에 규약 확인이 필요함.
- done codex/figma-map-home 소스 89a013fc362af218903643ccc64d6652c1c20632에서109개 전체 gate·독립 리뷰·기본 빌드·실제 Chrome 검증이 통과했다 → final-review.json과 기능별 보관 plan을 참조할 것.

## 남은 것
- dev 대상 PR 리뷰·병합. GitHub 코멘트·태그·승인·병합은 사용자 요청 없이 실행하지 않았다.
- API 미제공 분류/상태/인기·주소 매치·타임라인/발생 위치/인용수 계약. 전체 제품의 Figma100% 일치를 주장하지 않는다.
- 제보 디자인은 amazon7737의 별도 PR22이며 제품 코드가 겹치지 않는다. 실기기 OS 공유창/키보드/safe-area 검증은 별도다.
