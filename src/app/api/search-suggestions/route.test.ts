import { expect, test, vi } from 'vitest';
import { GET } from './route';
import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

vi.mock('@/features/article-list/api/fetch-articles', () => ({
  fetchArticleList: vi.fn(),
}));

test('returns at most five safe article titles from the actual search results', async () => {
  const results = Array.from({ length: 6 }, (_, i) => ({
    article_id: String(i).repeat(64),
    article: { title: `<b>화재</b> &amp; ${i}` },
  }));
  vi.mocked(fetchArticleList).mockResolvedValueOnce({
    items: results,
    apiOrigin: 'https://example.com',
    total: 6,
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
  expect(body.items).toHaveLength(5);
  expect(body.items[0]).toEqual({ id: '0'.repeat(64), title: '화재 & 0' });
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
