// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vitest';
import { SearchSuggestions } from './search-suggestions';

vi.mock('next/link', () => ({ default: 'a' }));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('debounces Korean composition, aborts obsolete requests, and ignores late responses', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const deferred: Array<(response: Response) => void> = [];
  const signals: AbortSignal[] = [];
  const request = vi.fn((_url: string, init: RequestInit) => {
    signals.push(init.signal as AbortSignal);
    return new Promise<Response>((resolve) => deferred.push(resolve));
  });
  vi.stubGlobal('fetch', request);
  const host = document.createElement('div');
  const root = createRoot(host);
  const render = async (query: string, composing = false) => {
    await act(async () =>
      root.render(
        createElement(SearchSuggestions, { query, keyword: '', composing }),
      ),
    );
  };
  await render('화재', true);
  await act(async () => vi.advanceTimersByTime(500));
  expect(request).not.toHaveBeenCalled();
  await render('화재');
  await act(async () => vi.advanceTimersByTime(349));
  expect(request).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTime(1));
  expect(request).toHaveBeenCalledTimes(1);
  await render('교통');
  expect(signals[0].aborted).toBe(true);
  await act(async () => vi.advanceTimersByTime(350));
  await act(async () =>
    deferred[1](
      Response.json({ items: [{ id: 'b'.repeat(64), title: '교통 기사' }] }),
    ),
  );
  expect(host.textContent).toContain('교통 기사');
  expect(host.querySelector('a')?.getAttribute('href')).toBe(
    `/incidents/${'b'.repeat(64)}`,
  );
  await act(async () =>
    deferred[0](
      Response.json({ items: [{ id: 'a'.repeat(64), title: '지난 기사' }] }),
    ),
  );
  expect(host.textContent).not.toContain('지난 기사');
  await render('');
  expect(host.textContent).not.toContain('교통 기사');
  await act(async () => root.unmount());
});

test('does not repeat a submitted search and fails without fabricated suggestions', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const request = vi.fn().mockRejectedValue(new Error('unavailable'));
  vi.stubGlobal('fetch', request);
  const host = document.createElement('div');
  const root = createRoot(host);
  await act(async () =>
    root.render(
      createElement(SearchSuggestions, {
        query: '화재',
        keyword: '화재',
        composing: false,
      }),
    ),
  );
  await act(async () => vi.advanceTimersByTime(500));
  expect(request).not.toHaveBeenCalled();
  await act(async () =>
    root.render(
      createElement(SearchSuggestions, {
        query: '화재 사고',
        keyword: '화재',
        composing: false,
      }),
    ),
  );
  await act(async () => vi.advanceTimersByTime(350));
  expect(request).toHaveBeenCalledTimes(1);
  expect(host.textContent).toBe('');
  await act(async () => root.unmount());
});

test('highlights literal queries without changing article titles or accessible link text', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const title = 'AI ai Ai aI 안전과 C++ 소식';
  const id = 'c'.repeat(64);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(Response.json({ items: [{ id, title }] })),
      ),
  );
  const host = document.createElement('div');
  const root = createRoot(host);

  for (const [query, matches] of [
    ['ai', ['AI', 'ai', 'Ai', 'aI']],
    ['Ai', ['AI', 'ai', 'Ai', 'aI']],
    ['c++', ['C++']],
  ] as const) {
    await act(async () =>
      root.render(
        createElement(SearchSuggestions, {
          query,
          keyword: '',
          composing: false,
        }),
      ),
    );
    await act(async () => vi.advanceTimersByTime(350));
    const link = host.querySelector('li a');

    expect(link?.textContent).toBe(title);
    expect(link?.getAttribute('href')).toBe(`/incidents/${id}`);
    expect(
      [...link!.querySelectorAll('mark')].map((mark) => mark.textContent),
    ).toEqual(matches);
    expect(host.querySelector('[aria-live="polite"]')?.textContent).toBe(
      '일치하는 기사 1개',
    );
  }

  await act(async () => root.unmount());
});

test('keeps the status region mounted and wraps long titles without losing the article link', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const title = '매우긴화재소식'.repeat(40);
  const id = 'd'.repeat(64);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ items: [{ id, title }] })),
  );
  const host = document.createElement('div');
  const root = createRoot(host);
  await act(async () =>
    root.render(
      createElement(SearchSuggestions, {
        query: '',
        keyword: '',
        composing: false,
      }),
    ),
  );
  const status = host.querySelector('[aria-live="polite"]');
  expect(status?.textContent).toBe('');
  await act(async () =>
    root.render(
      createElement(SearchSuggestions, {
        query: '화재',
        keyword: '',
        composing: false,
      }),
    ),
  );
  await act(async () => vi.advanceTimersByTime(350));
  const link = host.querySelector('li a');
  expect(host.querySelector('[aria-live="polite"]')).toBe(status);
  expect(status?.textContent).toBe('일치하는 기사 1개');
  expect(link?.textContent).toBe(title);
  expect(link?.getAttribute('href')).toBe(`/incidents/${id}`);
  expect(link?.classList.contains('[overflow-wrap:anywhere]')).toBe(true);
  expect(link?.classList.contains('min-w-0')).toBe(true);
  await act(async () => root.unmount());
});
