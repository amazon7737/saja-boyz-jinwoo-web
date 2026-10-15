// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vitest';

import { MapHome } from './map-home';
import type { MapArticleResult } from '../../model/map-article.types';

let root: Root | undefined;
let container: HTMLDivElement;
const data: MapArticleResult = {
  total: 1,
  apiOrigin: 'https://news.example.com',
  items: [
    {
      article_id: 'a'.repeat(64),
      collection_id: 'collection',
      image_status: 'disabled',
      image_url: null,
      article: {
        title: '장림동 <b>공장</b> 화재',
        description: '부산 사하구 장림동에서 화재 발생',
        originallink: 'https://example.com/news',
        link: 'https://example.com/news',
        pubDate: 'Wed, 14 Oct 2026 08:00:00 +0900',
      },
      location_status: 'resolved',
      location_reason: null,
      location: {
        latitude: 35.083,
        longitude: 128.968,
        label: '부산 사하구 장림동',
        precision: 'region',
        evidence: { field: 'description', text: '부산 사하구 장림동에서' },
      },
    },
  ],
};

async function mount(result: MapArticleResult | null = data) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const positions: unknown[] = [];
  const removed = vi.fn();
  const off = vi.fn();
  const fitBounds = vi.fn();
  const setCenter = vi.fn();
  const setZoom = vi.fn();
  const selected: (() => void)[] = [];
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
  class Marker {
    constructor(
      public options: {
        position: unknown;
        title: string;
        icon?: { content: HTMLElement };
      },
    ) {
      positions.push(options);
      if (options.icon?.content) {
        container
          .querySelector('[aria-label="주변 지도"] > div')
          ?.append(options.icon.content);
      }
    }
    setMap(map: unknown) {
      removed(map);
      if (map === null) this.options.icon?.content.remove();
    }
  }
  Object.assign(window, {
    naver: {
      maps: {
        LatLng,
        Marker,
        Size: class {},
        Point: class {},
        Map: class {
          destroy = vi.fn();
          setSize = vi.fn();
          setCenter = setCenter;
          setZoom = setZoom;
          fitBounds = fitBounds;
        },
        Event: {
          addListener: vi.fn(
            (_target: unknown, _event: string, callback: () => void) => {
              selected.push(callback);
              return callback;
            },
          ),
          removeListener: off,
        },
      },
    },
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root!.render(
      createElement(MapHome, { clientId: 'test', articles: result }),
    ),
  );
  await act(async () =>
    document
      .querySelector('script[src*="oapi.map.naver.com"]')!
      .dispatchEvent(new Event('load')),
  );
  return { positions, selected, removed, off, fitBounds, setCenter, setZoom };
}

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  container?.remove();
  document
    .querySelectorAll('script[src*="oapi.map.naver.com"]')
    .forEach((node) => node.remove());
  Reflect.deleteProperty(window, 'naver');
  Reflect.deleteProperty(window, 'navermap_authFailure');
  vi.unstubAllGlobals();
});

test('draws a marker at the server coordinates and opens a plain-text article summary with approximate location', async () => {
  const fixture = await mount();
  expect(fixture.positions).toHaveLength(1);
  expect(fixture.positions[0]).toMatchObject({
    position: { latitude: 35.083, longitude: 128.968 },
    title: '장림동 공장 화재',
  });
  await act(async () => fixture.selected[0]());
  expect(document.body.textContent).toContain(
    '지역 대표 위치 · 실제 발생 지점과 다를 수 있습니다',
  );
  expect(
    document.querySelector('a[href="/incidents/' + 'a'.repeat(64) + '"]')
      ?.textContent,
  ).toBe('장림동 공장 화재');
  expect(document.querySelector('b')).toBeNull();
  await act(async () => root!.unmount());
  root = undefined;
  expect(fixture.removed).toHaveBeenCalledWith(null);
  expect(fixture.off).toHaveBeenCalledTimes(1);
});

test('shows all article positions only on request without overriding the saved viewport', async () => {
  const second = {
    ...data.items[0],
    article_id: 'b'.repeat(64),
    location: { ...data.items[0].location, latitude: 37.55, longitude: 126.97 },
  };
  const fixture = await mount({
    ...data,
    total: 2,
    items: [...data.items, second],
  });
  expect(fixture.fitBounds).not.toHaveBeenCalled();
  const button = [...container.querySelectorAll('button')].find((node) =>
    node.textContent?.includes('기사 위치 보기'),
  );
  expect(button).toBeDefined();
  await act(async () => button!.click());
  expect(fixture.fitBounds).toHaveBeenCalledWith(
    [
      { latitude: 35.083, longitude: 128.968 },
      { latitude: 37.55, longitude: 126.97 },
    ],
    expect.objectContaining({ maxZoom: 15 }),
  );
});

test('keeps the map and location control usable when article coordinates are unavailable', async () => {
  await mount(null);
  expect(container.textContent).toContain('기사 위치를 불러오지 못했습니다');
  expect(
    container.querySelector<HTMLButtonElement>('button[aria-label="내 위치"]')
      ?.disabled,
  ).toBe(false);
  expect(
    [...container.querySelectorAll('button')].some((button) =>
      button.textContent?.includes('다시 불러오기'),
    ),
  ).toBe(true);
  await act(async () => root!.unmount());
  root = undefined;
  container.remove();
  document
    .querySelectorAll('script[src*="oapi.map.naver.com"]')
    .forEach((node) => node.remove());
  const fixture = await mount({ ...data, total: 4, items: [] });
  expect(container.textContent).toContain('아직 위치가 확인된 기사가 없습니다');
  expect(fixture.positions).toHaveLength(0);
  expect(
    container.querySelector<HTMLButtonElement>('button[aria-label="내 위치"]')
      ?.disabled,
  ).toBe(false);
});

test('detaches article listeners on SDK authentication failure and ignores old marker clicks', async () => {
  const fixture = await mount();
  const callback = (window as Window & { navermap_authFailure?: () => void })
    .navermap_authFailure;
  expect(callback).toBeTypeOf('function');
  await act(async () => callback!());
  expect(fixture.removed).toHaveBeenCalledTimes(1);
  expect(fixture.off).toHaveBeenCalledTimes(1);
  expect(container.textContent).toContain('지도를 불러오지 못했습니다');
  await act(async () => fixture.selected[0]());
  expect(document.querySelector('[aria-label="선택한 기사"]')).toBeNull();
  await act(async () => root!.unmount());
  root = undefined;
  expect(fixture.removed).toHaveBeenCalledTimes(1);
  expect(fixture.off).toHaveBeenCalledTimes(1);
});

test('groups articles at the same representative coordinate and keeps every article selectable', async () => {
  const second = {
    ...data.items[0],
    article_id: 'b'.repeat(64),
    article: { ...data.items[0].article, title: '동일 지역의 두 번째 기사' },
  };
  const fixture = await mount({
    ...data,
    total: 2,
    items: [...data.items, second],
  });
  expect(fixture.positions).toHaveLength(1);
  const marker = fixture.positions[0] as {
    icon?: { content: HTMLElement };
    title: string;
  };
  expect(marker.icon?.content.textContent).toBe('2');
  expect(marker.title).toContain('2건');
  await act(async () => fixture.selected[0]());
  const links = document
    .querySelector('[aria-label="선택한 기사"]')!
    .querySelectorAll('a[href^="/incidents/"]');
  expect([...links].map((link) => link.getAttribute('href'))).toEqual([
    '/incidents/' + 'a'.repeat(64),
    '/incidents/' + 'b'.repeat(64),
  ]);
  expect(document.body.textContent).toContain('지역 대표 위치');
});

test('attributes the representative coordinate catalog beside the region marker summary', async () => {
  await mount();
  const source = container.querySelector(
    'a[href="https://www.data.go.kr/data/15084084/openapi.do"]',
  );
  expect(source?.textContent).toBe('지역 좌표: 기상청');
});

test('centers a single unique article position instead of sending a degenerate array to fitBounds', async () => {
  for (const items of [
    data.items,
    [...data.items, { ...data.items[0], article_id: 'b'.repeat(64) }],
  ]) {
    const fixture = await mount({ ...data, total: items.length, items });
    const button = [...container.querySelectorAll('button')].find((node) =>
      node.textContent?.includes('기사 위치 보기'),
    );
    expect(fixture.setCenter).not.toHaveBeenCalled();
    await act(async () => button!.click());
    expect(fixture.setCenter).toHaveBeenCalledWith({
      latitude: 35.083,
      longitude: 128.968,
    });
    expect(fixture.setZoom).toHaveBeenCalledWith(15, false);
    expect(fixture.fitBounds).not.toHaveBeenCalled();
    await act(async () => root!.unmount());
    root = undefined;
    container.remove();
    document
      .querySelectorAll('script[src*="oapi.map.naver.com"]')
      .forEach((node) => node.remove());
  }
});

test('uses a numeric region circle for one article and restores its unselected appearance when the sheet closes', async () => {
  const fixture = await mount();
  const marker = fixture.positions[0] as {
    icon?: { content: HTMLButtonElement };
  };
  const button = marker.icon?.content;
  expect(button?.getAttribute('aria-label')).toContain('지역 대표 위치');
  expect(button?.textContent).toBe('1');
  expect(button?.querySelector('img')).toBeNull();
  await act(async () => fixture.selected[0]());
  expect(button?.getAttribute('aria-pressed')).toBe('true');
  expect(button?.textContent).toBe('1');
  expect(button?.querySelector('img')).toBeNull();
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>('button[aria-label="기사 선택 닫기"]')!
      .click(),
  );
  expect(button?.getAttribute('aria-pressed')).toBe('false');
  expect(button?.textContent).toBe('1');
  expect(button?.querySelector('img')).toBeNull();
  expect(document.querySelector('[aria-label="선택한 기사"]')).toBeNull();
});

test('shows the selected article in the Figma sheet with its real image and publication time', async () => {
  const fixture = await mount({
    ...data,
    items: [
      {
        ...data.items[0],
        image_status: 'ready',
        image_url: `/images/${'a'.repeat(64)}.jpg`,
      },
    ],
  });
  await act(async () => fixture.selected[0]());
  const sheet = document.querySelector('[aria-label="선택한 기사"]');
  const close = sheet?.querySelector('button[aria-label="기사 선택 닫기"]');
  expect(close?.querySelector('img')?.getAttribute('src')).toBe(
    '/map/sheet-close.svg',
  );
  expect(sheet?.querySelector('h2 a')?.textContent).toBe('장림동 공장 화재');
  expect(sheet?.querySelector('article img')?.getAttribute('src')).toBe(
    `https://news.example.com/images/${'a'.repeat(64)}.jpg`,
  );
  expect(sheet?.textContent).toContain('AI 생성 이미지');
  expect(sheet?.textContent).toContain('기사 발행');
  expect(sheet?.querySelector('time')?.getAttribute('dateTime')).toBe(
    '2026-10-13T23:00:00.000Z',
  );
  expect(sheet?.textContent).toContain(
    '지역 대표 위치 · 실제 발생 지점과 다를 수 있습니다',
  );
  expect(sheet?.textContent).not.toMatch(/진행 중|10분 전 발생|320m 앞/);
});

test('allows Enter and Space to select markers and restores focus without scrolling when the sheet closes', async () => {
  const second = {
    ...data.items[0],
    article_id: 'b'.repeat(64),
    article: { ...data.items[0].article, title: '다른 지역 기사' },
    location: { ...data.items[0].location, latitude: 37.55 },
  };
  const fixture = await mount({
    ...data,
    total: 2,
    items: [...data.items, second],
  });
  const buttons = fixture.positions.map(
    (position) =>
      (position as { icon: { content: HTMLButtonElement } }).icon.content,
  );

  for (const [index, key] of ['Enter', ' '].entries()) {
    const button = buttons[index];
    button.focus();
    await act(async () =>
      button.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true }),
      ),
    );
    expect(
      document.querySelector('[aria-label="선택한 기사"] h2')?.textContent,
    ).toBe(index === 0 ? '장림동 공장 화재' : '다른 지역 기사');
    const close = document.querySelector<HTMLButtonElement>(
      'button[aria-label="기사 선택 닫기"]',
    )!;
    expect(document.activeElement).toBe(close);
    const focus = vi.spyOn(button, 'focus');
    await act(async () =>
      close.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      ),
    );
    expect(document.activeElement).toBe(button);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(button.getAttribute('aria-pressed')).toBe('false');
  }
});
