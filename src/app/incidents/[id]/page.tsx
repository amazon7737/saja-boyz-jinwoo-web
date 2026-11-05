import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { ArticleViewTracker } from '@/features/article-views/article-view-tracker';
import { IconText } from '@/components/ui/icon-text/icon-text';
import { Notice } from '@/components/feedback/notice';
import { pageMetadata, siteOrigin } from '@/app/site-metadata';
import {
  articleText,
  articleTitle,
  articleDescription,
  publicationDate,
  publicationText,
  safeSourceUrl,
} from '@/features/article-list/model/article-presentation';
import {
  DetailLocation,
  RelatedArticles,
} from '@/features/article-detail/ui/detail-context/detail-context';
import { DetailMap } from '@/features/article-detail/ui/detail-map/detail-map';
import { DetailRetry } from '@/features/article-detail/ui/detail-retry/detail-retry';
import { DetailSheet } from '@/features/article-detail/ui/detail-sheet/detail-sheet';

import { loadDetail } from './load-detail';
import { DetailShare } from './detail-share';
import { DetailImage } from './detail-image';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const result = await loadDetail(id);

  if (result.status === 'not-found') {
    return {
      title: '이 기사는 찾을 수 없어요',
      robots: { index: false, follow: true },
    };
  }

  if (result.status === 'error') {
    return {
      ...pageMetadata(
        '기사를 불러오지 못했어요',
        '연결을 확인한 뒤 다시 눌러주세요.',
        '/incidents/' + id,
      ),
      robots: { index: false, follow: true },
    };
  }

  const title = articleTitle(result.item.article.title);
  const description = articleDescription(result.item.article.description);

  return {
    ...pageMetadata(title, description, `/incidents/${id}`),
    robots: { index: true, follow: true },
  };
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await loadDetail(id);

  if (result.status === 'not-found') notFound();

  if (result.status === 'error') {
    return (
      <DetailSheet titleId="article-detail-error">
        <span id="article-detail-error" className="sr-only">
          기사 상세 오류
        </span>
        <Notice
          role="alert"
          title="이 소식을 다시 열어볼까요?"
          action={<DetailRetry id={id} />}
        >
          <p className="mt-0 font-bold">기사를 불러오지 못했어요</p>

          <p>연결을 확인한 뒤 다시 눌러주세요.</p>
        </Notice>
      </DetailSheet>
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
    <DetailSheet
      key={id}
      titleId={`article-detail-title-${id}`}
      footer={
        <DetailShare key={id} id={id} title={articleTitle(article.title)} />
      }
    >
      <ArticleViewTracker id={id} apiOrigin={apiOrigin} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <div className="flex flex-col gap-3">
        <h1
          id={`article-detail-title-${id}`}
          className="m-0 text-[18px]/[normal] font-extrabold [overflow-wrap:anywhere]"
        >
          {articleTitle(article.title)}
        </h1>
        <div className="flex flex-col gap-1">
          <DetailLocation id={id} />
          <p className="m-0 flex items-center gap-1 text-[12px]/4 text-slate-400">
            {Number.isNaN(publishedAt.getTime()) ? (
              '발행 시각 미확인'
            ) : (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Image
                  src="/figma/preview-date.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  unoptimized
                  className="size-4 shrink-0"
                />
                <span>
                  <span className="sr-only">기사 발행 </span>
                  <time dateTime={publishedAt.toISOString()}>
                    {publicationText(publishedAt)}
                  </time>
                </span>
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <DetailImage key={imageUrl} src={imageUrl} />
        <section aria-label="기사 요약">
          <h2 className="sr-only">기사 요약</h2>
          <p className="m-0 text-[13px]/[1.5] whitespace-pre-line text-muted [overflow-wrap:anywhere]">
            {articleText(article.description)}
          </p>
        </section>
      </div>
      {sourceUrl ? (
        <div className="flex min-w-0 items-center gap-1.5 py-1 text-[12px]/[15px] text-muted">
          <span className="shrink-0">출처:</span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`기사 원문 · ${new URL(sourceUrl).hostname}`}
            className="ui-link inline-flex min-w-0 items-center gap-1.5"
          >
            <IconText
              icon="link"
              size="compact"
              position="end"
              textClassName="truncate underline decoration-slate-300 underline-offset-2"
            >
              <span className="sr-only">기사 원문 · </span>
              {new URL(sourceUrl).hostname}
            </IconText>
          </a>
        </div>
      ) : (
        <p className="m-0 py-1 text-[12px]/[15px] text-muted">원문 링크 없음</p>
      )}
      <RelatedArticles id={id} />
      <DetailMap id={id} />
    </DetailSheet>
  );
}
