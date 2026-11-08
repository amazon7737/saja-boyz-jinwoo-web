// file: src/components/feedback/loading-feedback.test.ts
// @vitest-environment jsdom
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';

import { SearchLoading } from '@/features/search/ui/search-loading/search-loading';
import IncidentsLoading from '@/components/feedback/list-loading';
import ArticleDetailLoading from '@/app/(browse)/(.)incidents/[id]/loading';
import { KeywordLinkStatus } from '@/features/search/ui/keyword-link-status/keyword-link-status';
import { MapHome } from '@/features/map/ui/map-home/map-home';

vi.mock('next/link', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/link')>()),
  useLinkStatus: () => ({ pending: true }),
}));

test('loadingFeedbackUsesDecorativeSkeletonsAndCompactAccessibleSpinners', () => {
  for (const [Component, label] of [
    [IncidentsLoading, '사건을 불러오는 중'],
    [SearchLoading, '검색 결과를 불러오는 중'],
    [ArticleDetailLoading, '기사를 불러오는 중'],
  ] as const) {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(createElement(Component));
    const statuses = host.querySelectorAll('[role="status"]');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].getAttribute('aria-busy')).toBe('true');
    expect(statuses[0].textContent).toContain(label);
    expect(statuses[0].querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(statuses[0].querySelector('article, a, button, img')).toBeNull();
    expect(host.querySelector('article')).toBeNull();
    if (Component === ArticleDetailLoading) {
      const close = host.querySelector('a[aria-label="닫기"]');
      expect(close).not.toBeNull();
      const images = host.querySelectorAll('img');
      expect(images).toHaveLength(1);
      expect(images[0].getAttribute('src')).toBe(
        '/article-detail/header-close.svg',
      );
      expect(close?.contains(images[0])).toBe(true);
    } else {
      expect(host.querySelector('a, button, img')).toBeNull();
    }
    expect(host.textContent).not.toMatch(/없어요|못했어요/);
  }

  for (const element of [
    createElement(KeywordLinkStatus),
    createElement(MapHome, { clientId: 'local-test-id' }),
  ]) {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(element);
    const status = host.querySelector('[role="status"][aria-busy="true"]');
    expect(status).not.toBeNull();
    expect(status?.textContent?.trim()).not.toBe('');
    expect(status?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  }
});
