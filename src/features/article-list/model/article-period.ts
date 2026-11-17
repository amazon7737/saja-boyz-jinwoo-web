export type ArticlePeriod = '24h' | '7d' | '30d';

export function parseArticlePeriod(value: unknown): ArticlePeriod | undefined {
  return value === '24h' || value === '7d' || value === '30d'
    ? value
    : undefined;
}
