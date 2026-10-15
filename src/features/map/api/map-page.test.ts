import { afterEach, expect, test, vi } from 'vitest';
import HomePage from '@/app/page';

const fetcher = vi.hoisted(() => vi.fn());
vi.mock('./fetch-map-articles', () => ({ fetchMapArticles: fetcher }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

test('home passes server-fetched map data to the map and skips the API when the SDK key is absent', async () => {
  const data = { total: 0, items: [], apiOrigin: 'https://news.example.com' };
  fetcher.mockResolvedValue(data);
  vi.stubEnv('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID', 'public-sdk-id');
  const page = await HomePage();
  expect(fetcher).toHaveBeenCalledOnce();
  expect(page.props).toMatchObject({
    clientId: 'public-sdk-id',
    articles: data,
  });
  fetcher.mockClear();
  vi.stubEnv('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID', '');
  await HomePage();
  expect(fetcher).not.toHaveBeenCalled();
});
