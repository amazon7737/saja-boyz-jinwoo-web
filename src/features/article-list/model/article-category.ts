import type { IncidentCategory } from '@/features/incidents/model/types';

const categories: readonly IncidentCategory[] = [
  'security',
  'society',
  'politics',
  'international',
];

export function parseArticleCategory(
  value: unknown,
): IncidentCategory | undefined {
  return categories.find((category) => category === value);
}

export function articleCategoryOrNull(value: unknown): IncidentCategory | null {
  return parseArticleCategory(value) ?? null;
}
