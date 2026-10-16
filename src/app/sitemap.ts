import type { MetadataRoute } from 'next';

import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

import { siteOrigin } from './site-metadata';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    '/',
    '/incidents',
    '/archive',
    '/about',
  ].map((path) => ({ url: `${siteOrigin}${path}` }));
  const result = await fetchArticleList();
  const articleIds = new Set(
    result?.items.slice(0, 20).map((item) => item.article_id),
  );

  for (const id of articleIds) {
    entries.push({ url: `${siteOrigin}/incidents/${id}` });
  }

  return entries;
}
