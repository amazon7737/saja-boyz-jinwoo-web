// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

import IncidentsPage from '@/app/(browse)/@background/incidents/page';

import { ArticleFilters } from './article-filters';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ push, replace: vi.fn() }),
}));

async function withFilters(
  query: string,
  run: (host: HTMLElement) => Promise<void>,
) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const originalUrl = window.location.pathname + window.location.search;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);

  window.history.replaceState({}, '', `/incidents${query}`);
  push.mockClear();
  try {
    await act(async () =>
      root.render(createElement(ArticleFilters, { isHome: false })),
    );
    await run(host);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    window.history.replaceState({}, '', originalUrl);
    vi.unstubAllGlobals();
  }
}

function click(host: HTMLElement, label: string) {
  const found = [...host.querySelectorAll('button')].find(
    (node) =>
      (node.getAttribute('aria-label') ?? node.textContent?.trim()) === label,
  );

  if (!found) throw new Error(`button missing: ${label}`);

  return act(async () => found.click());
}

test('selectingACategoryWritesTheUrlAndKeepsOtherParams', async () => {
  await withFilters('?period=7d&sort=popular', async (host) => {
    await click(host, '카테고리');
    await click(host, '사회');

    expect(push).toHaveBeenCalledTimes(1);
    const target = new URL(push.mock.calls[0][0], 'https://example.test');

    expect(target.pathname).toBe('/incidents');
    expect(target.searchParams.get('category')).toBe('society');
    expect(target.searchParams.get('period')).toBe('7d');
    expect(target.searchParams.get('sort')).toBe('popular');
  });
});

test('allRemovesTheCategoryParamAndKeepsTheRest', async () => {
  await withFilters('?category=politics&period=7d', async (host) => {
    expect(host.querySelector('button[aria-label="카테고리: 정치"]')).not.toBe(
      null,
    );
    await click(host, '카테고리: 정치');
    await click(host, '전체');

    expect(push).toHaveBeenCalledWith('/incidents?period=7d');
  });
});

test('allWithNothingElseReturnsToThePlainListUrl', async () => {
  await withFilters('?category=security', async (host) => {
    await click(host, '카테고리: 안보');
    await click(host, '전체');

    expect(push).toHaveBeenCalledWith('/incidents');
  });
});

test('invalidOrRepeatedCategoryParamsShowTheUnfilteredLabel', async () => {
  for (const query of [
    '?category=bogus',
    '?category=society&category=politics',
  ]) {
    await withFilters(query, async (host) => {
      expect(host.querySelector('button[aria-label="카테고리"]')).not.toBe(
        null,
      );
    });
  }
});

test('incidentsPageSendsTheCategoryToTheServerAndRejectsMismatch', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  const requests: URL[] = [];
  let header: string | null = 'society';

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      requests.push(
        new URL(input instanceof Request ? input.url : String(input)),
      );

      return Response.json(
        { total: 0, items: [] },
        { headers: header ? { 'X-News-Category': header } : {} },
      );
    }),
  );
  try {
    for (const [value, expected] of [
      ['society', 'society'],
      ['bogus', null],
      [['society', 'politics'], null],
      [undefined, null],
    ] as const) {
      header = expected;
      await IncidentsPage({
        searchParams: Promise.resolve({
          category: value as string | string[] | undefined,
        }),
      });

      expect(requests.at(-1)?.searchParams.get('category')).toBe(expected);
    }
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

test('incidentsPageErrorLinkKeepsTheCategory', async () => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ total: 0, items: [] })),
  );
  try {
    const page = await IncidentsPage({
      searchParams: Promise.resolve({ category: 'politics' }),
    });
    const { renderToStaticMarkup } = await import('react-dom/server');

    expect(renderToStaticMarkup(page)).toContain(
      'href="/incidents?category=politics"',
    );
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});
