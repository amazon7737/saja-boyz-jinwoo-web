// file: src/app/incidents/detail-map.test.ts
// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import {
  ArticleSheetContext,
  type ArticleSheetRoute,
} from '@/features/article-detail/model/article-sheet-context';
import DetailPage from './[id]/page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/incidents/' + 'a'.repeat(64),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => {
    throw new Error('TEST_ARTICLE_NOT_FOUND');
  },
}));

const id = 'a'.repeat(64);
const article = {
  article_id: id,
  collection_id: 'map-detail-test',
  image_status: 'disabled',
  image_url: null,
  article: {
    title: '검증된 위치 기사',
    description: '서울 검증 지역 기사',
    pubDate: '2026-10-10T09:00:00+09:00',
    originallink: 'https://publisher.example.invalid/news',
    link: '',
  },
};
const located = {
  ...article,
  location_status: 'resolved' as const,
  location_reason: null,
  location: {
    latitude: 37.5,
    longitude: 127.1,
    label: '서울 검증 지역',
    precision: 'region' as const,
    evidence: { field: 'description' as const, text: '서울 검증 지역' },
  },
};
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('NEWS_API_BASE_URL', 'https://news.example.invalid');
  vi.stubEnv('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID', 'map-test-id');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json(article)),
  );
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  document
    .querySelectorAll('script[src*="oapi.map.naver.com"]')
    .forEach((script) => script.remove());
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('detailMapUsesVerifiedCoordinateAndCleansUpOnlyItsOwnMap', async () => {
  const destroy = vi.fn();
  const removeMarker = vi.fn();
  const map = { destroy, setSize: vi.fn(), setCenter: vi.fn() };
  const makeMap = vi.fn(function (element: HTMLElement, options: unknown) {
    void element;
    void options;
    return map;
  });
  const makeMarker = vi.fn(function (options: unknown) {
    void options;
    return { setMap: removeMarker };
  });
  class LatLng {
    constructor(
      public latitude: number,
      public longitude: number,
    ) {}
  }
  const maps = {
    Map: makeMap,
    Marker: makeMarker,
    LatLng,
    Size: class {},
    Point: class {},
  };
  vi.stubGlobal('naver', { maps });
  const auth = vi.fn();
  vi.stubGlobal('navermap_authFailure', auth);
  const script = document.createElement('script');
  script.src =
    'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=map-test-id';
  script.dataset.naverMapLoaded = 'true';
  document.head.append(script);
  const route: ArticleSheetRoute = {
    active: true,
    sourcePath: '/',
    height: 0,
    mapArticles: [located],
    openArticle: vi.fn(),
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const tree = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () =>
    root.render(createElement(ArticleSheetContext, { value: route }, tree)),
  );
  const section = container.querySelector<HTMLElement>(
    'section[aria-label="기사에서 확인한 위치"]',
  );
  expect(section).not.toBeNull();
  expect(section?.textContent).toContain('실제 발생 지점과 다를 수 있습니다');
  const canvas = section?.querySelector<HTMLElement>('[data-detail-map]');
  expect(canvas?.classList.contains('h-[100px]')).toBe(true);
  expect(makeMap).toHaveBeenCalledOnce();
  const mapOptions = makeMap.mock.calls[0][1] as {
    center: LatLng;
    draggable: boolean;
    scrollWheel: boolean;
    pinchZoom: boolean;
    keyboardShortcuts: boolean;
  };
  expect(mapOptions.center).toMatchObject({ latitude: 37.5, longitude: 127.1 });
  expect(mapOptions.draggable).toBe(false);
  expect(mapOptions.scrollWheel).toBe(false);
  expect(mapOptions.pinchZoom).toBe(false);
  expect(mapOptions.keyboardShortcuts).toBe(false);
  expect(makeMarker).toHaveBeenCalledOnce();
  const markerOptions = makeMarker.mock.calls[0][0] as {
    map: unknown;
    position: LatLng;
  };
  expect(markerOptions.map).toBe(map);
  expect(markerOptions.position).toMatchObject({
    latitude: 37.5,
    longitude: 127.1,
  });
  await act(async () => root.render(null));
  expect(removeMarker).toHaveBeenCalledWith(null);
  expect(destroy).toHaveBeenCalledOnce();
  expect(script.isConnected).toBe(true);
  expect(Reflect.get(window, 'navermap_authFailure')).toBe(auth);
});

test('detailMapKeepsArticleAndOffersRetryWhenTheSdkFails', async () => {
  const route: ArticleSheetRoute = {
    active: true,
    sourcePath: '/',
    height: 0,
    mapArticles: [located],
    openArticle: vi.fn(),
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const tree = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () =>
    root.render(createElement(ArticleSheetContext, { value: route }, tree)),
  );
  const section = container.querySelector<HTMLElement>(
    'section[aria-label="기사에서 확인한 위치"]',
  );
  const script = document.querySelector<HTMLScriptElement>(
    'script[src*="oapi.map.naver.com"]',
  );
  expect(script).not.toBeNull();
  await act(async () => script!.dispatchEvent(new Event('error')));
  expect(section?.textContent).toContain('위치 지도를 불러오지 못했어요');
  expect(section?.textContent).toContain(
    '지역 대표 위치로, 실제 발생 지점과 다를 수 있습니다',
  );
  expect(section?.querySelector('button')?.textContent).toBe('다시 시도');
  expect(container.querySelector('h1')?.textContent).toBe(
    article.article.title,
  );
  expect(container.textContent).toContain(article.article.description);
  expect(
    document.querySelector('script[src*="oapi.map.naver.com"]'),
  ).toBeNull();
});

test('detailMapShowsFallbackWhenSharedSdkIsRemovedAfterLoading', async () => {
  const destroy = vi.fn();
  const removeMarker = vi.fn();
  class LatLng {
    constructor(
      public latitude: number,
      public longitude: number,
    ) {}
  }
  class Map {
    destroy = destroy;
    setSize = vi.fn();
    setCenter = vi.fn();
  }
  class Marker {
    setMap = removeMarker;
  }
  vi.stubGlobal('naver', {
    maps: { LatLng, Map, Marker, Size: class {}, Point: class {} },
  });
  const auth = vi.fn();
  vi.stubGlobal('navermap_authFailure', auth);
  const script = document.createElement('script');
  script.src =
    'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=map-test-id';
  script.dataset.naverMapLoaded = 'true';
  document.head.append(script);
  const route: ArticleSheetRoute = {
    active: true,
    sourcePath: '/',
    height: 0,
    mapArticles: [located],
    openArticle: vi.fn(),
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const tree = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () =>
    root.render(createElement(ArticleSheetContext, { value: route }, tree)),
  );
  const section = container.querySelector<HTMLElement>(
    'section[aria-label="기사에서 확인한 위치"]',
  );
  expect(section?.textContent).not.toContain('위치 지도를 불러오지 못했어요');
  await act(async () => script.remove());
  expect(section?.textContent).toContain('위치 지도를 불러오지 못했어요');
  expect(container.querySelector('h1')?.textContent).toBe(
    article.article.title,
  );
  expect(removeMarker).toHaveBeenCalledWith(null);
  expect(destroy).toHaveBeenCalledOnce();
  expect(Reflect.get(window, 'navermap_authFailure')).toBe(auth);
});

test('directDetailLoadsLocationAndRetriesTheMapSdk', async () => {
  const destroy = vi.fn();
  const makeMap = vi.fn(function () {
    return { destroy, setSize: vi.fn() };
  });
  const makeMarker = vi.fn(function () {
    return { setMap: vi.fn() };
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) =>
      String(input).startsWith('/api/incidents/')
        ? Response.json({ location: located.location, related: [] })
        : Response.json(article),
    ),
  );
  const tree = await DetailPage({ params: Promise.resolve({ id }) });
  await act(async () => root.render(tree));
  const section = container.querySelector<HTMLElement>(
    'section[aria-label="기사에서 확인한 위치"]',
  );
  expect(section?.textContent).toContain('서울 검증 지역');
  expect(container.querySelector('h1')?.textContent).toBe(
    article.article.title,
  );
  const originalScript = document.querySelector<HTMLScriptElement>(
    'script[src*="oapi.map.naver.com"]',
  );
  expect(originalScript).not.toBeNull();
  await act(async () => originalScript!.dispatchEvent(new Event('error')));
  expect(section?.textContent).toContain('위치 지도를 불러오지 못했어요');
  const retry = [...section!.querySelectorAll('button')].find((button) =>
    button.textContent?.includes('다시'),
  );
  expect(retry).toBeDefined();
  await act(async () => retry!.click());
  const retryScript = document.querySelector<HTMLScriptElement>(
    'script[src*="oapi.map.naver.com"]',
  );
  expect(retryScript).not.toBeNull();
  expect(retryScript).not.toBe(originalScript);
  vi.stubGlobal('naver', {
    maps: {
      Map: makeMap,
      Marker: makeMarker,
      LatLng: class {},
      Size: class {},
      Point: class {},
    },
  });
  await act(async () => retryScript!.dispatchEvent(new Event('load')));
  expect(makeMap).toHaveBeenCalledOnce();
  expect(makeMarker).toHaveBeenCalledOnce();
  expect(section?.textContent).toContain('실제 발생 지점과 다를 수 있습니다');
  expect(section?.textContent).not.toContain('위치 지도를 불러오지 못했어요');
});
