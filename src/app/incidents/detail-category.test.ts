import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const id = 'c'.repeat(64);
const detail = {
  article_id: id,
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

beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test.each([
  ['politics', 'politics'],
  [null, null],
  ['sports', null],
  [undefined, null],
])('detail category %s becomes %s', async (received, expected) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ ...detail, category: received })),
  );
  vi.resetModules();
  const { loadDetail: load } = await import('./[id]/load-detail');
  const result = await load(id);

  expect(result.status).toBe('success');
  expect(result.status === 'success' && result.item.category).toBe(expected);
});
