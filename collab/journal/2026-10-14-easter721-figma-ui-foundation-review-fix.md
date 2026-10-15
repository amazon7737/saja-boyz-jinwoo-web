# codex/figma-ui-foundation 리뷰 수정 · easter721 · 2026-10-14
- claim: collab/active/codex--figma-ui-foundation/claim.md

## 이벤트
- added src/app/incidents/[id]/detail-navigation.tsx 정상·API 오류가 같은 전용 목록/지도 탐색 사용 → 상세의 복귀 링크와 접근성 이름을 유지할 것
- changed src/app/incidents/[id]/page.tsx API 오류에서도 복귀 탐색·안내·현재 기사 재시도를 함께 제공 → 오류 화면에 공통 검색/주 메뉴를 되살리지 말 것
- added src/app/incidents/article-detail-error-navigation.test.ts 실제 상세+AppShell 정상/오류6종 회귀 → 기존101개와 신규1개를 함께 실행할 것
- supersedes collab/journal/2026-10-14-easter721-figma-ui-foundation.md 공통 기반 검증101개 이후 상세 복귀 회귀 수정과 신규1개를 반영하여 전체102개로 갱신 → 최신 검증은 review-error-navigation 산출물을 확인할 것
- done codex/figma-ui-foundation PR19 코멘트의 상세 API 오류 복귀 회귀를 Sobaya 검증 소스 그대로 반영 → PR19의 새 CI/리뷰에서 확인할 것

## 검증과 남은 것

## 남은 것
- Sobaya83af28d baseline 3568b013b45f4ac53512c72fe98491c24ca01f9c에서 신규1개를 정확히 승인받고 RED/GREEN102개·최종 전체 gate·새 독립 리뷰를 완료했다. 검증 소스 HEAD d974e9b34909e9f806fb9d39a5b76ecfdf185ccd; 원 PR 반영 코드의 src/public/docs/의존성/AGENTS 트리가 동일함을 integration-proof.json으로 확인했다.
- 기본 production build와 Chrome의 전용3018 포트·로컬 모의 API에서 500 직접 진입4화면 폭, 요청 실패·timeout·JSON·계약·설정 오류, 목록/지도 경로 복귀 클릭·동일 주소 재시도 성공을 검증했다. 기존3000 개발 서버와 next-env.d.ts의 사전 변경은 보존했다.
- 기존 테스트·mock·fixture·테스트 명령·API5초 제한·404·이미지·공유는 변경하지 않았다. 원 PR에서 Sobaya를 다시 실행하거나 이전 승인/보관 계획을 재작성하지 않았다.
- GitHub 코멘트는 게시하지 않고 사용자에게 초안만 보여준다. 머지·배포·운영 POST도 수행하지 않는다. 전체 디자인 후속 범위와 메뉴 대비 권고는 이번 오류 수정에 포함하지 않는다.
- 커밋·푸시 후 GitHub CI를 확인하고 PR19에서 재검토받는다.
