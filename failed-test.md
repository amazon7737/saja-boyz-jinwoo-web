# 검색·공유 기반 최적화 — 변수명 린트 수정 반영 정확 초안

최초 승인과 동일한 6개 신규 및 기존 보안1개 검증. 테스트 이름·기대값·fixture·검증 순서 유지. 신규 테스트의 지역 변수 module만 routeModule로 바꾼다.

## Node — src/app/search-discovery.test.ts

```ts
// file: src/app/search-discovery.test.ts
// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('TEST_SEO_NOT_FOUND');
  },
  usePathname: () => '/',
}));
const modules = import.meta.glob('./**/*.tsx');
const crawlModules = import.meta.glob('./{robots,sitemap}.ts');
const origin = 'https://hyunghyung.vercel.app';
const apiOrigin = 'https://news.example.invalid';
const id = 'a'.repeat(64);
const request = vi.fn<typeof fetch>();
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};
type Route = (props: Props) => ReactNode | Promise<ReactNode>;
type MetadataRoute = (props: Props) => Metadata | Promise<Metadata>;
function props(page?: string | string[], articleId = id): Props {
  return {
    params: Promise.resolve({ id: articleId }),
    searchParams: Promise.resolve({ page }),
  };
}
function item(articleId = id) {
  return {
    article_id: articleId,
    image_status: 'ready',
    image_url: '/images/' + articleId + '.jpg',
    article: {
      title: '교통 <b>안내</b> &amp; 점검',
      description: '도로 점검으로 우회가 필요합니다.',
      pubDate: '2026-10-10T09:00:00+09:00',
      originallink: 'https://publisher.example.invalid/article',
      link: 'https://portal.example.invalid/article',
    },
  };
}
async function load(path: string) {
  const loader = modules[path] ?? crawlModules[path];
  assert(loader, path + ' 공개 경로가 있어야 한다');
  return (await loader()) as Record<string, unknown>;
}
async function metadata(path: string, input = props()) {
  const routeModule = await load(path);
  if (typeof routeModule.generateMetadata === 'function')
    return (routeModule.generateMetadata as MetadataRoute)(input);
  assert(
    routeModule.metadata && typeof routeModule.metadata === 'object',
    path + ' 메타데이터가 있어야 한다',
  );
  return routeModule.metadata as Metadata;
}
function view(tree: ReactNode) {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(tree);
  return container;
}
function graphs(container: HTMLElement): Array<Record<string, unknown>> {
  return Array.from(
    container.querySelectorAll('script[type="application/ld+json"]'),
  ).flatMap((node) => {
    const parsed = JSON.parse(node.textContent ?? '{}');
    return Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : [parsed];
  });
}
beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  vi.stubGlobal('fetch', request);
});
afterEach(() => {
  request.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
```

- [x] searchDiscoveryUsesProductionBrandAndRouteMetadata — 명세의 실제 공개 동작 검증

```ts
test('searchDiscoveryUsesProductionBrandAndRouteMetadata', async () => {
  const root = await metadata('./layout.tsx');
  expect(
    root.metadataBase
      ? new URL(root.metadataBase.toString()).origin
      : undefined,
  ).toBe(origin);
  expect(root.title).toEqual({
    default: '흉흉 · 내 주변의 사건 사고',
    template: '%s · 흉흉 · 내 주변의 사건 사고',
  });
  expect(root.description).toContain('기사');
  expect(root.description).not.toMatch(/진행 상황|실시간.*확인/);
  expect(root.openGraph).toMatchObject({ siteName: '흉흉', locale: 'ko_KR' });
  expect(root.twitter).toMatchObject({ card: 'summary_large_image' });
  const image = readFileSync('public/og/site.png');
  expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(image.readUInt32BE(16)).toBe(1200);
  expect(image.readUInt32BE(20)).toBe(630);
  expect(await metadata('./page.tsx')).toMatchObject({
    alternates: { canonical: origin + '/' },
  });
  expect(await metadata('./incidents/page.tsx')).toMatchObject({
    title: '사건 사고 기사 목록',
    alternates: { canonical: origin + '/incidents' },
  });
  for (const path of ['./search/page.tsx', './report/layout.tsx']) {
    expect(await metadata(path)).toMatchObject({
      robots: { index: false, follow: true },
    });
  }
});
```

- [x] articleMetadataMatchesSummaryAndEscapesStructuredCitation — 명세의 실제 공개 동작 검증

```ts
test('articleMetadataMatchesSummaryAndEscapesStructuredCitation', async () => {
  const fixture = item();
  fixture.article.description =
    '도로 점검 &lt;/script&gt;&lt;img src=x onerror=alert(1)&gt; 안내';
  request.mockImplementation(async () => Response.json(fixture));
  const info = await metadata('./incidents/[id]/page.tsx');
  expect(info.title).toBe('교통 안내 & 점검');
  expect(info.description).toBe(
    '도로 점검 </script><img src=x onerror=alert(1)> 안내',
  );
  expect(info.alternates?.canonical).toBe(origin + '/incidents/' + id);
  expect(info.openGraph).toMatchObject({
    title: '교통 안내 & 점검',
    url: origin + '/incidents/' + id,
  });
  expect(info.twitter).toMatchObject({
    card: 'summary_large_image',
    title: '교통 안내 & 점검',
  });
  expect(JSON.stringify(info.openGraph)).not.toContain(apiOrigin + '/images/');
  expect(JSON.stringify(info)).not.toContain('publisher:');
  const routeModule = await load('./incidents/[id]/page.tsx');
  const container = view(await (routeModule.default as Route)(props()));
  expect(container.querySelector('h1')?.textContent).toBe(info.title);
  expect(
    container.querySelector('section[aria-label="기사 요약"]')?.textContent,
  ).toContain(info.description);
  const nodes = graphs(container);
  const page = nodes.find((node) => node['@type'] === 'WebPage');
  assert(page);
  expect(page.url).toBe(origin + '/incidents/' + id);
  expect(page.name).toBe(info.title);
  expect(page.description).toBe(info.description);
  expect(page.citation).toMatchObject({
    '@type': 'CreativeWork',
    name: '교통 안내 & 점검',
    url: fixture.article.originallink,
    datePublished: '2026-10-10T00:00:00.000Z',
  });
  expect(
    container.querySelector(
      'script:not([type="application/ld+json"]), img[onerror]',
    ),
  ).toBeNull();
  expect(
    container.querySelectorAll('script[type="application/ld+json"]'),
  ).toHaveLength(1);
  expect(
    container.querySelector('script[type="application/ld+json"]')?.textContent,
  ).not.toContain('</script>');
  expect(JSON.stringify(nodes)).not.toMatch(
    /"author"|"publisher"|"geo"|"startDate"|"dateModified"|"NewsArticle"/,
  );
  const invalid = item();
  invalid.article.pubDate = '2026-02-31T00:00:00Z';
  invalid.article.originallink = 'javascript:alert(1)';
  invalid.article.link = 'data:text/html,unsafe';
  request.mockImplementation(async () => Response.json(invalid));
  const safe = view(await (routeModule.default as Route)(props()));
  expect(JSON.stringify(graphs(safe))).not.toMatch(
    /javascript:|data:text|2026-02-31|datePublished/,
  );
});
```

- [x] articleMetadataErrorsAreNotIndexableArticles — 명세의 실제 공개 동작 검증

```ts
test('articleMetadataErrorsAreNotIndexableArticles', async () => {
  for (const badId of ['short', 'A'.repeat(64), '../news']) {
    await expect(
      metadata('./incidents/[id]/page.tsx', props(undefined, badId)),
    ).rejects.toThrow('TEST_SEO_NOT_FOUND');
  }
  expect(request).not.toHaveBeenCalled();
  request.mockResolvedValueOnce(new Response('', { status: 404 }));
  await expect(metadata('./incidents/[id]/page.tsx')).rejects.toThrow(
    'TEST_SEO_NOT_FOUND',
  );
  for (const response of [
    new Response('PRIVATE_UPSTREAM', { status: 503 }),
    new Response('not-json'),
    Response.json({ ...item(), article_id: 'b'.repeat(64) }),
  ]) {
    request.mockResolvedValueOnce(response);
    const info = await metadata('./incidents/[id]/page.tsx');
    expect(info.robots).toMatchObject({ index: false });
    expect(JSON.stringify(info)).not.toMatch(
      /PRIVATE_UPSTREAM|교통 안내|article:published_time/,
    );
  }
  request.mockReset();
  vi.stubEnv('NEWS_API_BASE_URL', '');
  expect((await metadata('./incidents/[id]/page.tsx')).robots).toMatchObject({
    index: false,
  });
  expect(request).not.toHaveBeenCalled();
});
```

- [x] crawlEndpointsListCanonicalRecentArticlesWithBoundedRequests — 명세의 실제 공개 동작 검증

```ts
test('crawlEndpointsListCanonicalRecentArticlesWithBoundedRequests', async () => {
  const robots = await load('./robots.ts');
  assert(typeof robots.default === 'function');
  const policy = await (robots.default as () => Record<string, unknown>)();
  expect(policy.sitemap).toBe(origin + '/sitemap.xml');
  const rules = Array.isArray(policy.rules) ? policy.rules : [policy.rules];
  const all = rules.find(
    (rule) => rule.userAgent === '*' || rule.userAgent?.includes('*'),
  );
  expect(all).toMatchObject({ allow: '/' });
  expect(JSON.stringify(all.disallow ?? [])).not.toMatch(
    /search|report|incidents|archive|about|_next/,
  );
  request.mockResolvedValueOnce(
    Response.json({
      total: 100000,
      items: [item(), item(), item('b'.repeat(64))],
    }),
  );
  const sitemap = await load('./sitemap.ts');
  assert(typeof sitemap.default === 'function');
  const entries = await (
    sitemap.default as () => Promise<Array<Record<string, unknown>>>
  )();
  const urls = entries.map((entry) => entry.url);
  expect(urls).toEqual(
    expect.arrayContaining([
      origin + '/',
      origin + '/incidents',
      origin + '/archive',
      origin + '/about',
      origin + '/incidents/' + id,
      origin + '/incidents/' + 'b'.repeat(64),
    ]),
  );
  expect(new Set(urls).size).toBe(urls.length);
  expect(
    urls.every(
      (url) => typeof url === 'string' && url.startsWith(origin + '/'),
    ),
  ).toBe(true);
  expect(urls.join(' ')).not.toMatch(/\/search|\/report|\?|#/);
  expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
  expect(request).toHaveBeenCalledTimes(1);
  const [input] = request.mock.calls[0];
  const apiUrl = new URL(String(input));
  expect(apiUrl.pathname).toBe('/news');
  expect(apiUrl.searchParams.get('offset')).toBe('0');
  expect(apiUrl.searchParams.get('limit')).toBe('20');
  request.mockReset();
  request.mockResolvedValueOnce(new Response('', { status: 503 }));
  const fallback = await (
    sitemap.default as () => Promise<Array<Record<string, unknown>>>
  )();
  expect(fallback.map((entry) => entry.url)).toEqual(
    expect.arrayContaining([
      origin + '/',
      origin + '/incidents',
      origin + '/archive',
      origin + '/about',
    ]),
  );
  expect(
    fallback.some((entry) => String(entry.url).includes('/incidents/')),
  ).toBe(false);
  expect(request).toHaveBeenCalledTimes(1);
});
```

- [ ] serverArchiveLinksOlderRawPagesWithoutReplacingInfiniteScroll — 명세의 실제 공개 동작 검증

```ts
test('serverArchiveLinksOlderRawPagesWithoutReplacingInfiniteScroll', async () => {
  const routeModule = await load('./archive/page.tsx');
  assert(typeof routeModule.default === 'function');
  const fixtures = Array.from({ length: 20 }, (_, index) =>
    item((index + 21).toString(16).padStart(64, '0')),
  );
  fixtures[1] = fixtures[0];
  request.mockImplementation(async () =>
    Response.json({ total: 41, items: fixtures }),
  );
  const container = view(await (routeModule.default as Route)(props('2')));
  expect(container.querySelectorAll('article')).toHaveLength(19);
  expect(container.querySelector('a[href="/archive"]')).not.toBeNull();
  expect(container.querySelector('a[href="/archive?page=3"]')).not.toBeNull();
  expect(
    container.querySelector(
      'a[href="/incidents/' + fixtures[0].article_id + '"]',
    ),
  ).not.toBeNull();
  expect(container.textContent).not.toMatch(/41.*(?:사건|사고)|더 보기/);
  for (const [input] of request.mock.calls)
    expect(new URL(String(input)).searchParams.get('offset')).toBe('20');
  expect(await metadata('./archive/page.tsx', props('2'))).toMatchObject({
    alternates: { canonical: origin + '/archive?page=2' },
  });
  expect(await metadata('./archive/page.tsx', props('1'))).toMatchObject({
    alternates: { canonical: origin + '/archive' },
  });
  request.mockReset();
  for (const page of ['0', '-1', '1.5', 'x', '9007199254740992']) {
    await expect((routeModule.default as Route)(props(page))).rejects.toThrow(
      'TEST_SEO_NOT_FOUND',
    );
  }
  expect(request).not.toHaveBeenCalled();
  request.mockImplementation(async () =>
    Response.json({ total: 41, items: [] }),
  );
  const end = view(await (routeModule.default as Route)(props('4')));
  expect(end.querySelector('a[href="/archive?page=5"]')).toBeNull();
  request.mockImplementation(async () => new Response('', { status: 503 }));
  const failed = view(await (routeModule.default as Route)(props('2')));
  expect(failed.querySelector('[role="alert"]')).not.toBeNull();
  expect(failed.querySelector('a[href="/archive?page=2"]')).not.toBeNull();
});
```

- [ ] serviceAnswersAreVisibleAndReachableWithoutMapJavaScript — 명세의 실제 공개 동작 검증

```ts
test('serviceAnswersAreVisibleAndReachableWithoutMapJavaScript', async () => {
  const routeModule = await load('./about/page.tsx');
  const container = view(await (routeModule.default as Route)(props()));
  expect(container.querySelector('h1')?.textContent).toContain('흉흉');
  for (const text of [
    '내 주변의 사건 사고',
    '기사 발행',
    '발생 시각',
    '지역 대표',
    '정확한',
    'AI 생성',
    '원문',
  ])
    expect(container.textContent).toContain(text);
  expect(container.querySelector('a[href="/incidents"]')).not.toBeNull();
  expect(container.querySelector('a[href="/archive"]')).not.toBeNull();
  expect(await metadata('./about/page.tsx')).toMatchObject({
    alternates: { canonical: origin + '/about' },
  });
  const list = await load('./incidents/page.tsx');
  request.mockResolvedValueOnce(Response.json({ total: 0, items: [] }));
  const listView = view(await (list.default as Route)(props()));
  expect(listView.querySelector('a[href="/archive"]')).not.toBeNull();
  expect(listView.querySelector('a[href="/about"]')).not.toBeNull();
  const home = await load('./page.tsx');
  vi.stubEnv('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID', '');
  const homeView = view(await (home.default as Route)(props()));
  expect(homeView.querySelector('a[href="/about"]')).not.toBeNull();
  expect(homeView.querySelector('a[href="/incidents"]')).not.toBeNull();
});
```

## Node — src/app/incidents/article-detail.test.ts

```ts
// file: src/app/incidents/article-detail.test.ts
// @vitest-environment jsdom
import { afterEach, assert, beforeEach, expect, test, vi } from 'vitest';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import DetailPage from './[id]/page';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('TEST_ARTICLE_NOT_FOUND');
  },
}));

const id = 'a'.repeat(64);
const apiOrigin = 'https://news.example.invalid';
const item = {
  collection_id: 'test-collection',
  article_id: id,
  article: {
    title: '교통 <b>안내</b> &amp; 점검',
    description: '도로 점검으로 우회가 필요합니다.',
    pubDate: '2026-10-10T09:00:00+09:00',
    originallink: 'https://publisher.example.invalid/article',
    link: 'https://portal.example.invalid/article',
  },
  image_status: 'ready',
  image_url: `/images/${id}.jpg`,
};
const fetchMock = vi.fn<typeof fetch>();
const detailRoute: (props: {
  params: Promise<{ id: string }>;
}) => ReactNode | void | Promise<ReactNode | void> = DetailPage;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', apiOrigin);
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  fetchMock.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState(null, '', '/');
});

async function detailTree(articleId = id) {
  return (
    (await detailRoute({ params: Promise.resolve({ id: articleId }) })) ?? null
  );
}

async function detailMarkup() {
  const outcome = await detailTree().then(
    (tree) => ({ tree }),
    (error: unknown) => ({ error }),
  );
  expect(outcome).not.toHaveProperty('error');
  assert('tree' in outcome);
  const view = document.createElement('div');
  view.innerHTML = renderToStaticMarkup(outcome.tree);
  return view;
}
```

- [ ] articleDetailSafePresentation — 기존 보안 검증 유지, 실행 스크립트 차단과 JSON-LD 정보 구분

```ts
test('articleDetailSafePresentation', async () => {
  for (const imageStatus of [
    'disabled',
    'pending',
    'generating',
    'failed',
    'unknown',
  ]) {
    fetchMock.mockResolvedValueOnce(
      Response.json({ ...item, image_status: imageStatus }),
    );
    const view = await detailMarkup();
    expect(view.querySelector('img')).toBeNull();
    expect(view.textContent).toContain('이미지 없음');
    expect(view.textContent).not.toContain('AI 생성 이미지');
  }
  for (const imageUrl of [
    null,
    'https://other.invalid/image.jpg',
    '//other.invalid/image.jpg',
    `/images/${'b'.repeat(64)}.jpg`,
  ]) {
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ...item,
        image_url: imageUrl,
        article: {
          ...item.article,
          title: '<b>안내</b> &lt;script&gt;alert(1)&lt;/script&gt;',
          description: '&quot;확인&quot; <img src=x onerror=alert(1)>',
          originallink: 'javascript:alert(1)',
          pubDate: 'invalid-date',
        },
      }),
    );
    const view = await detailMarkup();
    expect(view.querySelector('h1')?.textContent).toBe(
      '안내 <script>alert(1)</script>',
    );
    expect(view.textContent).toContain('"확인"');
    expect(
      view.querySelector(
        'script:not([type="application/ld+json"]), img, b, time',
      ),
    ).toBeNull();
    expect(
      view.querySelector('a[href="https://portal.example.invalid/article"]'),
    ).not.toBeNull();
    expect(view.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(view.textContent).toContain('발행 시각 미확인');
  }
  fetchMock.mockResolvedValueOnce(
    Response.json({
      ...item,
      article: {
        ...item.article,
        originallink: '//unsafe.invalid',
        link: 'data:text/html,unsafe',
      },
    }),
  );
  const view = await detailMarkup();
  expect(view.textContent).toContain('원문 링크 없음');
  expect(view.querySelector('a[href^="//"], a[href^="data:"]')).toBeNull();
});
```
