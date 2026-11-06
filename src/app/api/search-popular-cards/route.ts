import { loadDetail } from '@/app/incidents/[id]/load-detail';

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  const ids = new URL(request.url).searchParams.getAll('id');

  if (
    !ids.length ||
    ids.length > 3 ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => /^[a-f0-9]{64}$/.test(id))
  ) {
    return Response.json({ items: [] }, { status: 400, headers });
  }

  const items = await Promise.all(
    ids.map(async (id) => {
      const result = await loadDetail(id, request.signal);

      if (result.status !== 'success') return { id, status: result.status };
      const { item, apiOrigin } = result;

      return {
        id,
        status: 'success' as const,
        apiOrigin,
        item: {
          article_id: item.article_id,
          image_status: item.image_status,
          image_url: item.image_url,
          article: {
            title: item.article.title,
            description: item.article.description,
            pubDate: item.article.pubDate,
            originallink: item.article.originallink,
            link: item.article.link,
          },
        },
      };
    }),
  );

  return Response.json({ items }, { headers });
}
