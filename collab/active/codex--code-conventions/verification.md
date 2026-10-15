# 코드 작성 컨벤션 검증

2026-10-11 · 제품·문서·설정 최종 gate 및 독립 리뷰 HEAD `f3c4a8c72e8e2e2d7544ae524c34097a410d8f63`.

## 검증 결과

- 기존 dev의 전체 61개 테스트를 변경 전 Sobaya gate와 변경 후 Sobaya review의 gate에서 실행해 통과했다. Format/Lint도 통과했다. 새 테스트·새 RED 체크포인트는 없고 기존 테스트·헤더·fixture·전체 명령은 그대로다.
- 구조 정리 워커가 별도 승인된 refactor 절차로 구현했다. 완료된 기존 AppShell 검사 한 개를 원문 그대로 계획에서 참조한 경위는 verification-plan.md에 기록했다. 런타임은 변경하지 않았다.
- 변경 소스 25개 중 24개는 TypeScript AST가 import 순서 정규화 후 동일하다. 부작용 import와 모든 import 선언 내용도 동일하다. AppShell만 경로별 노출·클래스 조건을 같은 함수의 이름 있는 변수로 추출했으며 DOM·클래스·오류 경계·훅·props를 유지했다.
- 기존 테스트/support/fixture와 package.json·pnpm-lock.yaml이 기준 dev와 동일함을 검사했다. ESLint가 잘못된 공백과 import 그룹을 거부하고 올바른 공백은 통과시키며, 테스트에서는 새 스타일 규칙을 제외하되 Next lint는 유지함을 메모리 내 probe로 확인했다.
- 최종 src와 byte 단위로 같은 임시 복사본에서 TypeScript와 Next.js 프로덕션 빌드를 통과했다. 기존 dev와 PR #12 HEAD의 제품·설정·의존성 차이가 없음을 확인해 해당 PR 검증 복사본의 빌드를 변경 전 기준으로 사용했다.
- 실제 Chrome에서 지도·검색·검색 결과·목록·상세·제보 6개 화면을 320/393/1280px에서 변경 전후 비교했다. 18쌍 모두 DOM·PNG가 동일했고 가로 넘침·pageerror는 없었다. API fixture와 지도 키 미설정 상태에서 비교했으며 운영 API·지도 서비스·배포 검증은 아니다.
- 별도 읽기 전용 Astra 리뷰에서 수정이 필요한 결함이 없었다. 마지막 인수인계 커밋은 제품·테스트·설정·컨벤션 문서를 바꾸지 않고 검증 자료·claim·저널·계획 보관만 추가한다.

## 화면 비교 환경 보완

첫 비교는 18쌍 모두 PNG byte가 동일했다. 보관한 스크립트 재실행에서는 상세 393px의 헤더 원형 표시 가장자리 8픽셀에 RGB 채널 최대 1 차이가 있었다. DOM은 동일했고 브라우저 오류는 없었으며 Pillow로 실제 차이 영역을 확인했다. 허용 오차를 늘리지 않고 Chrome의 --disable-gpu 옵션으로 렌더링 환경을 고정한 뒤 엄격한 DOM·PNG 동일 비교를 다시 수행해 18쌍 모두 통과했다. 제품·기존 테스트·gate 명령은 변경하지 않았다.

## 재현

저장소 루트에서 `node collab/active/codex--code-conventions/evidence/invariants.mjs`와 `node collab/active/codex--code-conventions/evidence/lint-probe.mjs`를 실행한다. 기준 dev SHA는 invariants.mjs의 기본값이며 다른 기준은 첫 인자로 지정한다.

변경 전후 제품 복사본을 각각 프로덕션 빌드한 뒤 `node collab/active/codex--code-conventions/evidence/browser-compare.mjs BEFORE_BUILD AFTER_BUILD`를 실행한다. Chrome 설치가 필요하며 fixture·Next 서버는 스크립트가 생성하고 종료한다. 결과는 기본 /tmp/code-conventions-browser-evidence에 남긴다.

자동 규칙은 import/문법 구획만 검사한다. 의미상의 변수 묶음·이름·JSX 책임은 docs/code-conventions.md에 따라 리뷰한다. 기존 ESLint 9 내장 공백 규칙은 폐기 예정이므로 ESLint 버전 업그레이드 때 별도 이전 검토가 필요하다. 이번에 의존성이나 명령을 바꾸지는 않았다.
