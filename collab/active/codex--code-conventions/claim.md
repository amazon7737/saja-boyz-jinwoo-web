branch: codex/code-conventions
owner: easter721
started: 2026-10-11
status: done
goal: refactor(frontend): 코드 작성 컨벤션과 가독성 통일
next: PR #13의 추가 CI 결과 확인과 amazon7737 재리뷰 후 dev에 squash merge.
base: dev
---

## 범위
- 제품 TypeScript/TSX의 import·타입·상수·함수 구획과 함수 내부 흐름의 공백을 정리한다. 복잡한 레이아웃 조건은 의미 있는 이름으로 표현한다.
- 컨벤션 문서와 기존 ESLint의 자동 검사 가능한 규칙을 연결한다. 새 패키지·추상화·폴더 이동·제품 기능 변경은 하지 않는다.
- 기존 테스트·fixture·Test 명령은 그대로 유지한다. 사용자가 이번 컨벤션 정리와 PR 작성까지 승인했으며 PR은 dev 대상이다. GitHub 코멘트·머지는 별도 승인 전 하지 않는다.

## CI 피드백 반영 범위
- 사용자가 PR #13에 CI 컨벤션 검사 추가까지 승인했다. app-check workflow에 별도 검사 job을 추가하고 컨벤션 문서에 검사 방법을 명시한다. 기존 필수 검사·제품 코드·테스트·의존성은 유지한다.
