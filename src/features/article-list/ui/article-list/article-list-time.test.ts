// @vitest-environment jsdom
import { act, createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';

import type { ArticleCollectionItem } from '../../model/article.types';
import { PaginatedArticleList } from './paginated-article-list';

vi.mock('next/link', () => ({ default: 'a' }));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function item(id: string, pubDate: string): ArticleCollectionItem {
  return {
    article_id: id.repeat(64),
    image_status: 'disabled',
    image_url: null,
    article: {
      title: '빈칸없는긴제목'.repeat(40),
      description: '가상 기사 요약',
      pubDate,
      originallink: 'https://publisher.example.invalid/original',
      link: '',
    },
  };
}

test('hydrates the exact timestamp before updating relative time and cleans up its clock', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-15T00:59:00Z'));
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const items = [
    item('a', '2026-10-15T00:00:00Z'),
    item('b', '2026-10-16T00:00:00Z'),
    item('c', 'bad-date'),
  ];
  const props = {
    initialPage: { items, total: 3, apiOrigin: 'https://news.example.invalid' },
  };
  const host = document.createElement('div');
  host.innerHTML = renderToString(createElement(PaginatedArticleList, props));
  const onRecoverableError = vi.fn();
  const before = host.querySelectorAll('article');
  expect(before[0].querySelector('time')?.textContent).toBe(
    '2026-10-15 09:00 KST',
  );
  expect(before[1].querySelector('time')?.textContent).toBe(
    '2026-10-16 09:00 KST',
  );
  expect(before[2].querySelector('time')).toBeNull();
  expect(before[2].textContent).toContain('발행 시각 미확인');
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(host, createElement(PaginatedArticleList, props), {
      onRecoverableError,
    });
    vi.runAllTicks();
  });
  const cards = host.querySelectorAll('article');
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(cards[0].querySelector('time')?.textContent).toBe('59분 전');
  expect(cards[0].querySelector('time')?.getAttribute('datetime')).toBe(
    '2026-10-15T00:00:00.000Z',
  );
  expect(cards[0].querySelector('time')?.getAttribute('aria-label')).toBe(
    '기사 발행 2026-10-15 09:00 KST, 59분 전',
  );
  expect(cards[1].querySelector('time')?.textContent).toBe(
    '2026-10-16 09:00 KST',
  );
  expect(cards[2].querySelector('time')).toBeNull();
  for (const card of cards) {
    expect(card.querySelector('h2')?.textContent).toBe(items[0].article.title);
    expect(
      card.querySelector('h2')?.classList.contains('[overflow-wrap:anywhere]'),
    ).toBe(true);
    expect(card.querySelectorAll('a')).toHaveLength(2);
    expect(
      card.querySelector('a[href="https://publisher.example.invalid/original"]')
        ?.textContent,
    ).toBe('기사 원문');
    expect(card.textContent).toContain('이미지 없음');
  }
  await act(async () => vi.advanceTimersByTime(60_000));
  expect(cards[0].querySelector('time')?.textContent).toBe('1시간 전');
  await act(async () => root!.unmount());
  expect(vi.getTimerCount()).toBe(0);
});
