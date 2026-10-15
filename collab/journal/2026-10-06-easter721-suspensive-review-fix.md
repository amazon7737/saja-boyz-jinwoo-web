# codex/suspensive-error-boundaries · easter721 · 2026-10-06
- claim: collab/active/codex--suspensive-error-boundaries/claim.md

## 이벤트
- changed src/components/errors/feature-error-boundary.tsx 분류 문구 featureErrorMessages를 RouteError와 공유함 → 유형별 안내 문구는 이 매핑에서 유지.
- changed src/app/error.tsx Next가 먼저 잡은 실제 클라이언트 FeatureError도 유형별 안내·안전한 로그로 연결하고 unknown 입력을 좁힘 → 서버 오류의 원래 클래스 보존을 가정하지 말고 기존 retry/reset 계약 유지.
- added src/components/errors/next-error-boundary.test.ts 실제 Next 경계 순서의 분류·복구 및 서버 오류 호환 회귀 검증 → 오류 경계 변경 시 이 테스트를 유지.
- added collab/active/codex--suspensive-error-boundaries/evidence/review-fix 추가 경계 없는 실제 Next 페이지 검증 fixture·재현 스크립트·결과 → 기존 Fault 바깥 추가 경계 QA 대신 이 경로로 페이지 통합 동작을 확인.
- reply @amazon PR #5의 경계 연결과 QA 지적을 반영함 → 최신 리비전을 재리뷰.

## 남은 것
- PR #5 아마존 재리뷰·승인 후 dev squash merge와 브랜치 삭제.
- 폴더 구조 정리와 Tailwind 전환 리팩터링은 PR #5 머지 이후 별도 dev 기반 브랜치에서 진행. 이번 수정에는 포함하지 않음.
