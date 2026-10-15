import type {
  LocatedArticle,
  MapArticleResult,
} from '../model/map-article.types';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validItem(value: unknown): boolean {
  if (!record(value) || !record(value.article)) return false;
  const article = value.article;

  if (
    typeof value.article_id !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.article_id) ||
    typeof value.collection_id !== 'string' ||
    typeof value.image_status !== 'string' ||
    !(value.image_url === null || typeof value.image_url === 'string') ||
    !['title', 'description', 'originallink', 'link', 'pubDate'].every(
      (key) => typeof article[key] === 'string',
    )
  )
    return false;

  if (value.location_status !== 'resolved') {
    if (value.location !== null) return false;
    if (value.location_status === 'unprocessed')
      return (
        value.location_reason === null ||
        value.location_reason === 'stale_source'
      );
    if (value.location_status === 'unresolved')
      return [
        'not_incident',
        'insufficient_evidence',
        'multiple_locations',
        'ambiguous_geocode',
      ].includes(String(value.location_reason));
    if (value.location_status === 'failed')
      return ['invalid_metadata', 'provider_failed'].includes(
        String(value.location_reason),
      );

    return false;
  }

  const location = value.location;

  if (
    value.location_reason !== null ||
    !record(location) ||
    !record(location.evidence)
  )
    return false;
  const { latitude, longitude, label, precision, evidence } = location;

  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    typeof label === 'string' &&
    Boolean(label.trim()) &&
    (precision === 'address' ||
      precision === 'neighborhood' ||
      precision === 'region') &&
    (evidence.field === 'title' || evidence.field === 'description') &&
    typeof evidence.text === 'string' &&
    Boolean(evidence.text.trim()) &&
    (article[evidence.field] as string).includes(evidence.text)
  );
}

export async function fetchMapArticles(): Promise<MapArticleResult | null> {
  try {
    const baseUrl = process.env.NEWS_API_BASE_URL;

    if (!baseUrl) return null;
    const base = new URL(baseUrl);

    if (
      !['https:', 'http:'].includes(base.protocol) ||
      base.username ||
      base.password
    )
      return null;
    const items = new Map<string, LocatedArticle>();
    let offset = 0;
    let total = 0;
    const signal = AbortSignal.timeout(15_000);

    do {
      const url = new URL('/map/articles', base);

      url.searchParams.set('offset', String(offset));
      url.searchParams.set('limit', '100');
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal,
      });

      if (!response.ok) return null;
      const page: unknown = await response.json();

      if (
        !record(page) ||
        !Number.isSafeInteger(page.total) ||
        (page.total as number) < 0 ||
        !Array.isArray(page.items) ||
        page.items.length > 100 ||
        offset + page.items.length > (page.total as number) ||
        !page.items.every(validItem)
      )
        return null;
      if (offset && page.total !== total) return null;
      if (!offset) total = page.total as number;

      for (const item of page.items) {
        if (item.location_status === 'resolved' && !items.has(item.article_id))
          items.set(item.article_id, item as LocatedArticle);
      }

      offset += page.items.length;
      if (!page.items.length && offset < total) return null;
    } while (offset < total);

    return { total, items: [...items.values()], apiOrigin: base.origin };
  } catch {
    return null;
  }
}
