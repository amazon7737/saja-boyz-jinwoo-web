'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { articleText } from '@/features/article-list/model/article-presentation';

import { createArticleMarker } from './map-article-marker';
import { MapArticleSheet } from './map-article-sheet';
import type {
  LocatedArticle,
  MapArticleResult,
} from '../../model/map-article.types';
import {
  captureMapViewport,
  restoreMapViewport,
} from '../../model/map-viewport';

type MapInstance = {
  destroy(): void;
  getCenter?(): { lat(): number; lng(): number };
  getZoom?(): number;
  setCenter(point: unknown): void;
  setZoom(zoom: number, effect?: boolean): void;
  fitBounds(
    points: unknown[],
    options: {
      top: number;
      right: number;
      bottom: number;
      left: number;
      maxZoom: number;
    },
  ): void;
  setSize(size: unknown): void;
};
type MarkerInstance = { setMap(map: MapInstance | null): void };
type NaverMaps = {
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  Marker: new (options: {
    map: MapInstance;
    position: unknown;
    icon?:
      | { url: string; size: unknown; anchor: unknown }
      | { content: HTMLElement; anchor: unknown };
    title?: string;
  }) => MarkerInstance;
  Event: {
    addListener(
      target: MarkerInstance,
      event: string,
      callback: () => void,
    ): unknown;
    removeListener(listener: unknown): void;
  };
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (
    element: HTMLElement,
    options: { center: unknown; zoom: number },
  ) => MapInstance;
};

export function MapHome({
  clientId,
  articles,
}: {
  clientId: string;
  articles?: MapArticleResult | null;
}) {
  const [selectedArticles, setSelectedArticles] = useState<LocatedArticle[]>(
    [],
  );
  const canvas = useRef<HTMLDivElement>(null);
  const fitArticles = useRef<(() => void) | null>(null);
  const clearSelection = useRef<((restoreFocus?: boolean) => void) | null>(
    null,
  );
  const locate = useRef<(() => void) | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const viewport = restoreMapViewport(clientId);
    let disposed = false;
    let loadFailed = false;
    let map: MapInstance | undefined;
    let marker: MarkerInstance | undefined;
    let selectedMarker: HTMLButtonElement | undefined;
    const articleMarkers: {
      marker: MarkerInstance;
      listener: unknown;
      setSelected(selected: boolean): void;
    }[] = [];
    let removeArticleListener: ((listener: unknown) => void) | undefined;
    const clearArticles = () => {
      for (const entry of articleMarkers.splice(0)) {
        removeArticleListener?.(entry.listener);
        entry.marker.setMap(null);
      }
    };
    let pending = false;
    let requestId = 0;
    let observer: ResizeObserver | undefined;
    const resize = () => {
      const maps = (window as Window & { naver?: { maps: NaverMaps } }).naver
        ?.maps;

      if (!disposed && !loadFailed && map && maps && canvas.current) {
        map.setSize(
          new maps.Size(
            canvas.current.clientWidth,
            canvas.current.clientHeight,
          ),
        );
      }
    };
    const sdkWindow = window as Window & { navermap_authFailure?: () => void };
    const previousAuthFailure = sdkWindow.navermap_authFailure;
    const initialize = () => {
      const maps = (window as Window & { naver?: { maps: NaverMaps } }).naver
        ?.maps;

      if (disposed || loadFailed || map || !canvas.current || !maps) return;
      map = new maps.Map(canvas.current, {
        center: new maps.LatLng(viewport.latitude, viewport.longitude),
        zoom: viewport.zoom,
      });

      removeArticleListener = (listener) => maps.Event.removeListener(listener);

      clearSelection.current = (restoreFocus = false) => {
        for (const entry of articleMarkers) entry.setSelected(false);
        if (restoreFocus) selectedMarker?.focus({ preventScroll: true });
        selectedMarker = undefined;
      };

      const groups = new Map<string, LocatedArticle[]>();

      for (const item of articles?.items ?? []) {
        const key = `${item.location.latitude},${item.location.longitude}`;
        const group = groups.get(key) ?? [];

        group.push(item);
        groups.set(key, group);
      }

      fitArticles.current = () => {
        if (disposed || loadFailed || !map || !groups.size) return;
        const points = [...groups.values()].map(
          ([item]) =>
            new maps.LatLng(item.location.latitude, item.location.longitude),
        );

        // The SDK ignores coordinate arrays shorter than two; repeated
        // representative coordinates also do not define an area to fit.
        if (points.length === 1) {
          map.setCenter(points[0]);
          map.setZoom(15, false);

          return;
        }

        map.fitBounds(points, {
          top: 150,
          right: 60,
          bottom: 180,
          left: 60,
          maxZoom: 15,
        });
      };

      for (const group of groups.values()) {
        const item = group[0];
        const title =
          group.length === 1
            ? articleText(item.article.title)
            : `${item.location.label} · 기사 ${group.length}건`;
        const positionLabel =
          item.location.precision === 'address'
            ? '기사에 언급된 주소'
            : '지역 대표 위치';
        const visual = createArticleMarker(
          group.length,
          `${positionLabel}: ${item.location.label} · ${title}`,
        );

        const articleMarker = new maps.Marker({
          map,
          position: new maps.LatLng(
            item.location.latitude,
            item.location.longitude,
          ),
          title,
          icon: {
            content: visual.content,
            anchor: new maps.Point(visual.side / 2, visual.side / 2),
          },
        });
        const select = () => {
          if (disposed || loadFailed) return;
          clearSelection.current?.();
          visual.setSelected(true);
          selectedMarker = visual.content;
          setSelectedArticles(group);
        };
        const listener = maps.Event.addListener(articleMarker, 'click', select);

        visual.content.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            select();
          }
        });

        articleMarkers.push({
          marker: articleMarker,
          listener,
          setSelected: visual.setSelected,
        });
      }

      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(resize);
        observer.observe(canvas.current);
      }

      window.addEventListener('resize', resize);

      locate.current = () => {
        if (disposed || loadFailed || !map || pending) return;
        setLocationError('');

        if (!navigator.geolocation) {
          setLocationError('이 브라우저는 위치 확인을 지원하지 않습니다.');

          return;
        }

        const currentRequest = ++requestId;

        pending = true;
        setLocating(true);
        const activeMap = map;
        const isActive = () =>
          !disposed &&
          !loadFailed &&
          map === activeMap &&
          currentRequest === requestId &&
          pending;
        const reject = (error?: GeolocationPositionError) => {
          if (!isActive()) return;
          pending = false;
          setLocating(false);
          setLocationError(
            error?.code === 1
              ? '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해 주세요.'
              : error?.code === 3
                ? '위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.'
                : '위치를 확인하지 못했습니다. 다시 시도해 주세요.',
          );
        };

        try {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!isActive()) return;
              const point = new maps.LatLng(
                position.coords.latitude,
                position.coords.longitude,
              );

              marker?.setMap(null);
              marker = new maps.Marker({
                map: activeMap,
                position: point,
                icon: {
                  url: '/naver-map-location.svg',
                  size: new maps.Size(24, 24),
                  anchor: new maps.Point(12, 12),
                },
              });
              activeMap.setCenter(point);
              pending = false;
              setLocating(false);
            },
            reject,
            { timeout: 10_000 },
          );
        } catch {
          reject();
        }
      };

      clearTimeout(timeout);
      setReady(true);
    };

    const url = new URL('https://oapi.map.naver.com/openapi/v3/maps.js');

    url.searchParams.set('ncpKeyId', clientId);

    for (const element of document.querySelectorAll('script[src]')) {
      const scriptUrl = new URL((element as HTMLScriptElement).src);

      if (
        scriptUrl.origin === url.origin &&
        scriptUrl.pathname === url.pathname &&
        scriptUrl.searchParams.get('ncpKeyId') !== clientId
      ) {
        element.remove();
      }
    }

    let script = [...document.querySelectorAll('script')].find(
      (element) => element.src === url.href,
    );
    const existing = Boolean(script);

    if (!script) {
      script = document.createElement('script');
      script.src = url.href;
      script.async = true;
    }

    const fail = () => {
      if (disposed || loadFailed) return;
      loadFailed = true;
      clearTimeout(timeout);
      locate.current = null;
      fitArticles.current = null;
      clearSelection.current = null;
      pending = false;
      setLocating(false);
      setLocationError('');
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      clearArticles();
      marker?.setMap(null);
      marker = undefined;
      map?.destroy();
      map = undefined;
      script.remove();
      setReady(false);
      setFailed(true);
    };

    sdkWindow.navermap_authFailure = fail;
    const timeout = setTimeout(fail, 10_000);

    script.addEventListener('load', initialize);
    script.addEventListener('error', fail);
    if (!existing) document.head.append(script);
    // A previous home visit may already have loaded the SDK.
    if (existing) queueMicrotask(initialize);

    return () => {
      disposed = true;
      locate.current = null;
      fitArticles.current = null;
      clearSelection.current = null;
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      clearArticles();
      marker?.setMap(null);
      clearTimeout(timeout);

      if (sdkWindow.navermap_authFailure === fail) {
        if (previousAuthFailure === undefined) {
          delete sdkWindow.navermap_authFailure;
        } else {
          sdkWindow.navermap_authFailure = previousAuthFailure;
        }
      }

      script.removeEventListener('load', initialize);
      script.removeEventListener('error', fail);
      if (map) captureMapViewport(clientId, map);
      map?.destroy();
    };
  }, [clientId, attempt, articles]);

  return (
    <section aria-label="주변 지도" className="relative">
      <div
        ref={canvas}
        className="h-[calc(100dvh-max(110px,env(safe-area-inset-bottom)_+_90px))] overflow-hidden"
      />
      <button
        type="button"
        aria-label="내 위치"
        aria-busy={locating}
        disabled={!ready || locating}
        onClick={() => locate.current?.()}
        className="absolute right-4 bottom-12 flex size-11 items-center justify-center rounded-full bg-white shadow-floating disabled:opacity-50"
      >
        <Image src="/naver-map-crosshair.svg" alt="" width={20} height={20} />
      </button>
      {ready && articles !== undefined && !articles?.items.length && (
        <div
          role="status"
          className="absolute top-26 right-4 left-4 rounded-2xl bg-floating p-3 text-sm text-muted shadow-floating"
        >
          {articles === null ? (
            <>
              <p>
                기사 위치를 불러오지 못했습니다. 지도는 계속 사용할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 inline-block underline"
              >
                기사 위치 다시 불러오기
              </button>
            </>
          ) : (
            <>
              <p>아직 위치가 확인된 기사가 없습니다.</p>
              <Link href="/incidents" className="mt-2 inline-block underline">
                전체 기사 목록 보기
              </Link>
            </>
          )}
        </div>
      )}
      {ready && Boolean(articles?.items.length) && (
        <div className="absolute top-26 right-4 left-4 flex items-center justify-between gap-2 rounded-2xl bg-floating p-3 shadow-floating">
          <div className="text-xs text-muted">
            <p className="m-0">지도 기사 {articles!.items.length}건</p>
            {articles!.items.some(
              (item) => item.location.precision === 'region',
            ) && (
              <a
                href="https://www.data.go.kr/data/15084084/openapi.do"
                className="mt-1 inline-block text-[11px] underline"
              >
                지역 좌표: 기상청
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => fitArticles.current?.()}
            className="rounded-lg border border-border px-3 py-2 text-sm text-text"
          >
            기사 위치 보기
          </button>
        </div>
      )}
      {ready && selectedArticles.length > 0 && articles && (
        <MapArticleSheet
          items={selectedArticles}
          apiOrigin={articles.apiOrigin}
          onClose={() => {
            clearSelection.current?.(true);
            setSelectedArticles([]);
          }}
        />
      )}
      {locationError && (
        <p
          role="status"
          className="absolute top-26 right-4 left-4 rounded-2xl bg-floating p-4 shadow-floating"
        >
          {locationError}
        </p>
      )}
      {failed && (
        <div
          role="alert"
          className="absolute top-26 right-4 left-4 rounded-2xl bg-floating p-4 shadow-floating"
        >
          <p>지도를 불러오지 못했습니다. 다시 시도해 주세요.</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setReady(false);
              setAttempt((value) => value + 1);
            }}
            className="rounded-lg border border-border px-4 py-2"
          >
            다시 시도
          </button>
        </div>
      )}
      {!ready && !failed && (
        <div
          role="status"
          aria-busy="true"
          className="absolute top-26 right-4 left-4 rounded-2xl bg-floating p-4 shadow-floating"
        >
          지도를 불러오는 중입니다.
        </div>
      )}
    </section>
  );
}
