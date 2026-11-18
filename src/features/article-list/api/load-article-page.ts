'use server';

import { fetchArticleList } from './fetch-articles';
import type { ArticlePeriod } from '../model/article-period';
import type { ArticleSort } from '../model/article-sort';

export async function loadArticlePage(
  offset: number,
  period?: ArticlePeriod,
  sort: ArticleSort = 'popular',
) {
  return fetchArticleList(undefined, offset, sort, undefined, period);
}
