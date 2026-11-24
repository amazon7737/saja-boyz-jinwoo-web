import { afterEach, expect, test, vi } from 'vitest';

import { fetchArticleList } from './fetch-articles';

const base = {
  article_id: 'a'.repeat(64),
  image_status: 'disabled',
  image_url: null,
  article: {
    title: '제목',
    description: '설명',
    originallink: 'https://example.invalid/a',
    link: 'https://example.invalid/a',
    pubDate: 'Thu, 17 Sep 2026 09:00:00 +0900',
  },
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubResponse(items: unknown[], headers: Record<string, string> = {}) {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const request = vi
    .fn()
    .mockResolvedValue(
      Response.json({ total: items.length, items }, { headers }),
    );

  vi.stubGlobal('fetch', request);

  return request;
}

test('listRequestIncludesSelectedCategory', async () => {
  const request = stubResponse([], { 'X-News-Category': 'society' });

  const result = await fetchArticleList(
    undefined,
    0,
    'recent',
    undefined,
    undefined,
    20,
    'society',
  );

  expect(result).not.toBeNull();
  const url = new URL(String(request.mock.calls[0][0]));

  expect(url.searchParams.get('category')).toBe('society');
});

test('listRequestOmitsCategoryByDefault', async () => {
  const request = stubResponse([]);

  await fetchArticleList();

  expect(
    new URL(String(request.mock.calls[0][0])).searchParams.has('category'),
  ).toBe(false);
});

test('listRejectsResponseWithoutMatchingCategoryHeader', async () => {
  const wrong: Record<string, string>[] = [
    {},
    { 'X-News-Category': 'security' },
  ];

  for (const headers of wrong) {
    stubResponse([], headers);

    expect(
      await fetchArticleList(
        undefined,
        0,
        'recent',
        undefined,
        undefined,
        20,
        'society',
      ),
    ).toBeNull();
  }
});

test('listItemsKeepKnownCategoryAndFallBackToNull', async () => {
  stubResponse([
    { ...base, category: 'international' },
    { ...base, category: null },
    { ...base, category: 'sports' },
    base,
  ]);

  const result = await fetchArticleList();

  expect(result?.items.map((item) => item.category)).toEqual([
    'international',
    null,
    null,
    null,
  ]);
});
