import type { LocatedArticle } from './map-article.types';

export function groupMapArticles(items: LocatedArticle[]) {
  const seen = new Set<string>();
  const groups = new Map<string, LocatedArticle[]>();

  for (const item of items) {
    if (seen.has(item.article_id)) continue;
    seen.add(item.article_id);

    const { latitude, longitude, label, precision } = item.location;
    // Server region labels distinguish administrative areas even when their
    // representative points coincide. Historical locations remain point-based.
    const key = JSON.stringify(
      precision === 'region'
        ? ['region', label, latitude, longitude]
        : ['point', latitude, longitude],
    );
    const group = groups.get(key) ?? [];

    group.push(item);
    groups.set(key, group);
  }

  return groups;
}
