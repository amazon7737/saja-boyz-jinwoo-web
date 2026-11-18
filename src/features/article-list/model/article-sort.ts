export type ArticleSort = 'recent' | 'popular';

export function parseArticleSort(value: unknown): ArticleSort {
  return value === 'recent' ? 'recent' : 'popular';
}
