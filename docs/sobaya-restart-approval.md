# sobaya 재개발 승인안

기존 PR의 UI 구현·자산·추가 테스트를 제거했다. src는 초기 main scaffold와 같으며 pnpm·협업 하네스·Figma 분석·분담은 보존한다. 이 문서와 failed-test.md는 승인 전 초안이다.

## spec.md에 반영할 명세

Figma 공용 검색 헤더(18:2360), 필터 행(18:2368), 상태 선택(45:3691), 하단 메뉴(18:2428)를 기준으로 홈과 목록의 공용 화면을 sobaya로 재개발한다. 본문을 보존하고 검색 링크, 기간·분류·상태의 접근 가능한 필터, 홈·제보·목록 메뉴를 제공한다. 홈↔목록은 q/category/status/period를 유지하고 page는 넘기지 않는다. URL의 society/ongoing/1w 선택은 사회/진행 중/최근 1주로 표시한다. 제보와 사건 상세는 공용 헤더·필터·메뉴를 숨긴다. Figma 원본 아이콘을 로컬로 다시 가져오고 브라우저에서 디자인을 확인한다.

지도 SDK·외부 뉴스·제보 저장과 amazon 담당 본문은 범위 밖이다. 승인 항목의 RED→워커 구현→전체 GREEN, gate와 독립 review가 완료되어야 완료로 판정한다. spec.md는 현재 사용자 소유 설치 템플릿이며 승인된 명세만 반영한다.

## 검사 계약 변경안

pnpm을 유지한다. sobaya가 pnpm 명령 파싱을 지원하지 않으므로 AGENTS.md의 Test를 `./node_modules/.bin/vitest run`으로 연결한다. package.json의 test도 `vitest run`으로 바꿔 `pnpm test`가 같은 전체 스위트를 실행하게 한다. 기존 하네스 쉘 스위트는 아래 지원 테스트로 포함하며 기존 테스트 본문은 수정하지 않는다. Lint·Format은 pnpm 명령을 유지한다.

승인 후 src/test-support/harness.test.ts에 추가할 정확한 지원 코드:

```ts
import { execFileSync } from 'node:child_process';
import { test } from 'vitest';

for (const suite of ['hooks', 'loop', 'sobaya']) {
  test(`harness_${suite}`, () => {
    const env = { ...process.env };
    delete env.CLAUDE_PROJECT_DIR;
    execFileSync('sh', [`tests/${suite}.sh`], {
      cwd: process.cwd(),
      env,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 8 * 1024 * 1024,
    });
  }, 180_000);
}
```

## 기능 테스트와 실행 정책

amazon 피드백을 반영한 [단계별 인수 조건](shared-foundation-acceptance.md)을 적용한다. 아래 4개는 첫 레이아웃 checkpoint이며 공용 기반 전체 완료 조건이 아니다. 2단계에서 배지·공용 컴포넌트·URL 어댑터와 DOM 상호작용의 정확한 테스트·지원 코드를 별도 baseline 승인안으로 제시하고, 최종 gate·독립 review 후에만 인수한다. 통합 대상은 dev다.

failed-test.md에 전체 헤더와 4개 항목의 정확한 본문이 있다: browseChrome, navigationKeepsFilters, selectedFilters, immersiveRoutes. 초기 AppShell을 실행해 기능 부재로 실패해야 하며 import·환경 오류는 RED로 인정하지 않는다.

sobaya 기본 정책: gpt-6-astra, selected, 최대 20회 호출, 호출당 900초. 구현·독립 review를 별도 컨텍스트로 실행한다. 모든 워커 명령은 collab.sh run으로 감싼다.

## 준비 상태

공식 생성 도구로 brain index 오류를 해소했다. doctor는 협업 pre-commit이 sobaya 단독 관리 훅과 다르다는 이유로 실패한다. 프로젝트 공식 attach 어댑터가 협업 훅 뒤에 sobaya 훅을 연결하며 실제 커밋에서 두 검사가 실행됨을 확인했다. doctor 통과라고 보고하지 않는다.

초기환경 검사 중 sobaya 경로 설정의 기존 자동 감지 충돌과 가짜 저장소가 실제 버전 lock을 상속하는 문제를 확인했다. 기존 자동 감지를 우선하도록 연결 설정을 수정하고, 미결합 상태 테스트의 픽스처에서 실제 앱 lock만 제거했다. 테스트 기대값은 변경하지 않았다.

승인 후 명세·지원 테스트·검사 계약을 반영하고 커밋한 정확한 baseline을 approve.sh로 기록한다. 그 전에는 구현 워커를 호출하지 않는다.
