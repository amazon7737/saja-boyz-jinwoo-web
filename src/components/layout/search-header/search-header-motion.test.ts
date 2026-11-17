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
