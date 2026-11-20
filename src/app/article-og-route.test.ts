import { afterEach, expect, test, vi } from 'vitest';

import { articleOgDetails } from '@/features/article-detail/model/article-og';

import { GET } from './og/incidents/[id]/route';

const id = 'a'.repeat(64);
const realFetch = globalThis.fetch;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test('fallbackWhenExternalGlyphRequestsDoNotRespond', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://api.example.test');
  const external: string[] = [];
  let title = '';
  const item = () => ({
    article_id: id,
    image_status: 'disabled',
    image_url: null,
    article: {
      title,
      description: '가상 기사',
      pubDate: '2026-11-20T00:00:00Z',
      originallink: 'https://news.example.test/one',
      link: '',
    },
  });

  // This test simulates stalled third-party glyph requests; production fetch remains unchanged.
  vi.stubGlobal(
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      );
      if (url.hostname === 'api.example.test') return Response.json(item());
      if (url.protocol === 'data:') return realFetch(input, init);
      external.push(url.hostname);
      return new Promise<Response>(() => {});
    },
  );

  for (title of ['화재 안내 🔥', '도로 안내 𠮷']) {
    const details = articleOgDetails(item(), 'https://api.example.test');
    expect(details).not.toBeNull();
    const started = performance.now();
    const response = await GET(
      new Request(`https://hyunghyung.vercel.app${details!.image.url}`),
      { params: Promise.resolve({ id: `${id}.png` }) },
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/og/site-v2.png');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(performance.now() - started).toBeLessThan(5000);
  }
  expect(external.length).toBeGreaterThan(0);
}, 12000);
