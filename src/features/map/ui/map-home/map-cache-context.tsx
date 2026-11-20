'use client';

import { createContext } from 'react';

import type { MapArticleResult } from '../../model/map-article.types';

export type CachedMap = {
  clientId: string;
  articles?: MapArticleResult | null;
};

export type MapCacheController = {
  cacheMap(map: CachedMap): void;
  cached: boolean;
};

export const MapCacheContext = createContext<MapCacheController | null>(null);
