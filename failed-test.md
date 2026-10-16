# 읽기 경험 개선 — 기존7개 이관·신규2개 정확 초안

기존7개의 데이터·이동 회귀를 유지하고 새 관찰 트리거·간격 검증에 맞게 이관한다. API 전용1개를 포함한 다른106개 기존 테스트는 유지한다.

승인 후 Sobaya 등록 전에는 이관할7개 본문을 baseline에서 분리한다. 목록·추천 회귀 파일은 첫 항목 추가 전까지 파일이 없는 상태이며 검색 파일에는 기존 API 테스트와 승인된 helper가 남는다. 빈 테스트 파일이나 가짜 통과 테스트를 만들지 않는다. 이후 이 문서의 정확 본문을 Sobaya가 기존 이름 그대로 항목마다 다시 추가하고 전체 스위트로 검증한다. 최종 테스트는 기존113개+신규2개=115개다.

## Node — src/app/incidents/article-list-pagination.test.ts

```ts
// file: src/app/incidents/article-list-pagination.test.ts
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import IncidentsPage from '@/app/incidents/page';
import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';

const request = vi.fn<typeof fetch>();
const apiOrigin = 'https://news.example.invalid';
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
  request.mockReset();
  installObserver();
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
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
});

async function mount() {
  const page = await IncidentsPage();
  await act(async () => root.render(page));
}

function button(name: string) {
  const found = Array.from(container.querySelectorAll('button')).find(
    (entry) =>
      (entry.getAttribute('aria-label') ?? entry.textContent?.trim()) === name,
  );
  assert(found, `${name} 버튼이 표시되어야 합니다`);
  return found;
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
    new URL(
      input instanceof Request ? input.url : String(input),
    ).searchParams.get('offset'),
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
```

- [x] articleListMoreAppendsWithRawOffsetsAndFirstSeenIdentity — 기존 회귀 이관
```ts
test('articleListMoreAppendsWithRawOffsetsAndFirstSeenIdentity', async () => {
  const first = [...batch().slice(0, 19), article(0)];
  request.mockResolvedValueOnce(Response.json({ total: 100, items: first }));
  await mount();
  expect(titles()).toEqual(
    first.slice(0, 19).map((item) => item.article.title),
  );
  expect(request).toHaveBeenCalledTimes(1);
  expectsObservedTail();

  const duplicate = article(0);
  duplicate.article.title = '뒤늦은 중복 제목';
  request.mockResolvedValueOnce(
    Response.json({
      total: 100,
      items: Array.from({ length: 20 }, () => duplicate),
    }),
  );
  await intersect();
  expect(titles()).toEqual(
    first.slice(0, 19).map((item) => item.article.title),
  );
  expectsObservedTail();

  const next = article(19);
  next.image_status = 'ready';
  next.image_url = `/images/${next.article_id}.jpg`;
  const repeatedNext = {
    ...next,
    article: { ...next.article, title: '새 페이지 내부의 중복 제목' },
  };
  request.mockResolvedValueOnce(
    Response.json({ total: 100, items: [next, repeatedNext] }),
  );
  await intersect();
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  expectsObservedTail();
  const added = Array.from(container.querySelectorAll('article')).at(-1);
  assert(added);
  expect(added.querySelector('h2 a')?.getAttribute('href')).toBe(
    `/incidents/${next.article_id}`,
  );
  expect(added.querySelector('img')?.getAttribute('src')).toBe(
    apiOrigin + next.image_url,
  );
  expect(added.textContent).toContain('AI 생성 이미지');
  expect(
    added.querySelector('a[href="https://publisher.example.invalid/19"]'),
  ).not.toBeNull();

  request.mockResolvedValueOnce(
    Response.json({ total: 43, items: [duplicate] }),
  );
  await intersect();
  expect(offsets()).toEqual(['0', '20', '40', '42']);
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  expect(container.querySelector('button')).toBeNull();
  expect(container.textContent).not.toContain('뒤늦은 중복 제목');
  expect(container.textContent).not.toContain('새 페이지 내부의 중복 제목');
  expect(container.textContent).not.toMatch(/(?:100|43)\s*건/);
  for (const [input, init] of request.mock.calls) {
    const url = new URL(input instanceof Request ? input.url : String(input));
    expect(url.origin).toBe(apiOrigin);
    expect(url.pathname).toBe('/news');
    expect([...url.searchParams.keys()].sort()).toEqual(['limit', 'offset']);
    expect(url.searchParams.get('limit')).toBe('20');
    expect(init?.method).toBe('GET');
    expect(init?.cache).toBe('no-store');
    expect(init?.signal).toBeTruthy();
    expect(init?.body).toBeUndefined();
  }
});
```

- [x] articleListMorePendingFailuresAndRetryPreserveArticles — 기존 회귀 이관
```ts
test('articleListMorePendingFailuresAndRetryPreserveArticles', async () => {
  request.mockResolvedValueOnce(Response.json({ total: 21, items: batch() }));
  await mount();
  let finish: ((response: Response) => void) | undefined;
  request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await intersect(false);
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => {
    dispatchIntersections();
    dispatchIntersections();
  });
  expect(request).toHaveBeenCalledTimes(2);
  expect(
    container.querySelector('[role="status"][aria-busy="true"]'),
  ).not.toBeNull();
  const busy = container.querySelector('[role="status"][aria-busy="true"]');
  expect(busy?.textContent).toContain('추가 기사를 불러오는 중이에요');
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  assert(finish);
  const resolvePending = finish;
  await act(async () =>
    resolvePending(new Response('PRIVATE_HTTP_FAILURE', { status: 503 })),
  );
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    '추가 기사를 불러오지 못했어요',
  );
  expect(container.textContent).not.toContain('PRIVATE_HTTP_FAILURE');
  expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  expect(button('다시 시도').disabled).toBe(false);
  const failedCalls = request.mock.calls.length;
  await intersect();
  await intersect();
  expect(request).toHaveBeenCalledTimes(failedCalls);
  expect(titles()).toEqual(batch().map((item) => item.article.title));

  for (const response of [
    new Response('invalid-json'),
    Response.json({
      total: 21,
      items: [{ ...article(20), article_id: 'invalid' }],
    }),
  ]) {
    request.mockResolvedValueOnce(response);
    await click('다시 시도');
    expect(titles()).toEqual(batch().map((item) => item.article.title));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '추가 기사를 불러오지 못했어요',
    );
  }
  request.mockRejectedValueOnce(new Error('PRIVATE_NETWORK_FAILURE'));
  await click('다시 시도');
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  expect(container.textContent).not.toContain('PRIVATE_NETWORK_FAILURE');
  expect(button('다시 시도').disabled).toBe(false);
  request.mockResolvedValueOnce(
    Response.json({ total: 21, items: [article(20)] }),
  );
  await click('다시 시도');
  expect(titles()).toEqual(
    [...batch(), article(20)].map((item) => item.article.title),
  );
  expect(offsets()).toEqual(['0', '20', '20', '20', '20', '20']);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  expect(container.querySelector('button')).toBeNull();
});
```

- [x] articleListMoreStopsOnEmptyPageAndDoesNotOfferFinishedLists — 기존 회귀 이관
```ts
test('articleListMoreStopsOnEmptyPageAndDoesNotOfferFinishedLists', async () => {
  request.mockResolvedValueOnce(Response.json({ total: 100, items: batch() }));
  await mount();
  expectsObservedTail();
  request.mockResolvedValueOnce(Response.json({ total: 100, items: [] }));
  await intersect();
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  expect(container.querySelector('button')).toBeNull();
  expect(container.textContent).not.toContain('아직 수집된 기사가 없어요');
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(offsets()).toEqual(['0', '20']);
  await intersect();
  expect(request).toHaveBeenCalledTimes(2);

  await act(async () => root.render(null));
  request.mockResolvedValueOnce(Response.json({ total: 99, items: [] }));
  await mount();
  expect(titles()).toEqual([]);
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    '아직 수집된 기사가 없어요',
  );
  expect(container.querySelector('button')).toBeNull();
  expect(container.querySelector('[role="alert"]')).toBeNull();

  await act(async () => root.render(null));
  request.mockResolvedValueOnce(Response.json({ total: 20, items: batch() }));
  await mount();
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  expect(container.querySelector('button')).toBeNull();
  expect(offsets()).toEqual(['0', '20', '0', '0']);
  expect(request).toHaveBeenCalledTimes(4);
});
```

- [x] articleInfiniteScrollFallbackLoadsNearViewportAndCleansUp — 신규 회귀
```ts
test('articleInfiniteScrollFallbackLoadsNearViewportAndCleansUp', async () => {
  vi.stubGlobal('IntersectionObserver', undefined);
  request.mockResolvedValueOnce(Response.json({ total: 21, items: batch() }));
  request.mockResolvedValueOnce(
    Response.json({ total: 21, items: [article(20)] }),
  );
  await mount();
  await act(async () => {
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
  });
  expect(titles()).toHaveLength(21);
  expect(offsets()).toEqual(['0', '20']);
  expect(container.querySelector('button')).toBeNull();

  await act(async () => root.render(null));
  const calls = request.mock.calls.length;
  await act(async () => {
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
  });
  expect(request).toHaveBeenCalledTimes(calls);
});
```

## Node — src/features/search/ui/search-results/search-results.test.ts

```ts
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
```

- [x] searchMoreAppendsDeduplicatedPagesWithRawOffsets — 기존 회귀 이관
```ts
test('searchMoreAppendsDeduplicatedPagesWithRawOffsets', async () => {
  const first = [...batch().slice(0, 19), article(0)];
  const second = [article(0), ...batch(19).slice(0, 19)];
  request.mockResolvedValueOnce(Response.json({ total: 43, items: first }));
  await mount('  서울 & 화재?#  ');
  expect(titles()).toEqual(
    first.slice(0, 19).map((item) => item.article.title),
  );
  request.mockResolvedValueOnce(Response.json({ total: 43, items: second }));
  await intersect();
  expect(titles()).toEqual(Array.from({ length: 38 }, (_, i) => '기사 ' + i));
  request.mockResolvedValueOnce(
    Response.json({
      total: 43,
      items: [article(38), article(38), article(39)],
    }),
  );
  await intersect();
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
```

- [x] searchMorePendingFailureAndRetryPreserveLoadedArticles — 기존 회귀 이관
```ts
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
  await intersect(false);
  expect(request).toHaveBeenCalledTimes(1);
  await act(async () => {
    dispatchIntersections();
    dispatchIntersections();
  });
  expect(request).toHaveBeenCalledTimes(2);
  expect(
    container.querySelector('[role="status"][aria-busy="true"]'),
  ).not.toBeNull();
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
  const failedCalls = request.mock.calls.length;
  await intersect();
  await intersect();
  expect(request).toHaveBeenCalledTimes(failedCalls);
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
```

- [x] searchMoreResetsOnKeywordChangeAndIgnoresLatePages — 기존 회귀 이관
```ts
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
  await intersect();
  expect(request).toHaveBeenCalledTimes(2);
  request.mockResolvedValueOnce(
    Response.json({ total: 60, items: batch(100) }),
  );
  await mount('다른 검색');
  expect(titles()).toEqual(batch(100).map((item) => item.article.title));
  await act(async () => finish(Response.json({ total: 40, items: batch(20) })));
  expect(titles()).toEqual(batch(100).map((item) => item.article.title));
  request.mockResolvedValueOnce(Response.json({ total: 60, items: [] }));
  await intersect();
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
```

## Node — src/app/search/recommendation-loading.test.ts

```ts
// file: src/app/search/recommendation-loading.test.ts
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp, rm, symlink } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { chromium, type Browser } from 'playwright-core';
import { expect, test } from 'vitest';

const execute = promisify(execFile);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function listen(server: Server) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return (server.address() as AddressInfo).port;
}

async function stop(child?: ChildProcess) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  await Promise.race([exited, wait(2000)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await exited;
  }
}

async function ready(origin: string, app: ChildProcess, output: () => string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (app.exitCode !== null) throw new Error(output());
    try {
      const response = await fetch(origin + '/search', {
        signal: AbortSignal.timeout(1000),
      });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // Wait only for the owned local Next server to start.
    }
    await wait(100);
  }
  throw new Error('Next server did not start: ' + output());
}
```

- [x] recommendedKeywordShowsPendingUntilResultsArrive — 기존 회귀 이관
```ts
test('recommendedKeywordShowsPendingUntilResultsArrive', async () => {
  let releaseResponse!: () => void;
  const heldResponse = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  let markRequested!: () => void;
  const requested = new Promise<void>((resolve) => {
    markRequested = resolve;
  });
  const requests: string[] = [];
  const api = createServer(async (request, response) => {
    const keyword =
      new URL(request.url ?? '/', 'http://fixture.invalid').searchParams.get(
        'keyword',
      ) ?? '';
    requests.push(keyword);
    if (keyword === '교통통제') {
      markRequested();
      await heldResponse;
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify({
        total: 1,
        items: [
          {
            article_id: 'a'.repeat(64),
            image_status: 'disabled',
            image_url: null,
            article: {
              title: keyword + ' 검증 기사',
              description: '로컬 회귀 검증 응답',
              pubDate: '2026-10-07T00:00:00Z',
              originallink: 'https://example.invalid/news',
              link: '',
            },
          },
        ],
      }),
    );
  });
  const directory = await mkdtemp(join(tmpdir(), 'search-pending-test-'));
  let app: ChildProcess | undefined;
  let browser: Browser | undefined;
  try {
    const apiPort = await listen(api);
    const reservation = createServer();
    const appPort = await listen(reservation);
    await new Promise<void>((resolve) => reservation.close(() => resolve()));
    for (const path of [
      'src',
      'package.json',
      'next.config.ts',
      'postcss.config.mjs',
      'tsconfig.json',
    ]) {
      await cp(join(process.cwd(), path), join(directory, path), {
        recursive: true,
      });
    }
    await symlink(
      join(process.cwd(), 'node_modules'),
      join(directory, 'node_modules'),
      'junction',
    );
    const env = {
      ...process.env,
      NEWS_API_BASE_URL: 'http://127.0.0.1:' + apiPort,
      NEXT_TELEMETRY_DISABLED: '1',
    };
    await execute(
      process.execPath,
      [
        join(process.cwd(), 'node_modules/next/dist/bin/next'),
        'build',
        '--webpack',
      ],
      { cwd: directory, env, timeout: 60000, maxBuffer: 8 * 1024 * 1024 },
    );
    app = spawn(
      process.execPath,
      [
        join(process.cwd(), 'node_modules/next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(appPort),
      ],
      { cwd: directory, env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let output = '';
    app.stdout?.on('data', (chunk) => {
      output += String(chunk);
    });
    app.stderr?.on('data', (chunk) => {
      output += String(chunk);
    });
    const origin = 'http://127.0.0.1:' + appPort;
    await ready(origin, app, () => output);
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({
      viewport: { width: 393, height: 852 },
    });
    await page.goto(origin + '/search?q=' + encodeURIComponent('화재'));
    await page.locator('article').waitFor();
    expect(await page.locator('article').innerText()).toContain(
      '화재 검증 기사',
    );
    for (const width of [320, 393, 640]) {
      await page.setViewportSize({ width, height: 852 });
      const geometry = await page.evaluate(() => {
        const form = document.querySelector('form[action="/search"]')!;
        const submit = form.querySelector('button')!;
        const fr = form.getBoundingClientRect();
        const sr = submit.getBoundingClientRect();
        const tabs = [
          ...document.querySelectorAll('nav[aria-label="주 메뉴"] a'),
        ].map((el) => el.getBoundingClientRect());
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          formHeight: fr.height,
          submitHeight: sr.height,
          contained: sr.top >= fr.top && sr.bottom <= fr.bottom,
          gaps: [tabs[1].left - tabs[0].right, tabs[2].left - tabs[1].right],
        };
      });
      expect(geometry.overflow).toBe(false);
      expect(geometry.formHeight).toBeGreaterThanOrEqual(44);
      expect(geometry.submitHeight).toBeGreaterThanOrEqual(44);
      expect(geometry.contained).toBe(true);
      expect(geometry.gaps.every((gap) => gap >= 8)).toBe(true);
    }
    await page.setViewportSize({ width: 393, height: 852 });
    const keywordLink = page.getByRole('link', { name: /교통통제/ });
    const beforePending = await keywordLink.boundingBox();
    expect(beforePending).not.toBeNull();
    await keywordLink.click();
    await Promise.race([
      requested,
      wait(10000).then(() => {
        throw new Error('추천 키워드 API 요청 없음');
      }),
    ]);
    const loading = page.getByRole('status').filter({ hasText: /검색.*불러/ });
    await loading.waitFor({ state: 'visible', timeout: 2500 });
    expect(await loading.getAttribute('aria-busy')).toBe('true');
    expect(await loading.locator('svg[aria-hidden="true"]').count()).toBe(1);
    const duringPending = await keywordLink.boundingBox();
    expect(duringPending).not.toBeNull();
    expect(Math.abs(duringPending!.width - beforePending!.width)).toBeLessThan(
      1,
    );
    expect(
      Math.abs(duringPending!.height - beforePending!.height),
    ).toBeLessThan(1);
    expect(await page.locator('article').innerText()).not.toContain(
      '교통통제 검증 기사',
    );
    releaseResponse();
    await page.waitForURL((url) => url.searchParams.get('q') === '교통통제');
    await page
      .locator('article')
      .filter({ hasText: '교통통제 검증 기사' })
      .waitFor();
    expect(
      await page
        .getByRole('searchbox', { name: '기사 키워드 검색' })
        .inputValue(),
    ).toBe('교통통제');
    expect(await loading.count()).toBe(0);
    expect(requests).toContain('교통통제');
  } finally {
    releaseResponse();
    await browser?.close();
    await stop(app);
    api.closeAllConnections();
    await new Promise<void>((resolve) => api.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
}, 90000);
```

## Node — src/components/feedback/loading-feedback.test.ts

```ts
// file: src/components/feedback/loading-feedback.test.ts
// @vitest-environment jsdom
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';

import SearchLoading from '@/app/search/loading';
import IncidentsLoading from '@/app/incidents/loading';
import ArticleDetailLoading from '@/app/incidents/[id]/loading';
import { KeywordLinkStatus } from '@/app/search/keyword-link-status';
import { MapHome } from '@/features/map/ui/map-home/map-home';

vi.mock('next/link', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/link')>()),
  useLinkStatus: () => ({ pending: true }),
}));
```

- [x] loadingFeedbackUsesDecorativeSkeletonsAndCompactAccessibleSpinners — 신규 회귀
```ts
test('loadingFeedbackUsesDecorativeSkeletonsAndCompactAccessibleSpinners', () => {
  for (const [Component, label] of [
    [IncidentsLoading, '사건을 불러오는 중'],
    [SearchLoading, '검색 결과를 불러오는 중'],
    [ArticleDetailLoading, '기사를 불러오는 중'],
  ] as const) {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(createElement(Component));
    const statuses = host.querySelectorAll('[role="status"]');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].getAttribute('aria-busy')).toBe('true');
    expect(statuses[0].textContent).toContain(label);
    expect(statuses[0].querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(host.querySelector('article, a, button, img')).toBeNull();
    expect(host.textContent).not.toMatch(/없어요|못했어요/);
  }

  for (const element of [
    createElement(KeywordLinkStatus),
    createElement(MapHome, { clientId: 'local-test-id' }),
  ]) {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(element);
    const status = host.querySelector('[role="status"][aria-busy="true"]');
    expect(status).not.toBeNull();
    expect(status?.textContent?.trim()).not.toBe('');
    expect(status?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  }
});
```
