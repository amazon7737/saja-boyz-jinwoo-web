import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';
import {
  articleText,
  publicationDate,
  publicationText,
  safeSourceUrl,
} from '@/features/article-list/model/article-presentation';

import { DetailShare } from './detail-share';
import { DetailImage } from './detail-image';

export const dynamic = 'force-dynamic';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDetailItem(
  value: unknown,
  id: string,
): value is ArticleCollectionItem {
  if (!isRecord(value) || !isRecord(value.article)) return false;

  return (
    value.article_id === id &&
    typeof value.article.title === 'string' &&
    typeof value.article.description === 'string' &&
    typeof value.article.pubDate === 'string' &&
    typeof value.article.originallink === 'string' &&
    typeof value.article.link === 'string' &&
    typeof value.image_status === 'string' &&
    (value.image_url === null || typeof value.image_url === 'string')
  );
}

async function fetchDetail(id: string) {
  try {
    const base = new URL(process.env.NEWS_API_BASE_URL ?? '');

    if (
      (base.protocol !== 'http:' && base.protocol !== 'https:') ||
      base.username ||
      base.password
    ) {
      return { status: 'error' } as const;
    }

    const url = new URL(`/news/${id}`, base);
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 404) return { status: 'not-found' } as const;
    if (!response.ok) return { status: 'error' } as const;
    const item: unknown = await response.json();

    if (!isDetailItem(item, id)) return { status: 'error' } as const;

    return { status: 'success', item, apiOrigin: url.origin } as const;
  } catch {
    return { status: 'error' } as const;
  }
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^[a-f0-9]{64}$/.test(id)) notFound();
  const result = await fetchDetail(id);

  if (result.status === 'not-found') notFound();

  if (result.status === 'error') {
    return (
      <div role="alert" className="mt-6 rounded-card bg-surface p-6 text-text">
        <p className="mt-0 font-bold">기사를 불러오지 못했어요</p>
        <Link
          href={`/incidents/${id}`}
          className="text-sm font-bold text-brand underline underline-offset-4"
        >
          다시 시도
        </Link>
      </div>
    );
  }

  const { item, apiOrigin } = result;
  const { article } = item;
  const publishedAt = publicationDate(article.pubDate);
  const sourceUrl =
    safeSourceUrl(article.originallink) ?? safeSourceUrl(article.link);
  const imageUrl =
    item.image_status === 'ready' &&
    item.image_url === `/images/${item.article_id}.jpg`
      ? new URL(item.image_url, apiOrigin).href
      : null;

  return (
    <article className="mt-6 flex min-w-0 flex-col gap-5 rounded-card bg-surface p-4 text-text sm:p-6">
      <nav
        aria-label="기사 상세 탐색"
        className="flex items-center justify-between border-0 border-b border-solid border-border pb-3"
      >
        <Link
          href="/incidents"
          aria-label="목록으로"
          className="flex min-h-11 items-center gap-2 font-bold"
        >
          <span aria-hidden="true" className="text-2xl">
            ←
          </span>
          기사 상세
        </Link>
        <Link
          href="/"
          aria-label="닫기"
          className="grid size-11 place-items-center rounded-lg"
        >
          <span
            aria-hidden="true"
            className="block size-6 bg-[url('/article-detail-close.svg')] bg-center bg-no-repeat"
          />
        </Link>
      </nav>
      <h1 className="m-0 text-[22px]/[30px] font-extrabold [overflow-wrap:anywhere]">
        {articleText(article.title)}
      </h1>
      <p className="-mt-2 mb-0 text-[12px]/5 text-muted">
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
      <DetailImage key={imageUrl} src={imageUrl} />
      {sourceUrl ? (
        <a
          href={sourceUrl}
          className="self-start text-sm text-muted underline underline-offset-4"
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
      <DetailShare id={id} title={articleText(article.title)} />
    </article>
  );
}
