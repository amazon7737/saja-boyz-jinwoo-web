import { afterEach, expect, test, vi } from 'vitest';

import { fetchMapArticles } from '@/features/map/api/fetch-map-articles';

import { GET } from './route';

vi.mock('@/features/map/api/fetch-map-articles', () => ({
  fetchMapArticles: vi.fn(),
}));

const id = 'a'.repeat(64);
const maps = vi.mocked(fetchMapArticles);

function request() {
  return new Request(
    'https://app.example.invalid/api/incidents/' + id + '/location',
  );
}

function params(articleId: string) {
  return { params: Promise.resolve({ id: articleId }) };
}

afterEach(() => {
  maps.mockReset();
});

test('locationApiDistinguishesInvalidIdMissingLocationAndProviderFailure', async () => {
  const invalid = await GET(request(), params('../invalid'));
  expect(invalid.status).toBe(400);
  expect(invalid.headers.get('cache-control')).toContain('no-store');
  expect(await invalid.json()).toEqual({ error: 'invalid_article_id' });
  expect(maps).not.toHaveBeenCalled();

  const incoming = request();
  maps.mockResolvedValueOnce({
    items: [],
    total: 0,
    apiOrigin: 'https://private.example.invalid',
  });
  const missing = await GET(incoming, params(id));
  expect(missing.status).toBe(200);
  expect(missing.headers.get('cache-control')).toContain('no-store');
  expect(await missing.json()).toEqual({ location: null, related: [] });
  expect(maps).toHaveBeenLastCalledWith(incoming.signal);

  maps.mockResolvedValueOnce(null);
  const failed = await GET(request(), params(id));
  expect(failed.status).toBe(503);
  expect(failed.headers.get('cache-control')).toContain('no-store');
  expect(await failed.json()).toEqual({ error: 'location_unavailable' });
});
