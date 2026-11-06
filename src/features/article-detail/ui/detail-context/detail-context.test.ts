// file: src/features/article-detail/ui/detail-context/detail-context.test.ts
// @vitest-environment jsdom
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import {
  ArticleSheetContext,
  type ArticleSheetRoute,
} from '../../model/article-sheet-context';
import type { LocatedArticle } from '@/features/map/model/map-article.types';
import { DetailLocation, RelatedArticles } from './detail-context';

test('articleSheetVerifiedContext', () => {
  const id = 'a'.repeat(64);
  const item: LocatedArticle = {
    article_id: id,
    collection_id: 'verified-context',
    image_status: 'disabled',
    image_url: null,
    article: {
      title: '검증 기사',
      description: '요약',
      pubDate: '2026-10-22T12:20:00Z',
      originallink: '',
      link: '',
    },
    location_status: 'resolved',
    location_reason: null,
    location: {
      latitude: 37.5,
      longitude: 127,
      label: '검증 지역 A',
      precision: 'region',
      evidence: { field: 'description', text: '검증 지역 A' },
    },
  };
  const related = {
    ...item,
    article_id: 'b'.repeat(64),
    article: { ...item.article, title: '<b>같은 지역</b> 검증 기사' },
  };
  const anotherRegion = {
    ...item,
    article_id: 'c'.repeat(64),
    location: { ...item.location, label: '다른 지역 B' },
  };
  const route: ArticleSheetRoute = {
    active: true,
    sourcePath: '/',
    height: 456,
    mapArticles: [item, related, related, anotherRegion],
    openArticle: vi.fn(),
    close: vi.fn(),
    setHeight: vi.fn(),
    registerMapArticles: vi.fn(),
    retry: vi.fn(),
  };
  function draw(value: ArticleSheetRoute | null, articleId: string) {
    const view = document.createElement('div');
    view.innerHTML = renderToStaticMarkup(
      createElement(
        ArticleSheetContext,
        { value },
        createElement(
          Fragment,
          null,
          createElement(DetailLocation, { id: articleId }),
          createElement(RelatedArticles, { id: articleId }),
        ),
      ),
    );
    return view;
  }
  const view = draw(route, id);
  expect(view.textContent).toContain('검증 지역 A');
  expect(view.textContent).toContain('지역 대표 위치');
  expect(view.textContent).toContain('실제 발생 지점과 다를 수 있습니다');
  const section = view.querySelector('section[aria-label="같은 지역 기사"]');
  expect(section?.querySelector('h2')?.textContent?.trim()).toBe(
    '같은 지역 기사',
  );
  expect(section?.textContent).toContain('같은 지역 검증 기사');
  expect(
    [...section!.querySelectorAll('a')].map((link) =>
      link.getAttribute('href'),
    ),
  ).toEqual(['/incidents/' + related.article_id]);
  expect(view.querySelector('b')).toBeNull();
  expect(view.textContent).not.toMatch(
    /같은 지역 보도|진행 중|조회수|다른 지역 B/,
  );
  expect(draw(route, 'f'.repeat(64)).textContent).toBe('');
  expect(
    draw(null, id).textContent,
    '직접 유입에 없는 위치·관련 기사를 채워 넣지 않음',
  ).toBe('');
});

test('serverDetailLocationUsesFigmaIconAndKeepsAccuracyDisclosure', () => {
  const id = 'a'.repeat(64);
  const item: LocatedArticle = {
    article_id: id,
    collection_id: 'verified-context',
    image_status: 'disabled',
    image_url: null,
    article: {
      title: '검증 기사',
      description: '검증 지역 A',
      pubDate: '2026-10-22T12:20:00Z',
      originallink: '',
      link: '',
    },
    location_status: 'resolved',
    location_reason: null,
    location: {
      latitude: 37.5,
      longitude: 127,
      label: '검증 지역 A',
      precision: 'region',
      evidence: { field: 'description', text: '검증 지역 A' },
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
  const render = (value: ArticleSheetRoute | null) => {
    const view = document.createElement('div');
    view.innerHTML = renderToStaticMarkup(
      createElement(
        ArticleSheetContext,
        { value },
        createElement(DetailLocation, { id }),
      ),
    );
    return view;
  };
  const view = render(route);
  const icon = view.querySelector<HTMLImageElement>(
    'img[src="/figma/preview-location.svg"]',
  );
  expect(icon).not.toBeNull();
  expect(icon?.getAttribute('width')).toBe('16');
  expect(icon?.getAttribute('height')).toBe('16');
  expect(icon?.getAttribute('alt')).toBe('');
  expect(icon?.parentElement?.classList.contains('items-center')).toBe(true);
  expect(icon?.parentElement?.classList.contains('gap-1')).toBe(true);
  expect(view.textContent).toContain('검증 지역 A · 지역 대표 위치');
  expect(view.textContent).toContain('실제 발생 지점과 다를 수 있습니다');
  expect(render(null).textContent).toBe('');
});
