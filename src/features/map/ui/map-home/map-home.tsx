'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import {
  captureMapViewport,
  restoreMapViewport,
} from '../../model/map-viewport';

type MapInstance = {
  destroy(): void;
  getCenter?(): { lat(): number; lng(): number };
  getZoom?(): number;
  setCenter(point: unknown): void;
  setSize(size: unknown): void;
};
type MarkerInstance = { setMap(map: MapInstance | null): void };
type NaverMaps = {
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  Marker: new (options: {
    map: MapInstance;
    position: unknown;
    icon: { url: string; size: unknown; anchor: unknown };
  }) => MarkerInstance;
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (
    element: HTMLElement,
    options: { center: unknown; zoom: number },
  ) => MapInstance;
};

export function MapHome({ clientId }: { clientId: string }) {
  const canvas = useRef<HTMLDivElement>(null);
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
      pending = false;
      setLocating(false);
      setLocationError('');
      observer?.disconnect();
      window.removeEventListener('resize', resize);
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
      observer?.disconnect();
      window.removeEventListener('resize', resize);
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
  }, [clientId, attempt]);

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
