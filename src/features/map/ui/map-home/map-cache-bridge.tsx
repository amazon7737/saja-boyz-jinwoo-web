'use client';

import { useContext, useEffect } from 'react';

import { SiteStructuredData } from '@/components/layout/site-structured-data/site-structured-data';

import { MapCacheContext, type CachedMap } from './map-cache-context';
import { MapHome } from './map-home';

export function MapCacheBridge({ clientId, articles }: CachedMap) {
  const cache = useContext(MapCacheContext);
  const cacheMap = cache?.cacheMap;

  useEffect(() => {
    if (!cacheMap) return;
    cacheMap({ clientId, articles });
  }, [cacheMap, clientId, articles]);

  return (
    <>
      <SiteStructuredData />
      {(!cache || !cache.cached) && (
        <MapHome
          clientId={clientId}
          articles={articles}
          initializeSdk={!cache}
        />
      )}
    </>
  );
}
