// file: src/app/search/search-page.test.ts
// @vitest-environment jsdom
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SearchPage from './page';
const loadingModules = import.meta.glob('./loading.tsx');
const mock = vi.fn<typeof fetch>();
const item = {
  article_id: 'a'.repeat(64),
  image_status: 'disabled',
  image_url: null,
  article: {
    title: '테스트 기사 <b>화재</b>',
    description: '안전 &amp; 점검',
    pubDate: '2026-10-07T00:00:00Z',
    originallink: 'https://example.invalid/news',
    link: '',
  },
};
beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal('fetch', mock);
});
afterEach(() => {
  mock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
async function renderSearch(q?: string | string[]) {
  const page: (props: {
    searchParams: Promise<{ q?: string | string[] }>;
  }) => ReactNode | Promise<ReactNode> = SearchPage;
  const root = document.createElement('div');
  root.innerHTML = renderToStaticMarkup(
    await page({ searchParams: Promise.resolve({ q }) }),
  );
  return root;
}

test('searchInitialStateUsesRealGetFormWithoutFetching', async () => {
  for (const q of [undefined, '   ']) {
    const root = await renderSearch(q);
    const form = root.querySelector('form');
    assert(form);
    expect(form.getAttribute('action')).toBe('/search');
    expect((form.getAttribute('method') ?? 'get').toLowerCase()).toBe('get');
    const input = form.querySelector('input[name="q"]');
    assert(input instanceof HTMLInputElement);
    expect(input.value).toBe('');
    expect(input.getAttribute('aria-label')).toBe('기사 키워드 검색');
    expect(form.querySelector('button[type="submit"]')).not.toBeNull();
    expect(root.querySelector('a[href="/"]')).not.toBeNull();
    expect(
      Array.from(root.querySelectorAll('a')).some(
        (a) =>
          new URL(
            a.getAttribute('href') ?? '',
            'https://app.example.invalid',
          ).searchParams.get('q') === '대형화재',
      ),
    ).toBe(true);
    expect(root.textContent).not.toContain('검색 결과가 없어요');
    expect(root.textContent).not.toContain('서울 소방서');
  }
  expect(mock).not.toHaveBeenCalled();
});

test('searchUrlRendersApiResultsAndKeepsInputInSync', async () => {
  mock.mockResolvedValueOnce(Response.json({ total: 80, items: [item, item] }));
  const root = await renderSearch(['  서울 & 화재  ', '무시할 값']);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(
    new URL(String(mock.mock.calls[0][0])).searchParams.get('keyword'),
  ).toBe('서울 & 화재');
  const input = root.querySelector('input[name="q"]');
  assert(input instanceof HTMLInputElement);
  expect(input.value).toBe('서울 & 화재');
  expect(root.querySelectorAll('article')).toHaveLength(1);
  expect(root.textContent).toContain('테스트 기사 화재');
  expect(root.textContent).toContain('안전 & 점검');
  expect(root.textContent).not.toContain('80건');
  const reset = Array.from(root.querySelectorAll('a')).find(
    (a) => a.getAttribute('aria-label') === '검색어 초기화',
  );
  expect(reset?.getAttribute('href')).toBe('/search');
  const clean = await renderSearch();
  expect(clean.querySelectorAll('article')).toHaveLength(0);
  expect(mock).toHaveBeenCalledTimes(1);
});

test('searchDistinguishesEmptyFailureAndLoading', async () => {
  mock.mockResolvedValueOnce(Response.json({ total: 0, items: [] }));
  const empty = await renderSearch('화재');
  const status = empty.querySelector('[role="status"]');
  assert(status);
  expect(status.textContent).toContain('검색 결과가 없어요');
  expect(empty.querySelector('[role="alert"]')).toBeNull();
  mock.mockRejectedValueOnce(new Error('PRIVATE_SERVER_DETAIL'));
  const failed = await renderSearch('서울 & 화재');
  const alert = failed.querySelector('[role="alert"]');
  assert(alert);
  expect(alert.textContent).toContain('검색 결과를 불러오지 못했어요');
  expect(failed.textContent).not.toContain('PRIVATE_SERVER_DETAIL');
  const retry = Array.from(alert.querySelectorAll('a')).find((a) =>
    a.textContent?.includes('다시 시도'),
  );
  assert(retry);
  const url = new URL(
    retry.getAttribute('href') ?? '',
    'https://app.example.invalid',
  );
  expect(url.pathname).toBe('/search');
  expect(url.searchParams.get('q')).toBe('서울 & 화재');
  const load = loadingModules['./loading.tsx'];
  assert(load);
  const loadingModule = (await load()) as { default: ComponentType };
  const loading = document.createElement('div');
  loading.innerHTML = renderToStaticMarkup(
    createElement(loadingModule.default),
  );
  expect(
    loading.querySelector('[role="status"][aria-busy="true"]'),
  ).not.toBeNull();
});
