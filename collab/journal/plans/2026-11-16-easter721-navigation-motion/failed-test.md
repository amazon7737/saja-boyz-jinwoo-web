# 화면 전환 행동 시나리오

## 검색 안내
```ts
// file: src/components/layout/search-header/search-header-motion.test.ts
// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vitest';

import { SearchPromptProvider } from '@/features/search/model/use-rolling-search-prompt';
import { SearchHeader } from './search-header';

vi.mock('next/link', () => ({ default: 'a' }));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
```

## 목록 로딩 접근성
```ts
// file: src/components/feedback/list-navigation-pending.test.ts
```
- [x] listPendingLocksControlsAndPreservesDestinationFocus — 대기 중 보이는 복제 컨트롤은 조작되지 않고 상태 안내는 한 개이며, 완료 후 도착 화면의 포커스를 빼앗지 않는다.
```ts
test('listPendingLocksControlsAndPreservesDestinationFocus', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  const main = document.createElement('main');
  main.id = 'main-content';
  const opener = document.createElement('button');
  opener.textContent = '목록';
  main.append(opener);
  document.body.append(main, host);
  opener.focus();
  const root = createRoot(host);
  let mounted = true;
  const destination = document.createElement('button');
  destination.textContent = '도착 화면';
  try {
    await act(async () => root.render(createElement(ListNavigationPending)));
    const pending = document.querySelector('[data-list-navigation-pending]');
    expect(pending).not.toBeNull();
    const controls = Array.from(
      pending!.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
        'a[href], button:not(:disabled)',
      ),
    );
    expect(controls.every((control) => control.closest('[inert]'))).toBe(true);
    const statuses = pending!.querySelectorAll('[role="status"]');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].closest('[inert]')).toBeNull();
    expect(pending!.contains(document.activeElement)).toBe(true);

    document.body.append(destination);
    destination.focus();
    await act(async () => root.unmount());
    mounted = false;
    expect(document.activeElement).toBe(destination);
  } finally {
    if (mounted) await act(async () => root.unmount());
    destination.remove();
    main.remove();
    host.remove();
    vi.unstubAllGlobals();
  }
});
```
- [x] searchHeaderHeadlineVisiblyRolls — 새 안내가 나타날 때 실제 세로 전환 요소가 교체되고 검색 링크를 유지한다.
```ts
test('searchHeaderHeadlineVisiblyRolls', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        Response.json({ titles: ['서울 소식', '부산 소식', '인천 소식'] }),
      ),
  );
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    await act(async () => {
      root.render(
        createElement(
          SearchPromptProvider,
          null,
          createElement(SearchHeader, { isHome: true }),
        ),
      );
    });
    const link = host.querySelector('a[href="/search"]');
    const first = link?.querySelector('[data-search-prompt-roll]');
    expect(first?.textContent).toMatch(/소식 검색하기/);
    expect(first?.classList.contains('ui-sheet-enter')).toBe(true);
    expect(first?.parentElement?.classList.contains('overflow-hidden')).toBe(
      true,
    );
    await act(async () => vi.advanceTimersByTime(5000));
    const second = link?.querySelector('[data-search-prompt-roll]');
    expect(second).not.toBe(first);
    expect(second?.textContent).not.toBe(first?.textContent);
    expect(link?.getAttribute('aria-label')).toBe('기사 키워드 검색');
  } finally {
    await act(async () => root.unmount());
  }
});
```

## 상세 복귀
```ts
// file: src/features/article-detail/ui/detail-sheet/detail-sheet-return-motion.test.ts
// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

import { DetailSheet } from './detail-sheet';

vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ back: vi.fn() }),
}));
```
- [x] restoredPreviewDoesNotReplayEntrance — 지도 기사 미리보기로 돌아오면 바로 보이며 처음 열 때만 진입 애니메이션이 실행된다.
```ts
test('restoredPreviewDoesNotReplayEntrance', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const render = (active: boolean) =>
    root.render(
      createElement(
        DetailSheet,
        { titleId: 'title', onClose: () => {}, active },
        createElement('h1', { id: 'title' }, '기사 미리보기'),
      ),
    );
  try {
    await act(async () => render(true));
    const panel = host.querySelector('[role="dialog"]');
    expect(panel?.classList.contains('ui-sheet-enter')).toBe(true);
    await act(async () => render(false));
    expect(panel?.hasAttribute('hidden')).toBe(true);
    await act(async () => render(true));
    expect(panel?.hasAttribute('hidden')).toBe(false);
    expect(panel?.classList.contains('ui-sheet-enter')).toBe(false);
    expect(panel?.textContent).toContain('기사 미리보기');
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
```

## 목록 이동
```ts
// file: src/components/feedback/list-navigation-pending.test.ts
// @vitest-environment jsdom
import { act, createElement, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

import { ListNavigationPending } from './list-navigation-pending';

vi.mock('next/link', async () => {
  const React = await import('react');
  const pending = React.createContext(true);

  return {
    default: ({ children, ...props }: ComponentProps<'a'>) =>
      React.createElement(
        pending.Provider,
        { value: false },
        React.createElement('a', props, children),
      ),
    useLinkStatus: () => ({ pending: React.useContext(pending) }),
  };
});
```
- [x] listNavigationShowsDestinationShell — 지도에서 목록으로 이동하는 동안 목록 화면의 전체 틀이 표시되고 지도 위에 부분 로딩 레이어가 뜨지 않는다.
```ts
test('listNavigationShowsDestinationShell', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  const main = document.createElement('main');
  main.id = 'main-content';
  main.textContent = '지도 화면';
  const previousInert = main.inert;
  document.body.append(main, host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(createElement(ListNavigationPending)));
    const pending = document.querySelector('[data-list-navigation-pending]');
    expect(pending).not.toBeNull();
    expect(main.inert).toBe(true);
    expect(pending?.querySelector('[aria-label="주 메뉴"]')).not.toBeNull();
    expect(
      pending?.querySelector('[role="status"][aria-busy="true"]'),
    ).not.toBeNull();
    expect(pending?.querySelector('header')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    const restoredInert = main.inert;
    main.remove();
    host.remove();
    vi.unstubAllGlobals();
    expect(restoredInert).toBe(previousInert);
  }
});
```
