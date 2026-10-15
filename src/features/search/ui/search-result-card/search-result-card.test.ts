// file: src/features/search/ui/search-result-card/search-result-card.test.ts
// @vitest-environment jsdom
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { SearchResultCard } from './search-result-card';
import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';

test('searchHighlightIgnoresCaseAndPreservesOriginalLiteralText', () => {
  const item: ArticleCollectionItem = {
    article_id: 'a'.repeat(64),
    image_status: 'disabled',
    image_url: null,
    article: {
      title: 'AI ai Ai aI 안전',
      description: 'aI Ai ai AI 보도',
      pubDate: '2026-10-15T06:00:00Z',
      link: 'https://example.com/news',
      originallink: 'https://example.com/news',
    },
  };
  const render = (keyword: string, title = item.article.title) => {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(
      createElement(SearchResultCard, {
        item: { ...item, article: { ...item.article, title } },
        keyword,
      }),
    );
    return host;
  };
  for (const keyword of ['AI', 'ai', 'Ai', 'aI', '  ai  ']) {
    const host = render(keyword);
    expect(host.querySelector('h2')?.textContent).toBe(item.article.title);
    expect(host.querySelector('article > p')?.textContent).toBe(
      item.article.description,
    );
    expect(
      [...host.querySelectorAll('h2 mark')].map((mark) => mark.textContent),
    ).toEqual(['AI', 'ai', 'Ai', 'aI']);
    expect(
      [...host.querySelectorAll('article > p mark')].map(
        (mark) => mark.textContent,
      ),
    ).toEqual(['aI', 'Ai', 'ai', 'AI']);
  }
  for (const [keyword, title, matched] of [
    ['ai+', 'AI+ AII AI', 'AI+'],
    ['c++', 'C++ C+ CCC', 'C++'],
    ['[ai]', '[AI] AI A', '[AI]'],
    ['a.b', 'A.B A0B AB', 'A.B'],
  ]) {
    const host = render(keyword, title);
    expect(host.querySelector('h2')?.textContent).toBe(title);
    expect(
      [...host.querySelectorAll('h2 mark')].map((mark) => mark.textContent),
    ).toEqual([matched]);
  }
  for (const keyword of ['', '   ', 'missing']) {
    const host = render(keyword);
    expect(host.querySelector('h2')?.textContent).toBe(item.article.title);
    expect(host.querySelectorAll('mark')).toHaveLength(0);
  }
});
