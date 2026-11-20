// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';

import { MapHomeLoading } from './map-home-loading';
import { MapHome } from './map-home';
import type { MapArticleResult } from '../../model/map-article.types';

const items: MapArticleResult['items'] = [
  {
    article_id: 'a'.repeat(64),
    collection_id: 'collection',
    image_status: 'disabled',
    image_url: null,
    article: {
      title: '장림동 공장 화재',
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
];

test('지도 최초 로딩은 넓은 앱 화면을 채울 카드와 하나의 로딩 안내를 제공한다', () => {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(createElement(MapHomeLoading));

  const status = host.querySelector('[role="status"][aria-busy="true"]');
  const cards = host.querySelectorAll('.ui-skeleton-pulse')[1]?.children;
  expect(host.querySelectorAll('[role="status"]')).toHaveLength(1);
  expect(status?.textContent).toContain('주변 기사를 지도에 불러오는 중이에요');
  expect(cards).toHaveLength(4);
  expect(cards?.[0].closest('[aria-hidden="true"]')).not.toBeNull();
});

test('기사 데이터가 준비되기 전에는 카드 대기를 표시하고 빈 결과에는 표시하지 않는다', () => {
  const host = document.createElement('div');

  host.innerHTML = renderToStaticMarkup(
    createElement(MapHome, {
      clientId: 'local-test-id',
    }),
  );
  expect(host.querySelector('[data-map-carousel-skeleton]')).not.toBeNull();
  expect(host.querySelectorAll('[data-map-skeleton-card]')).toHaveLength(4);
  expect(
    host.querySelectorAll('[role="status"][aria-busy="true"]'),
  ).toHaveLength(1);

  host.innerHTML = renderToStaticMarkup(
    createElement(MapHome, {
      clientId: 'local-test-id',
      articles: { items: [], total: 0, apiOrigin: 'https://example.com' },
    }),
  );
  expect(host.querySelector('[data-map-carousel-skeleton]')).toBeNull();
});

test('기사 데이터가 도착하거나 지도 SDK가 실패하면 카드 대기를 제거한다', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => {
      root.render(
        createElement(MapHome, {
          clientId: 'local-test-id',
        }),
      );
    });
    expect(host.querySelector('[data-map-carousel-skeleton]')).not.toBeNull();
    await act(async () => {
      root.render(
        createElement(MapHome, {
          clientId: 'local-test-id',
          articles: { items, total: 1, apiOrigin: 'https://example.com' },
        }),
      );
    });
    expect(host.querySelector('[data-map-carousel-skeleton]')).toBeNull();
    expect(
      host.querySelector('section[aria-label="지도 기사"] a'),
    ).not.toBeNull();
    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="oapi.map.naver.com/openapi/v3/maps.js"]',
    );
    expect(script).not.toBeNull();
    await act(async () => script?.dispatchEvent(new Event('error')));
    expect(host.querySelector('[data-map-carousel-skeleton]')).toBeNull();
    expect(host.textContent).toContain('지도를 불러오지 못했습니다');
    expect(
      host.querySelector('section[aria-label="지도 기사"] a'),
    ).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document
      .querySelectorAll('script[src*="oapi.map.naver.com/openapi/v3/maps.js"]')
      .forEach((node) => node.remove());
    vi.unstubAllGlobals();
  }
});
