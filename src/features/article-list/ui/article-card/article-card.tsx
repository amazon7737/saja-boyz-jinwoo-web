import Link from 'next/link';

import { formatRelativeTime } from '@/lib/relative-time';

import { ArticleImage } from '../article-image/article-image';
import type { ArticleCollectionItem } from '../../model/article.types';
import {
  articleText,
  safeSourceUrl,
  publicationDate,
  publicationText,
} from '../../model/article-presentation';

export function ArticleCard({
  item,
  apiOrigin,
  now = null,
}: {
  item: ArticleCollectionItem;
  apiOrigin: string;
  now?: number | null;
}) {
  const { article_id, article, image_status, image_url } = item;
  const publishedAt = publicationDate(article.pubDate);
  const sourceUrl =
    safeSourceUrl(article.originallink) ?? safeSourceUrl(article.link);
  const validDate = !Number.isNaN(publishedAt.getTime());
  const preciseTime = validDate ? publicationText(publishedAt) : '';
  const relativeTime =
    validDate &&
    now !== null &&
    Number.isFinite(now) &&
    publishedAt.getTime() <= now
      ? formatRelativeTime(publishedAt, new Date(now))
      : null;
  const imageUrl =
    image_status === 'ready' &&
    /^[a-f0-9]{64}$/.test(article_id) &&
    image_url === `/images/${article_id}.jpg`
      ? new URL(image_url, apiOrigin).href
      : null;

  return (
    <article className="ui-card-enter grid min-h-[120px] min-w-0 grid-cols-[80px_minmax(0,1fr)] content-start items-start gap-x-3 gap-y-1.5 rounded-card border border-solid border-border bg-surface p-3 shadow-[0_4px_8px_rgb(0_0_0/3%)]">
      <ArticleImage key={imageUrl} src={imageUrl} />
      <h2 className="col-start-2 row-start-2 m-0 min-w-0 line-clamp-2 text-[14px]/[17px] font-extrabold text-text [overflow-wrap:anywhere]">
        <Link
          scroll={false}
          className="ui-link"
          href={`/incidents/${article_id}`}
        >
          {articleText(article.title)}
        </Link>
      </h2>
      <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-between gap-2">
        {sourceUrl ? (
          <a
            className="ui-link relative shrink-0 whitespace-nowrap rounded-sm text-[11px]/[14px] text-muted underline underline-offset-[3px] after:absolute after:-inset-x-1 after:-top-2 after:bottom-0 after:content-['']"
            href={sourceUrl}
          >
            기사 원문
          </a>
        ) : (
          <span className="min-w-0 truncate text-[11px]/[14px] text-muted">
            원문 링크 없음
          </span>
        )}
        <p className="m-0 whitespace-nowrap text-[11px]/[14px] text-muted">
          {validDate ? (
            <time
              dateTime={publishedAt.toISOString()}
              title={`기사 발행 ${preciseTime}`}
              aria-label={`기사 발행 ${preciseTime}${relativeTime ? `, ${relativeTime}` : ''}`}
            >
              {relativeTime ?? preciseTime}
            </time>
          ) : (
            '발행 시각 미확인'
          )}
        </p>
      </div>
      <p className="col-start-2 row-start-3 m-0 min-w-0 line-clamp-2 text-[12px]/4 text-muted [overflow-wrap:anywhere]">
        {articleText(article.description)}
      </p>
    </article>
  );
}
