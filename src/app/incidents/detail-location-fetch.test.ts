// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import {
  ArticleSheetContext,
  type ArticleSheetRoute,
} from '@/features/article-detail/model/article-sheet-context';

import DetailPage from './[id]/page';

const id = 'a'.repeat(64);
const relatedId = 'b'.repeat(64);
const apiFetch = vi.fn<typeof fetch>();
const pendingArticle = {
  article_id: id,
  collection_id: 'detail-location',
  image_status: 'disabled',
  image_url: null,
  article: {
    title: '먼저 표시되는 기사 본문',
    description: '검증된 기사 내용',
    pubDate: '2026-11-06T02:00:00Z',
    originallink: 'https://publisher.example.invalid/news',
    link: '',
  },
};

vi.mock('./[id]/load-detail', () => ({
  loadDetail: async () => ({
    status: 'success',
    item: pendingArticle,
    apiOrigin: 'https://news.example.invalid',
  }),
}));
vi.mock('@/features/article-views/article-view-tracker', () => ({
  ArticleViewTracker: () => null,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/incidents/' + id,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => {
    throw new Error('TEST_NOT_FOUND');
  },
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', apiFetch);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  apiFetch.mockReset();
  vi.unstubAllGlobals();
});

test('directDetailLoadsVerifiedLocationWithoutBlockingArticle', async () => {
  let resolve!: (response: Response) => void;
  const pending = new Promise<Response>((done) => {
    resolve = done;
  });
  apiFetch.mockReturnValueOnce(pending);
  const page = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () => root.render(page));

  expect(container.textContent).toContain('먼저 표시되는 기사 본문');
  expect(container.textContent).not.toContain('부산 사하구');
  expect(apiFetch).toHaveBeenCalledOnce();
  expect(String(apiFetch.mock.calls[0][0])).toBe(
    '/api/incidents/' + id + '/location',
  );

  await act(async () => {
    resolve(
      Response.json({
        location: {
          latitude: 35.08,
          longitude: 128.96,
          label: '부산 사하구',
          precision: 'region',
        },
        related: [
          {
            articleId: relatedId,
            title: '같은 지역 기사',
            publishedAt: '2026-11-06T01:00:00Z',
            locationLabel: '부산 사하구',
          },
        ],
      }),
    );
    await pending;
  });

  expect(container.textContent).toContain('부산 사하구');
  expect(container.textContent).toContain('지역 대표 위치');
  expect(container.textContent).toContain('같은 지역 기사');
  expect(
    container.querySelector('a[href="/incidents/' + relatedId + '"]'),
  ).not.toBeNull();
});

test('mapContextUsesExistingVerifiedLocationWithoutAnotherRequest', async () => {
  const located = {
    ...pendingArticle,
    location_status: 'resolved' as const,
    location_reason: null,
    location: {
      latitude: 37.5,
      longitude: 127.1,
      label: '기존 지도 지역',
      precision: 'region' as const,
      evidence: { field: 'description' as const, text: '기사 내용' },
    },
  };
  const route: ArticleSheetRoute = {
    active: true,
    sourcePath: '/',
    height: 0,
    mapArticles: [located, { ...located, article_id: relatedId }],
    openArticle: vi.fn(),
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const page = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () =>
    root.render(createElement(ArticleSheetContext, { value: route }, page)),
  );
  expect(container.textContent).toContain('기존 지도 지역');
  expect(
    container.querySelector('a[href="/incidents/' + relatedId + '"]'),
  ).not.toBeNull();
  expect(apiFetch).not.toHaveBeenCalled();
});

test('locationErrorCanRetryAndEmptyLocationDoesNotInventData', async () => {
  apiFetch.mockResolvedValueOnce(new Response(null, { status: 503 }));
  apiFetch.mockResolvedValueOnce(
    Response.json({ location: null, related: [] }),
  );
  const page = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () => root.render(page));
  await act(async () => {});
  expect(container.textContent).toContain('먼저 표시되는 기사 본문');
  expect(container.textContent).toContain('위치를 불러오지 못했어요');
  const retry = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === '다시 시도',
  );
  expect(retry).toBeDefined();
  await act(async () => retry!.click());
  await act(async () => {});
  expect(apiFetch).toHaveBeenCalledTimes(2);
  expect(container.textContent).not.toContain('위치를 불러오지 못했어요');
  expect(container.textContent).not.toContain('지역 대표 위치');
  expect(container.textContent).toContain('먼저 표시되는 기사 본문');
});

test('changingArticleAbortsPreviousLookupAndDiscardsLateResponse', async () => {
  const nextId = 'c'.repeat(64);
  let resolveOld!: (response: Response) => void;
  let resolveNext!: (response: Response) => void;
  const oldResponse = new Promise<Response>((resolve) => {
    resolveOld = resolve;
  });
  const nextResponse = new Promise<Response>((resolve) => {
    resolveNext = resolve;
  });
  apiFetch.mockReturnValueOnce(oldResponse).mockReturnValueOnce(nextResponse);
  const page = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () => root.render(page));
  const firstSignal = apiFetch.mock.calls[0][1]?.signal;
  expect(firstSignal?.aborted).toBe(false);
  const nextPage = await DetailPage({
    params: Promise.resolve({ id: nextId }),
  });
  await act(async () => root.render(nextPage));
  expect(firstSignal?.aborted).toBe(true);
  expect(apiFetch).toHaveBeenCalledTimes(2);
  await act(async () => {
    resolveNext(
      Response.json({
        location: {
          latitude: 36,
          longitude: 127,
          label: '새 기사 지역',
          precision: 'region',
        },
        related: [],
      }),
    );
    await nextResponse;
  });
  await act(async () => {
    resolveOld(
      Response.json({
        location: {
          latitude: 35,
          longitude: 128,
          label: '이전 기사 지역',
          precision: 'region',
        },
        related: [],
      }),
    );
    await oldResponse;
  });
  expect(container.textContent).toContain('새 기사 지역');
  expect(container.textContent).not.toContain('이전 기사 지역');
});

test('malformedLocationResponseShowsRetryWithoutInventingCoordinates', async () => {
  apiFetch.mockResolvedValueOnce(
    Response.json({
      location: {
        latitude: 1000,
        longitude: 128,
        label: '틀린 지역',
        precision: 'region',
      },
      related: [],
    }),
  );
  const page = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () => root.render(page));
  await act(async () => {});
  expect(container.textContent).toContain('위치를 불러오지 못했어요');
  expect(container.textContent).not.toContain('틀린 지역');
  expect(container.textContent).toContain('먼저 표시되는 기사 본문');
});

test('unmountAbortsPendingLocationLookup', async () => {
  apiFetch.mockReturnValueOnce(new Promise<Response>(() => {}));
  const page = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () => root.render(page));
  const signal = apiFetch.mock.calls[0][1]?.signal;
  expect(signal?.aborted).toBe(false);
  await act(async () => root.render(null));
  expect(signal?.aborted).toBe(true);
});

test('serverRenderedArticleDoesNotWaitForLocationLookup', async () => {
  const page = await DetailPage({ params: Promise.resolve({ id }) });
  const html = renderToStaticMarkup(page);
  expect(html).toContain('먼저 표시되는 기사 본문');
  expect(html).toContain('검증된 기사 내용');
  expect(html).toContain('application/ld+json');
  expect(apiFetch).not.toHaveBeenCalled();
});

test.each(['/search?q=%ED%99%94%EC%9E%AC', '/incidents'])(
  'detailFromListOrSearchLoadsLocationWhenMapContextIsEmpty: %s',
  async (sourcePath) => {
    apiFetch.mockResolvedValueOnce(
      Response.json({
        location: {
          latitude: 36,
          longitude: 127,
          label: '검색된 지역',
          precision: 'region',
        },
        related: [
          {
            articleId: relatedId,
            title: '같은 지역 기사',
            publishedAt: '2026-11-06T01:00:00Z',
            locationLabel: '검색된 지역',
          },
        ],
      }),
    );
    const route: ArticleSheetRoute = {
      active: true,
      sourcePath,
      height: 0,
      mapArticles: [],
      openArticle: vi.fn(),
      close: vi.fn(),
      setHeight: vi.fn(),
      registerMapArticles: vi.fn(),
      retry: vi.fn(),
    };
    const page = await DetailPage({ params: Promise.resolve({ id }) });
    await act(async () =>
      root.render(createElement(ArticleSheetContext, { value: route }, page)),
    );
    await act(async () => {});
    expect(apiFetch).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('검색된 지역');
    expect(container.textContent).toContain('같은 지역 기사');
    expect(
      container.querySelector('a[href="/incidents/' + relatedId + '"]'),
    ).not.toBeNull();
  },
);
