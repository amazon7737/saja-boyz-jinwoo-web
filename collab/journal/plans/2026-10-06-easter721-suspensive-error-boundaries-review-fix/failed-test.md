# 오류 경계 정확 테스트 초안

공통 헤더:

```ts
// file: src/components/errors/error-boundaries.test.ts
// @vitest-environment jsdom
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { act, createElement, type ComponentType, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

let pathname = '/incidents';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
const modules = import.meta.glob([
  './feature-error-boundary.tsx',
  '../../app/error.tsx',
  '../../app/global-error.tsx',
]);
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
async function draw(node: ReactNode) {
  await act(async () => root.render(node));
}
async function clickRetry() {
  const button = Array.from(container.querySelectorAll('button')).find((el) =>
    el.textContent?.includes('다시 시도'),
  );
  assert(button);
  await act(async () => button.click());
}
function Throw({ error }: { error: Error | null }) {
  if (error) throw error;
  return createElement('p', null, '정상 내용');
}
async function boundaries() {
  const load = modules['./feature-error-boundary.tsx'];
  expect(load, '공용 오류 경계 모듈이 있어야 한다').toBeTypeOf('function');
  return (await load()) as {
    FeatureError: new (
      reason: 'network' | 'configuration' | 'invalid-response',
    ) => Error & { reason: string };
    FeatureErrorBoundary: ComponentType<{ children: ReactNode }>;
  };
}
```

- [x] featureErrorClassifiesAndPropagates — 지정 오류 분류와 미지정 오류의 상위 전파

```ts
test('featureErrorClassifiesAndPropagates', async () => {
  const { FeatureError, FeatureErrorBoundary } = await boundaries();
  for (const [reason, message] of [
    ['network', '연결을 확인'],
    ['configuration', '서비스 설정'],
    ['invalid-response', '응답을 확인'],
  ] as const) {
    await draw(null);
    const error = new FeatureError(reason);
    error.message = 'SECRET_INTERNAL_MESSAGE';
    await draw(
      createElement(
        FeatureErrorBoundary,
        null,
        createElement(Throw, { error }),
      ),
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      message,
    );
    expect(container.textContent).not.toContain('SECRET_INTERNAL_MESSAGE');
  }
  await draw(null);
  await draw(
    createElement(
      FeatureErrorBoundary,
      null,
      createElement(Throw, { error: new Error('SECRET_UNKNOWN') }),
    ),
  );
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    '화면을 표시하지 못했어요',
  );
  expect(container.textContent).not.toContain('SECRET_UNKNOWN');
});
```

- [x] featureBoundaryRetriesAndResetsOnNavigation — 재시도·경로 복구 및 AppShell 내비게이션 보존

```ts
test('featureBoundaryRetriesAndResetsOnNavigation', async () => {
  const { FeatureError, FeatureErrorBoundary } = await boundaries();
  let error: Error | null = new FeatureError('network');
  function Content() {
    return createElement(Throw, { error });
  }
  const node = createElement(
    FeatureErrorBoundary,
    null,
    createElement(Content),
  );
  await draw(node);
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  error = null;
  await clickRetry();
  expect(container.textContent).toContain('정상 내용');
  expect(container.querySelector('[role="alert"]')).toBeNull();
  error = new Error('SECRET_UNKNOWN');
  await draw(createElement(FeatureErrorBoundary, null, createElement(Content)));
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  error = null;
  pathname = '/search';
  await draw(createElement(FeatureErrorBoundary, null, createElement(Content)));
  expect(container.textContent).toContain('정상 내용');
  expect(container.querySelector('[role="alert"]')).toBeNull();
  await draw(null);
  const { AppShell } = await import('../layout/app-shell');
  await draw(
    createElement(
      AppShell,
      null,
      createElement(Throw, { error: new Error('SECRET_SHELL') }),
    ),
  );
  expect(container.querySelector('header')?.textContent).toContain('흉흉');
  expect(container.querySelector('nav')?.textContent).toContain('목록');
  expect(container.querySelector('main [role="alert"]')).not.toBeNull();
  expect(container.textContent).not.toContain('SECRET_SHELL');
});
```

- [x] nextRouteErrorBridgesResetSafely — Next.js 오류 경계·최상위 문서 구조와 reset 연결

```ts
test('nextRouteErrorBridgesResetSafely', async () => {
  for (const path of ['../../app/error.tsx', '../../app/global-error.tsx']) {
    await draw(null);
    const load = modules[path];
    expect(load, `${path}가 있어야 한다`).toBeTypeOf('function');
    const { default: ErrorView } = (await load()) as {
      default: ComponentType<{
        error: Error & { digest?: string };
        reset: () => void;
      }>;
    };
    const reset = vi.fn();
    const error = Object.assign(new Error('SECRET_SERVER_MESSAGE'), {
      digest: 'SECRET_DIGEST',
    });
    const iframe = path.includes('global-error')
      ? document.createElement('iframe')
      : null;
    if (iframe) document.body.append(iframe);
    const targetDocument = iframe?.contentDocument;
    const globalRoot = targetDocument ? createRoot(targetDocument) : null;
    const target = targetDocument ?? container;
    try {
      if (globalRoot) {
        await act(async () =>
          globalRoot.render(createElement(ErrorView, { error, reset })),
        );
      } else {
        await draw(createElement(ErrorView, { error, reset }));
      }
      expect(target.querySelector('[role="alert"]')?.textContent).toContain(
        '화면을 표시하지 못했어요',
      );
      expect(target.querySelector('[role="alert"]')?.textContent).not.toContain(
        'SECRET_SERVER_MESSAGE',
      );
      expect(target.querySelector('[role="alert"]')?.textContent).not.toContain(
        'SECRET_DIGEST',
      );
      const button = Array.from(target.querySelectorAll('button')).find((el) =>
        el.textContent?.includes('다시 시도'),
      );
      assert(button);
      await act(async () => button.click());
      expect(reset).toHaveBeenCalledTimes(1);
      if (path.includes('global-error')) {
        expect(target.querySelector('html')?.getAttribute('lang')).toBe('ko');
        expect(target.querySelector('html > body')).not.toBeNull();
      }
    } finally {
      if (globalRoot) await act(async () => globalRoot.unmount());
      iframe?.remove();
    }
  }
});
```


## Next 경계 연결 리뷰 회귀

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

- [x] nextBoundaryPreservesFeatureClassification — 설치된 Next ErrorBoundaryHandler가 AppShell 안쪽에서 페이지 오류를 먼저 잡는 실제 경계 순서로 세 분류·로그·재시도·경로 복구를 검증

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
      const boundaryProps = {
        pathname,
        errorComponent: RouteError,
        children: createElement(Page),
      };
      return createElement(
        AppShell,
        null,
        createElement(ErrorBoundaryHandler, boundaryProps),
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

- [x] routeErrorKeepsServerFallbackAndRetry — 클래스가 없는 서버 오류의 일반 안내·비밀 정보 비노출·retry 우선·reset 호환을 검증

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

