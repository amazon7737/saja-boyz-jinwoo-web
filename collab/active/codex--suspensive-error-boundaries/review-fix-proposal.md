# PR #5 리뷰 수정: Next 오류 경계 연결

기존 26개 테스트와 API·이미지 동작을 유지한다. RouteError에서 실제 클라이언트 FeatureError의 유형별 안내와 onError 처리를 연결한다. 서버 전달 오류는 사용자 정의 클래스 보존을 가정하지 않고 일반 안내를 제공한다. retry 우선/reset 호환, AppShell의 헤더·내비게이션 보존, 경로 이동 복구를 유지한다. 의존성·테스트 명령·제품 라우트를 추가하지 않는다.

## 추가 정확 테스트

공통 헤더:
```ts
// file: src/components/errors/next-error-boundary.test.ts
// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ErrorBoundaryHandler } from 'next/dist/client/components/error-boundary';
import { AppShell } from '../layout/app-shell';
import { FeatureError } from './feature-error-boundary';
import RouteError from '../../app/error';

let pathname = '/incidents';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  pathname = '/incidents';
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function draw(node: ReturnType<typeof createElement> | null) {
  await act(async () => root.render(node));
}
```

- [ ] nextBoundaryPreservesFeatureClassification — 설치된 Next ErrorBoundaryHandler가 AppShell 안쪽에서 페이지 오류를 먼저 잡는 실제 경계 순서로 세 분류·로그·재시도·경로 복구를 검증

```ts
test('nextBoundaryPreservesFeatureClassification', async () => {
  for (const [reason, message] of [
    ['network', '연결을 확인'],
    ['configuration', '서비스 설정'],
    ['invalid-response', '응답을 확인'],
  ] as const) {
    await draw(null);
    vi.mocked(console.error).mockClear();
    let broken = true;
    const error = new FeatureError(reason);
    error.message = 'SECRET_CLIENT_DETAIL';
    function Page() {
      if (broken) throw error;
      return createElement('p', null, '정상 페이지');
    }
    function tree() {
      return createElement(
        AppShell,
        null,
        createElement(ErrorBoundaryHandler, {
          pathname,
          errorComponent: RouteError,
          children: createElement(Page),
        }),
      );
    }
    await draw(tree());
    expect(
      container.querySelector('main [role="alert"]')?.textContent,
    ).toContain(message);
    expect(console.error).toHaveBeenCalledWith('기능 오류:', reason);
    expect(container.textContent).not.toContain('SECRET_CLIENT_DETAIL');
    expect(container.querySelector('header')?.textContent).toContain('흉흉');
    expect(container.querySelector('nav')?.textContent).toContain('목록');
    broken = false;
    const retry = container.querySelector('main button');
    expect(retry).toBeInstanceOf(HTMLButtonElement);
    await act(async () => (retry as HTMLButtonElement).click());
    expect(container.textContent).toContain('정상 페이지');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    broken = true;
    await draw(tree());
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    broken = false;
    pathname = '/search';
    await draw(tree());
    expect(container.textContent).toContain('정상 페이지');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    pathname = '/incidents';
  }
});
```

- [ ] routeErrorKeepsServerFallbackAndRetry — 클래스가 없는 서버 오류의 일반 안내·비밀 정보 비노출·retry 우선·reset 호환을 검증

```ts
test('routeErrorKeepsServerFallbackAndRetry', async () => {
  const error = Object.assign(new Error('SECRET_SERVER_DETAIL'), {
    name: 'FeatureError',
    reason: 'network',
    digest: 'SECRET_DIGEST',
  });
  const reset = vi.fn();
  const retry = vi.fn();
  await draw(createElement(RouteError, { error, reset, retry }));
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    '화면을 표시하지 못했어요',
  );
  expect(container.textContent).not.toContain('SECRET_SERVER_DETAIL');
  expect(container.textContent).not.toContain('SECRET_DIGEST');
  expect(console.error).not.toHaveBeenCalledWith('기능 오류:', 'network');
  await act(async () => container.querySelector('button')!.click());
  expect(retry).toHaveBeenCalledTimes(1);
  expect(reset).not.toHaveBeenCalled();
  await draw(createElement(RouteError, { error, reset }));
  await act(async () => container.querySelector('button')!.click());
  expect(reset).toHaveBeenCalledTimes(1);
});
```

## 실제 Next 페이지 통합 확인

별도 FeatureErrorBoundary를 두지 않은 임시 Next 페이지에서 클라이언트 마운트 이후 세 FeatureError를 각각 발생시킨다. 프로덕션 Next 서버와 Chrome에서 유형별 안내와 로그, 원인 해소 후 재시도, 오류 상태에서 /search 이동 복구, 헤더·내비게이션 유지까지 확인한다. 재현 fixture와 결과는 collab 산출물에 보관하고 제품 라우트에는 포함하지 않는다. 단위 테스트의 Next 내부 모듈 의존은 위 통합 확인으로 보완한다.
