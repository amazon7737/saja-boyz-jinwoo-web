import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

export const articleSitemapPageSize = 100;

export const maximumSitemaps = 50_000;

const entities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function fetchSitemapArticles(offset = 0) {
  return fetchArticleList(
    undefined,
    offset,
    undefined,
    undefined,
    undefined,
    articleSitemapPageSize,
  );
}

export function escapeSitemapXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

export function sitemapXmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control':
        'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}

export function sitemapUnavailable() {
  return new Response('일시적으로 사이트맵을 불러오지 못했습니다.', {
    status: 503,
    headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
  });
}
