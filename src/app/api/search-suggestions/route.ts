import { fetchArticleList } from '@/features/article-list/api/fetch-articles';
import {
  articleTitle,
  publicationDate,
} from '@/features/article-list/model/article-presentation';

export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  const headers = { 'Cache-Control': 'no-store' };

  if (keyword.length < 2 || keyword.length > 200) {
    return Response.json({ items: [] }, { status: 400, headers });
  }

  const result = await fetchArticleList(keyword, 0, 'recent', request.signal);

  if (!result) return Response.json({ items: [] }, { status: 503, headers });

  let imageOrigin: URL | null = null;

  try {
    const origin = new URL(result.apiOrigin);

    if (
      ['http:', 'https:'].includes(origin.protocol) &&
      !origin.username &&
      !origin.password &&
      origin.origin === result.apiOrigin
    )
      imageOrigin = origin;
  } catch {
    // A bad image origin must not prevent searching articles.
  }

  const items = result.items
    .map((item) => {
      const date = publicationDate(item.article.pubDate);

      return {
        id: item.article_id,
        title: articleTitle(item.article.title),
        publishedAt: Number.isNaN(date.getTime()) ? null : date.toISOString(),
        imageUrl:
          imageOrigin &&
          item.image_status === 'ready' &&
          item.image_url === `/images/${item.article_id}.jpg`
            ? new URL(item.image_url, imageOrigin).href
            : null,
      };
    })
    .filter((item) => item.title)
    .slice(0, 6);

  return Response.json({ items }, { headers });
}
