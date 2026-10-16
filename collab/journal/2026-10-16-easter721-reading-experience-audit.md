# codex/reading-experience · easter721 · 2026-10-16
- claim: collab/active/codex--reading-experience/claim.md

## 이벤트
- touching src/app/globals.css 간격·로딩·절제된 모션 개선을 위해 이 브랜치에서 수정 예정 → 겹치는 공통 스타일 작업 전 claim 확인.
- added collab/active/codex--reading-experience/spec-proposal.md dev a924bdd 기준 전체 화면 간격·검색/목록 무한 스크롤·스켈레톤/스피너 요구와 신규2개·기존7개 정확 테스트 이관 초안 → 사용자 승인 전 제품 코드 변경 없음.
- rule collab/active/codex--reading-experience/evidence/baseline/ Tailwind padding/gap 유틸은 정상이며 검색창36px/버튼44px·하단 탭 간격0px·추천 칩 내부 간격 미지정이 확인됨 → 전역 reset이나 임의 spacing 스케일 교체로 해결하지 말 것.

## 남은 것
- 정확 초안 승인 후 Sobaya 설치/approve/loop/full gate/독립 review/default build/typecheck·실제 Chrome 검증·dev 대상 PR.
- 기존113개 테스트 중7개는 제거 완료가 아니라 같은 이름·핵심 기대값을 유지하는 관찰자 트리거로 이관 예정. 신규2개 포함 최종115개.
- 승인 전 /tmp 복제본으로 테스트 실행·타입 검사 완료. RED 증거는 구현 완료/전체 테스트 통과가 아님.
- 원래 체크아웃의 사용자 next-env.d.ts 변경 유지. 제품 소스·기존 테스트·의존성/lock/API/harness 수정 없음.
- collab check가 오래된 동료 branch 대비 inherited report/harness 경로 겹침을 경고하나 origin/dev...HEAD 제품 diff는0이며 open PR 없음. 실제 동시 편집 충돌은 digest에서 없었음.
- GitHub 코멘트/태그/승인은 게시 전 사용자 문구 승인 필요. 프로덕션 제보 POST 금지.
