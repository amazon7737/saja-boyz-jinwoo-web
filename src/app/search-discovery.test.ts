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
