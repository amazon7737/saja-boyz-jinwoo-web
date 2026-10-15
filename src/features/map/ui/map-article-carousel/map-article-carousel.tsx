import Link from 'next/link';

import { MapCarouselCard } from '../map-carousel-card/map-carousel-card';
import type { MapArticleResult } from '../../model/map-article.types';
import { recentMapArticles } from '../../model/map-carousel-articles';

export function MapArticleCarousel({
  articles,
}: {
  articles: MapArticleResult;
}) {
  return (
    <section
      aria-label="지도 기사"
      className="flex flex-col gap-3 bg-linear-to-b from-transparent to-background/95 pt-8 pb-2 [@media(max-height:550px)]:gap-2 [@media(max-height:550px)]:pt-2"
    >
      <div className="flex items-center justify-between px-4">
        <h2 className="m-0 flex items-center gap-1.5 text-[14px]/[17px] font-extrabold text-text">
          <span aria-hidden="true" className="text-[14px]">
            🔥
          </span>
          최근 보도 기사
        </h2>
        <Link
          href="/incidents"
          className="text-[11px]/[normal] font-bold text-brand"
        >
          전체보기 →
        </Link>
      </div>
      <div className="flex snap-x snap-proximity gap-2.5 overflow-x-auto overscroll-x-contain px-4 [scroll-padding-inline:16px]">
        {articles.items.length === 0 && (
          <p
            role="status"
            className="m-0 w-full rounded-card border border-white bg-floating p-3 text-[13px] text-muted shadow-[0_4px_16px_rgb(0_0_0/5%)]"
          >
            선택한 기간의 기사가 없습니다. 기간을 변경해 주세요.
          </p>
        )}
        {recentMapArticles(articles.items).map((item) => (
          <MapCarouselCard
            key={item.article_id}
            item={item}
            apiOrigin={articles.apiOrigin}
          />
        ))}
      </div>
    </section>
  );
}
