import {
  articleSitemapPageSize,
  escapeSitemapXml,
  fetchSitemapArticles,
  maximumSitemaps,
  sitemapUnavailable,
  sitemapXmlResponse,
} from '../../article-sitemap-shared';
import { siteOrigin } from '../../site-metadata';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^(0|[1-9]\d*)\.xml$/.test(id))
    return new Response(null, { status: 404 });
  const page = Number(id.slice(0, -4));

  if (!Number.isSafeInteger(page) || page >= maximumSitemaps - 1)
    return new Response(null, { status: 404 });
  const offset = page * articleSitemapPageSize;
  const result = await fetchSitemapArticles(offset);

  if (!result || !Number.isSafeInteger(result.total)) {
    return sitemapUnavailable();
  }

  if (offset >= result.total)
    return new Response(null, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });

  if (!result.items.length || result.items.length > result.total - offset) {
    return sitemapUnavailable();
  }

  const ids = new Set(
    result.items
      .slice(0, articleSitemapPageSize)
      .map((item) => item.article_id),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
    ...ids,
  ]
    .map(
      (articleId) =>
        `<url><loc>${escapeSitemapXml(`${siteOrigin}/incidents/${articleId}`)}</loc></url>`,
    )
    .join('\n')}\n</urlset>`;

  return sitemapXmlResponse(xml);
}
