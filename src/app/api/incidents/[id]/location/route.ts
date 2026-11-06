import { articleTitle } from '@/features/article-list/model/article-presentation';
import { fetchMapArticles } from '@/features/map/api/fetch-map-articles';
import { groupMapArticles } from '@/features/map/model/map-region-groups';

const headers = { 'Cache-Control': 'no-store' };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^[a-f0-9]{64}$/.test(id)) {
    return Response.json(
      { error: 'invalid_article_id' },
      { status: 400, headers },
    );
  }

  const result = await fetchMapArticles(request.signal);

  if (!result) {
    return Response.json(
      { error: 'location_unavailable' },
      { status: 503, headers },
    );
  }

  const group = [...groupMapArticles(result.items).values()].find((items) =>
    items.some((item) => item.article_id === id),
  );
  const item = group?.find((candidate) => candidate.article_id === id);

  if (!item) return Response.json({ location: null, related: [] }, { headers });

  const { latitude, longitude, label, precision } = item.location;
  const related = (group ?? [])
    .filter((candidate) => candidate.article_id !== id)
    .slice(0, 3)
    .map((candidate) => ({
      articleId: candidate.article_id,
      title: articleTitle(candidate.article.title),
      publishedAt: candidate.article.pubDate,
      locationLabel: candidate.location.label,
    }));

  return Response.json(
    { location: { latitude, longitude, label, precision }, related },
    { headers },
  );
}
