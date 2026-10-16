import { notFound } from 'next/navigation';
import { cache } from 'react';

import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDetailItem(
  value: unknown,
  id: string,
): value is ArticleCollectionItem {
  if (!isRecord(value) || !isRecord(value.article)) return false;

  return (
    value.article_id === id &&
    typeof value.article.title === 'string' &&
    typeof value.article.description === 'string' &&
    typeof value.article.pubDate === 'string' &&
    typeof value.article.originallink === 'string' &&
    typeof value.article.link === 'string' &&
    typeof value.image_status === 'string' &&
    (value.image_url === null || typeof value.image_url === 'string')
  );
}

export const loadDetail = cache(async (id: string) => {
  if (!/^[a-f0-9]{64}$/.test(id)) notFound();

  const result = await fetchDetail(id);

  if (result.status === 'not-found') notFound();

  return result;
});

async function fetchDetail(id: string) {
  try {
    const base = new URL(process.env.NEWS_API_BASE_URL ?? '');

    if (
      (base.protocol !== 'http:' && base.protocol !== 'https:') ||
      base.username ||
      base.password
    ) {
      return { status: 'error' } as const;
    }

    const url = new URL(`/news/${id}`, base);
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 404) return { status: 'not-found' } as const;
    if (!response.ok) return { status: 'error' } as const;
    const item: unknown = await response.json();

    if (!isDetailItem(item, id)) return { status: 'error' } as const;

    return { status: 'success', item, apiOrigin: url.origin } as const;
  } catch {
    return { status: 'error' } as const;
  }
}
