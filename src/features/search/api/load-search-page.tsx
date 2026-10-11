'use server';

import { fetchArticleList } from '@/features/article-list/api/fetch-articles';
import { ArticleCard } from '@/features/article-list/ui/article-card/article-card';

export async function loadSearchPage(keyword: string, offset: number) {
  if (
    typeof keyword !== 'string' ||
    !keyword.trim() ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    return null;
  }

  const result = await fetchArticleList(keyword.trim(), offset);

  if (!result) return null;

  return {
    total: result.total,
    received: result.items.length,
    cards: result.items.map((item) => ({
      id: item.article_id,
      content: <ArticleCard item={item} apiOrigin={result.apiOrigin} />,
    })),
  };
}
