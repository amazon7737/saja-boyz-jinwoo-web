// @vitest-environment jsdom
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { MapHomeLoading } from './map-home-loading';

test('지도 로딩은 자바스크립트가 없을 때 실제 기사와 안내로 이동할 수 있다', () => {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(createElement(MapHomeLoading));
  const fallback = host.querySelector('noscript');
  const fallbackContent = document.createElement('div');
  fallbackContent.innerHTML = fallback?.textContent ?? '';

  expect(fallbackContent.textContent).toContain(
    '지도를 보려면 자바스크립트를 켜 주세요',
  );
  expect(fallbackContent.querySelector('a[href="/archive"]')?.textContent).toBe(
    '기사 아카이브',
  );
  expect(fallbackContent.querySelector('a[href="/about"]')?.textContent).toBe(
    '서비스 안내',
  );
  expect(
    host.querySelector('[role="status"][aria-busy="true"]'),
  ).not.toBeNull();
  expect(host.querySelectorAll('[data-map-skeleton-card]')).toHaveLength(4);
});
