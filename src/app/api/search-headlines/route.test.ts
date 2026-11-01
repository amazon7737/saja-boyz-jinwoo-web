import { afterEach, expect, test, vi } from 'vitest';
import { GET } from './route';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('searchHeadlinesProxyUsesTodayRankingAndCleansNaverTitleMarkup', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.test/private');
  const request = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        date: '2026-11-01',
        timezone: 'Asia/Seoul',
        items: [
          {
            article_id: 'a'.repeat(64),
            title: '<b>서울</b> 수사 &amp; 속보',
            views_today: 3,
          },
          { article_id: 'b'.repeat(64), title: '부산 소식', views_today: 1 },
        ],
      }),
    ),
  );
  vi.stubGlobal('fetch', request);
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    titles: ['서울 수사 & 속보', '부산 소식'],
  });
  expect(String(request.mock.calls[0][0])).toBe(
    'https://news.example.test/news/popular/today',
  );
  expect(request.mock.calls[0][1]).toMatchObject({
    cache: 'no-store',
    method: 'GET',
  });
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});

test.each([
  { status: 503, payload: { message: 'private upstream diagnostic' } },
  {
    status: 200,
    payload: {
      date: '2026-11-01',
      timezone: 'Asia/Seoul',
      items: [
        { article_id: 'a'.repeat(64), title: 'wrong counter', views_30d: 20 },
      ],
    },
  },
  { status: 200, payload: { date: '2026-11-01', timezone: 'UTC', items: [] } },
])(
  'searchHeadlinesRejectsUnavailableOrWrongRanking: %j',
  async ({ status, payload }) => {
    vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.test');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json(payload, { status })),
    );
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ titles: [] });
  },
);

test('searchHeadlinesWithoutServerConfigurationDoesNotFetch', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', '');
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  const response = await GET();
  expect(response.status).toBe(503);
  expect(request).not.toHaveBeenCalled();
});
