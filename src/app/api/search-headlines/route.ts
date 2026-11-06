import { articleText } from '@/features/article-list/model/article-presentation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };

  try {
    const base = new URL(process.env.NEWS_API_BASE_URL ?? '');

    if (
      !['http:', 'https:'].includes(base.protocol) ||
      base.username ||
      base.password
    ) {
      return Response.json({ titles: [] }, { status: 503, headers });
    }

    const response = await fetch(new URL('/news/popular/today', base), {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok)
      return Response.json({ titles: [] }, { status: 503, headers });
    const payload: unknown = await response.json();

    if (
      !isRecord(payload) ||
      payload.timezone !== 'Asia/Seoul' ||
      typeof payload.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(payload.date) ||
      !Array.isArray(payload.items) ||
      payload.items.length > 3 ||
      !payload.items.every(
        (item: unknown) =>
          isRecord(item) &&
          typeof item.article_id === 'string' &&
          /^[a-f0-9]{64}$/.test(item.article_id) &&
          typeof item.title === 'string' &&
          typeof item.views_today === 'number' &&
          Number.isSafeInteger(item.views_today) &&
          item.views_today > 0,
      )
    ) {
      return Response.json({ titles: [] }, { status: 503, headers });
    }

    const items = payload.items
      .map((item: Record<string, unknown>) => ({
        article_id: item.article_id as string,
        title:
          typeof item.title === 'string'
            ? articleText(item.title).replace(/\s+/g, ' ').trim()
            : '',
        views_today: item.views_today as number,
      }))
      .filter((item) => item.title);
    const titles = items.map((item) => item.title);

    return Response.json({ titles, items }, { headers });
  } catch {
    return Response.json({ titles: [] }, { status: 503, headers });
  }
}
