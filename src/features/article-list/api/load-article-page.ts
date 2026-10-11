'use server';

import { fetchArticleList } from './fetch-articles';

export async function loadArticlePage(offset: number) {
  return fetchArticleList(undefined, offset);
}
