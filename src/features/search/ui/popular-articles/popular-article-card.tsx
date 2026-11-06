import Link from 'next/link';

import type { ArticleCollectionItem } from '@/features/article-list/model/article.types';
import {
  articleText,
  publicationDate,
  publicationText,
} from '@/features/article-list/model/article-presentation';
import { ArticleImage } from '@/features/article-list/ui/article-image/article-image';
import { formatRelativeTime } from '@/lib/relative-time';

export function PopularArticleCard({
  item,
  apiOrigin,
  now,
}: {
  item: ArticleCollectionItem;
  apiOrigin: string;
  now: Date | null;
}) {
  const { article_id, article } = item;
  const publishedAt = publicationDate(article.pubDate);
  const imageUrl =
    item.image_status === 'ready' &&
    /^[a-f0-9]{64}$/.test(article_id) &&
    item.image_url === `/images/${article_id}.jpg`
      ? new URL(item.image_url, apiOrigin).href
      : null;

  return (
    <article className="ui-card-enter grid h-[88px] min-w-0 grid-cols-[60px_minmax(0,1fr)] content-start items-start gap-x-2 gap-y-1 rounded-xl bg-surface p-3.5 shadow-[0_4px_8px_rgb(0_0_0/5%)] ring-1 ring-inset ring-border">
      <ArticleImage key={imageUrl} src={imageUrl} compact />
      <p className="col-start-2 row-start-1 m-0 justify-self-end text-[11px]/[14px] text-muted">
        {Number.isNaN(publishedAt.getTime()) ? (
          '발행 시각 미확인'
        ) : (
          <time
            dateTime={publishedAt.toISOString()}
            title={`기사 발행 ${publicationText(publishedAt)}`}
          >
            {now
              ? formatRelativeTime(publishedAt, now)
              : publicationText(publishedAt)}
          </time>
        )}
      </p>
      <h3 className="col-start-2 row-start-2 m-0 min-w-0 line-clamp-2 text-[14px]/[17px] font-bold text-text [overflow-wrap:anywhere]">
        <Link
          scroll={false}
          className="ui-link"
          href={`/incidents/${article_id}`}
        >
          {articleText(article.title)}
        </Link>
      </h3>
    </article>
  );
}
