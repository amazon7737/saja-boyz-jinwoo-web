# codex/code-conventions · easter721 · 2026-10-11
- claim: collab/active/codex--code-conventions/claim.md

## 이벤트
- added .github/workflows/app-check.yml 별도 코드 컨벤션 검사 job에서 기존 lint·format 검사와 컨벤션 문서·workflow 포맷 검사를 실행함 → PR에서 독립 체크 결과를 확인할 것. 기존 필수 app job 검사도 유지한다.
- rule docs/code-conventions.md CI 검사 범위와 로컬 재현 명령을 명시함 → 코드 컨벤션 위반은 수정한 뒤 재검사하며 의미상 가독성은 리뷰로 확인할 것.
- done CI 후속 변경은 workflow와 문서에 한정했고 로컬 lint·format:check 및 추가 Prettier 검사가 통과함 → 제품 코드·테스트·의존성 변경이 없으며 GitHub 실행 결과는 PR에서 확인할 것.

## 남은 것
- PR #13의 새 HEAD에 대한 GitHub CI 실행과 amazon7737 재리뷰. 승인 전 코멘트 게시와 머지는 하지 않는다.
