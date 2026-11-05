import Link from 'next/link';

import { ArticleImage } from '@/features/article-list/ui/article-image/article-image';
import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';
import {
  articleText,
  publicationDate,
  publicationText,
  safeSourceUrl,
} from '@/features/article-list/model/article-presentation';

function highlightedText(text: string, keyword: string) {
  const query = keyword.trim();

  if (!query) return text;

  const literalQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = new RegExp(`(${literalQuery})`, 'gi');

  return text.split(matches).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="bg-transparent text-brand">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function SearchResultCard({
  item,
  keyword,
  apiOrigin,
}: {
  item: ArticleCollectionItem;
  keyword: string;
  apiOrigin?: string;
}) {
  const { article_id, article } = item;
  const publishedAt = publicationDate(article.pubDate);
  const sourceUrl =
    safeSourceUrl(article.originallink) ?? safeSourceUrl(article.link);
  const imageUrl =
    apiOrigin &&
    item.image_status === 'ready' &&
    /^[a-f0-9]{64}$/.test(article_id) &&
    item.image_url === `/images/${article_id}.jpg`
      ? new URL(item.image_url, apiOrigin).href
      : null;

  return (
    <article className="ui-card-enter grid min-w-0 grid-cols-[60px_minmax(0,1fr)] content-start items-start gap-x-2 gap-y-1.5 rounded-xl border border-solid border-border bg-surface p-3.5 shadow-[0_4px_8px_rgb(0_0_0/5%)]">
      <ArticleImage key={imageUrl} src={imageUrl} compact />
      <h2 className="col-start-2 row-start-1 m-0 line-clamp-1 text-[14px]/[17px] font-bold text-text [overflow-wrap:anywhere]">
        <Link
          scroll={false}
          className="ui-link"
          href={`/incidents/${article_id}`}
        >
          {highlightedText(articleText(article.title), keyword)}
        </Link>
      </h2>
      <p className="col-start-2 row-start-2 m-0 line-clamp-1 text-[12px]/4 text-muted [overflow-wrap:anywhere]">
        {highlightedText(articleText(article.description), keyword)}
      </p>
      <div className="col-start-2 row-start-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[11px]/[14px] text-muted">
        <p className="m-0">
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
        {sourceUrl ? (
          <a
            href={sourceUrl}
            className="ui-link shrink-0 underline underline-offset-[3px]"
          >
            기사 원문
          </a>
        ) : (
          <span>원문 링크 없음</span>
        )}
      </div>
    </article>
  );
}
