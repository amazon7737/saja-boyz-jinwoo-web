import Link from 'next/link';

import {
  articleText,
  publicationDate,
  publicationText,
} from '@/features/article-list/model/article-presentation';

import { MapCarouselImage } from '../map-carousel-image/map-carousel-image';
import type { LocatedArticle } from '../../model/map-article.types';

export function MapCarouselCard({
  item,
  apiOrigin,
}: {
  item: LocatedArticle;
  apiOrigin: string;
}) {
  const publishedAt = publicationDate(item.article.pubDate);
  const imageUrl =
    item.image_status === 'ready' &&
    /^[a-f0-9]{64}$/.test(item.article_id) &&
    item.image_url === `/images/${item.article_id}.jpg`
      ? new URL(item.image_url, apiOrigin).href
      : null;

  return (
    <article className="relative flex h-[152px] w-[200px] shrink-0 snap-start flex-col gap-2.5 rounded-card ring-1 ring-white ring-inset bg-floating p-3 shadow-[0_4px_16px_rgb(0_0_0/5%)] [@media(max-height:550px)]:h-[62px]">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="m-0 h-4 text-right text-[11px]/4 text-muted">
          {Number.isNaN(publishedAt.getTime()) ? (
            '발행 시각 미확인'
          ) : (
            <time dateTime={publishedAt.toISOString()}>
              {publicationText(publishedAt)}
            </time>
          )}
        </p>
        <h3 className="m-0 truncate text-[13px]/4 font-bold text-text">
          <Link
            href={`/incidents/${item.article_id}`}
            className="after:absolute after:inset-0 after:z-10 after:rounded-card after:content-['']"
          >
            {articleText(item.article.title)}
          </Link>
        </h3>
      </div>
      <MapCarouselImage key={imageUrl} src={imageUrl} />
    </article>
  );
}
