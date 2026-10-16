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
  installObserver();
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

type ObservedEntry = {
  callback: IntersectionObserverCallback;
  targets: Set<Element>;
  disconnected: boolean;
};
const observers: ObservedEntry[] = [];

function installObserver() {
  observers.length = 0;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      entry: ObservedEntry;
      constructor(callback: IntersectionObserverCallback) {
        this.entry = { callback, targets: new Set(), disconnected: false };
        observers.push(this.entry);
      }
      observe(target: Element) {
        this.entry.disconnected = false;
        this.entry.targets.add(target);
      }
      unobserve(target: Element) {
        this.entry.targets.delete(target);
      }
      disconnect() {
        this.entry.disconnected = true;
        this.entry.targets.clear();
      }
    },
  );
}

function dispatchIntersections(isIntersecting = true) {
  for (const observer of [...observers]) {
    if (observer.disconnected || observer.targets.size === 0) continue;
    observer.callback(
      [...observer.targets].map((target) => ({
        target,
        isIntersecting,
        intersectionRatio: isIntersecting ? 1 : 0,
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRect: target.getBoundingClientRect(),
        rootBounds: null,
        time: 0,
      })),
      observer as unknown as IntersectionObserver,
    );
  }
}

async function intersect(isIntersecting = true) {
  await act(async () => dispatchIntersections(isIntersecting));
}

function expectsObservedTail() {
  expect(
    observers.some((entry) => !entry.disconnected && entry.targets.size > 0),
  ).toBe(true);
  expect(
    Array.from(container.querySelectorAll('button')).some(
      (entry) => entry.textContent?.trim() === '더 보기',
    ),
  ).toBe(false);
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
