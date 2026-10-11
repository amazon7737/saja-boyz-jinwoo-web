# 코드 작성 컨벤션 통일

## 이벤트

- rule docs/code-conventions.md 제품 코드의 import·선언·처리 구획과 이름·JSX 책임 기준을 문서화함 → PR 머지 후 새 제품 코드도 이 기준과 기존 컴포넌트 책임을 따를 것.
- changed eslint.config.mjs 제품 TS/TSX에 import/order와 구획 공백 검사를 추가함 → 기존 Next/TS 검사와 함께 실행되며 승인 테스트에는 새 스타일 규칙을 적용하지 말 것.
- changed src/app/layout.tsx metadata 구획과 중첩 제목 객체를 읽기 좋게 정리함 → 값·라우트·루트 레이아웃 동작은 동일하다.
- changed src/features/incidents/model/types.ts 타입 선언 사이 공백만 정리함 → 타입 이름·필드·호출 계약은 변경하지 않았다.
- changed src/components/layout/app-shell/app-shell.tsx 경로별 헤더 노출과 클래스 선택을 이름 있는 변수로 표현함 → DOM·클래스·링크·오류 경계 위치는 유지했다.
- done collab/active/codex--code-conventions/verification.md 기존 61개 테스트 전후 gate·AST 보존·타입·빌드·18쌍 Chrome 비교·독립 리뷰 완료 → 리뷰 HEAD f3c4a8c72e8e2e2d7544ae524c34097a410d8f63와 보관된 명세·검증 자료를 확인할 것.

## 남은 것

- dev 대상 PR의 CI·amazon7737 리뷰 후 squash merge와 브랜치 삭제. 이 작업에서 GitHub 코멘트나 병합은 수행하지 않는다.
- 향후 ESLint 메이저 업그레이드 시 내장 공백 규칙 대체를 별도 검토한다. 의미상 구획은 자동 검사만으로 보장하지 않으므로 컨벤션 문서로 리뷰한다.
