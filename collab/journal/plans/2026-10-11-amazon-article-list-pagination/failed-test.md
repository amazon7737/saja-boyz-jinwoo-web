# 기사 목록 페이지네이션 실패 테스트 초안

2026-10-11 · 사용자 승인 전. 기존 58개 테스트는 유지한다.

## 기사 목록 더 보기 사용자 흐름

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
```

- [x] articleListMoreAppendsWithRawOffsetsAndFirstSeenIdentity — 원본 행 기준 페이지 이동·중복 제거·짧은 페이지·최신 total 종료·추가 카드 연결

```ts
test('articleListMoreAppendsWithRawOffsetsAndFirstSeenIdentity', async () => {
  const first = [...batch().slice(0, 19), article(0)];
  request.mockResolvedValueOnce(Response.json({ total: 100, items: first }));
  await mount();
  expect(titles()).toEqual(
    first.slice(0, 19).map((item) => item.article.title),
  );
  expect(request).toHaveBeenCalledTimes(1);
  expect(button('더 보기').disabled).toBe(false);

  const duplicate = article(0);
  duplicate.article.title = '뒤늦은 중복 제목';
  request.mockResolvedValueOnce(
    Response.json({
      total: 100,
      items: Array.from({ length: 20 }, () => duplicate),
    }),
  );
  await click('더 보기');
  expect(titles()).toEqual(
    first.slice(0, 19).map((item) => item.article.title),
  );
  expect(button('더 보기').disabled).toBe(false);

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
  await click('더 보기');
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  expect(button('더 보기').disabled).toBe(false);
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
  await click('더 보기');
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

- [x] articleListMorePendingFailuresAndRetryPreserveArticles — 중복 클릭 방지·로딩·실패 시 기존 기사 유지·동일 페이지 재시도

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
  const more = button('더 보기');
  await act(async () => {
    more.click();
    more.click();
  });
  expect(request).toHaveBeenCalledTimes(2);
  expect(more.disabled).toBe(true);
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

- [x] articleListMoreStopsOnEmptyPageAndDoesNotOfferFinishedLists — 빈 다음 페이지 종료·빈 초기 결과·이미 끝난 목록의 더 보기 숨김

```ts
test('articleListMoreStopsOnEmptyPageAndDoesNotOfferFinishedLists', async () => {
  request.mockResolvedValueOnce(Response.json({ total: 100, items: batch() }));
  await mount();
  expect(button('더 보기').disabled).toBe(false);
  request.mockResolvedValueOnce(Response.json({ total: 100, items: [] }));
  await click('더 보기');
  expect(titles()).toEqual(batch().map((item) => item.article.title));
  expect(container.querySelector('button')).toBeNull();
  expect(container.textContent).not.toContain('아직 수집된 기사가 없어요');
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(offsets()).toEqual(['0', '20']);

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
