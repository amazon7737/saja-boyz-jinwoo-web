import {
  articleSitemapPageSize,
  escapeSitemapXml,
  fetchSitemapArticles,
  maximumSitemaps,
  sitemapUnavailable,
  sitemapXmlResponse,
} from '../article-sitemap-shared';
import { siteOrigin } from '../site-metadata';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await fetchSitemapArticles();

  if (
    !result ||
    !Number.isSafeInteger(result.total) ||
    result.items.length > result.total ||
    Math.ceil(result.total / articleSitemapPageSize) >= maximumSitemaps
  ) {
    return sitemapUnavailable();
  }

  const pages = Math.ceil(result.total / articleSitemapPageSize);
  const urls = [
    `${siteOrigin}/sitemap.xml`,
    ...Array.from(
      { length: pages },
      (_, page) => `${siteOrigin}/article-sitemap/${page}.xml`,
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `<sitemap><loc>${escapeSitemapXml(url)}</loc></sitemap>`)
    .join('\n')}\n</sitemapindex>`;

  return sitemapXmlResponse(xml);
}
