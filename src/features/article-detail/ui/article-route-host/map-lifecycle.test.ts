// @vitest-environment jsdom
import { act, createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

import { ArticleRouteHost } from './article-route-host';
import HomePage from '@/app/(browse)/@background/(map)/page';

let pathname = '/search';
let segments = ['search'];
const mounts = vi.hoisted(() => ({ count: 0, destroyed: 0 }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
  useSelectedLayoutSegments: (slot?: string) =>
    slot === 'background' ? segments : [],
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/features/map/api/fetch-map-articles', () => ({
  fetchMapArticles: async () => ({
    total: 0,
    items: [],
    apiOrigin: 'https://example.com',
  }),
}));
vi.mock('@/features/map/ui/map-home/map-home', () => ({
  MapHome: ({ initializeSdk = true }: { initializeSdk?: boolean }) => {
    useEffect(() => {
      if (!initializeSdk) return;
      mounts.count += 1;
      return () => {
        mounts.destroyed += 1;
      };
    }, [initializeSdk]);
    return createElement('section', {
      'aria-label': '주변 지도',
      'data-map-fixture': initializeSdk ? '' : undefined,
    });
  },
}));

test('keeps a visited map mounted while browsing and skips it on direct search', async () => {
  const previousId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID = 'map-test-id';
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const mapPage = await HomePage();
  const draw = async (path: string) => {
    pathname = path;
    segments = path === '/' ? ['(map)'] : [path.slice(1)];
    await act(async () => {
      root.render(
        createElement(ArticleRouteHost, {
          background: path === '/' ? mapPage : createElement('p', null, path),
        }),
      );
    });
  };

  try {
    await draw('/search');
    expect(mounts.count).toBe(0);
    await draw('/');
    const map = container.querySelector('[data-map-fixture]');
    expect(map).not.toBeNull();
    expect(mounts.count).toBe(1);
    await draw('/incidents');
    expect(container.querySelector('[data-map-fixture]')).toBe(map);
    expect(map?.closest('[hidden]')).not.toBeNull();
    expect(mounts.destroyed).toBe(0);
    await draw('/search');
    expect(container.querySelector('[data-map-fixture]')).toBe(map);
    await draw('/');
    expect(container.querySelector('[data-map-fixture]')).toBe(map);
    expect(map?.closest('[hidden]')).toBeNull();
    expect(mounts.count).toBe(1);
    expect(mounts.destroyed).toBe(0);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    if (previousId === undefined)
      delete process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    else process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID = previousId;
    vi.unstubAllGlobals();
  }
});
