import { afterEach, expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from '@/app/(browse)/@background/(map)/page';
import { MapCacheContext } from '../ui/map-home/map-cache-context';

const fetcher = vi.hoisted(() => vi.fn());
vi.mock('./fetch-map-articles', () => ({ fetchMapArticles: fetcher }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

test('home server markup retains its real map controls and structured data inside the host', async () => {
  fetcher.mockResolvedValue({
    total: 0,
    items: [],
    apiOrigin: 'https://news.example.com',
  });
  vi.stubEnv('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID', 'public-sdk-id');
  const page = await HomePage();
  const html = renderToStaticMarkup(
    createElement(
      MapCacheContext,
      { value: { cacheMap: vi.fn(), cached: false } },
      page,
    ),
  );
  expect(html).toContain('aria-label="주변 지도"');
  expect(html).toContain('aria-label="기간"');
  expect(html).toContain('application/ld+json');
  expect(html).toContain('내 위치');
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
