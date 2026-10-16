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
