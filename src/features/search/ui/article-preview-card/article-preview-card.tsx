import Link from 'next/link';

import { publicationText } from '@/features/article-list/model/article-presentation';
import { ArticleImage } from '@/features/article-list/ui/article-image/article-image';
import { formatRelativeTime } from '@/lib/relative-time';

import { highlightedText } from '../highlighted-text';

export function ArticlePreviewCard({
  id,
  title,
  publishedAt,
  imageUrl,
  now,
  keyword = '',
}: {
  id: string;
  title: string;
  publishedAt: string | null;
  imageUrl: string | null;
  now: Date | null;
  keyword?: string;
}) {
  const date = publishedAt ? new Date(publishedAt) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;

  return (
    <article className="ui-card-enter relative grid h-[88px] min-w-0 grid-cols-[60px_minmax(0,1fr)] content-start items-start gap-x-2 gap-y-1 rounded-xl bg-surface p-3.5 shadow-[0_4px_8px_rgb(0_0_0/5%)] ring-1 ring-inset ring-border">
      <ArticleImage key={imageUrl} src={imageUrl} compact />
      <p className="col-start-2 row-start-1 m-0 justify-self-end text-[11px]/[14px] text-muted">
        {validDate ? (
          <time
            dateTime={validDate.toISOString()}
            title={`기사 발행 ${publicationText(validDate)}`}
          >
            {now
              ? formatRelativeTime(validDate, now)
              : publicationText(validDate)}
          </time>
        ) : (
          '발행 시각 미확인'
        )}
      </p>
      <h3 className="col-start-2 row-start-2 m-0 min-w-0 line-clamp-2 text-[14px]/[17px] font-bold text-text [overflow-wrap:anywhere]">
        <Link
          scroll={false}
          className="ui-link after:absolute after:inset-0 after:content-['']"
          href={`/incidents/${id}`}
        >
          {highlightedText(title, keyword)}
        </Link>
      </h3>
    </article>
  );
}
