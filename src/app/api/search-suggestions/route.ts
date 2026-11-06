import { fetchArticleList } from '@/features/article-list/api/fetch-articles';
import { articleTitle } from '@/features/article-list/model/article-presentation';

export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  const headers = { 'Cache-Control': 'no-store' };

  if (keyword.length < 2 || keyword.length > 200) {
    return Response.json({ items: [] }, { status: 400, headers });
  }

  const result = await fetchArticleList(keyword, 0, 'recent', request.signal);

  if (!result) return Response.json({ items: [] }, { status: 503, headers });

  const items = result.items
    .map((item) => ({
      id: item.article_id,
      title: articleTitle(item.article.title),
    }))
    .filter((item) => item.title)
    .slice(0, 5);

  return Response.json({ items }, { headers });
}
