// file: src/components/layout/article-filters/article-period-query.test.ts
// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

import IncidentsPage from '@/app/(browse)/@background/incidents/page';

import { ArticleFilters } from './article-filters';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

test('listPeriodQueryShowsTheSameFilterSentToTheServer', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const requests: URL[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      requests.push(url);
      const period = url.searchParams.get('period');

      return Response.json(
        { total: 0, items: [] },
        { headers: period ? { 'X-News-Period': period } : {} },
      );
    }),
  );

  const originalUrl = window.location.pathname + window.location.search;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);

  try {
    for (const [query, expected, label] of [
      ['', null, '기간'],
      ['period=7d', '7d', '기간: 최근 7일'],
      ['period=bogus', null, '기간'],
      ['period=7d&period=24h', null, '기간'],
      ['period=7d&period=7d', null, '기간'],
    ] as const) {
      window.history.replaceState(
        {},
        '',
        `/incidents${query ? `?${query}` : ''}`,
      );
      const values = new URLSearchParams(query).getAll('period');
      const serverValue = values.length > 1 ? values : values[0];

      await IncidentsPage({
        searchParams: Promise.resolve({ period: serverValue }),
      });
      await act(async () =>
        root.render(createElement(ArticleFilters, { isHome: false })),
      );

      expect(requests.at(-1)?.searchParams.get('period'), query).toBe(expected);
      expect(
        host
          .querySelector('button[aria-label^="기간"]')
          ?.getAttribute('aria-label'),
        query,
      ).toBe(label);
    }
  } finally {
    await act(async () => root.unmount());
    host.remove();
    window.history.replaceState({}, '', originalUrl);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});
