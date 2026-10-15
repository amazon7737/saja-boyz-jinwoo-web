# codex/frontend-refactor · easter721 · 2026-10-06
- claim: collab/active/codex--frontend-refactor/claim.md

## 이벤트
- migrated src/features/article-list/ api/model/ui 구조와 컴포넌트별 폴더로 이동 → ArticleCollectionItem은 model/article.types, ArticleList는 ui/article-list/article-list에서 import할 것.
- migrated src/features/incidents/model/ 기존 사건 타입·라벨·필터와 테스트 이동 → 새 model 경로로 import할 것. 데이터 의미·필터 동작은 유지.
- migrated src/features/incident-list/ui/incident-list/ 기존 사건 목록 이동 → 신규 경로 사용. 기사 모델과 강제 통합하지 않음.
- migrated src/components/layout/ 컴포넌트별 폴더로 이동 → app-shell/app-shell, foundation-panel/foundation-panel을 참조.
- migrated src/components/errors/model/feature-error.ts 오류 클래스·문구 분리 → 신규 호출부는 model에서 import. 경계는 feature-error-boundary/feature-error-boundary에 있으며 기존 클래스 재수출을 유지.
- dep package.json Tailwind/postcss 4.3.3 및 postcss 8.5.29 추가 → pnpm install --frozen-lockfile 후 사용. Next/React/Suspensive 버전은 유지.
- rule src/app/globals.css Tailwind theme/utilities 적용, Preflight 제외, 기본 스타일은 base layer → 컴포넌트별 클래스와 기존 디자인 토큰 사용. 전역 h1/p 스타일에 의존하지 말 것.
- changed harness/config.sh 공용 사건 타입 HOTSPOTS 경로 이동을 반영 → 동료 편집 차단 대상은 새 model/types.ts.
- added docs/architecture.md 현재 구조·스타일·검증 운영 기준 갱신 → feature 내부 api/model/ui 원칙을 따르고 불필요한 공통 계층은 추가하지 말 것.
- done collab/active/codex--frontend-refactor/verification.md 전체 28테스트·형식·린트·타입·빌드·실브라우저 전후 비교·독립 리뷰 완료 → dev PR에서 외부 리뷰 필요.

## 남은 것
- dev PR 외부 리뷰와 승인 후 squash merge. 자동 머지는 하지 않음.
- docs/news-api-contract.md 요청에 대한 amazon의 정식 명세 링크·규약 확인 답변 필요. 기존 ask 저널을 참조. 실제 서버 계약 확정이나 API 동작 변경은 이번 완료 범위가 아님.
