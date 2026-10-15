# 기사 목록 API 연결 — 실패 테스트 초안

상태: 정확한 입력 승인 전. 기존 13개 테스트와 지원 파일은 변경하지 않는다.

## 실제 목록 라우트

```ts
// file: src/app/incidents/article-list-api.test.ts
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const loadingRoutes = import.meta.glob('./loading.tsx');
const apiOrigin = 'https://news.example.invalid';
const idA = 'e77553113fe8862b91aec1fd09a25af83e256ac12cb4a8ff7d8d78ea3050c909';
const idB = '6dd70b87676f579839c940ae6048bc6bf65d2005e1552c515b9a0151500b621a';
const item = {
  collection_id: '20261004T030000000000Z_00000000000000000000000000000000',
  article_id: idA,
  article: {
    title: '샘플: <b>교통</b> 안내 &amp; 점검',
    originallink: 'https://example.invalid/news/a',
    link: 'https://portal.example.invalid/news/a',
    description: '가상 &quot;안내&quot; &#39;검증&#39; &#xAC00;',
    pubDate: 'Thu, 17 Sep 2026 09:00:00 +0900',
  },
  image_status: 'disabled',
  image_url: null,
};
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function respond(items: unknown[], total = items.length) {
  fetchMock.mockResolvedValueOnce(Response.json({ total, items }));
}

async function renderPage() {
  vi.resetModules();
  const { default: IncidentsPage } = await import('./page');
  return renderToStaticMarkup(await IncidentsPage());
}

function cards(html: string): string[] {
  return html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? [];
}

function singleCard(html: string) {
  const rows = cards(html);
  expect(rows).toHaveLength(1);
  return rows[0];
}

function readRole(html: string, role: 'status' | 'alert') {
  return html.match(
    new RegExp(
      `<([a-z][a-z0-9]*)\\b([^>]*\\brole="${role}"[^>]*)>([\\s\\S]*?)<\\/\\1>`,
    ),
  );
}

function isLoadingModule(value: unknown): value is { default: ComponentType } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'default' in value &&
    typeof value.default === 'function'
  );
}

function expectError(html: string) {
  const alert = readRole(html, 'alert');
  expect(alert).not.toBeNull();
  expect(alert?.[3]).toContain('기사를 불러오지 못했어요');
  expect(alert?.[3]).toContain('다시 시도');
  expect(alert?.[3]).toContain('href="/incidents"');
  expect(html).not.toContain('아직 수집된 기사가 없어요');
  expect(cards(html)).toHaveLength(0);
}
```

- [x] articleApiRequest — 서버에서 최근 20개 수집 행을 GET으로 한 번 조회한다

```ts
test('articleApiRequest', async () => {
  respond([]);
  await renderPage();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [input, init] = fetchMock.mock.calls[0];
  const url = new URL(input instanceof Request ? input.url : String(input));
  expect(url.origin).toBe(apiOrigin);
  expect(url.pathname).toBe('/news');
  expect([...url.searchParams.entries()].sort()).toEqual([
    ['limit', '20'],
    ['offset', '0'],
  ]);
  expect(init?.method).toBe('GET');
  expect(init?.cache).toBe('no-store');
  expect(init?.body).toBeUndefined();
  expect(init?.signal).toBeInstanceOf(AbortSignal);
});
```

- [x] articleCardsIdentityAndPublication — 기사 ID 중복만 제거하고 제목·요약·발행 시각·원문을 표시한다

```ts
test('articleCardsIdentityAndPublication', async () => {
  respond(
    [
      item,
      {
        ...item,
        article_id: idB,
        article: {
          ...item.article,
          originallink: 'https://example.invalid/news/b',
          pubDate: 'Fri, 18 Sep 2099 12:00:00 +0900',
        },
      },
      {
        ...item,
        collection_id: 'older-collection',
        article: { ...item.article, title: '오래된 중복 제목' },
      },
    ],
    987654,
  );
  const html = await renderPage();
  const rows = cards(html);
  expect(html).toContain('사건 목록');
  expect(rows).toHaveLength(2);
  expect(rows[0]).toContain('샘플: 교통 안내 &amp; 점검');
  expect(rows[1]).toContain('샘플: 교통 안내 &amp; 점검');
  expect(rows[0]).toContain('가상 &quot;안내&quot; &#x27;검증&#x27; 가');
  expect(rows[0]).toContain('href="https://example.invalid/news/a"');
  expect(rows[1]).toContain('href="https://example.invalid/news/b"');
  expect(rows[0]).toContain('기사 발행');
  expect(rows[0]).toContain('dateTime="2026-09-17T00:00:00.000Z"');
  expect(rows[0]).toContain('2026-09-17 09:00 KST');
  expect(rows[1]).toContain('2099-09-18 12:00 KST');
  expect(html).not.toContain('987654');
  expect(html).not.toContain('987,654');
  expect(html).not.toContain('오래된 중복 제목');
  expect(html).not.toMatch(
    /data-category|data-status|📍|진행 중|발생 시각|전체 사건/,
  );
  expect(html).not.toContain('href="/incidents/');
  expect(html).not.toMatch(/<header\b|<nav\b/);
});
```

- [x] articleTextAndSourceSafety — 텍스트·위험한 출처·잘못된 발행 시각을 안전하게 표시한다

```ts
test('articleTextAndSourceSafety', async () => {
  for (const unsafe of [
    'javascript:alert(1)',
    'data:text/html,test',
    '/relative',
    '//other.invalid/a',
    'https://user:password@example.invalid/a',
  ]) {
    respond([
      {
        ...item,
        article: {
          ...item.article,
          title: '태그 <b>강조</b> &lt;img src=x onerror=alert(1)&gt;',
          description: '&apos;인용&apos;&nbsp;&#128240; &#x110000; &#xD800;',
          originallink: unsafe,
          link: 'https://portal.example.invalid/fallback',
          pubDate: 'invalid-date',
        },
      },
    ]);
    const row = singleCard(await renderPage());
    expect(row).toContain('태그 강조 &lt;img src=x onerror=alert(1)&gt;');
    expect(row).toContain('&#x27;인용&#x27;');
    expect(row).toContain('📰');
    expect(row).toContain('&amp;#x110000;');
    expect(row).toContain('&amp;#xD800;');
    expect(row).toContain('href="https://portal.example.invalid/fallback"');
    expect(row).toContain('기사 원문');
    expect(row).toContain('발행 시각 미확인');
    expect(row).not.toMatch(/<img\b|<b\b|<script\b|<time\b/);
    respond([
      {
        ...item,
        article: { ...item.article, originallink: unsafe, link: unsafe },
      },
    ]);
    const unlinked = singleCard(await renderPage());
    expect(unlinked).toContain('샘플: 교통 안내');
    expect(unlinked).toContain('원문 링크 없음');
    expect(unlinked).not.toMatch(/<a\b/);
  }
});
```

- [x] articleImageStates — 준비 완료된 같은 기사 이미지에만 AI 표시를 붙인다

```ts
test('articleImageStates', async () => {
  const imagePath = `/images/${idA}.jpg`;
  respond([{ ...item, image_status: 'ready', image_url: imagePath }]);
  const ready = singleCard(await renderPage());
  expect(ready).toContain(`src="${apiOrigin}${imagePath}"`);
  expect(ready).toContain('AI 생성 이미지');
  expect(ready).toMatch(/width="80"/);
  expect(ready).toMatch(/height="80"/);
  for (const imageStatus of ['disabled', 'pending', 'generating', 'failed']) {
    respond([{ ...item, image_status: imageStatus, image_url: imagePath }]);
    const row = singleCard(await renderPage());
    expect(row).toContain('이미지 없음');
    expect(row).not.toMatch(/<img\b/);
    expect(row).not.toContain('AI 생성 이미지');
  }
  for (const imageUrl of [
    null,
    'javascript:alert(1)',
    '//other.invalid/image.jpg',
    'https://other.invalid/image.jpg',
    `/images/${idB}.jpg`,
  ]) {
    respond([{ ...item, image_status: 'ready', image_url: imageUrl }]);
    const row = singleCard(await renderPage());
    expect(row).toContain('이미지 없음');
    expect(row).not.toMatch(/<img\b/);
    expect(row).not.toContain('AI 생성 이미지');
  }
});
```

- [x] articleEmpty — 조회 성공 0건의 안내를 상태 영역에 표시한다

```ts
test('articleEmpty', async () => {
  respond([]);
  const html = await renderPage();
  const status = readRole(html, 'status');
  expect(status).not.toBeNull();
  expect(status?.[3]).toContain('아직 수집된 기사가 없어요');
  expect(html).not.toContain('role="alert"');
  expect(html).not.toContain('기사를 불러오지 못했어요');
  expect(html).not.toContain('사건을 불러오는 중');
  expect(html).not.toContain('검색어나 필터를 바꿔보세요');
  expect(cards(html)).toHaveLength(0);
});
```

- [x] articleErrors — 설정·통신·JSON·응답 오류를 빈 결과와 구분한다

```ts
test('articleErrors', async () => {
  for (const baseUrl of [
    '',
    'not-a-url',
    'file:///tmp/news',
    'https://user:password@news.example.invalid',
  ]) {
    vi.stubEnv('NEWS_API_BASE_URL', baseUrl);
    expectError(await renderPage());
  }
  expect(fetchMock).not.toHaveBeenCalled();
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  fetchMock.mockResolvedValueOnce(
    new Response('upstream-secret', { status: 503 }),
  );
  const unavailable = await renderPage();
  expectError(unavailable);
  expect(unavailable).not.toContain('upstream-secret');
  fetchMock.mockRejectedValueOnce(new Error('private-network-detail'));
  const disconnected = await renderPage();
  expectError(disconnected);
  expect(disconnected).not.toContain('private-network-detail');
  fetchMock.mockResolvedValueOnce(new Response('invalid-json'));
  expectError(await renderPage());
  for (const payload of [
    null,
    { total: -1, items: [] },
    { total: 1, items: null },
    { total: 1, items: [{ ...item, article_id: '' }] },
    { total: 1, items: [{ ...item, article_id: 'not-an-article-id' }] },
    { total: 1, items: [{ ...item, article: { ...item.article, title: 42 } }] },
    {
      total: 1,
      items: [{ ...item, article: { ...item.article, description: null } }],
    },
    {
      total: 1,
      items: [{ ...item, article: { ...item.article, pubDate: 42 } }],
    },
  ]) {
    fetchMock.mockResolvedValueOnce(Response.json(payload));
    expectError(await renderPage());
  }
});
```

- [x] articleRequestTimeout — 지연된 요청을 취소하고 오류로 전환한다

```ts
test('articleRequestTimeout', async () => {
  let requestSignal: AbortSignal | null | undefined;
  fetchMock.mockImplementationOnce((_input, init) => {
    requestSignal = init?.signal;
    return new Promise<Response>((_resolve, reject) => {
      requestSignal?.addEventListener(
        'abort',
        () => reject(new DOMException('timeout', 'AbortError')),
        { once: true },
      );
    });
  });
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      renderPage(),
      new Promise<string>((resolve) => {
        deadline = setTimeout(() => resolve('REQUEST_DID_NOT_FINISH'), 7000);
      }),
    ]);
    expectError(result);
    expect(requestSignal?.aborted).toBe(true);
  } finally {
    clearTimeout(deadline);
  }
}, 10000);
```

- [x] articleLoading — 실제 loading 라우트가 기존 로딩 상태를 표시한다

```ts
test('articleLoading', async () => {
  const load = loadingRoutes['./loading.tsx'];
  expect(load).toBeTypeOf('function');
  const loadingModule = await load();
  assert(isLoadingModule(loadingModule));
  const html = renderToStaticMarkup(createElement(loadingModule.default));
  const status = readRole(html, 'status');
  expect(status).not.toBeNull();
  expect(status?.[2]).toContain('aria-busy="true"');
  expect(status?.[3]).toContain('사건을 불러오는 중');
  expect(html).not.toContain('아직 수집된 기사가 없어요');
  expect(html).not.toContain('기사를 불러오지 못했어요');
  expect(cards(html)).toHaveLength(0);
  expect(fetchMock).not.toHaveBeenCalled();
});
```
