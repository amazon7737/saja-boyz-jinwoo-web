# codex/keyword-search · easter721 · 2026-10-08
- claim: collab/active/codex--keyword-search/claim.md

## 이벤트
- touching src/app/search/ 및 src/features/search/ui/ 추천 키워드 전환의 pending 누락을 실제 브라우저로 재현함 → 작은 client 대기 표시와 실제 Next 브라우저 회귀만 후속 작업.
- added collab/active/codex--keyword-search/review-pending/ 명세·브라우저 테스트1개·assertion RED 기록 준비 → 기존33개 테스트와 API 계약을 유지하며 정확 초안 승인 후 sobaya 구현.

## 남은 것
- 정확 spec-proposal.md 및 failed-test-proposal.md와 playwright-core 1.62.1 개발 의존성 추가 승인 대기. 제품 코드 변경 없음.
- 기존 계획을 같은 브랜치 루트로 복원했다. 승인 후 항목 추가·새 baseline 승인·구현·전체34 테스트·브라우저·gate/리뷰·계획 보관·push로 진행.
- probe의 ignored node_modules 임시 도구 연결은 승인 후 정확 pnpm 개발 의존성으로 교체한다. 테스트에 로컬 런타임 경로 없음.
- GitHub 코멘트는 사용자 별도 승인 후 게시.
