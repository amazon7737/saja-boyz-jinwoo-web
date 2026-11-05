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

async function mount(
  items: LocatedArticle[],
  failure = false,
  viewport?: { width: number; height: number },
  paneProjection = false,
) {
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
  let panX = 0;
  let panY = 0;
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
            x: (point.lng() - 129) * scale + (paneProjection ? 1000 : panX),
            y: (point.lat() - 35) * scale + (paneProjection ? -500 : panY),
          };
        },
      };
    }
    getCenter() {
      if (viewport) {
        const canvas = host.querySelector<HTMLElement>(
          '[aria-label="주변 지도"] > .h-dvh',
        )!;
        const scale = zoom >= 15 ? 100000 : 1000;
        return new LatLng(
          35 + (canvas.clientHeight / 2 - panY) / scale,
          129 + (canvas.clientWidth / 2 - panX) / scale,
        );
      }
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
        .querySelector('[aria-label="주변 지도"] > .h-dvh')
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
  if (viewport) {
    const canvas = host.querySelector('[aria-label="주변 지도"] > .h-dvh')!;
    Object.defineProperty(canvas, 'clientWidth', {
      configurable: true,
      value: viewport.width,
    });
    Object.defineProperty(canvas, 'clientHeight', {
      configurable: true,
      value: viewport.height,
    });
  }
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
    async pan(x: number, y: number) {
      panX = x;
      panY = y;
      await act(async () => {
        for (const [target, events] of callbacks)
          if (target instanceof MapFixture) events.get('idle')?.();
      });
    },
    async resize(width: number, height: number) {
      const canvas = host.querySelector('[aria-label="주변 지도"] > .h-dvh')!;
      Object.defineProperty(canvas, 'clientWidth', {
        configurable: true,
        value: width,
      });
      Object.defineProperty(canvas, 'clientHeight', {
        configurable: true,
        value: height,
      });
      await act(async () => window.dispatchEvent(new Event('resize')));
    },
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
  const clusterSide = parseFloat(cluster.content.style.width);
  const singleSide = parseFloat(single.content.style.width);
  expect(clusterSide - singleSide).toBeGreaterThanOrEqual(4);
  expect(cluster.anchor).toMatchObject({
    x: clusterSide / 2,
    y: clusterSide / 2,
  });
  expect(single.anchor).toMatchObject({ x: singleSide / 2, y: singleSide / 2 });
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

test('mapCircleSizesCompareOnlyCurrentViewportAndKeepDistinctCountsVisible', async () => {
  let id = 100;
  const groups = [
    { count: 3, x: 60, y: 120, age: 0 },
    { count: 4, x: 210, y: 120, age: 0 },
    { count: 8, x: 360, y: 120, age: 0 },
    { count: 4, x: 210, y: 260, age: 0 },
    { count: 19, x: 980, y: 120, age: 2 },
    { count: 3, x: 800, y: 120, age: 0 },
  ];
  const items = groups.flatMap((group, index) =>
    Array.from({ length: group.count }, () => {
      const entry = item(++id, group.age, `비율 검증 지역 ${index}`);
      return {
        ...entry,
        location: {
          ...entry.location,
          latitude: 35 + group.y / 1000,
          longitude: 129 + group.x / 1000,
        },
      };
    }),
  );
  const fixture = await mount(items, false, { width: 480, height: 300 });
  const size = (count: number) => {
    const entries = [...fixture.active].filter(
      (entry) => Number(entry.content.textContent) === count,
    );
    assert(entries.length);
    const widths = entries.map(
      (entry) => (entry.anchor as { x: number }).x * 2,
    );
    for (const [index, entry] of entries.entries()) {
      expect
        .soft(
          parseFloat(entry.content.style.width),
          '실제 원과 SDK anchor 너비 일치',
        )
        .toBeCloseTo(widths[index], 8);
      expect
        .soft(parseFloat(entry.content.style.height), '실제 원 높이 일치')
        .toBeCloseTo(widths[index], 8);
    }
    expect.soft(new Set(widths).size, '같은 건수는 같은 크기').toBe(1);
    return widths[0];
  };
  expect
    .soft(counts(fixture), '화면 밖 대규모 그룹은 표시·비율에서 제외')
    .toEqual(['3', '4', '4', '8']);
  const before = [size(3), size(4), size(8)];
  expect
    .soft(before[1] - before[0], '인접 건수도 시각적 차이')
    .toBeGreaterThanOrEqual(4);
  expect.soft(before[2] - before[1]).toBeGreaterThanOrEqual(4);
  expect.soft(before[0]).toBeGreaterThanOrEqual(38.4);
  expect.soft(before[2]).toBeLessThanOrEqual(88);

  await fixture.pan(-700, 0);
  expect.soft(counts(fixture)).toEqual(['19', '3']);
  expect.soft(size(19) - size(3)).toBeGreaterThanOrEqual(4);
  await click('기간');
  await click('최근 24시간');
  expect.soft(counts(fixture)).toEqual(['3']);
  expect.soft(Number.isFinite(size(3))).toBe(true);
  const same = [...fixture.active][0].content;
  await fixture.idle();
  expect
    .soft([...fixture.active][0].content, '같은 화면 idle에서 마커 수명 유지')
    .toBe(same);

  await fixture.pan(0, 0);
  expect.soft(counts(fixture)).toEqual(['3', '4', '4', '8']);
  expect.soft([size(3), size(4), size(8)]).toEqual(before);
  const largest = [...fixture.active].find(
    (entry) => entry.content.textContent === '8',
  )!;
  largest.content.focus();
  await act(async () =>
    largest.content.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    ),
  );
  const sheet = document.querySelector('[aria-label="선택한 기사"]');
  assert(sheet);
  expect(sheet.querySelectorAll('a[href^="/incidents/"]')).toHaveLength(8);
  await click('기사 선택 닫기', sheet);
  expect(document.activeElement).toBe(largest.content);
  expect(fixture.created).toHaveBeenCalledTimes(1);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});

test('mapRelativeResizingKeepsUnchangedSelectionAndReturnsToCurrentMarker', async () => {
  let id = 300;
  const items = [
    { count: 3, x: 60 },
    { count: 4, x: 260 },
    { count: 12, x: 650 },
  ].flatMap((group, region) =>
    Array.from({ length: group.count }, () => {
      const entry = item(++id, 0, `크기 변경 지역 ${region}`);
      return {
        ...entry,
        location: {
          ...entry.location,
          latitude: 35.12,
          longitude: 129 + group.x / 1000,
        },
      };
    }),
  );
  const fixture = await mount(items, false, { width: 480, height: 300 });
  expect(counts(fixture)).toEqual(['3', '4']);
  const original = [...fixture.active].find(
    (entry) => entry.content.textContent === '4',
  )!;
  const before = parseFloat(original.content.style.width);
  await act(async () =>
    original.content.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    ),
  );
  const sheet = document.querySelector('[aria-label="선택한 기사"]')!;
  const link = sheet.querySelector<HTMLAnchorElement>(
    'a[href^="/incidents/"]',
  )!;
  link.focus();

  await fixture.resize(800, 300);
  expect.soft(counts(fixture)).toEqual(['12', '3', '4']);
  expect
    .soft(
      document.querySelector('[aria-label="선택한 기사"]'),
      '크기 변화만 있으면 같은 선택 시트 유지',
    )
    .toBe(sheet);
  expect.soft(document.activeElement, '읽던 링크 포커스 유지').toBe(link);
  const current = [...fixture.active].find(
    (entry) => entry.content.textContent === '4',
  )!;
  expect
    .soft(parseFloat(current.content.style.width), '새 최대값에 따른 재계산')
    .toBeLessThan(before);
  expect.soft(current.content.getAttribute('aria-pressed')).toBe('true');
  if (sheet.isConnected) {
    await click('기사 선택 닫기', sheet);
    expect
      .soft(document.activeElement, '닫으면 현재 크기의 마커로 복귀')
      .toBe(current.content);
    expect.soft(current.content.getAttribute('aria-pressed')).toBe('false');
  }
  expect(fixture.created).toHaveBeenCalledTimes(1);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});

test('mapPaneProjectionNormalizesCameraCenterBeforeViewportSizing', async () => {
  let id = 500;
  const items = [
    { count: 3, x: 80 },
    { count: 4, x: 230 },
    { count: 8, x: 400 },
  ].flatMap((group, region) =>
    Array.from({ length: group.count }, () => {
      const entry = item(++id, 0, `이동 레이어 지역 ${region}`);
      return {
        ...entry,
        location: {
          ...entry.location,
          latitude: 35.12,
          longitude: 129 + group.x / 1000,
        },
      };
    }),
  );
  const fixture = await mount(items, false, { width: 480, height: 300 }, true);
  const width = (count: number) =>
    parseFloat(
      [...fixture.active].find(
        (entry) => Number(entry.content.textContent) === count,
      )?.content.style.width ?? 'NaN',
    );
  expect
    .soft(counts(fixture), '레이어 원점이 화면 원점과 달라도 화면 안 그룹 표시')
    .toEqual(['3', '4', '8']);
  const middle = width(4);
  await fixture.pan(-180, 0);
  expect
    .soft(counts(fixture), '지도 이동 시 중심 기준으로 화면 밖3 제외')
    .toEqual(['4', '8']);
  expect
    .soft(width(4), '새 화면 안 최소 건수에 따라 재계산')
    .toBeLessThan(middle);
  await fixture.resize(200, 300);
  expect.soft(counts(fixture), '화면 축소 시 밖으로 나간8 제외').toEqual(['4']);
  expect.soft(Number.isFinite(width(4))).toBe(true);
  expect(fixture.created).toHaveBeenCalledTimes(1);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});

test('carouselPreviewSurvivesMarkerRegroupingOnZoom', async () => {
  const first = nearby(1);
  const fixture = await mount([first, nearby(2), item(3)]);
  expect(counts(fixture)).toEqual(['1', '2']);
  const card = carousel().querySelector<HTMLAnchorElement>(
    `a[href="/incidents/${first.article_id}"]`,
  )!;
  const stop = (event: MouseEvent) => event.preventDefault();
  document.addEventListener('click', stop);
  try {
    await act(async () => card.click());
    const preview = document.querySelector<HTMLElement>(
      '[aria-label="선택한 기사"]',
    )!;
    expect(preview).not.toBeNull();
    expect(preview.textContent).toContain(first.article.title);
    await fixture.changeZoom(15);
    expect(counts(fixture)).toEqual(['1', '1', '1']);
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBe(preview);
    expect(preview.textContent).toContain(first.article.title);
    await click('기사 선택 닫기', preview);
    expect(document.activeElement).toBe(card);
    expect(fixture.created).toHaveBeenCalledTimes(1);
    expect(fixture.destroy).not.toHaveBeenCalled();
    expect(fixture.setCenter).not.toHaveBeenCalled();
    expect(fixture.setZoom).not.toHaveBeenCalled();
  } finally {
    document.removeEventListener('click', stop);
  }
});
