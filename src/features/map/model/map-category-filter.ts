import { categoryLabels } from '@/features/incidents/model/labels';
import type { IncidentCategory } from '@/features/incidents/model/types';

import type { LocatedArticle } from './map-article.types';

export type MapCategory = 'all' | IncidentCategory;

export const mapCategories: readonly {
  value: MapCategory;
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  ...(['security', 'society', 'politics', 'international'] as const).map(
    (value) => ({ value, label: categoryLabels[value] }),
  ),
];

export function filterMapCategory(
  items: LocatedArticle[],
  category: MapCategory,
) {
  return category === 'all'
    ? items
    : items.filter((item) => item.category === category);
}
