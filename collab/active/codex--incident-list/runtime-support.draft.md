# 사건 목록 실행 지원 검토안

상태: DRAFT. 아래 변경은 아직 적용하지 않았다. 사용자 승인 후 동료 WIP 겹침을 재확인해 적용한다.

## 변경할 정확한 계약

AGENTS.md의 Test 한 줄만 다음으로 변경한다. Format·Lint·Skills 및 나머지 규칙은 유지한다.

```text
- Test: `./node_modules/.bin/vitest run`
```

package.json의 scripts.test 문자열만 다음으로 변경한다. test:harness 및 기존 셸 테스트는 유지한다.

```json
"test": "vitest run"
```

전체 Vitest 실행 안에서 기존 hooks·loop·sobaya 셸 스위트를 모두 아래 지원 파일로 실행한다.
이로써 테스트를 생략하지 않고 Sobaya가 읽을 수 있는 결과 형식으로 제공한다.
이 지원 파일은 승인 baseline의 보호된 테스트이며 구현 워커가 고칠 수 없다.

대상: src/test-support/harness.test.ts

```ts
import { execFileSync } from 'node:child_process';
import { test } from 'vitest';

function runHarness(suite: 'hooks' | 'loop' | 'sobaya') {
  const env = { ...process.env };
  delete env.CLAUDE_PROJECT_DIR;
  execFileSync('sh', [`tests/${suite}.sh`], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
  });
}

test('harness_hooks', () => runHarness('hooks'), 180_000);
test('harness_loop', () => runHarness('loop'), 180_000);
test('harness_sobaya', () => runHarness('sobaya'), 180_000);
```

## 로컬 설정

- 앱 협업 핸들 amazon, rerere, .githooks 활성화 완료. 기존 협업 훅 파일 내용은 바꾸지 않았다.
- 앱 .git/hooks/pre-commit에는 팀 lock 런타임이 생성하는 표준 Sobaya 훅을 설치하고, 기존 .githooks/pre-commit이 이를 호출하는지 검증한다. spec.md를 자동 생성하는 install.sh는 실행하지 않는다.
- 공유 루트 Sobaya에는 다른 작업이 있으므로 수정·pull하지 않는다. 팀 lock 83af28db653c29a54be880ae49671725b6bbbcc4의 별도 checkout에서 실행하고 앱 절대경로를 넘긴다.
- Node 24.19.0와 pnpm 10.34.6을 명시적으로 PATH에 선택한다. 전역 Node 26/pnpm 11을 사용하지 않는다.
- 기존 doctor는 .githooks 래퍼를 표준 훅 바이트와 비교하므로 실패한다. 이를 통과로 기록하거나 검사를 무력화하지 않는다.
  승인 후 로컬 훅 연결을 설치하여 협업 검사와 Sobaya 검사 두 경로를 실제로 검증하고 그 증거와 doctor의 호환 한계를 함께 보고한다.
  승인·루프·gate 자체는 doctor의 이 문자열 검사를 호출하지 않는다. 이것이 하네스 전체 통과를 뜻하지 않으며 실제 gate·독립 review는 반드시 별도로 통과해야 한다.
- 기본 실행 정책은 저장소 Sobaya 문서의 selected / gpt-6-astra / 최대 20호출 / 호출당 900초를 따른다. 구현과 최종 review는 별도 컨텍스트다.

## 승인 범위

위 정확한 명령 변경·보존된 셸 스위트 연결, proposal.md의 빈 소스 준비,
failed-test.draft.md의 다섯 항목을 하나의 검토 묶음으로 제시한다.
spec.md는 사용자 소유이므로, 사용자가 제안 내용의 작성까지 명시적으로 허용하기 전에는 생성·수정하지 않는다.
