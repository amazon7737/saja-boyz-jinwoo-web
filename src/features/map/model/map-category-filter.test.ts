import { expect, test } from 'vitest';

import type { LocatedArticle } from './map-article.types';
import { filterMapCategory, mapCategories } from './map-category-filter';

function article(id: string, category: LocatedArticle['category']) {
  return { article_id: id, category } as LocatedArticle;
}

const items = [
  article('a', 'society'),
  article('b', 'politics'),
  article('c', null),
  article('d', 'society'),
];

test('allKeepsEveryItemIncludingUncategorized', () => {
  expect(filterMapCategory(items, 'all')).toEqual(items);
});

test('aCategoryKeepsOnlyExactMatches', () => {
  expect(
    filterMapCategory(items, 'society').map((item) => item.article_id),
  ).toEqual(['a', 'd']);
  expect(filterMapCategory(items, 'international')).toEqual([]);
});

test('optionsListAllThenTheFourCategoriesInDisplayOrder', () => {
  expect(mapCategories.map((option) => option.label)).toEqual([
    '전체',
    '안보',
    '사회',
    '정치',
    '국제',
  ]);
});
