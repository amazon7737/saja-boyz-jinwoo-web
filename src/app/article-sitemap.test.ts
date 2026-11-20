import { afterEach, expect, test, vi } from 'vitest';

import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

import { escapeSitemapXml } from './article-sitemap-shared';
import { GET } from './article-sitemap.xml/route';

const origin = 'https://hyunghyung.vercel.app';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('article sitemap index lists 100-row shards with one API request', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ total: 201, items: [] }));
  vi.stubGlobal('fetch', request);

  const response = await GET();
  const xml = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('application/xml');
  expect(xml).toContain('<sitemapindex');
  for (const page of [0, 1, 2]) {
    expect(xml).toContain(`<loc>${origin}/article-sitemap/${page}.xml</loc>`);
  }
  expect(xml).not.toContain(`${origin}/article-sitemap/3.xml`);
  expect(request).toHaveBeenCalledTimes(1);
  const url = new URL(String(request.mock.calls[0][0]));
  expect(url.searchParams.get('offset')).toBe('0');
  expect(url.searchParams.get('limit')).toBe('100');
});

test('article sitemap index asks crawlers to retry upstream failures and rejects unsafe totals', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response('', { status: 503 }));
  vi.stubGlobal('fetch', request);

  const failed = await GET();
  expect(failed.status).toBe(503);
  expect(failed.headers.get('retry-after')).toBe('60');
  expect(failed.headers.get('cache-control')).toBe('no-store');

  request.mockResolvedValueOnce(Response.json({ total: 5_000_000, items: [] }));
  const tooMany = await GET();
  expect(tooMany.status).toBe(503);
  expect(tooMany.headers.get('retry-after')).toBe('60');
});

test('empty article index still points to the existing sitemap', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ total: 0, items: [] })),
  );
  const response = await GET();
  const xml = await response.text();
  expect(response.status).toBe(200);
  expect(xml).toContain(`<loc>${origin}/sitemap.xml</loc>`);
  expect(xml).not.toContain('/article-sitemap/0.xml');
});

test('inconsistent empty total does not hide articles from the index', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        total: 0,
        items: [
          {
            article_id: 'a'.repeat(64),
            image_status: 'disabled',
            image_url: null,
            article: {
              title: '기사 제목',
              description: '기사 요약',
              pubDate: '2026-11-20T09:00:00+09:00',
              originallink: 'https://news.example.invalid/article',
              link: 'https://news.example.invalid/article',
            },
          },
        ],
      }),
    ),
  );
  const response = await GET();
  expect(response.status).toBe(503);
  expect(response.headers.get('retry-after')).toBe('60');
});

test('sitemap escapes XML and rejects oversized API pages before sending requests', async () => {
  expect(escapeSitemapXml(`a&b<c>d"e'f`)).toBe(
    'a&amp;b&lt;c&gt;d&quot;e&apos;f',
  );
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const request = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', request);
  for (const limit of [0, -1, 101, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    expect(
      await fetchArticleList(
        undefined,
        0,
        undefined,
        undefined,
        undefined,
        limit,
      ),
    ).toBeNull();
  }
  expect(request).not.toHaveBeenCalled();
});
