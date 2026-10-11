import type { ArticleCollectionItem } from '../model/article.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isArticleCollectionItem(
  value: unknown,
): value is ArticleCollectionItem {
  if (!isRecord(value) || !isRecord(value.article)) return false;

  return (
    typeof value.article_id === 'string' &&
    /^[a-f0-9]{64}$/.test(value.article_id) &&
    typeof value.article.title === 'string' &&
    typeof value.article.description === 'string' &&
    typeof value.article.pubDate === 'string' &&
    typeof value.article.originallink === 'string' &&
    typeof value.article.link === 'string' &&
    typeof value.image_status === 'string' &&
    (value.image_url === null || typeof value.image_url === 'string')
  );
}

export async function fetchArticleList(keyword?: string, offset = 0) {
  if (!Number.isSafeInteger(offset) || offset < 0) return null;

  try {
    const baseUrl = process.env.NEWS_API_BASE_URL;

    if (!baseUrl) return null;

    const base = new URL(baseUrl);

    if (
      (base.protocol !== 'http:' && base.protocol !== 'https:') ||
      base.username ||
      base.password
    ) {
      return null;
    }

    const url = new URL('/news', base);

    url.searchParams.set('offset', String(offset));
    url.searchParams.set('limit', '20');
    const normalizedKeyword = keyword?.trim();

    if (normalizedKeyword) url.searchParams.set('keyword', normalizedKeyword);

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const payload: unknown = await response.json();

    if (
      !isRecord(payload) ||
      typeof payload.total !== 'number' ||
      !Number.isInteger(payload.total) ||
      payload.total < 0 ||
      !Array.isArray(payload.items) ||
      !payload.items.every(isArticleCollectionItem)
    ) {
      return null;
    }

    return {
      items: payload.items,
      apiOrigin: url.origin,
      total: payload.total,
    };
  } catch {
    return null;
  }
}
