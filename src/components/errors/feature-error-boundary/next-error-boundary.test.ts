// file: src/components/errors/feature-error-boundary/next-error-boundary.test.ts
// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ErrorBoundaryHandler } from 'next/dist/client/components/error-boundary';
import { AppShell } from '../../layout/app-shell/app-shell';
import { FeatureError } from '../model/feature-error';
import RouteError from '../../../app/error';

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
