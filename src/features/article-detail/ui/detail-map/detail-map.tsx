'use client';

import { useEffect, useRef, useState } from 'react';

import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import {
  subscribeNaverMaps,
  type MapInstance,
  type MarkerInstance,
} from '@/features/map/ui/map-home/naver-map-sdk';

import { useDetailLocation } from '../../model/detail-location-context';

type Location = NonNullable<
  NonNullable<ReturnType<typeof useDetailLocation>['data']>['location']
>;

export function DetailMap({ id }: { id: string }) {
  const { data } = useDetailLocation(id);
  const location = data?.location;

  if (!location) return null;

  return <VerifiedLocationMap location={location} />;
}

function VerifiedLocationMap({ location }: { location: Location }) {
  const canvas = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const { latitude, longitude, precision, label } = location;

  useEffect(() => {
    let disposed = false;
    let map: MapInstance | undefined;
    let marker: MarkerInstance | undefined;
    let observer: ResizeObserver | undefined;

    const clean = () => {
      observer?.disconnect();
      observer = undefined;
      marker?.setMap(null);
      marker = undefined;
      map?.destroy();
      map = undefined;
    };

    const unsubscribe = subscribeNaverMaps(
      process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? '',
      {
        ready: (maps) => {
          const element = canvas.current;

          if (disposed || !element) return;

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
        },
        error: () => {
          if (disposed) return;
          clean();
          setStatus('failed');
        },
      },
    );

    return () => {
      disposed = true;
      unsubscribe();
      clean();
    };
  }, [latitude, longitude, precision, attempt]);

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
            <button
              type="button"
              className="ui-control shrink-0 rounded-md border-0 bg-transparent px-2 py-1 text-brand"
              onClick={() => {
                setStatus('loading');
                setAttempt((value) => value + 1);
              }}
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
      <p className="m-0 text-xs text-muted">
        {label} · {disclosure}
      </p>
    </section>
  );
}
