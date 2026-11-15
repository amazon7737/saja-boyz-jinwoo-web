// file: src/features/article-list/api/list-period.test.ts
import { afterEach, expect, test, vi } from 'vitest';

import { fetchArticleList } from './fetch-articles';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('listRequestIncludesSelectedPeriod', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const request = vi
    .fn()
    .mockResolvedValue(
      Response.json(
        { total: 0, items: [] },
        { headers: { 'X-News-Period': '7d' } },
      ),
    );
  vi.stubGlobal('fetch', request);

  const result = await Reflect.apply(fetchArticleList, undefined, [
    undefined,
    20,
    'popular',
    undefined,
    '7d',
  ]);

  expect(result).not.toBeNull();
  const url = new URL(String(request.mock.calls[0][0]));
  expect(url.searchParams.get('period')).toBe('7d');
  expect(url.searchParams.get('sort')).toBe('popular');
  expect(url.searchParams.get('offset')).toBe('20');
});
