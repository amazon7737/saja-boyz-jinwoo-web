// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';

import { MapHomeLoading } from './map-home-loading';
import { MapHome } from './map-home';
import type { MapArticleResult } from '../../model/map-article.types';

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

test('지도 SDK를 기다릴 때 기사가 있으면 카드 대기를 표시하고 빈 결과에는 표시하지 않는다', () => {
  const host = document.createElement('div');
  const items = [{ article_id: 'a'.repeat(64) }] as MapArticleResult['items'];

  host.innerHTML = renderToStaticMarkup(
    createElement(MapHome, {
      clientId: 'local-test-id',
      articles: { items, total: 1, apiOrigin: 'https://example.com' },
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

test('지도 SDK가 실패하면 카드 스켈레톤을 제거한다', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const items = [{ article_id: 'a'.repeat(64) }] as MapArticleResult['items'];

  try {
    await act(async () => {
      root.render(
        createElement(MapHome, {
          clientId: 'local-test-id',
          articles: { items, total: 1, apiOrigin: 'https://example.com' },
        }),
      );
    });
    expect(host.querySelector('[data-map-carousel-skeleton]')).not.toBeNull();
    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="oapi.map.naver.com/openapi/v3/maps.js"]',
    );
    expect(script).not.toBeNull();
    await act(async () => script?.dispatchEvent(new Event('error')));
    expect(host.querySelector('[data-map-carousel-skeleton]')).toBeNull();
    expect(host.textContent).toContain('지도를 불러오지 못했습니다');
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document
      .querySelectorAll('script[src*="oapi.map.naver.com/openapi/v3/maps.js"]')
      .forEach((node) => node.remove());
    vi.unstubAllGlobals();
  }
});
