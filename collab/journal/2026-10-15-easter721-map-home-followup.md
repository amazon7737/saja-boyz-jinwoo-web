# codex/figma-map-home · easter721 · 2026-10-15
- claim: collab/active/codex--figma-map-home/claim.md

## 이벤트
- supersedes src/features/map/model 이전의 줌 클러스터 금지 문구는 화면 표시 묶음에 적용하지 않는다 → 원본 지역 식별·대표 좌표는 유지하고 화면에서 겹친 원만 별도로 합칠 것.
- added src/features/map/model/map-display-groups.ts 원본 label+좌표 지역 그룹과 고유 article_id를 보존한 화면 투영 집계다 → 연쇄 겹침·반경 증가·원본 대표점과 최소48px 다지역 묶음을 유지할 것.
- changed src/features/map/ui/map-home/map-home.tsx 줌/idle/resize/기간 재집계와 동일 묶음 DOM·선택 유지, 변경 시 오래된 시트·콜백 해제를 적용했다 → SDK/카메라 자동 재설정 없이 선택·복귀 동선을 보존할 것.
- changed src/features/search/ui/search-result-card/search-result-card.tsx 제목·설명 강조는 대소문자를 무시하는 리터럴 매칭이고 원문 표기를 유지한다 → 소문자 변환 결과나 검색어 자체를 강조 문자열로 출력하지 말 것.
- done codex/figma-map-home 소스 6a2640113347a3aa244eea28c5ec90a064e7f2ba에서113개 전체 gate·새 독립 리뷰·타입/기본 빌드·실제 SDK/운영GET 검증이 통과했다 → followup-review.json과 followup-verification.md 및 후속 보관 plan을 참조할 것.

## 남은 것
- dev 대상 PR23 리뷰·머지. GitHub 코멘트는 사용자에게 초안만 제시하며 승인 전 게시하지 않는다.
- API 미제공 분류·상태·타임라인 등 계약과 실기기 OS 공유창/키보드/safe-area는 이전 남은 범위를 유지한다.
- 원격의 dev 동기화21920e6을 보존했으며 PR22 제보 제품 파일은 origin/dev와 동일하다.
