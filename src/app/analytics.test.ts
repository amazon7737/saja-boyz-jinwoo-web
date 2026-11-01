// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';

import RootLayout from './layout';

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => createElement('span', { 'data-analytics-probe': '' }),
}));
vi.mock('@/components/layout/route-shell/route-shell', () => ({
  RouteShell: ({ children }: { children: ReactNode }) =>
    createElement('div', { 'data-route-shell': '' }, children),
}));

test('rootLayoutMountsOneAnalyticsAlongsidePreservedRouteContent', () => {
  const html = renderToStaticMarkup(
    RootLayout({
      children: createElement('h1', null, '기사 화면'),
    }),
  );
  const document = new DOMParser().parseFromString(html, 'text/html');
  expect(document.querySelector('h1')?.textContent).toBe('기사 화면');
  expect(document.querySelectorAll('[data-analytics-probe]')).toHaveLength(1);
  expect(
    document.querySelector('body > [data-analytics-probe]'),
  ).not.toBeNull();
  expect(
    document.querySelector('[data-route-shell] [data-analytics-probe]'),
  ).toBeNull();
});
