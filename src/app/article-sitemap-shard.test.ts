import { afterEach, expect, test, vi } from 'vitest';

import { GET } from './article-sitemap/[id]/route';

const origin = 'https://hyunghyung.vercel.app';

function item(id: string) {
  return {
    article_id: id,
    image_status: 'disabled',
    image_url: null,
    article: {
      title: '기사 제목',
      description: '기사 요약',
      pubDate: '2026-11-20T09:00:00+09:00',
      originallink: 'https://news.example.invalid/article',
      link: 'https://news.example.invalid/article',
    },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('article sitemap shard fetches the requested batch and deduplicates IDs', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const firstId = 'a'.repeat(64);
  const secondId = 'b'.repeat(64);
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      total: 201,
      items: [item(firstId), item(firstId), item(secondId)],
    }),
  );
  vi.stubGlobal('fetch', request);

  const response = await GET(new Request(`${origin}/article-sitemap/1.xml`), {
    params: Promise.resolve({ id: '1.xml' }),
  });
  const xml = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('application/xml');
  expect(xml).toContain('<urlset');
  expect(
    xml.match(new RegExp(`${origin}/incidents/${firstId}`, 'g')),
  ).toHaveLength(1);
  expect(xml).toContain(`<loc>${origin}/incidents/${secondId}</loc>`);
  expect(request).toHaveBeenCalledTimes(1);
  const url = new URL(String(request.mock.calls[0][0]));
  expect(url.searchParams.get('offset')).toBe('100');
  expect(url.searchParams.get('limit')).toBe('100');
});

test('invalid shard paths do not call the article API', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const request = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', request);
  for (const id of [
    '-1.xml',
    '01.xml',
    '1',
    '1.xml.txt',
    '49999.xml',
    '9007199254740993.xml',
  ]) {
    const response = await GET(new Request(`${origin}/article-sitemap/test`), {
      params: Promise.resolve({ id }),
    });
    expect(response.status, id).toBe(404);
  }
  expect(request).not.toHaveBeenCalled();
});

test('shard errors are retryable and unknown batches return 404', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValueOnce(Response.json({ total: 201, items: [] }))
    .mockResolvedValueOnce(Response.json({ total: 0, items: [] }));
  vi.stubGlobal('fetch', request);

  async function shard(id: string) {
    return GET(new Request(`${origin}/article-sitemap/${id}`), {
      params: Promise.resolve({ id }),
    });
  }

  const failed = await shard('0.xml');
  expect(failed.status).toBe(503);
  expect(failed.headers.get('retry-after')).toBe('60');
  expect(failed.headers.get('cache-control')).toBe('no-store');
  const missingBatch = await shard('1.xml');
  expect(missingBatch.status).toBe(503);
  const outsideRange = await shard('0.xml');
  expect(outsideRange.status).toBe(404);
  expect(outsideRange.headers.get('cache-control')).toBe('no-store');
});

test('invalid article IDs are never emitted into XML', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ total: 1, items: [item('bad</loc><evil/>')] }),
      ),
  );
  const response = await GET(new Request(`${origin}/article-sitemap/0.xml`), {
    params: Promise.resolve({ id: '0.xml' }),
  });
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('<evil');
});

test('shard retries when its page exceeds the remaining reported total', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        total: 201,
        items: [item('a'.repeat(64)), item('b'.repeat(64))],
      }),
    ),
  );
  const response = await GET(new Request(`${origin}/article-sitemap/2.xml`), {
    params: Promise.resolve({ id: '2.xml' }),
  });
  expect(response.status).toBe(503);
  expect(response.headers.get('retry-after')).toBe('60');
});
