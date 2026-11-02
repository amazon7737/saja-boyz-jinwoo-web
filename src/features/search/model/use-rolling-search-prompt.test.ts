// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vitest';
import { SearchPromptProvider } from './use-rolling-search-prompt';
import { SearchForm } from '@/features/search/ui/search-form/search-form';
import { SearchHeader } from '@/components/layout/search-header/search-header';

vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

let cleanup: (() => Promise<void>) | undefined;
afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('searchHeaderRollsThreeHeadlinesWithoutRepeatsAndKeepsSearchAccessible', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  const request = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        titles: ['서울 사고 소식', '부산 사건 소식', '인천 수사 소식'],
      }),
    ),
  );
  vi.stubGlobal('fetch', request);
  const host = document.createElement('div');
  const root = createRoot(host);
  cleanup = async () => {
    await act(async () => root.unmount());
  };
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
  const shown = new Set<string>();
  for (let i = 0; i < 3; i++) {
    expect(link?.textContent).toMatch(/소식 검색하기/);
    shown.add(link?.textContent ?? '');
    await act(async () => vi.advanceTimersByTime(5000));
  }
  expect(shown.size).toBe(3);
  expect(link?.getAttribute('aria-label')).toBe('기사 키워드 검색');
  expect(request).toHaveBeenCalledTimes(1);
  await cleanup();
  cleanup = undefined;
  expect(vi.getTimerCount()).toBe(0);
});

test('searchInputRollsOnlyPlaceholderAndPreservesTypedText', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ titles: ['서울 소식', '부산 소식', '인천 소식'] }),
        ),
      ),
  );
  const host = document.createElement('div');
  const root = createRoot(host);
  cleanup = async () => {
    await act(async () => root.unmount());
  };
  const formProps = { keyword: '', children: null };
  await act(async () => {
    root.render(
      createElement(
        SearchPromptProvider,
        null,
        createElement(SearchForm, formProps),
      ),
    );
  });
  const input = host.querySelector('input');
  expect(input?.placeholder).toMatch(/소식 검색하기/);
  const first = input?.placeholder;
  if (!input) throw new Error('search input missing');
  input.value = '내가 입력한 검색어';
  await act(async () => vi.advanceTimersByTime(5000));
  expect(input.placeholder).not.toBe(first);
  expect(input.value).toBe('내가 입력한 검색어');
  expect(input.getAttribute('aria-label')).toBe('기사 키워드 검색');
});

test.each([[], ['한 건의 기사'], null])(
  'searchPromptHandlesSparseOrInvalidHeadlines: %j',
  async (titles) => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ titles })),
    );
    const host = document.createElement('div');
    const root = createRoot(host);
    cleanup = async () => {
      await act(async () => root.unmount());
    };
    await act(async () => {
      root.render(
        createElement(
          SearchPromptProvider,
          null,
          createElement(SearchHeader, { isHome: true }),
        ),
      );
    });
    expect(host.textContent).toContain(
      Array.isArray(titles) && titles.length
        ? '한 건의 기사 검색하기'
        : '기사 키워드 검색…',
    );
    expect(vi.getTimerCount()).toBe(0);
  },
);

test('searchPromptSharesOneRequestAndStopsRollingForReducedMotion', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
  const request = vi
    .fn()
    .mockResolvedValue(Response.json({ titles: ['서울 소식', '부산 소식'] }));
  vi.stubGlobal('fetch', request);
  const host = document.createElement('div');
  const root = createRoot(host);
  cleanup = async () => {
    await act(async () => root.unmount());
  };
  await act(async () => {
    root.render(
      createElement(
        SearchPromptProvider,
        null,
        createElement(SearchHeader, { isHome: true }),
        createElement(SearchHeader, { isHome: false }),
      ),
    );
  });
  const first = host.textContent;
  await act(async () => vi.advanceTimersByTime(15000));
  expect(host.textContent).toBe(first);
  expect(request).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

test('searchPromptKeepsFallbackOnFailureAndAbortsPendingRequestOnUnmount', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  let signal: AbortSignal | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((_url, options) => {
      signal = options.signal;
      return new Promise(() => {});
    }),
  );
  const host = document.createElement('div');
  const root = createRoot(host);
  cleanup = async () => {
    await act(async () => root.unmount());
  };
  await act(async () => {
    root.render(
      createElement(
        SearchPromptProvider,
        null,
        createElement(SearchHeader, { isHome: true }),
      ),
    );
  });
  expect(host.textContent).toContain('기사 키워드 검색…');
  await cleanup();
  cleanup = undefined;
  expect(signal?.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});
