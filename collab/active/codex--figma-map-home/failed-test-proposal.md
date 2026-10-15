# 지도 홈 — 신규 테스트 초안(미승인)

기존102개와 함께 아래7개를 실행한다. 헤더·대상·지원 코드를 포함한 정확 초안이다.

## Node

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

- [ ] mapRegionCirclesCountUniqueArticlesAtFixedPoints — 대표점별 고유 기사 수·1건 숫자 원·크기 단계·줌 불변
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
  expect(markers).toHaveLength(3);
  expect(markers.map((marker) => marker.content.textContent).sort()).toEqual([
    '1',
    '1',
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
  ).toEqual(['1', '1', '2']);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});
```

- [ ] mapRegionCirclesGrowWithCountAndKeepSelection — 1·5·7·12건 원의 크기와 숫자 선택·닫기
```ts
test('mapRegionCirclesGrowWithCountAndKeepSelection', async () => {
  const items = [1, 5, 7, 12].flatMap((count, group) =>
    Array.from({ length: count }, (_, index) => ({
      ...item(group * 20 + index + 1),
      location: {
        ...item(1).location,
        label: `지역 ${group}`,
        latitude: 35 + group,
      },
    })),
  );
  const fixture = await mount(items);
  const markers = [...fixture.active];
  expect(markers.map((marker) => marker.content.textContent)).toEqual([
    '1',
    '5',
    '7',
    '12',
  ]);
  expect(markers.map((marker) => marker.anchor)).toEqual([
    { x: 19.2, y: 19.2 },
    { x: 19.2, y: 19.2 },
    { x: 24, y: 24 },
    { x: 36, y: 36 },
  ]);
  markers[3].content.focus();
  await act(async () =>
    markers[3].content.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    ),
  );
  const sheet = document.querySelector('[aria-label="선택한 기사"]');
  assert(sheet);
  expect(sheet.querySelectorAll('a[href^="/incidents/"]')).toHaveLength(12);
  expect(markers[3].content.getAttribute('aria-pressed')).toBe('true');
  await click('기사 선택 닫기', sheet);
  expect(markers[3].content.getAttribute('aria-pressed')).toBe('false');
  expect(document.activeElement).toBe(markers[3].content);
});
```

- [ ] mapCarouselUsesRealArticlesAndSafeImages — 실제 기사 순서·고유 링크·HTML 텍스트·이미지 실패·전체보기
```ts
test('mapCarouselUsesRealArticlesAndSafeImages', async () => {
  const recent = item(2);
  recent.article.title = '서울 <b>화재</b> &amp; 소식';
  recent.image_status = 'ready';
  recent.image_url = `/images/${recent.article_id}.jpg`;
  const unknown = item(3);
  unknown.article.pubDate = 'invalid';
  await mount([
    item(1, 3),
    recent,
    { ...recent, collection_id: 'duplicate' },
    unknown,
  ]);
  const cards = carousel();
  const links = [...cards.querySelectorAll('a[href^="/incidents/"]')];
  expect(links.map((link) => link.getAttribute('href'))).toEqual(
    [2, 1, 3].map((index) => `/incidents/${item(index).article_id}`),
  );
  expect(cards.textContent).toContain('서울 화재 & 소식');
  expect(cards.querySelector('b')).toBeNull();
  expect(cards.querySelector('a[href="/incidents"]')?.textContent).toContain(
    '전체보기',
  );
  expect(cards.textContent).toContain('최근 보도 기사');
  expect(cards.textContent).toContain('발행 시각 미확인');
  expect(cards.textContent).not.toMatch(/진행 중|공론화 성공|종결|인기 순위/);
  const image = cards.querySelector<HTMLImageElement>(
    `img[src="https://news.example.com/images/${recent.article_id}.jpg"]`,
  );
  assert(image);
  expect(cards.textContent).toContain('AI 생성 이미지');
  await act(async () => image.dispatchEvent(new Event('error')));
  expect(cards.textContent).toContain('이미지 없음');
  expect(cards.querySelectorAll('a[href^="/incidents/"]')).toHaveLength(3);
});
```

- [ ] mapPeriodFiltersSynchronizeMarkersAndCardsWithoutResettingMap — 발행일 기간 경계·미확인/미래 제외·집계와 카드 동기화·지도 보존
```ts
test('mapPeriodFiltersSynchronizeMarkersAndCardsWithoutResettingMap', async () => {
  const unknown = item(4);
  unknown.article.pubDate = 'invalid';
  const fixture = await mount([
    item(1, 0.5),
    item(2, 1),
    item(3, 8),
    unknown,
    item(5, -1),
  ]);
  await click('기간');
  await click('최근 24시간');
  expect(carousel().querySelectorAll('a[href^="/incidents/"]')).toHaveLength(2);
  expect(
    [...fixture.active].map((marker) => marker.content.textContent),
  ).toEqual(['2']);
  expect(host.querySelector('[aria-label="기사 필터"]')?.textContent).toContain(
    '24시간',
  );
  expect(host.querySelector('[aria-label="기사 필터"]')?.textContent).toContain(
    '발행일',
  );
  await click('기간: 최근 24시간');
  await click('최근 7일');
  expect(carousel().querySelectorAll('a[href^="/incidents/"]')).toHaveLength(2);
  await click('기간: 최근 7일');
  await click('전체 기간');
  expect(carousel().querySelectorAll('a[href^="/incidents/"]')).toHaveLength(5);
  expect(fixture.created).toHaveBeenCalledTimes(1);
  expect(fixture.destroy).not.toHaveBeenCalled();
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});
```

- [ ] mapUnavailableFiltersExplainMissingMetadataAndCloseAccessibly — 분류·상태 드롭다운과 선택 불가 안내·Escape 포커스 복원
```ts
test('mapUnavailableFiltersExplainMissingMetadataAndCloseAccessibly', async () => {
  await mount([item(1)]);
  for (const [label, explanation, options] of [
    ['카테고리', '분류 정보 미제공', ['사회', '안보', '정치', '국제']],
    ['상태', '상태 정보 미제공', ['진행 중', '공론화 성공', '종결']],
  ] as const) {
    const trigger = button(label);
    trigger.focus();
    await act(async () => trigger.click());
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const popup = document.querySelector(`[aria-label="${label} 선택"]`);
    assert(popup);
    expect(popup.textContent).toContain(explanation);
    for (const option of options)
      expect(button(option, popup).disabled).toBe(true);
    expect(button('전체', popup).getAttribute('aria-pressed')).toBe('true');
    await act(async () =>
      popup.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      ),
    );
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  }
  expect(carousel().querySelectorAll('a[href^="/incidents/"]')).toHaveLength(1);
});
```

- [ ] mapAllFiltersApplyOrDiscardDraftAndReset — 전체 필터 시트의 임시 선택·취소·적용·초기화
```ts
test('mapAllFiltersApplyOrDiscardDraftAndReset', async () => {
  const fixture = await mount([item(1, 0.5), item(2, 8)]);
  const trigger = button('전체 필터');
  await click('전체 필터');
  let panel = document.querySelector('[role="dialog"][aria-label="전체 필터"]');
  assert(panel);
  expect(panel.textContent).toContain('카테고리');
  expect(panel.textContent).toContain('상태');
  await click('최근 24시간', panel);
  expect(carousel().querySelectorAll('a[href^="/incidents/"]')).toHaveLength(2);
  await click('필터 닫기', panel);
  expect(document.activeElement).toBe(trigger);
  await click('전체 필터');
  panel = document.querySelector('[role="dialog"][aria-label="전체 필터"]');
  assert(panel);
  expect(button('전체 기간', panel).getAttribute('aria-pressed')).toBe('true');
  await click('최근 24시간', panel);
  await click('필터 적용하기', panel);
  expect(carousel().querySelectorAll('a[href^="/incidents/"]')).toHaveLength(1);
  expect(
    [...fixture.active].map((marker) => marker.content.textContent),
  ).toEqual(['1']);
  await click('전체 필터');
  panel = document.querySelector('[role="dialog"][aria-label="전체 필터"]');
  assert(panel);
  await click('초기화', panel);
  await click('필터 적용하기', panel);
  expect(carousel().querySelectorAll('a[href^="/incidents/"]')).toHaveLength(2);
});
```

- [ ] mapFilteredEmptyAndApiFailureKeepRecoveryAndLocation — 필터 빈 결과·API 실패 안내와 지도·내 위치 유지
```ts
test('mapFilteredEmptyAndApiFailureKeepRecoveryAndLocation', async () => {
  const fixture = await mount([item(1, 8)]);
  await click('기간');
  await click('최근 24시간');
  expect(carousel().textContent).toContain('선택한 기간의 기사가 없습니다');
  expect(fixture.active.size).toBe(0);
  expect(button('내 위치').disabled).toBe(false);
  await click('기간: 최근 24시간');
  await click('전체 기간');
  expect(carousel().querySelectorAll('a[href^="/incidents/"]')).toHaveLength(1);
  await act(async () => root!.unmount());
  root = undefined;
  host.remove();
  const failed = await mount([], true);
  expect(host.textContent).toContain('기사 위치를 불러오지 못했습니다');
  expect(failed.active.size).toBe(0);
  expect(button('내 위치').disabled).toBe(false);
  expect(button('기사 위치 다시 불러오기')).toBeDefined();
});
```
