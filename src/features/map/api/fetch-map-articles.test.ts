import { afterEach, expect, test, vi } from 'vitest';

import { fetchMapArticles } from './fetch-map-articles';

const article = {
  title: '동네 공장 화재',
  description: '부산광역시 사하구 장림동에서 화재가 발생했다.',
  originallink: 'https://example.com/article',
  link: 'https://example.com/article',
  pubDate: 'Wed, 14 Oct 2026 08:00:00 +0900',
};
const item = (index: number, resolved = false) => ({
  article_id: index.toString(16).padStart(64, '0'),
  collection_id: 'collection',
  article,
  image_status: 'disabled',
  image_url: null,
  location_status: resolved ? 'resolved' : 'unprocessed',
  location_reason: null,
  location: resolved
    ? {
        latitude: 35.083,
        longitude: 128.968,
        label: '부산광역시 사하구 장림동',
        precision: 'neighborhood',
        evidence: {
          field: 'description',
          text: '부산광역시 사하구 장림동에서',
        },
      }
    : null,
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('reads beyond the first page and keeps only verified resolved articles', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.com');
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        total: 101,
        items: Array.from({ length: 100 }, (_, n) => item(n)),
      }),
    )
    .mockResolvedValueOnce(
      Response.json({ total: 101, items: [item(100, true)] }),
    );
  vi.stubGlobal('fetch', fetcher);

  const result = await fetchMapArticles();

  expect(result).toEqual({
    total: 101,
    items: [item(100, true)],
    apiOrigin: 'https://news.example.com',
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(
    fetcher.mock.calls.map(([url]) => new URL(url).searchParams.get('offset')),
  ).toEqual(['0', '100']);
  for (const [url, options] of fetcher.mock.calls) {
    expect(new URL(url).pathname).toBe('/map/articles');
    expect(new URL(url).searchParams.get('limit')).toBe('100');
    expect(options).toMatchObject({ method: 'GET', cache: 'no-store' });
  }
});

test('rejects malformed location contracts instead of drawing misleading markers', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.com');
  const valid = item(1, true);
  const malformed = [
    { ...valid, location: { ...valid.location, latitude: 91 } },
    { ...valid, location: { ...valid.location, longitude: '128.968' } },
    { ...valid, location: { ...valid.location, precision: 'city' } },
    {
      ...valid,
      location: {
        ...valid.location,
        evidence: { field: 'description', text: '서울' },
      },
    },
    { ...valid, location_reason: 'provider_failed' },
    { ...valid, location_status: 'unprocessed' },
    { ...valid, article_id: '../unsafe' },
  ];
  for (const article of malformed) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ total: 1, items: [article] })),
    );
    expect(await fetchMapArticles()).toBeNull();
  }
});

test('distinguishes an empty response from provider failures and never loops on a short page', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.com');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ total: 0, items: [] })),
  );
  expect(await fetchMapArticles()).toEqual({
    total: 0,
    items: [],
    apiOrigin: 'https://news.example.com',
  });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })),
  );
  expect(await fetchMapArticles()).toBeNull();
  const malformed = vi
    .fn()
    .mockResolvedValue(Response.json({ total: 2, items: [] }));
  vi.stubGlobal('fetch', malformed);
  expect(await fetchMapArticles()).toBeNull();
  expect(malformed).toHaveBeenCalledTimes(1);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(Response.json({ total: 0, items: [item(1, true)] })),
  );
  expect(await fetchMapArticles()).toBeNull();
});

test('accepts catalog region precision without reclassifying it as a neighborhood or an exact address', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.com');
  const regionArticle = item(1, true);
  regionArticle.location!.precision = 'region';
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(Response.json({ total: 1, items: [regionArticle] })),
  );
  expect((await fetchMapArticles())?.items[0].location.precision).toBe(
    'region',
  );
});

test('discards a page set whose total changes instead of presenting a partial set as complete', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.com');
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ total: 2, items: [item(1, true)] }))
    .mockResolvedValueOnce(Response.json({ total: 3, items: [item(2, true)] }));
  vi.stubGlobal('fetch', fetcher);
  expect(await fetchMapArticles()).toBeNull();
});
