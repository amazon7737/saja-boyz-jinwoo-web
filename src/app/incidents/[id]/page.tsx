import Link from 'next/link';
import type { Metadata } from 'next';

import { pageMetadata, siteOrigin } from '@/app/site-metadata';
import {
  articleText,
  articleTitle,
  articleDescription,
  publicationDate,
  publicationText,
  safeSourceUrl,
} from '@/features/article-list/model/article-presentation';

import { loadDetail } from './load-detail';
import { DetailShare } from './detail-share';
import { DetailImage } from './detail-image';
import { DetailNavigation } from './detail-navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const result = await loadDetail(id);

  if (result.status === 'error') {
    return {
      title: '기사를 불러오지 못했어요',
      robots: { index: false, follow: true },
    };
  }

  const title = articleTitle(result.item.article.title);
  const description = articleDescription(result.item.article.description);

  return pageMetadata(title, description, `/incidents/${id}`);
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await loadDetail(id);

  if (result.status === 'error') {
    return (
      <div className="bg-surface px-4 text-text">
        <DetailNavigation />
        <div role="alert" className="py-4">
          <p className="mt-0 font-bold">기사를 불러오지 못했어요</p>
          <Link
            href={`/incidents/${id}`}
            className="text-sm font-bold text-brand underline underline-offset-4"
          >
            다시 시도
          </Link>
        </div>
      </div>
    );
  }

  const { item, apiOrigin } = result;
  const { article } = item;
  const publishedAt = publicationDate(article.pubDate);
  const sourceUrl =
    safeSourceUrl(article.originallink) ?? safeSourceUrl(article.link);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: `${siteOrigin}/incidents/${id}`,
    name: articleTitle(article.title),
    description: articleDescription(article.description),
    inLanguage: 'ko',
    ...(sourceUrl
      ? {
          citation: {
            '@type': 'CreativeWork',
            name: articleTitle(article.title),
            url: sourceUrl,
            ...(!Number.isNaN(publishedAt.getTime())
              ? { datePublished: publishedAt.toISOString() }
              : {}),
          },
        }
      : {}),
  };
  const imageUrl =
    item.image_status === 'ready' &&
    item.image_url === `/images/${item.article_id}.jpg`
      ? new URL(item.image_url, apiOrigin).href
      : null;

  return (
    <article className="flex min-h-[calc(100dvh_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] min-w-0 flex-col gap-4 bg-surface px-4 pb-6 text-text">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <DetailNavigation />
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[22px]/[30px] font-extrabold [overflow-wrap:anywhere]">
          {articleTitle(article.title)}
        </h1>
        <p className="m-0 text-[12px]/4 text-muted">
          {Number.isNaN(publishedAt.getTime()) ? (
            '발행 시각 미확인'
          ) : (
            <>
              기사 발행{' '}
              <time dateTime={publishedAt.toISOString()}>
                {publicationText(publishedAt)}
              </time>
            </>
          )}
        </p>
      </div>
      <DetailImage key={imageUrl} src={imageUrl} />
      {sourceUrl ? (
        <a
          href={sourceUrl}
          className="self-start text-[12px]/4 font-semibold text-muted underline underline-offset-4"
        >
          기사 원문 보기
        </a>
      ) : (
        <p className="m-0 text-sm text-muted">원문 링크 없음</p>
      )}
      <section aria-label="기사 요약">
        <h2 className="mt-0 mb-2 text-sm font-extrabold">기사 요약</h2>
        <p className="m-0 text-[14px]/[22px] whitespace-pre-line text-muted [overflow-wrap:anywhere]">
          {articleText(article.description)}
        </p>
      </section>
      <DetailShare id={id} title={articleTitle(article.title)} />
    </article>
  );
}
