'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import {
  naverMapScriptUrl,
  type MapInstance,
  type MarkerInstance,
  type NaverMaps,
} from '@/features/map/ui/map-home/naver-map-sdk';
import type { LocatedArticle } from '@/features/map/model/map-article.types';

import { useArticleSheetRoute } from '../../model/article-sheet-context';

type Location = LocatedArticle['location'];

export function DetailMap({ id }: { id: string }) {
  const route = useArticleSheetRoute();
  const location = route?.mapArticles.find(
    (item) => item.article_id === id,
  )?.location;

  if (!location) return null;

  return <VerifiedLocationMap location={location} />;
}

function VerifiedLocationMap({ location }: { location: Location }) {
  const canvas = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const { latitude, longitude, precision, label } = location;

  useEffect(() => {
    let disposed = false;
    let map: MapInstance | undefined;
    let marker: MarkerInstance | undefined;
    let observer: ResizeObserver | undefined;
    let scriptObserver: MutationObserver | undefined;

    const clean = () => {
      scriptObserver?.disconnect();
      scriptObserver = undefined;
      observer?.disconnect();
      observer = undefined;
      marker?.setMap(null);
      marker = undefined;
      map?.destroy();
      map = undefined;
    };

    queueMicrotask(() => {
      if (disposed) return;
      const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim();
      const maps = (window as Window & { naver?: { maps: NaverMaps } }).naver
        ?.maps;
      const scriptUrl = clientId ? naverMapScriptUrl(clientId).href : null;
      const script = scriptUrl
        ? [...document.querySelectorAll<HTMLScriptElement>('script[src]')].find(
            (element) => element.src === scriptUrl,
          )
        : undefined;
      const element = canvas.current;

      if (!element || !maps || script?.dataset.naverMapLoaded !== 'true') {
        setStatus('failed');

        return;
      }

      try {
        const position = new maps.LatLng(latitude, longitude);

        map = new maps.Map(element, {
          center: position,
          zoom:
            precision === 'address'
              ? 15
              : precision === 'neighborhood'
                ? 12
                : 10,
          draggable: false,
          scrollWheel: false,
          pinchZoom: false,
          keyboardShortcuts: false,
          disableDoubleClickZoom: true,
          disableDoubleTapZoom: true,
          disableTwoFingerTapZoom: true,
        });
        marker = new maps.Marker({
          map,
          position,
          icon: {
            url: '/map/article-selected.svg',
            size: new maps.Size(28, 28),
            anchor: new maps.Point(14, 14),
          },
        });

        if (typeof MutationObserver !== 'undefined') {
          scriptObserver = new MutationObserver(() => {
            if (!disposed && !script.isConnected) {
              clean();
              setStatus('failed');
            }
          });
          scriptObserver.observe(document.head, { childList: true });
        }

        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(() => {
            if (
              !disposed &&
              map &&
              element.clientWidth &&
              element.clientHeight
            ) {
              map.setSize(
                new maps.Size(element.clientWidth, element.clientHeight),
              );
            }
          });
          observer.observe(element);
        }

        setStatus('ready');
      } catch {
        clean();
        setStatus('failed');
      }
    });

    return () => {
      disposed = true;
      clean();
    };
  }, [latitude, longitude, precision]);

  const disclosure =
    precision === 'address'
      ? '기사에 언급된 주소 기준 위치입니다.'
      : precision === 'neighborhood'
        ? '동네 기준 위치로, 실제 발생 지점과 다를 수 있습니다.'
        : '지역 대표 위치로, 실제 발생 지점과 다를 수 있습니다.';

  return (
    <section aria-label="기사에서 확인한 위치" className="flex flex-col gap-2">
      <h2 className="m-0 text-sm font-extrabold">발생 위치</h2>
      <div className="relative overflow-hidden rounded-[10px] bg-background">
        <div ref={canvas} data-detail-map="" className="h-[100px] w-full" />
        {status === 'loading' && (
          <div
            role="status"
            className="absolute inset-0 grid place-items-center bg-background"
          >
            <LoadingSpinner />
            <span className="sr-only">위치 지도를 불러오는 중이에요</span>
          </div>
        )}
        {status === 'failed' && (
          <div
            role="status"
            className="absolute inset-0 flex items-center justify-center gap-2 bg-background px-3 text-xs text-muted"
          >
            <span>위치 지도를 불러오지 못했어요</span>
            <Link
              href="/"
              className="ui-link shrink-0 rounded-md px-2 py-1 text-brand"
            >
              지도에서 다시 시도
            </Link>
          </div>
        )}
      </div>
      <p className="m-0 text-xs text-muted">
        {label} · {disclosure}
      </p>
    </section>
  );
}
