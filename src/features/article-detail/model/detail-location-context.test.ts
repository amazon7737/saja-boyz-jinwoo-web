// @vitest-environment jsdom
import {
  act,
  createElement,
  type ComponentType,
  type PropsWithChildren,
} from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';

import {
  ArticleSheetContext,
  type ArticleSheetRoute,
} from './article-sheet-context';
import {
  DetailLocationProvider,
  useDetailLocation,
} from './detail-location-context';
import { groupMapArticles } from '@/features/map/model/map-region-groups';

vi.mock('@/features/map/model/map-region-groups', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/map/model/map-region-groups')
    >();
  return { ...actual, groupMapArticles: vi.fn(actual.groupMapArticles) };
});

test('sheet resizing does not regroup unchanged map articles while changed articles still update detail', async () => {
  const id = 'a'.repeat(64);
  const item = {
    article_id: id,
    collection_id: 'test',
    image_status: 'disabled' as const,
    image_url: null,
    article: {
      title: '기사',
      description: '',
      pubDate: '2026-11-20T00:00:00Z',
      link: '',
      originallink: '',
    },
    location_status: 'resolved' as const,
    location_reason: null,
    location: {
      latitude: 37.5,
      longitude: 127.1,
      label: '서울',
      precision: 'region' as const,
      evidence: { field: 'title' as const, text: '기사' },
    },
  };
  const route: ArticleSheetRoute = {
    active: true,
    sourcePath: '/',
    height: 0,
    mapArticles: [item],
    openArticle: vi.fn(),
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  function Consumer() {
    const detail = useDetailLocation(id);
    return createElement('p', null, detail.data?.location?.label);
  }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  const render = async (value: ArticleSheetRoute) => {
    await act(async () =>
      root.render(
        createElement(
          ArticleSheetContext,
          { value },
          createElement(
            DetailLocationProvider as ComponentType<
              PropsWithChildren<{ id: string }>
            >,
            { id },
            createElement(Consumer),
          ),
        ),
      ),
    );
  };
  try {
    await render(route);
    expect(node.textContent).toBe('서울');
    const initial = vi.mocked(groupMapArticles).mock.calls.length;
    await render({ ...route, height: 100 });
    await render({ ...route, height: 200 });
    expect(vi.mocked(groupMapArticles)).toHaveBeenCalledTimes(initial);
    await render({
      ...route,
      height: 200,
      mapArticles: [{ ...item, location: { ...item.location, label: '부산' } }],
    });
    expect(node.textContent).toBe('부산');
    expect(vi.mocked(groupMapArticles).mock.calls.length).toBeGreaterThan(
      initial,
    );
  } finally {
    await act(async () => root.unmount());
    node.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  }
});
