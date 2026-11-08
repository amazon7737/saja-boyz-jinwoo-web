'use client';

import { createContext, useContext } from 'react';

import type { LocatedArticle } from '@/features/map/model/map-article.types';

export type ArticleSheetRoute = {
  detailFocus?: { current: 'back' | 'close' | null };
  active: boolean;
  sourcePath: string;
  height: number;
  mapArticles: LocatedArticle[];
  openArticle(id: string): void;
  close(): void;
  setHeight(height: number, expanded?: boolean): void;
  registerMapArticles(items: LocatedArticle[]): void;
  setMapPreviewVisible?(visible: boolean): void;
  retry(): void;
};

export const ArticleSheetContext = createContext<ArticleSheetRoute | null>(
  null,
);

export function useArticleSheetRoute() {
  return useContext(ArticleSheetContext);
}
