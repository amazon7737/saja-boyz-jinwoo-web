import { expect, test, vi } from 'vitest';
import { GET } from './route';
import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

vi.mock('@/features/article-list/api/fetch-articles', () => ({
  fetchArticleList: vi.fn(),
}));

test('returns at most six safe article titles from the actual search results', async () => {
  const results = Array.from({ length: 7 }, (_, i) => ({
    article_id: String(i).repeat(64),
    article: {
      title: `<b>화재</b> &amp; ${i}`,
      pubDate: '2026-10-15T06:00:00Z',
    },
    image_status: i === 0 ? 'ready' : 'disabled',
    image_url: `/images/${String(i).repeat(64)}.jpg`,
  }));
  vi.mocked(fetchArticleList).mockResolvedValueOnce({
    items: results,
    apiOrigin: 'https://example.com',
    total: 7,
  } as never);
  const request = new Request(
    'https://example.com/api/search-suggestions?q=%ED%99%94%EC%9E%AC',
  );
  const response = await GET(request);
  expect(fetchArticleList).toHaveBeenCalledWith(
    '화재',
    0,
    'recent',
    request.signal,
  );
  expect(response.headers.get('cache-control')).toBe('no-store');
  const body = await response.json();
  expect(body.items).toHaveLength(6);
  expect(body.items[0]).toEqual({
    id: '0'.repeat(64),
    title: '화재 & 0',
    publishedAt: '2026-10-15T06:00:00.000Z',
    imageUrl: `https://example.com/images/${'0'.repeat(64)}.jpg`,
  });
  expect(body.items[1].imageUrl).toBeNull();
  expect(Object.keys(body.items[0]).sort()).toEqual([
    'id',
    'imageUrl',
    'publishedAt',
    'title',
  ]);
});

test('rejects invalid input and distinguishes unavailable results from an empty set', async () => {
  expect(
    (await GET(new Request('https://example.com/api/search-suggestions?q=a')))
      .status,
  ).toBe(400);
  vi.mocked(fetchArticleList).mockResolvedValueOnce(null);
  expect(
    (
      await GET(
        new Request('https://example.com/api/search-suggestions?q=abcd'),
      )
    ).status,
  ).toBe(503);
  vi.mocked(fetchArticleList).mockResolvedValueOnce({
    items: [],
    apiOrigin: 'https://example.com',
    total: 0,
  });
  const response = await GET(
    new Request('https://example.com/api/search-suggestions?q=abcd'),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ items: [] });
});

test('exposes only validated article image paths from a safe configured origin', async () => {
  const id = 'a'.repeat(64);
  const item = {
    article_id: id,
    article: { title: '화재', pubDate: '2026-10-15T06:00:00Z' },
    image_status: 'ready',
    image_url: `/images/${id}.jpg`,
  };
  const cases = [
    {
      origin: 'https://example.com',
      path: 'https://attacker.test/image.jpg',
      expected: null,
    },
    {
      origin: 'https://example.com',
      path: `/images/${'b'.repeat(64)}.jpg`,
      expected: null,
    },
    {
      origin: 'https://user:secret@example.com',
      path: `/images/${id}.jpg`,
      expected: null,
    },
    {
      origin: 'javascript:alert(1)',
      path: `/images/${id}.jpg`,
      expected: null,
    },
    {
      origin: 'https://example.com',
      path: `/images/${id}.jpg`,
      expected: `https://example.com/images/${id}.jpg`,
    },
  ];
  for (const { origin, path, expected } of cases) {
    vi.mocked(fetchArticleList).mockResolvedValueOnce({
      items: [{ ...item, image_url: path }],
      apiOrigin: origin,
      total: 1,
    } as never);
    const response = await GET(
      new Request('https://web.example.test/api/search-suggestions?q=fire'),
    );
    expect((await response.json()).items[0].imageUrl).toBe(expected);
  }
});
