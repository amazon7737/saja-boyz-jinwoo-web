import { publicationDate } from '@/features/article-list/model/article-presentation';

import type { LocatedArticle } from './map-article.types';

export function recentMapArticles(items: LocatedArticle[]) {
  const unique = new Map<string, LocatedArticle>();

  for (const item of items) {
    if (!unique.has(item.article_id)) unique.set(item.article_id, item);
  }

  const timestamp = (item: LocatedArticle) => {
    const value = publicationDate(item.article.pubDate).getTime();

    return Number.isNaN(value) ? -Infinity : value;
  };

  // Stable sorting retains input order for equal and unknown publication dates.
  return [...unique.values()].sort((a, b) => timestamp(b) - timestamp(a));
}
