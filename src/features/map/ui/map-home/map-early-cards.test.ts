// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';

import type { MapArticleResult } from '../../model/map-article.types';
import { MapHome } from './map-home';

test('지도 준비 전과 지도 오류 후에도 준비된 기사 카드를 보고 상세를 열 수 있다', async () => {
  const id = 'a'.repeat(64);
  const articles: MapArticleResult = {
    total: 1,
    apiOrigin: 'https://news.example.com',
    items: [
      {
        article_id: id,
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
    ],
  };
  const props = { clientId: 'local-test-id', articles };
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(createElement(MapHome, props));
  const selector = `section[aria-label="지도 기사"] a[href="/incidents/${id}"]`;

  expect(host.querySelector(selector)?.textContent).toBe('장림동 공장 화재');
  expect(host.querySelector('[data-map-carousel-skeleton]')).toBeNull();
  expect(
    host.querySelector('[role="status"][aria-busy="true"]'),
  ).not.toBeNull();

  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  document.body.append(host);
  const root = createRoot(host);

  const expectOrdinaryLink = async () => {
    const card = host.querySelector<HTMLAnchorElement>(selector);
    expect(card).not.toBeNull();
    let preventedByCard = true;
    const stopNavigation = (event: MouseEvent) => {
      preventedByCard = event.defaultPrevented;
      event.preventDefault();
    };
    document.addEventListener('click', stopNavigation, { once: true });
    await act(async () => {
      card!.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );
    });
    expect(preventedByCard).toBe(false);
  };

  try {
    await act(async () => root.render(createElement(MapHome, props)));
    await expectOrdinaryLink();

    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="oapi.map.naver.com/openapi/v3/maps.js"]',
    );
    expect(script).not.toBeNull();
    await act(async () => script?.dispatchEvent(new Event('error')));
    expect(host.textContent).toContain('지도를 불러오지 못했습니다');
    await expectOrdinaryLink();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document
      .querySelectorAll('script[src*="oapi.map.naver.com/openapi/v3/maps.js"]')
      .forEach((node) => node.remove());
    vi.unstubAllGlobals();
  }
});
