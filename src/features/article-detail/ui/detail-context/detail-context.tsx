'use client';

import Link from 'next/link';

import { IconText } from '@/components/ui/icon-text/icon-text';
import { groupMapArticles } from '@/features/map/model/map-region-groups';
import {
  articleTitle,
  publicationDate,
  publicationText,
} from '@/features/article-list/model/article-presentation';

import { useArticleSheetRoute } from '../../model/article-sheet-context';

function useMapContext(id: string) {
  const route = useArticleSheetRoute();
  const groups = groupMapArticles(route?.mapArticles ?? []);
  const group = [...groups.values()].find((items) =>
    items.some((item) => item.article_id === id),
  );

  return {
    route,
    item: group?.find((item) => item.article_id === id),
    related: group?.filter((item) => item.article_id !== id).slice(0, 3) ?? [],
  };
}

export function DetailLocation({ id }: { id: string }) {
  const { item } = useMapContext(id);

  if (!item) return null;
  const precision =
    item.location.precision === 'address'
      ? '기사에 언급된 주소'
      : item.location.precision === 'neighborhood'
        ? '동네 기준 위치'
        : '지역 대표 위치';

  return (
    <p className="m-0 flex items-start gap-1 text-[13px]/[18px] font-medium text-muted">
      <IconText
        icon="pin"
        iconClassName="text-brand"
        textClassName="[overflow-wrap:anywhere]"
      >
        {item.location.label} · {precision}
        {item.location.precision !== 'address' && (
          <span className="sr-only"> · 실제 발생 지점과 다를 수 있습니다</span>
        )}
      </IconText>
    </p>
  );
}

export function RelatedArticles({ id }: { id: string }) {
  const { route, related } = useMapContext(id);

  if (!related.length) return null;

  return (
    <section aria-label="주변 핫한 사건" className="flex flex-col gap-2.5">
      <h2 className="m-0 text-[12px]/[15px] font-bold text-muted">
        주변 핫한 사건
      </h2>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {related.map((item) => {
          const published = publicationDate(item.article.pubDate);

          return (
            <li key={item.article_id}>
              <Link
                href={'/incidents/' + item.article_id}
                replace={route?.active}
                scroll={false}
                className="ui-link flex flex-col gap-1.5 rounded-lg border border-solid border-[#e3e8f0] bg-[#f7fafc] p-2.5"
              >
                <span className="self-end text-[11px]/[13px] text-muted">
                  {Number.isNaN(published.getTime()) ? (
                    '발행 시각 미확인'
                  ) : (
                    <time dateTime={published.toISOString()}>
                      {publicationText(published)}
                    </time>
                  )}
                </span>
                <span className="text-[13px]/[16px] font-bold text-text">
                  {articleTitle(item.article.title)}
                </span>
                <span className="text-[11px]/[13px] text-muted">
                  {item.location.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
