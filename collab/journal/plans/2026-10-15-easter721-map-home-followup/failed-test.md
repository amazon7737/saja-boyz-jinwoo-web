# 지도 겹침 묶음 — 신규3개·기존1개 정확 초안

기존108개 본문·helper·명령은 유지한다. 정렬은 실제 브라우저에서 세로 중심 차이를 실측한다.

## Node — 기존 동일 좌표 표시 기준

```ts
// file: src/features/map/ui/map-home/map-home-design.test.ts
// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, assert, expect, test, vi } from 'vitest';

import { MapHome } from './map-home';
import type {
  LocatedArticle,
  MapArticleResult,
} from '../../model/map-article.types';

let root: Root | undefined;
let host: HTMLDivElement;
const now = Date.parse('2026-10-15T06:00:00Z');

function item(
  index: number,
  daysAgo = 0,
  region = '서울특별시 중구',
): LocatedArticle {
  return {
    article_id: index.toString(16).padStart(64, '0'),
    collection_id: 'fixture',
    image_status: 'disabled',
    image_url: null,
    article: {
      title: `기사 ${index}`,
      description: `${region}에서 보도한 기사`,
      pubDate: new Date(now - daysAgo * 86400000).toISOString(),
      link: 'https://example.com/news',
      originallink: 'https://example.com/news',
    },
    location_status: 'resolved',
    location_reason: null,
    location: {
      latitude: region === '서울특별시 중구' ? 37.56 : 35.17,
      longitude: region === '서울특별시 중구' ? 126.99 : 129.07,
      label: region,
      precision: 'region',
      evidence: { field: 'description', text: region },
    },
  };
}

async function mount(items: LocatedArticle[], failure = false) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  host = document.createElement('div');
  document.body.append(host);
  const active = new Set<{
    content: HTMLButtonElement;
    position: unknown;
    anchor: unknown;
  }>();
  const callbacks = new Map<object, Map<string, () => void>>();
  const created = vi.fn();
  const destroy = vi.fn();
  const setCenter = vi.fn();
  const setZoom = vi.fn();
  class LatLng {
    constructor(
      public latitude: number,
      public longitude: number,
    ) {}
    lat() {
      return this.latitude;
    }
    lng() {
      return this.longitude;
    }
  }
  class MapFixture {
    constructor() {
      created();
    }
    destroy = destroy;
    setSize() {}
    setCenter = setCenter;
    setZoom = setZoom;
    fitBounds() {}
    getCenter() {
      return new LatLng(37.56, 126.99);
    }
    getZoom() {
      return 15;
    }
  }
  class MarkerFixture {
    entry: { content: HTMLButtonElement; position: unknown; anchor: unknown };
    constructor(options: {
      position: unknown;
      icon: { content: HTMLButtonElement; anchor: unknown };
    }) {
      this.entry = {
        content: options.icon.content,
        position: options.position,
        anchor: options.icon.anchor,
      };
      active.add(this.entry);
      host
        .querySelector('[aria-label="주변 지도"] > div')
        ?.append(this.entry.content);
    }
    setMap(map: unknown) {
      if (map === null) {
        active.delete(this.entry);
        this.entry.content.remove();
      }
    }
  }
  Object.assign(window, {
    naver: {
      maps: {
        Map: MapFixture,
        Marker: MarkerFixture,
        LatLng,
        Size: class {},
        Point: class {
          constructor(
            public x: number,
            public y: number,
          ) {}
        },
        Event: {
          addListener(target: object, name: string, callback: () => void) {
            const events =
              callbacks.get(target) ?? new Map<string, () => void>();
            events.set(name, callback);
            callbacks.set(target, events);
            return { target, name };
          },
          removeListener(listener: { target: object; name: string }) {
            callbacks.get(listener.target)?.delete(listener.name);
          },
        },
      },
    },
  });
  const articles: MapArticleResult | null = failure
    ? null
    : {
        total: items.length,
        items,
        apiOrigin: 'https://news.example.com',
      };
  root = createRoot(host);
  await act(async () =>
    root!.render(createElement(MapHome, { clientId: 'design-test', articles })),
  );
  await act(async () =>
    document
      .querySelector('script[src*="oapi.map.naver.com"]')!
      .dispatchEvent(new Event('load')),
  );
  return { active, callbacks, created, destroy, setCenter, setZoom };
}

function button(label: string, within: ParentNode = document) {
  const found = Array.from(
    within.querySelectorAll<HTMLButtonElement>('button'),
  ).find(
    (node) =>
      node.getAttribute('aria-label') === label ||
      node.textContent?.trim() === label,
  );
  assert(found, `button missing: ${label}`);
  return found;
}

async function click(label: string, within: ParentNode = document) {
  await act(async () => button(label, within).click());
}

function carousel() {
  const section = host.querySelector<HTMLElement>(
    'section[aria-label="지도 기사"]',
  );
  assert(section, '지도 기사 carousel missing');
  return section;
}

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  host?.remove();
  document
    .querySelectorAll('script[src*="oapi.map.naver.com"]')
    .forEach((node) => node.remove());
  Reflect.deleteProperty(window, 'naver');
  Reflect.deleteProperty(window, 'navermap_authFailure');
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
```

- [x] mapRegionCirclesCountUniqueArticlesAtFixedPoints — 같은 좌표의 표시 원을 합치되 대표점과 카메라를 유지

```ts
test('mapRegionCirclesCountUniqueArticlesAtFixedPoints', async () => {
  const first = item(1);
  const items = [
    first,
    { ...first, collection_id: 'duplicate' },
    item(2),
    item(3, 0, '부산광역시'),
    item(4, 0, '부산광역시 중구'),
  ];
  const fixture = await mount(items);
  const markers = [...fixture.active];
  expect(markers).toHaveLength(2);
  expect(markers.map((marker) => marker.content.textContent).sort()).toEqual([
    '2',
    '2',
  ]);
  expect(markers[0].position).toMatchObject({
    latitude: 37.56,
    longitude: 126.99,
  });
  for (const marker of markers) {
    expect(marker.content.querySelector('img')).toBeNull();
    expect(marker.content.getAttribute('aria-label')).toContain(
      '지역 대표 위치',
    );
  }
  for (const events of fixture.callbacks.values())
    events.get('zoom_changed')?.();
  expect(
    [...fixture.active].map((marker) => marker.content.textContent).sort(),
  ).toEqual(['2', '2']);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});
```

## Node — 화면 겹침 묶음

```ts
// file: src/features/map/ui/map-home/map-marker-overlap.test.ts
// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, assert, expect, test, vi } from 'vitest';

import { MapHome } from './map-home';
import type {
  LocatedArticle,
  MapArticleResult,
} from '../../model/map-article.types';

let root: Root | undefined;
let host: HTMLDivElement;
const now = Date.parse('2026-10-15T06:00:00Z');

function item(
  index: number,
  daysAgo = 0,
  region = '서울특별시 중구',
): LocatedArticle {
  return {
    article_id: index.toString(16).padStart(64, '0'),
    collection_id: 'fixture',
    image_status: 'disabled',
    image_url: null,
    article: {
      title: `기사 ${index}`,
      description: `${region}에서 보도한 기사`,
      pubDate: new Date(now - daysAgo * 86400000).toISOString(),
      link: 'https://example.com/news',
      originallink: 'https://example.com/news',
    },
    location_status: 'resolved',
    location_reason: null,
    location: {
      latitude: region === '서울특별시 중구' ? 37.56 : 35.17,
      longitude: region === '서울특별시 중구' ? 126.99 : 129.07,
      label: region,
      precision: 'region',
      evidence: { field: 'description', text: region },
    },
  };
}

async function mount(items: LocatedArticle[], failure = false) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  host = document.createElement('div');
  document.body.append(host);
  const active = new Set<{
    content: HTMLButtonElement;
    position: unknown;
    anchor: unknown;
  }>();
  const callbacks = new Map<object, Map<string, () => void>>();
  const created = vi.fn();
  const destroy = vi.fn();
  const setCenter = vi.fn();
  const setZoom = vi.fn();
  let zoom = 10;
  class LatLng {
    constructor(
      public latitude: number,
      public longitude: number,
    ) {}
    lat() {
      return this.latitude;
    }
    lng() {
      return this.longitude;
    }
  }
  class MapFixture {
    constructor() {
      created();
    }
    destroy = destroy;
    setSize() {}
    setCenter = setCenter;
    setZoom = setZoom;
    fitBounds() {}
    getProjection() {
      return {
        fromCoordToOffset(point: LatLng) {
          const scale = zoom >= 15 ? 100000 : 1000;
          return {
            x: (point.lng() - 129) * scale,
            y: (point.lat() - 35) * scale,
          };
        },
      };
    }
    getCenter() {
      return new LatLng(37.56, 126.99);
    }
    getZoom() {
      return zoom;
    }
  }
  class MarkerFixture {
    entry: { content: HTMLButtonElement; position: unknown; anchor: unknown };
    constructor(options: {
      position: unknown;
      icon: { content: HTMLButtonElement; anchor: unknown };
    }) {
      this.entry = {
        content: options.icon.content,
        position: options.position,
        anchor: options.icon.anchor,
      };
      active.add(this.entry);
      host
        .querySelector('[aria-label="주변 지도"] > div')
        ?.append(this.entry.content);
    }
    setMap(map: unknown) {
      if (map === null) {
        active.delete(this.entry);
        this.entry.content.remove();
      }
    }
  }
  Object.assign(window, {
    naver: {
      maps: {
        Map: MapFixture,
        Marker: MarkerFixture,
        LatLng,
        Size: class {},
        Point: class {
          constructor(
            public x: number,
            public y: number,
          ) {}
        },
        Event: {
          addListener(target: object, name: string, callback: () => void) {
            const events =
              callbacks.get(target) ?? new Map<string, () => void>();
            events.set(name, callback);
            callbacks.set(target, events);
            return { target, name };
          },
          removeListener(listener: { target: object; name: string }) {
            callbacks.get(listener.target)?.delete(listener.name);
          },
        },
      },
    },
  });
  const articles: MapArticleResult | null = failure
    ? null
    : {
        total: items.length,
        items,
        apiOrigin: 'https://news.example.com',
      };
  root = createRoot(host);
  await act(async () =>
    root!.render(createElement(MapHome, { clientId: 'design-test', articles })),
  );
  await act(async () =>
    document
      .querySelector('script[src*="oapi.map.naver.com"]')!
      .dispatchEvent(new Event('load')),
  );
  return {
    active,
    callbacks,
    created,
    destroy,
    setCenter,
    setZoom,
    async changeZoom(value: number) {
      zoom = value;
      await act(async () => {
        for (const [target, events] of callbacks)
          if (target instanceof MapFixture) {
            events.get('zoom_changed')?.();
            events.get('idle')?.();
          }
      });
    },
    async idle() {
      await act(async () => {
        for (const [target, events] of callbacks)
          if (target instanceof MapFixture) events.get('idle')?.();
      });
    },
  };
}

function button(label: string, within: ParentNode = document) {
  const found = Array.from(
    within.querySelectorAll<HTMLButtonElement>('button'),
  ).find(
    (node) =>
      node.getAttribute('aria-label') === label ||
      node.textContent?.trim() === label,
  );
  assert(found, `button missing: ${label}`);
  return found;
}

async function click(label: string, within: ParentNode = document) {
  await act(async () => button(label, within).click());
}

function carousel() {
  const section = host.querySelector<HTMLElement>(
    'section[aria-label="지도 기사"]',
  );
  assert(section, '지도 기사 carousel missing');
  return section;
}

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  host?.remove();
  document
    .querySelectorAll('script[src*="oapi.map.naver.com"]')
    .forEach((node) => node.remove());
  Reflect.deleteProperty(window, 'naver');
  Reflect.deleteProperty(window, 'navermap_authFailure');
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function nearby(index: number, daysAgo = 0) {
  const entry = item(
    index,
    daysAgo,
    index === 1 ? '울산광역시' : '울산광역시 울주군',
  );
  return {
    ...entry,
    location: {
      ...entry.location,
      latitude: index === 1 ? 35 : 35.01,
      longitude: index === 1 ? 129 : 129.01,
    },
  };
}
function counts(fixture: Awaited<ReturnType<typeof mount>>) {
  return [...fixture.active].map((entry) => entry.content.textContent).sort();
}
```

- [x] mapOverlappingRegionMarkersCombineUniqueArticles

```ts
test('mapOverlappingRegionMarkersCombineUniqueArticles', async () => {
  const first = nearby(1);
  const fixture = await mount([
    first,
    { ...first, collection_id: 'duplicate' },
    nearby(2),
    item(3),
  ]);
  expect(counts(fixture)).toEqual(['1', '2']);
  const cluster = [...fixture.active].find(
    (entry) => entry.content.textContent === '2',
  );
  const single = [...fixture.active].find(
    (entry) => entry.content.textContent === '1',
  );
  assert(cluster && single);
  expect(cluster.anchor).toMatchObject({ x: 24, y: 24 });
  expect(single.anchor).toMatchObject({ x: 19.2, y: 19.2 });
  expect(cluster.content.getAttribute('aria-label')).toContain('묶음');
  expect(
    [first.location, nearby(2).location].some((point) => {
      const position = cluster.position as {
        latitude: number;
        longitude: number;
      };
      return (
        point.latitude === position.latitude &&
        point.longitude === position.longitude
      );
    }),
  ).toBe(true);
  cluster.content.focus();
  await act(async () =>
    cluster.content.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    ),
  );
  const sheet = document.querySelector('[aria-label="선택한 기사"]');
  assert(sheet);
  expect(
    [...sheet.querySelectorAll('a[href^="/incidents/"]')]
      .map((link) => link.getAttribute('href'))
      .sort(),
  ).toEqual(
    [first.article_id, nearby(2).article_id]
      .map((id) => '/incidents/' + id)
      .sort(),
  );
  await click('기사 선택 닫기', sheet);
  expect(document.activeElement).toBe(cluster.content);
  expect(fixture.created).toHaveBeenCalledTimes(1);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});
```

- [x] mapRegionDisplayClustersSplitAndRejoinOnZoom

```ts
test('mapRegionDisplayClustersSplitAndRejoinOnZoom', async () => {
  const fixture = await mount([nearby(1), nearby(2), item(3)]);
  expect(counts(fixture)).toEqual(['1', '2']);
  await fixture.changeZoom(15);
  expect(counts(fixture)).toEqual(['1', '1', '1']);
  await fixture.changeZoom(10);
  expect(counts(fixture)).toEqual(['1', '2']);
  const cluster = [...fixture.active].find(
    (entry) => entry.content.textContent === '2',
  );
  assert(cluster);
  await fixture.idle();
  expect(
    [...fixture.active].find((entry) => entry.content.textContent === '2')
      ?.content,
  ).toBe(cluster.content);
  expect(fixture.created).toHaveBeenCalledTimes(1);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});
```

- [x] mapDisplayClustersFollowPeriodAndDisposeListeners

```ts
test('mapDisplayClustersFollowPeriodAndDisposeListeners', async () => {
  const fixture = await mount([nearby(1), nearby(2, 2), item(3)]);
  expect(counts(fixture)).toEqual(['1', '2']);
  await click('기간');
  await click('최근 24시간');
  expect(counts(fixture)).toEqual(['1', '1']);
  expect(carousel().querySelectorAll('a[href^="/incidents/"]')).toHaveLength(2);
  const stale = [...fixture.callbacks.values()].flatMap((events) => [
    ...events.values(),
  ]);
  await act(async () => root!.unmount());
  root = undefined;
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
  expect(fixture.active.size).toBe(0);
  expect(
    [...fixture.callbacks.values()].every((events) => events.size === 0),
  ).toBe(true);
  await act(async () => stale.forEach((callback) => callback()));
  expect(fixture.active.size).toBe(0);
  expect(fixture.created).toHaveBeenCalledTimes(1);
});
```

## Node — 검색 대소문자 강조 회귀

```ts
// file: src/features/search/ui/search-result-card/search-result-card.test.ts
// @vitest-environment jsdom
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { SearchResultCard } from './search-result-card';
import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';
```

- [x] searchHighlightIgnoresCaseAndPreservesOriginalLiteralText

```ts
test('searchHighlightIgnoresCaseAndPreservesOriginalLiteralText', () => {
  const item: ArticleCollectionItem = {
    article_id: 'a'.repeat(64),
    image_status: 'disabled',
    image_url: null,
    article: {
      title: 'AI ai Ai aI 안전',
      description: 'aI Ai ai AI 보도',
      pubDate: '2026-10-15T06:00:00Z',
      link: 'https://example.com/news',
      originallink: 'https://example.com/news',
    },
  };
  const render = (keyword: string, title = item.article.title) => {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(
      createElement(SearchResultCard, {
        item: { ...item, article: { ...item.article, title } },
        keyword,
      }),
    );
    return host;
  };
  for (const keyword of ['AI', 'ai', 'Ai', 'aI', '  ai  ']) {
    const host = render(keyword);
    expect(host.querySelector('h2')?.textContent).toBe(item.article.title);
    expect(host.querySelector('article > p')?.textContent).toBe(
      item.article.description,
    );
    expect(
      [...host.querySelectorAll('h2 mark')].map((mark) => mark.textContent),
    ).toEqual(['AI', 'ai', 'Ai', 'aI']);
    expect(
      [...host.querySelectorAll('article > p mark')].map(
        (mark) => mark.textContent,
      ),
    ).toEqual(['aI', 'Ai', 'ai', 'AI']);
  }
  for (const [keyword, title, matched] of [
    ['ai+', 'AI+ AII AI', 'AI+'],
    ['c++', 'C++ C+ CCC', 'C++'],
    ['[ai]', '[AI] AI A', '[AI]'],
    ['a.b', 'A.B A0B AB', 'A.B'],
  ]) {
    const host = render(keyword, title);
    expect(host.querySelector('h2')?.textContent).toBe(title);
    expect(
      [...host.querySelectorAll('h2 mark')].map((mark) => mark.textContent),
    ).toEqual([matched]);
  }
  for (const keyword of ['', '   ', 'missing']) {
    const host = render(keyword);
    expect(host.querySelector('h2')?.textContent).toBe(item.article.title);
    expect(host.querySelectorAll('mark')).toHaveLength(0);
  }
});
```
