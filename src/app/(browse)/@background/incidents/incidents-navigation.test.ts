// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';

const fetchArticles = vi.hoisted(() => vi.fn());

vi.mock('@/features/article-list/api/fetch-articles', () => ({
  fetchArticleList: fetchArticles,
}));

import IncidentsPage from './page';

test('기사 목록의 탐색 링크는 일반·빈 목록과 오류 화면에서 서버 HTML에 표시된다', async () => {
  const article = {
    article_id: 'a'.repeat(64),
    image_status: 'disabled',
    image_url: null,
    article: {
      title: '확인용 기사',
      description: '기사 설명',
      originallink: 'https://example.com/article',
      link: 'https://example.com/article',
      pubDate: 'Wed, 14 Oct 2026 08:00:00 +0900',
    },
  };
  const pages = [
    { total: 1, items: [article], apiOrigin: 'https://example.com' },
    { total: 0, items: [], apiOrigin: 'https://example.com' },
    null,
  ];

  for (const page of pages) {
    fetchArticles.mockResolvedValueOnce(page);
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(await IncidentsPage());
    const nav = host.querySelector('nav[aria-label="더 살펴보기"]');
    const archive = nav?.querySelector<HTMLAnchorElement>('a[href="/archive"]');
    const about = nav?.querySelector<HTMLAnchorElement>('a[href="/about"]');

    expect(nav).not.toBeNull();
    expect(nav?.hasAttribute('hidden')).toBe(false);
    expect(archive?.textContent).toBe('기사 아카이브');
    expect(about?.textContent).toBe('서비스 안내');
    expect(archive?.tabIndex).toBe(0);
    expect(about?.tabIndex).toBe(0);
    if (page?.items.length) {
      const firstArticle = host.querySelector('article');
      expect(firstArticle).not.toBeNull();
      expect(
        nav!.compareDocumentPosition(firstArticle!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  }
});
