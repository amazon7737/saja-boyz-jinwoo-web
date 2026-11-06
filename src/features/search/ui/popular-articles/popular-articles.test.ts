// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';

import { SearchPromptProvider } from '../../model/use-rolling-search-prompt';
import { PopularArticles } from './popular-articles';
import { PopularArticleCard } from './popular-article-card';
import { SearchHeader } from '@/components/layout/search-header/search-header';

vi.mock('next/link', () => ({ default: 'a' }));
vi.mock('next/image', () => ({ default: 'img' }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const first = 'a'.repeat(64);
const second = 'b'.repeat(64);
const ranking = [
  { article_id: first, title: '첫 번째', views_today: 5 },
  { article_id: second, title: '두 번째', views_today: 3 },
];
function card(id: string, title: string, image_url: string | null = null) {
  return {
    id,
    status: 'success',
    apiOrigin: 'https://news.example.invalid',
    item: {
      article_id: id,
      image_status: 'ready',
      image_url,
      article: {
        title,
        description: '사건 설명',
        pubDate: '2026-10-01',
        originallink: 'https://example.org',
        link: '',
      },
    },
  };
}
let root: Root | undefined;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
async function mount() {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root!.render(
      createElement(
        SearchPromptProvider,
        null,
        createElement(SearchHeader, { isHome: true }),
        createElement(PopularArticles),
      ),
    ),
  );
  return host;
}

test('popularArticlesSharesRankingAndKeepsRankOrderAndSafeImages', async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) === '/api/search-headlines')
      return Response.json({
        titles: ranking.map((x) => x.title),
        items: ranking,
      });
    return Response.json({
      items: [
        card(first, '첫 번째', `/images/${first}.jpg`),
        card(second, '두 번째', 'https://unsafe.invalid/other.jpg'),
      ],
    });
  });
  vi.stubGlobal('fetch', fetcher);
  const host = await mount();
  const titles = [...host.querySelectorAll('article h3')].map(
    (x) => x.textContent,
  );
  expect(titles).toEqual(['첫 번째', '두 번째']);
  expect(host.querySelector(`a[href="/incidents/${first}"]`)).not.toBeNull();
  expect(host.textContent).toContain('1위');
  expect(host.textContent).toContain('2위');
  expect(host.textContent).not.toContain('사건 설명');
  expect(host.textContent).not.toContain('기사 원문');
  expect(host.querySelector('article')?.className).toContain(
    'grid-cols-[60px_minmax(0,1fr)]',
  );
  expect(host.querySelector('article')?.className).toContain('p-3.5');
  expect(host.querySelector('article time')).not.toBeNull();
  expect(
    host.querySelector('img[src="https://unsafe.invalid/other.jpg"]'),
  ).toBeNull();
  expect(
    fetcher.mock.calls
      .map((args) => String(args[0]))
      .filter((url) => url === '/api/search-headlines'),
  ).toHaveLength(1);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test('popularArticlesDistinguishesEmptyFromFailureAndRetriesRanking', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ titles: [] }, { status: 503 }))
    .mockResolvedValueOnce(Response.json({ titles: [], items: [] }));
  vi.stubGlobal('fetch', fetcher);
  const host = await mount();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    '불러오지 못했어요',
  );
  expect(host.textContent).not.toContain('아직 오늘 조회된 기사가 없어요');
  const retry = host.querySelector('button');
  expect(retry?.textContent).toBe('다시 시도');
  await act(async () => retry!.click());
  expect(host.textContent).toContain('아직 오늘 조회된 기사가 없어요');
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test('popularArticlesShowsPartialFailureAndRetriesDetails', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ titles: ranking.map((x) => x.title), items: ranking }),
    )
    .mockResolvedValueOnce(
      Response.json({
        items: [card(first, '첫 번째'), { id: second, status: 'error' }],
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        items: [card(first, '첫 번째'), card(second, '두 번째')],
      }),
    );
  vi.stubGlobal('fetch', fetcher);
  const host = await mount();
  expect(host.querySelectorAll('article')).toHaveLength(1);
  expect(host.querySelector('[role="alert"]')).not.toBeNull();
  await act(async () => host.querySelector('button')!.click());
  expect(host.querySelectorAll('article')).toHaveLength(2);
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(3);
});

test('popularArticlesConvertsDetailTimeoutIntoRetryableFailure', async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ titles: ranking.map((x) => x.title), items: ranking }),
      )
      .mockImplementationOnce(
        (_url, { signal }: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) =>
            signal.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            ),
          ),
      ),
  );
  const host = await mount();
  expect(
    host.querySelector('[role="status"][aria-busy="true"]'),
  ).not.toBeNull();
  await act(async () => vi.advanceTimersByTime(7001));
  expect(host.querySelector('[role="status"][aria-busy="true"]')).toBeNull();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    '불러오지 못했어요',
  );
  expect(host.querySelector('button')?.textContent).toBe('다시 시도');
});

test('popularArticleCardHydratesWithStableTimeBeforeShowingRelativeTime', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  const item = card(first, '첫 번째').item;
  const props = { item, apiOrigin: 'https://news.example.invalid', now: null };
  host.innerHTML = renderToString(createElement(PopularArticleCard, props));
  const onRecoverableError = vi.fn();
  await act(async () => {
    root = hydrateRoot(host, createElement(PopularArticleCard, props), {
      onRecoverableError,
    });
  });
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(host.querySelector('time')?.textContent).toContain('KST');
  await act(async () =>
    root!.render(
      createElement(PopularArticleCard, {
        ...props,
        now: new Date('2026-10-01T22:00:00Z'),
      }),
    ),
  );
  expect(host.querySelector('time')?.textContent).toBe('22시간 전');
  expect(host.querySelector('time')?.getAttribute('datetime')).toBe(
    '2026-10-01T00:00:00.000Z',
  );
  expect(host.querySelector('time')?.getAttribute('title')).toContain(
    '기사 발행',
  );
});

test('popularArticlesShowsSkeletonUntilRetriedDetailsSettle', async () => {
  let finishRetry!: (response: Response) => void;
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ titles: ranking.map((x) => x.title), items: ranking }),
    )
    .mockResolvedValueOnce(
      Response.json({
        items: [card(first, '첫 번째'), { id: second, status: 'error' }],
      }),
    )
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finishRetry = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetcher);
  const host = await mount();
  expect(host.querySelectorAll('article')).toHaveLength(1);
  expect(host.querySelector('[role="alert"]')).not.toBeNull();
  await act(async () => host.querySelector('button')!.click());
  expect(host.querySelectorAll('article')).toHaveLength(0);
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(
    host.querySelector('[role="status"][aria-busy="true"]'),
  ).not.toBeNull();
  await act(async () =>
    finishRetry(
      Response.json({
        items: [card(first, '첫 번째'), card(second, '두 번째')],
      }),
    ),
  );
  expect(host.querySelectorAll('article')).toHaveLength(2);
  expect(host.querySelector('[role="alert"]')).toBeNull();
});
