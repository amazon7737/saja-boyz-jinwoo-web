'use server';

import { fetchArticleList } from './fetch-articles';
import type { ArticlePeriod } from '../model/article-period';

export async function loadArticlePage(offset: number, period?: ArticlePeriod) {
  return fetchArticleList(undefined, offset, 'popular', undefined, period);
}
