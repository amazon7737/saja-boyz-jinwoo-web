// file: src/features/search/ui/search-results/search-results.test.ts
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SearchPage from '@/app/search/page';
import { fetchArticleList } from '@/features/article-list/api/fetch-articles';
import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';

const request = vi.fn<typeof fetch>();
let container: HTMLDivElement;
let root: Root;
function article(index: number): ArticleCollectionItem {
  return {
    article_id: index.toString(16).padStart(64, '0'),
    image_status: 'disabled',
    image_url: null,
    article: {
      title: '기사 ' + index,
      description: '기사 요약 ' + index,
      pubDate: '2026-10-11T00:00:00Z',
      originallink: 'https://publisher.example.invalid/' + index,
      link: '',
    },
  };
}
function batch(start = 0) {
  return Array.from({ length: 20 }, (_, index) => article(start + index));
}
beforeEach(() => {
  localStorage.clear();
  request.mockReset();
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal('fetch', request);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
});
async function mount(q?: string) {
  const page = await SearchPage({ searchParams: Promise.resolve({ q }) });
  await act(async () => root.render(page));
}
function button(name: string) {
  const found = Array.from(container.querySelectorAll('button')).find(
    (entry) =>
      (entry.getAttribute('aria-label') ?? entry.textContent?.trim()) === name,
  );
  expect(found).toBeDefined();
  return found!;
}
async function click(name: string) {
  await act(async () => button(name).click());
}
function titles() {
  return Array.from(container.querySelectorAll('article h2')).map(
    (title) => title.textContent,
  );
}
function offsets() {
  return request.mock.calls.map(([input]) =>
    new URL(String(input)).searchParams.get('offset'),
  );
}

test('searchPageRequestValidatesOffsetAndRetainsRawTotal', async () => {
  request.mockResolvedValue(
    Response.json({ total: 80, items: [article(1), article(1)] }),
  );
  const pageRequest = fetchArticleList as (
    keyword?: string,
    offset?: number,
  ) => Promise<{
    items: ArticleCollectionItem[];
    apiOrigin: string;
    total?: number;
  } | null>;
  const result = await pageRequest('  서울 & 화재?#  ', 20);
  expect(result?.total).toBe(80);
  expect(result?.items).toHaveLength(2);
  const [input, init] = request.mock.calls[0];
  const url = new URL(String(input));
  expect(url.pathname).toBe('/news');
  expect(url.searchParams.get('keyword')).toBe('서울 & 화재?#');
  expect(url.searchParams.get('offset')).toBe('20');
  expect(url.searchParams.get('limit')).toBe('20');
  expect(init?.method).toBe('GET');
  expect(init?.cache).toBe('no-store');
  expect(init?.signal).toBeInstanceOf(AbortSignal);
  request.mockClear();
  for (const offset of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(await pageRequest('화재', offset)).toBeNull();
  }
  expect(request).not.toHaveBeenCalled();
});

test('searchMoreAppendsDeduplicatedPagesWithRawOffsets', async () => {
  const first = [...batch().slice(0, 19), article(0)];
  const second = [article(0), ...batch(19).slice(0, 19)];
  request.mockResolvedValueOnce(Response.json({ total: 43, items: first }));
  await mount('  서울 & 화재?#  ');
  expect(titles()).toEqual(
    first.slice(0, 19).map((item) => item.article.title),
  );
  request.mockResolvedValueOnce(Response.json({ total: 43, items: second }));
  await click('더 보기');
  expect(titles()).toEqual(Array.from({ length: 38 }, (_, i) => '기사 ' + i));
  request.mockResolvedValueOnce(
    Response.json({
      total: 43,
      items: [article(38), article(38), article(39)],
    }),
  );
  await click('더 보기');
  expect(titles()).toEqual(Array.from({ length: 40 }, (_, i) => '기사 ' + i));
  expect(offsets()).toEqual(['0', '20', '40']);
  for (const [input] of request.mock.calls) {
    expect(new URL(String(input)).searchParams.get('keyword')).toBe(
      '서울 & 화재?#',
    );
    expect(new URL(String(input)).searchParams.get('limit')).toBe('20');
  }
  expect(
    container.querySelector('input[name="q"]')?.getAttribute('value'),
  ).toBe('서울 & 화재?#');
  expect(container.textContent).not.toContain('최대 20개의 기사를 보여드려요');
  expect(container.textContent).not.toContain('43건');
  expect(
    Array.from(container.querySelectorAll('button')).some(
      (b) => b.textContent?.trim() === '더 보기',
    ),
  ).toBe(false);
  expect(container.querySelector('article h2 a')?.getAttribute('href')).toBe(
    '/incidents/' + article(0).article_id,
  );
});

test('searchMorePendingFailureAndRetryPreserveLoadedArticles', async () => {
  request.mockResolvedValueOnce(Response.json({ total: 21, items: batch() }));
  await mount('화재');
  let finish!: (response: Response) => void;
  request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const more = button('더 보기');
  await act(async () => {
    more.click();
    more.click();
  });
  expect(request).toHaveBeenCalledTimes(2);
  expect(more.disabled).toBe(true);
  expect(
    container.querySelector('[role="status"][aria-busy="true"]'),
  ).not.toBeNull();
  expect(titles()).toHaveLength(20);
  await act(async () =>
    finish(new Response('PRIVATE_MORE_FAILURE', { status: 503 })),
  );
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    '추가 기사를 불러오지 못했어요',
  );
  expect(container.textContent).not.toContain('PRIVATE_MORE_FAILURE');
  expect(titles()).toHaveLength(20);
  request.mockResolvedValueOnce(new Response('invalid-json'));
  await click('다시 시도');
  expect(titles()).toHaveLength(20);
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  request.mockRejectedValueOnce(new Error('PRIVATE_NETWORK_FAILURE'));
  await click('다시 시도');
  expect(titles()).toHaveLength(20);
  expect(container.textContent).not.toContain('PRIVATE_NETWORK_FAILURE');
  request.mockResolvedValueOnce(
    Response.json({ total: 21, items: [article(20)] }),
  );
  await click('다시 시도');
  expect(titles()).toHaveLength(21);
  expect(offsets()).toEqual(['0', '20', '20', '20', '20']);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(
    Array.from(container.querySelectorAll('button')).some(
      (b) => b.textContent?.trim() === '더 보기',
    ),
  ).toBe(false);
});

test('searchMoreResetsOnKeywordChangeAndIgnoresLatePages', async () => {
  request.mockResolvedValueOnce(Response.json({ total: 40, items: batch() }));
  await mount('첫 검색');
  let finish!: (response: Response) => void;
  request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await click('더 보기');
  request.mockResolvedValueOnce(
    Response.json({ total: 60, items: batch(100) }),
  );
  await mount('다른 검색');
  expect(titles()).toEqual(batch(100).map((item) => item.article.title));
  await act(async () => finish(Response.json({ total: 40, items: batch(20) })));
  expect(titles()).toEqual(batch(100).map((item) => item.article.title));
  request.mockResolvedValueOnce(Response.json({ total: 60, items: [] }));
  await click('더 보기');
  expect(titles()).toHaveLength(20);
  expect(
    Array.from(container.querySelectorAll('button')).some(
      (b) => b.textContent?.trim() === '더 보기',
    ),
  ).toBe(false);
  expect(offsets()).toEqual(['0', '20', '0', '20']);
  expect(
    request.mock.calls.map(([input]) =>
      new URL(String(input)).searchParams.get('keyword'),
    ),
  ).toEqual(['첫 검색', '첫 검색', '다른 검색', '다른 검색']);
  const calls = request.mock.calls.length;
  await mount('   ');
  expect(titles()).toEqual([]);
  expect(request).toHaveBeenCalledTimes(calls);
  expect(container.querySelector('form[action="/search"]')).not.toBeNull();
  expect(
    container.querySelector('section[aria-label="최근 검색"]'),
  ).not.toBeNull();
});
