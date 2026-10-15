import Link from 'next/link';

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
}: {
  item: ArticleCollectionItem;
  apiOrigin: string;
}) {
  const { article_id, article, image_status, image_url } = item;
  const publishedAt = publicationDate(article.pubDate);
  const sourceUrl =
    safeSourceUrl(article.originallink) ?? safeSourceUrl(article.link);
  const imageUrl =
    image_status === 'ready' &&
    /^[a-f0-9]{64}$/.test(article_id) &&
    image_url === `/images/${article_id}.jpg`
      ? new URL(image_url, apiOrigin).href
      : null;

  return (
    <article className="grid min-h-[120px] min-w-0 grid-cols-[80px_minmax(0,1fr)] items-start gap-x-3 gap-y-1 rounded-card border border-solid border-border bg-surface p-3 shadow-[0_4px_8px_rgb(0_0_0/3%)]">
      <ArticleImage key={imageUrl} src={imageUrl} />
      <h2 className="col-start-2 row-start-1 m-0 min-w-0 line-clamp-2 text-[14px]/[17px] font-extrabold text-text [overflow-wrap:anywhere]">
        <Link className="ui-link" href={`/incidents/${article_id}`}>
          {articleText(article.title)}
        </Link>
      </h2>
      <p className="col-start-2 row-start-3 m-0 min-w-0 line-clamp-2 text-[12px]/4 text-muted [overflow-wrap:anywhere]">
        {articleText(article.description)}
      </p>
      <p className="col-start-2 row-start-2 m-0 min-w-0 text-[11px]/[13px] text-muted [overflow-wrap:anywhere]">
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
          className="ui-link col-start-2 row-start-4 justify-self-start text-[11px]/[13px] text-muted underline underline-offset-[3px]"
          href={sourceUrl}
        >
          기사 원문
        </a>
      ) : (
        <span className="col-start-2 row-start-4 justify-self-start text-[11px]/[13px] text-muted underline underline-offset-[3px]">
          원문 링크 없음
        </span>
      )}
    </article>
  );
}
