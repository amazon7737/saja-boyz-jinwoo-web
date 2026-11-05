// file: src/features/map/ui/map-home/map-articles.test.ts
// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, test, vi } from 'vitest';

import { MapHome } from './map-home';
import { DetailSheet } from '@/features/article-detail/ui/detail-sheet/detail-sheet';
import {
  ArticleSheetContext,
  type ArticleSheetRoute,
} from '@/features/article-detail/model/article-sheet-context';
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

async function mount(
  result: MapArticleResult | null = data,
  sheetRoute: ArticleSheetRoute | null = null,
) {
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
  const draw = async (
    route: ArticleSheetRoute | null = sheetRoute,
    overlay?: ReactNode,
    nextResult: MapArticleResult | null = result,
  ) => {
    await act(async () =>
      root!.render(
        createElement(
          ArticleSheetContext,
          { value: route },
          createElement(MapHome, { clientId: 'test', articles: nextResult }),
          overlay,
        ),
      ),
    );
  };
  await draw();
  await act(async () =>
    document
      .querySelector('script[src*="oapi.map.naver.com"]')!
      .dispatchEvent(new Event('load')),
  );
  return {
    positions,
    selected,
    removed,
    off,
    fitBounds,
    setCenter,
    setZoom,
    draw,
  };
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
  expect(
    close?.querySelector<HTMLElement>('span')?.style.backgroundImage,
  ).toContain('/article-detail/close.svg');
  expect(sheet?.querySelector('h2 a')?.textContent).toBe('장림동 공장 화재');
  expect(sheet?.querySelector('article figure img')?.getAttribute('src')).toBe(
    `https://news.example.com/images/${'a'.repeat(64)}.jpg`,
  );
  expect(sheet?.textContent).toContain('AI로 생성된 이미지입니다.');
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

test('mapRemovedOverviewControlKeepsMultiArticleViewportUntouched', async () => {
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
  expect(fixture.positions).toHaveLength(2);
  expect(container.textContent).not.toContain('기사 위치 보기');
  expect(container.textContent).not.toContain('지역 좌표: 기상청');
  expect(fixture.fitBounds).not.toHaveBeenCalled();
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
});

test('mapCoordinateSourceLivesInServiceInfoWithoutMapOverlay', async () => {
  const fixture = await mount();
  expect(
    container.querySelector(
      'a[href="https://www.data.go.kr/data/15084084/openapi.do"]',
    ),
  ).toBeNull();
  expect(container.textContent).not.toContain('지역 좌표: 기상청');
  await act(async () => fixture.selected[0]());
  expect(
    document.querySelector('[aria-label="선택한 기사"]')?.textContent,
  ).toContain('지역 대표 위치 · 실제 발생 지점과 다를 수 있습니다');
  const { default: AboutPage } = await import('@/app/about/page');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const info = document.createElement('div');
  info.innerHTML = renderToStaticMarkup(createElement(AboutPage));
  const source = info.querySelector(
    'a[href="https://www.data.go.kr/data/15084084/openapi.do"]',
  );
  expect(source?.textContent).toContain('기상청');
  expect(info.textContent).toContain('정확한 사건 현장과 다를 수 있습니다');
});

test('mapRemovedOverviewControlDoesNotRecenterSingleOrDuplicatePositions', async () => {
  for (const items of [
    data.items,
    [...data.items, { ...data.items[0], article_id: 'b'.repeat(64) }],
  ]) {
    const fixture = await mount({ ...data, total: items.length, items });
    expect(fixture.positions).toHaveLength(1);
    expect(container.textContent).not.toContain('기사 위치 보기');
    expect(
      container.querySelector(
        'a[href="https://www.data.go.kr/data/15084084/openapi.do"]',
      ),
    ).toBeNull();
    expect(fixture.setCenter).not.toHaveBeenCalled();
    expect(fixture.setZoom).not.toHaveBeenCalled();
    expect(fixture.fitBounds).not.toHaveBeenCalled();
    await act(async () => root!.unmount());
    root = undefined;
    container.remove();
    document
      .querySelectorAll('script[src*="oapi.map.naver.com"]')
      .forEach((node) => node.remove());
  }
});

test('mapArticleSheetPreservesGroupedChoices', async () => {
  const pair = ['b', 'c'].map((letter) => ({
    ...data.items[0],
    article_id: letter.repeat(64),
    article: { ...data.items[0].article, title: letter + ' 두 건 지역 기사' },
    location: {
      ...data.items[0].location,
      latitude: 37.5,
      longitude: 127.1,
      label: '두 건 검증 지역',
    },
  }));
  const dozen = Array.from({ length: 12 }, (_, index) => ({
    ...data.items[0],
    article_id: (1000 + index).toString(16).padStart(64, '0'),
    article: { ...data.items[0].article, title: '열두 건 지역 기사 ' + index },
    location: {
      ...data.items[0].location,
      latitude: 37.2,
      longitude: 129.1,
      label: '열두 건 검증 지역',
    },
  }));
  const items = [...data.items, ...pair, ...dozen];
  const openArticle = vi.fn();
  const route: ArticleSheetRoute = {
    active: false,
    sourcePath: '/',
    height: 456,
    mapArticles: items,
    openArticle,
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const fixture = await mount({ ...data, total: items.length, items }, route);
  expect(fixture.positions).toHaveLength(3);
  await act(async () => fixture.selected[0]());
  expect(
    openArticle,
    '단건 원 선택 시 미리보기부터 표시',
  ).not.toHaveBeenCalled();
  expect(
    document
      .querySelector('[aria-label="선택한 기사"]')
      ?.querySelectorAll('a[href^="/incidents/"]'),
  ).toHaveLength(1);
  await fixture.draw({ ...route, active: true });
  expect(document.querySelector('[aria-label="선택한 기사"]')).toBeNull();
  await fixture.draw(route);
  expect(
    document
      .querySelector('[aria-label="선택한 기사"]')
      ?.querySelectorAll('a[href^="/incidents/"]'),
  ).toHaveLength(1);
  for (const [index, count] of [
    [1, 2],
    [2, 12],
  ]) {
    await act(async () => fixture.selected[index]());
    const chooser = document.querySelector('[aria-label="선택한 기사"]');
    expect(chooser?.querySelectorAll('a[href^="/incidents/"]')).toHaveLength(
      count,
    );
    await fixture.draw({ ...route, active: true });
    expect(
      document.querySelector('[aria-label="선택한 기사"]'),
      '상세와 선택 패널 중복 금지',
    ).toBeNull();
    await fixture.draw(route);
    expect(
      document
        .querySelector('[aria-label="선택한 기사"]')
        ?.querySelectorAll('a[href^="/incidents/"]'),
    ).toHaveLength(count);
  }
  expect(route.registerMapArticles).toHaveBeenCalledWith(items);
  expect(
    fixture.positions,
    '시트 진입으로 SDK나 마커를 재생성하지 않음',
  ).toHaveLength(3);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
  expect(fixture.fitBounds).not.toHaveBeenCalled();
});

test('mapGroupedSheetRestoresExpandedReadingPositionAndArticleFocus', async () => {
  const items = Array.from({ length: 12 }, (_, index) => ({
    ...data.items[0],
    article_id: (2000 + index).toString(16).padStart(64, '0'),
    article: {
      ...data.items[0].article,
      title: '그룹 복귀 검증 기사 ' + index,
    },
  }));
  const openArticle = vi.fn();
  const route: ArticleSheetRoute = {
    active: false,
    sourcePath: '/',
    height: 456,
    mapArticles: items,
    openArticle,
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const overflow = document.body.style.overflow;
  const padding = document.body.style.paddingRight;
  document.body.style.overflow = 'auto';
  document.body.style.paddingRight = '8px';

  try {
    const fixture = await mount({ ...data, total: items.length, items }, route);
    container.dataset.articleBackground = '';
    const marker = (fixture.positions[0] as { icon: { content: HTMLElement } })
      .icon.content;
    marker.focus();
    await act(async () => fixture.selected[0]());
    const chooser = document.querySelector<HTMLElement>(
      '[aria-label="선택한 기사"]',
    )!;
    const scroller = chooser.querySelector<HTMLElement>('[tabindex="0"]')!;
    const article = chooser.querySelectorAll<HTMLAnchorElement>(
      'a[href^="/incidents/"]',
    )[9];
    const handle = chooser.querySelector<HTMLButtonElement>(
      'button[aria-expanded]',
    )!;
    await act(async () => handle.click());
    scroller.scrollTop = 640;
    await act(async () => scroller.dispatchEvent(new Event('scroll')));
    article.focus();

    const preventNavigation = (event: MouseEvent) => event.preventDefault();
    document.addEventListener('click', preventNavigation);
    try {
      await act(async () =>
        article.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
          }),
        ),
      );
      expect(
        openArticle,
        '수정키 클릭은 기존 링크 동작 유지',
      ).not.toHaveBeenCalled();
      await act(async () => article.click());
      expect(
        openArticle,
        '선택한 기사는 미리보기부터 표시',
      ).not.toHaveBeenCalled();
      const preview = document.querySelector<HTMLElement>(
        '[aria-label="선택한 기사"]',
      )!;
      expect(preview.textContent).toContain(items[9].article.title);
      const detailLink = preview.querySelector<HTMLAnchorElement>(
        'a[href="/incidents/' + items[9].article_id + '"]',
      )!;
      await act(async () => detailLink.click());
    } finally {
      document.removeEventListener('click', preventNavigation);
    }
    expect(openArticle, '미리보기 링크로 공통 상세 진입').toHaveBeenCalledWith(
      items[9].article_id,
    );

    container.dataset.articleOverlay = 'true';
    container.inert = true;
    container.setAttribute('aria-hidden', 'true');
    await fixture.draw(
      { ...route, active: true },
      createElement(
        DetailSheet,
        { titleId: 'group-routed-detail-heading' },
        createElement(
          'h1',
          { id: 'group-routed-detail-heading' },
          items[9].article.title,
        ),
      ),
    );
    const detail = document.querySelector<HTMLElement>(
      '[data-article-inline]',
    )!;
    expect(chooser.isConnected, '그룹 시트를 버리지 않고 읽기 상태 보존').toBe(
      true,
    );
    expect(chooser.hidden).toBe(true);
    expect(chooser.hasAttribute('inert')).toBe(true);
    expect(chooser.getAttribute('role')).toBeNull();
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBeNull();
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    expect(
      detail.contains(document.activeElement),
      '새 상세가 포커스를 소유',
    ).toBe(true);
    expect(document.body.style.overflow).toBe('auto');

    delete container.dataset.articleOverlay;
    container.inert = false;
    container.removeAttribute('aria-hidden');
    await fixture.draw(route);
    const restoredPreview = document.querySelector<HTMLElement>(
      '[aria-label="선택한 기사"]',
    )!;
    expect(restoredPreview).not.toBe(chooser);
    expect(restoredPreview.textContent).toContain(items[9].article.title);
    await act(async () =>
      restoredPreview
        .querySelector<HTMLButtonElement>(
          'button[aria-label="기사 선택 닫기"]',
        )!
        .click(),
    );
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBe(chooser);
    expect(chooser.hidden).toBe(false);
    expect(chooser.hasAttribute('inert')).toBe(false);
    expect(chooser.dataset.expanded, '펼쳐 읽던 높이 유지').toBe('true');
    expect(chooser.querySelector('[tabindex="0"]')).toBe(scroller);
    expect(scroller.scrollTop, '열 번째 기사까지 읽던 스크롤 유지').toBe(640);
    expect(document.activeElement, '원래 열었던 열 번째 기사로 복귀').toBe(
      article,
    );
    expect(document.body.style.overflow).toBe('hidden');
    expect(container.inert).toBe(true);
    await act(async () =>
      chooser
        .querySelector<HTMLButtonElement>(
          'button[aria-label="기사 선택 닫기"]',
        )!
        .click(),
    );
    expect(document.activeElement, '그룹도 닫으면 원래 숫자 원으로 복귀').toBe(
      marker,
    );
    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.paddingRight).toBe('8px');
    expect(container.inert).toBe(false);
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    expect(fixture.positions).toHaveLength(1);
    expect(fixture.setCenter).not.toHaveBeenCalled();
    expect(fixture.setZoom).not.toHaveBeenCalled();
  } finally {
    if (root) await act(async () => root!.unmount());
    root = undefined;
    document.body.style.overflow = overflow;
    document.body.style.paddingRight = padding;
  }
});

test('groupedMarkerShowsSelectedArticlePreviewBeforeDetailAndRestoresChooser', async () => {
  const items = Array.from({ length: 12 }, (_, index) => ({
    ...data.items[0],
    article_id: (3000 + index).toString(16).padStart(64, '0'),
    article: {
      ...data.items[0].article,
      title: '미리보기 선택 기사 ' + index,
      description: '선택한 기사 내용 ' + index,
    },
  }));
  const openArticle = vi.fn();
  const route: ArticleSheetRoute = {
    active: false,
    sourcePath: '/',
    height: 456,
    mapArticles: items,
    openArticle,
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const fixture = await mount({ ...data, total: items.length, items }, route);
  const originalUrl = window.location.href;
  await act(async () => fixture.selected[0]());
  const chooser = document.querySelector<HTMLElement>(
    '[aria-label="선택한 기사"]',
  )!;
  const scroller = chooser.querySelector<HTMLElement>('[tabindex="0"]')!;
  const selected = chooser.querySelectorAll<HTMLAnchorElement>(
    'a[href^="/incidents/"]',
  )[9];
  const toggle = chooser.querySelector<HTMLButtonElement>(
    'button[aria-expanded]',
  )!;
  await act(async () => toggle.click());
  scroller.scrollTop = 640;
  await act(async () => scroller.dispatchEvent(new Event('scroll')));
  selected.focus();
  const preventNavigation = (event: MouseEvent) => event.preventDefault();
  document.addEventListener('click', preventNavigation);
  try {
    await act(async () =>
      selected.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        }),
      ),
    );
    expect(
      openArticle,
      '수정키 선택은 네이티브 링크 유지',
    ).not.toHaveBeenCalled();
    expect(chooser.hidden).toBe(false);
    await act(async () => selected.click());
    expect(
      openArticle,
      '기사 선택은 상세로 이동하지 않음',
    ).not.toHaveBeenCalled();
    expect(window.location.href).toBe(originalUrl);
    expect(chooser.isConnected).toBe(true);
    expect(chooser.hidden).toBe(true);
    const preview = document.querySelector<HTMLElement>(
      '[aria-label="선택한 기사"]',
    )!;
    expect(preview).not.toBe(chooser);
    expect(preview.textContent).toContain(items[9].article.title);
    expect(preview.textContent).toContain(items[9].article.description);
    expect(preview.textContent).not.toContain(items[8].article.title);
    const detail = preview.querySelector<HTMLAnchorElement>(
      'a[href="/incidents/' + items[9].article_id + '"]',
    )!;
    expect(detail.textContent).toContain('자세히 보기');
    await act(async () =>
      detail.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          metaKey: true,
        }),
      ),
    );
    expect(
      openArticle,
      '미리보기 상세 링크 수정키 동작 유지',
    ).not.toHaveBeenCalled();
    await act(async () => detail.click());
    expect(openArticle).toHaveBeenCalledOnce();
    expect(openArticle).toHaveBeenCalledWith(items[9].article_id);
    await fixture.draw({ ...route, active: true });
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBeNull();
    await fixture.draw(route);
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBe(preview);
    const close = preview.querySelector<HTMLButtonElement>(
      'button[aria-label="기사 선택 닫기"]',
    )!;
    await act(async () => close.click());
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBe(chooser);
    expect(chooser.dataset.expanded).toBe('true');
    expect(scroller.scrollTop).toBe(640);
    expect(document.activeElement).toBe(selected);
    expect(fixture.positions).toHaveLength(1);
    expect(fixture.removed).not.toHaveBeenCalled();
    expect(fixture.setCenter).not.toHaveBeenCalled();
    expect(fixture.setZoom).not.toHaveBeenCalled();
    expect(fixture.fitBounds).not.toHaveBeenCalled();
  } finally {
    document.removeEventListener('click', preventNavigation);
  }
});

test('singleMapMarkerShowsArticlePreviewBeforeOpeningDetail', async () => {
  const item = {
    ...data.items[0],
    image_status: 'ready',
    image_url: `/images/${data.items[0].article_id}.jpg`,
  };
  const openArticle = vi.fn();
  const route: ArticleSheetRoute = {
    active: false,
    sourcePath: '/',
    height: 0,
    mapArticles: [item],
    openArticle,
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const originalUrl = window.location.href;
  const fixture = await mount({ ...data, items: [item] }, route);
  expect(fixture.positions).toHaveLength(1);
  const marker = (
    fixture.positions[0] as { icon: { content: HTMLButtonElement } }
  ).icon.content;
  marker.focus();

  await act(async () => fixture.selected[0]());

  expect(
    openArticle,
    '마커 선택만으로 상세 경로에 진입하지 않음',
  ).not.toHaveBeenCalled();
  expect(window.location.href, '미리보기는 지도 주소에서 열림').toBe(
    originalUrl,
  );
  expect(marker.getAttribute('aria-pressed')).toBe('true');
  const sheets = document.querySelectorAll<HTMLElement>('[role="dialog"]');
  expect(sheets, '기사 미리보기 하나만 표시').toHaveLength(1);
  const sheet = sheets[0];
  expect(sheet.textContent).toContain('장림동 공장 화재');
  expect(sheet.textContent).toContain(item.article.description);
  expect(sheet.textContent).toContain(item.location.label);
  expect(sheet.textContent).toContain('실제 발생 지점과 다를 수 있습니다');
  expect(sheet.querySelector('b'), '기사 HTML은 텍스트로 표시').toBeNull();
  const imageUrl = `${data.apiOrigin}${item.image_url}`;
  expect(
    sheet.querySelector(`img[src="${imageUrl}"]`),
    '미리보기는 선택한 기사의 실제 이미지를 표시',
  ).not.toBeNull();

  const href = `/incidents/${item.article_id}`;
  const detail = sheet.querySelector<HTMLAnchorElement>(`a[href="${href}"]`);
  expect(detail, '실제 기사의 상세 주소가 있는 링크').not.toBeNull();
  expect(detail?.getAttribute('href')).toBe(href);
  expect(new URL(detail!.href).origin).toBe(window.location.origin);

  const close = sheet.querySelector<HTMLButtonElement>(
    'button[aria-label="기사 선택 닫기"], button[aria-label="닫기"]',
  );
  expect(close, '키보드로 접근할 수 있는 미리보기 닫기').not.toBeNull();
  await act(async () => close!.click());
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(marker.getAttribute('aria-pressed')).toBe('false');
  expect(document.activeElement, '닫으면 선택한 지도 원으로 복귀').toBe(marker);
  expect(window.location.href).toBe(originalUrl);
  expect(fixture.positions).toHaveLength(1);
  expect(fixture.setCenter).not.toHaveBeenCalled();
  expect(fixture.setZoom).not.toHaveBeenCalled();
  expect(fixture.fitBounds).not.toHaveBeenCalled();
});
test('singlePreviewAlignsLocationAndDateLikeFigma', async () => {
  const fixture = await mount();
  await act(async () => fixture.selected[0]());
  const preview = document.querySelector<HTMLElement>(
    '[role="dialog"][aria-label="선택한 기사"]',
  )!;
  const article = preview.querySelector('article')!;
  const title = article.querySelector('h2')!;
  const location = [...article.querySelectorAll('p')].find((node) =>
    node.textContent?.includes(data.items[0].location.label),
  )!;
  const date = article.querySelector('time')!.closest('p')!;
  const locationIcon = location.querySelector(
    'img[src="/figma/preview-location.svg"]',
  );
  const dateIcon = date.querySelector('img[src="/figma/preview-date.svg"]');
  for (const icon of [locationIcon, dateIcon]) {
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('width')).toBe('16');
    expect(icon?.getAttribute('height')).toBe('16');
    expect(icon?.getAttribute('alt')).toBe('');
    expect(icon?.parentElement?.classList.contains('gap-1')).toBe(true);
    expect(icon?.parentElement?.classList.contains('items-center')).toBe(true);
  }
  expect(title.parentElement).toBe(location.parentElement?.parentElement);
  expect(title.parentElement?.classList.contains('gap-3')).toBe(true);
  expect(location.parentElement?.classList.contains('gap-1')).toBe(true);
  expect(article.textContent).toContain(
    '지역 대표 위치 · 실제 발생 지점과 다를 수 있습니다',
  );
  expect(article.querySelector('time')?.getAttribute('datetime')).toBe(
    '2026-10-13T23:00:00.000Z',
  );
});

test('mapPreviewShowsSelectedArticleDetailsAndSafeSourceBeforeNavigation', async () => {
  const item = {
    ...data.items[0],
    image_status: 'ready',
    image_url: `/images/${data.items[0].article_id}.jpg`,
    article: {
      ...data.items[0].article,
      title: '장림동 <b>공장</b> 화재',
      description: '부산 사하구에서 불이 났습니다.',
      originallink: 'javascript:alert(1)',
      link: 'https://publisher.example.invalid/story',
    },
  };
  const openArticle = vi.fn();
  const route: ArticleSheetRoute = {
    active: false,
    sourcePath: '/',
    height: 0,
    mapArticles: [item],
    openArticle,
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const fixture = await mount({ ...data, total: 1, items: [item] }, route);
  const marker = (
    fixture.positions[0] as { icon: { content: HTMLButtonElement } }
  ).icon.content;
  marker.focus();
  const initialUrl = window.location.href;

  await act(async () => fixture.selected[0]());

  const preview = document.querySelector<HTMLElement>(
    '[role="dialog"][aria-label="선택한 기사"]',
  )!;
  expect(preview).not.toBeNull();
  expect(preview.textContent).toContain('장림동 공장 화재');
  expect(preview.querySelector('b')).toBeNull();
  expect(preview.textContent).toContain(item.location.label);
  expect(preview.textContent).toContain(item.article.description);
  expect(preview.querySelector('time')?.getAttribute('datetime')).toBe(
    '2026-10-13T23:00:00.000Z',
  );
  const image = preview.querySelector<HTMLImageElement>(
    `img[src="${data.apiOrigin}${item.image_url}"]`,
  );
  expect(image).not.toBeNull();
  expect(image?.getAttribute('width')).toBe('361');
  expect(image?.getAttribute('height')).toBe('140');
  expect(preview.textContent).toContain('AI로 생성된 이미지입니다.');
  const source = preview.querySelector<HTMLAnchorElement>(
    'a[href="https://publisher.example.invalid/story"]',
  );
  expect(source?.getAttribute('target')).toBe('_blank');
  expect(source?.getAttribute('rel')).toContain('noopener');
  expect(preview.querySelector('a[href^="javascript:"]')).toBeNull();

  const detail = preview.querySelector<HTMLAnchorElement>(
    `a[href="/incidents/${item.article_id}"]`,
  );
  expect(detail?.textContent).toContain('자세히 보기');
  expect(window.location.href).toBe(initialUrl);
  expect(openArticle).not.toHaveBeenCalled();
  const preventNavigation = (event: MouseEvent) => event.preventDefault();
  document.addEventListener('click', preventNavigation);
  try {
    await act(async () => detail!.click());
    expect(openArticle).toHaveBeenCalledOnce();
    expect(openArticle).toHaveBeenCalledWith(item.article_id);
    await fixture.draw({ ...route, active: true });
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBeNull();
    await fixture.draw(route);
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBe(preview);
    expect(document.activeElement).toBe(detail);
    await act(async () =>
      preview
        .querySelector<HTMLButtonElement>(
          'button[aria-label="기사 선택 닫기"]',
        )!
        .click(),
    );
    expect(document.activeElement).toBe(marker);
  } finally {
    document.removeEventListener('click', preventNavigation);
  }
});

test('mapCarouselCardShowsPreviewAndRestoresCardFocus', async () => {
  const item = data.items[0];
  const openArticle = vi.fn();
  const route: ArticleSheetRoute = {
    active: false,
    sourcePath: '/',
    height: 0,
    mapArticles: [item],
    openArticle,
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const fixture = await mount(data, route);
  const origin = window.location.href;
  const card = container.querySelector<HTMLAnchorElement>(
    `section[aria-label="지도 기사"] a[href="/incidents/${item.article_id}"]`,
  )!;
  expect(card).not.toBeNull();
  expect(card.getAttribute('href')).toBe(`/incidents/${item.article_id}`);
  const nativeClickStates: boolean[] = [];
  const preventNavigation = (event: MouseEvent) => {
    nativeClickStates.push(event.defaultPrevented);
    event.preventDefault();
  };
  document.addEventListener('click', preventNavigation);
  try {
    for (const modifier of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ]) {
      await act(async () =>
        card.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            ...modifier,
          }),
        ),
      );
      expect(
        nativeClickStates.at(-1),
        '수정키/보조 클릭은 브라우저에 전달',
      ).toBe(false);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(openArticle).not.toHaveBeenCalled();
    }
    await act(async () => card.click());
    expect(window.location.href).toBe(origin);
    expect(openArticle).not.toHaveBeenCalled();
    const preview = document.querySelector<HTMLElement>(
      '[aria-label="선택한 기사"]',
    )!;
    expect(preview).not.toBeNull();
    expect(preview.textContent).toContain('장림동 공장 화재');
    expect(preview.textContent).toContain(item.article.description);
    const detail = preview.querySelector<HTMLAnchorElement>(
      `a[href="/incidents/${item.article_id}"]`,
    )!;
    expect(detail.textContent).toContain('자세히 보기');
    await act(async () => detail.click());
    expect(openArticle).toHaveBeenCalledOnce();
    expect(openArticle).toHaveBeenCalledWith(item.article_id);
    await fixture.draw({ ...route, active: true });
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBeNull();
    await fixture.draw(route);
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBe(preview);
    expect(document.activeElement).toBe(detail);
    await act(async () =>
      preview
        .querySelector<HTMLButtonElement>(
          'button[aria-label="기사 선택 닫기"]',
        )!
        .click(),
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(card);
    expect(fixture.positions).toHaveLength(1);
    expect(fixture.removed).not.toHaveBeenCalled();
    expect(fixture.setCenter).not.toHaveBeenCalled();
    expect(fixture.setZoom).not.toHaveBeenCalled();
    expect(fixture.fitBounds).not.toHaveBeenCalled();
  } finally {
    document.removeEventListener('click', preventNavigation);
  }
});

test('carouselPreviewRestoresMapFocusWhenSourceCardLeavesLatestFour', async () => {
  const selected = data.items[0];
  const route: ArticleSheetRoute = {
    active: false,
    sourcePath: '/',
    height: 0,
    mapArticles: [selected],
    openArticle: vi.fn(),
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const fixture = await mount(data, route);
  const card = container.querySelector<HTMLAnchorElement>(
    `section[aria-label="지도 기사"] a[href="/incidents/${selected.article_id}"]`,
  )!;
  const preventNavigation = (event: MouseEvent) => event.preventDefault();
  document.addEventListener('click', preventNavigation);
  try {
    await act(async () => card.click());
    const preview = document.querySelector<HTMLElement>(
      '[aria-label="선택한 기사"]',
    )!;
    expect(preview.textContent).toContain('장림동 공장 화재');
    const newer = Array.from({ length: 4 }, (_, index) => ({
      ...selected,
      article_id: (index + 1).toString(16).padStart(64, '0'),
      article: {
        ...selected.article,
        title: '새 기사 ' + index,
        pubDate: '2027-01-01T00:00:00Z',
      },
    }));
    const items = [...newer, selected];
    await fixture.draw(route, undefined, {
      ...data,
      total: items.length,
      items,
    });
    expect(card.isConnected, '선택 카드는 최신 4개 바깥으로 이동').toBe(false);
    expect(document.querySelector('[aria-label="선택한 기사"]')).toBe(preview);
    await act(async () =>
      preview
        .querySelector<HTMLButtonElement>(
          'button[aria-label="기사 선택 닫기"]',
        )!
        .click(),
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement, '사라진 카드 대신 지도 영역으로 복귀').toBe(
      container.querySelector('[aria-label="주변 지도"]'),
    );
    expect(fixture.setCenter).not.toHaveBeenCalled();
    expect(fixture.setZoom).not.toHaveBeenCalled();
  } finally {
    document.removeEventListener('click', preventNavigation);
  }
});

test('carouselPreviewRestoresMapFocusWhenSelectedArticleIsRemoved', async () => {
  const selected = data.items[0];
  const route: ArticleSheetRoute = {
    active: false,
    sourcePath: '/',
    height: 0,
    mapArticles: [selected],
    openArticle: vi.fn(),
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const fixture = await mount(data, route);
  const card = container.querySelector<HTMLAnchorElement>(
    `section[aria-label="지도 기사"] a[href="/incidents/${selected.article_id}"]`,
  )!;
  const preventNavigation = (event: MouseEvent) => event.preventDefault();
  document.addEventListener('click', preventNavigation);
  try {
    await act(async () => card.click());
    expect(document.querySelector('[aria-label="선택한 기사"]')).not.toBeNull();
    const replacement = {
      ...selected,
      article_id: 'b'.repeat(64),
      article: { ...selected.article, title: '새 기사' },
    };
    await fixture.draw(route, undefined, { ...data, items: [replacement] });
    expect(card.isConnected).toBe(false);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(
      document.activeElement,
      '기사가 사라져 시트가 닫히면 지도 영역으로 복귀',
    ).toBe(container.querySelector('[aria-label="주변 지도"]'));
    expect(fixture.setCenter).not.toHaveBeenCalled();
    expect(fixture.setZoom).not.toHaveBeenCalled();
  } finally {
    document.removeEventListener('click', preventNavigation);
  }
});

test('removingCarouselArticleKeepsDetailFocusUntilReturningToMap', async () => {
  const selected = data.items[0];
  const route: ArticleSheetRoute = {
    active: false,
    sourcePath: '/',
    height: 0,
    mapArticles: [selected],
    openArticle: vi.fn(),
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  const fixture = await mount(data, route);
  const card = container.querySelector<HTMLAnchorElement>(
    `section[aria-label="지도 기사"] a[href="/incidents/${selected.article_id}"]`,
  )!;
  const preventNavigation = (event: MouseEvent) => event.preventDefault();
  document.addEventListener('click', preventNavigation);
  try {
    await act(async () => card.click());
    const preview = document.querySelector<HTMLElement>(
      '[aria-label="선택한 기사"]',
    )!;
    await act(async () =>
      preview
        .querySelector<HTMLAnchorElement>(
          `a[href="/incidents/${selected.article_id}"]`,
        )!
        .click(),
    );
    const activeRoute = { ...route, active: true };
    const detail = createElement(
      DetailSheet,
      { titleId: 'removed-card-detail' },
      createElement(
        'h1',
        { id: 'removed-card-detail' },
        selected.article.title,
      ),
    );
    await fixture.draw(activeRoute, detail);
    const inline = document.querySelector<HTMLElement>(
      '[data-article-inline]',
    )!;
    expect(inline.contains(document.activeElement)).toBe(true);
    const replacement = {
      ...selected,
      article_id: 'b'.repeat(64),
      article: { ...selected.article, title: '새 기사' },
    };
    const nextResult = { ...data, items: [replacement] };
    await fixture.draw(activeRoute, detail, nextResult);
    expect(
      inline.contains(document.activeElement),
      '상세를 읽는 중에 포커스 유지',
    ).toBe(true);
    await fixture.draw(route, undefined, nextResult);
    expect(document.activeElement, '지도로 돌아온 뒤 대체 위치 복귀').toBe(
      container.querySelector('[aria-label="주변 지도"]'),
    );
  } finally {
    document.removeEventListener('click', preventNavigation);
  }
});
