import { afterEach, expect, test, vi } from 'vitest';
import { GET } from './route';

const id = 'a'.repeat(64);
const id2 = 'b'.repeat(64);
const makeRequest = (...ids: string[]) => {
  const params = new URLSearchParams();
  ids.forEach((value) => params.append('id', value));
  return new Request(
    'https://example.invalid/api/search-popular-cards?' + params,
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('popularCardsProxyValidatesIdsAndReturnsSanitizedDetailsInOrder', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const value = new URL(String(input)).pathname.split('/').pop();
    if (value === id2) return new Response('', { status: 404 });
    return Response.json({
      article_id: value,
      image_status: 'ready',
      image_url: `/images/${value}.jpg`,
      privateField: 'secret',
      article: {
        title: '화재 소식',
        description: '기사 요약',
        pubDate: '2026-10-01',
        originallink: 'https://example.org',
        link: '',
        secret: 'secret',
      },
    });
  });
  vi.stubGlobal('fetch', fetcher);
  const response = await GET(makeRequest(id, id2));
  const json = await response.json();
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(json.items.map((item: { status: string }) => item.status)).toEqual([
    'success',
    'not-found',
  ]);
  expect(JSON.stringify(json)).not.toContain('secret');
  expect(json.items[0].item.article_id).toBe(id);
  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const invalid of [[], [id, id], ['../secret'], [id, id2, id, id2]]) {
    expect((await GET(makeRequest(...invalid))).status).toBe(400);
  }
  expect(fetcher).toHaveBeenCalledTimes(2);
});
