import { publicationDate } from '@/features/article-list/model/article-presentation';

import type { LocatedArticle } from './map-article.types';

export const mapPeriods = [
  { value: 'all', label: '전체 기간', days: null },
  { value: 'day', label: '최근 24시간', days: 1 },
  { value: 'week', label: '최근 7일', days: 7 },
  { value: 'month', label: '최근 30일', days: 30 },
] as const;

export type MapPeriod = (typeof mapPeriods)[number]['value'];

export function filterMapPeriod(
  items: LocatedArticle[],
  period: MapPeriod,
  now: number,
) {
  const days = mapPeriods.find((option) => option.value === period)!.days;
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.article_id)) return false;
    seen.add(item.article_id);
    if (days === null) return true;
    const published = publicationDate(item.article.pubDate).getTime();

    return published >= now - days * 86_400_000 && published <= now;
  });
}
