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
