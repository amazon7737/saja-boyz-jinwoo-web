'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { SiteStructuredData } from '@/components/layout/site-structured-data/site-structured-data';
import { useArticleSheetRoute } from '@/features/article-detail/model/article-sheet-context';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { Notice } from '@/components/feedback/notice';
import { articleText } from '@/features/article-list/model/article-presentation';

import { filterMapPeriod, type MapPeriod } from '../../model/map-period-filter';
import { MapAllFilters } from '../map-all-filters/map-all-filters';
import { MapPeriodFilter } from '../map-period-filter/map-period-filter';
import { MapUnavailableFilter } from '../map-unavailable-filter/map-unavailable-filter';
import { createArticleMarker } from './map-article-marker';
import { MapArticleSheet } from './map-article-sheet';
import {
  naverMapScriptUrl,
  type MapInstance,
  type MarkerInstance,
  type NaverMaps,
} from './naver-map-sdk';
import { MapArticleCarousel } from '../map-article-carousel/map-article-carousel';
import type {
  LocatedArticle,
  MapArticleResult,
} from '../../model/map-article.types';
import { groupMapArticles } from '../../model/map-region-groups';
import {
  groupMapDisplayPoints,
  sameMapDisplayGroups,
} from '../../model/map-display-groups';
import {
  captureMapViewport,
  hasMapViewport,
  restoreMapViewport,
} from '../../model/map-viewport';

type LocationResult =
  { latitude: number; longitude: number } | { error: string };

function requestLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        error:
          '이 브라우저는 위치 확인을 지원하지 않아요. 지도에서 원하는 동네를 살펴보세요.',
      });

      return;
    }

    const reject = (error?: GeolocationPositionError) =>
      resolve({
        error:
          error?.code === 1
            ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 허용하면 내 주변부터 볼 수 있어요.'
            : error?.code === 3
              ? '위치 확인 시간이 초과됐어요. 한 번 더 확인해 볼까요?'
              : '내 위치를 확인하지 못했어요. 연결 상태를 확인한 뒤 다시 눌러주세요.',
      });

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
          ) {
            reject();

            return;
          }

          resolve({ latitude, longitude });
        },
        reject,
        { timeout: 10_000 },
      );
    } catch {
      reject();
    }
  });
}

export function MapHome({
  clientId,
  articles,
}: {
  clientId: string;
  articles?: MapArticleResult | null;
}) {
  const sheetRoute = useArticleSheetRoute();
  const registerMapArticles = sheetRoute?.registerMapArticles;
  const detailOpen = sheetRoute?.active ?? false;
  const [selectionHeight, setSelectionHeight] = useState(0);
  const [selectedArticles, setSelectedArticles] = useState<LocatedArticle[]>(
    [],
  );
  const [period, setPeriod] = useState<MapPeriod>('all');
  const [periodNow, setPeriodNow] = useState(() => Date.now());
  const filteredArticles = useMemo(
    () =>
      articles
        ? {
            ...articles,
            items: filterMapPeriod(articles.items, period, periodNow),
          }
        : articles,
    [articles, period, periodNow],
  );
  const updateArticles = useRef<((items: LocatedArticle[]) => void) | null>(
    null,
  );
  const canvas = useRef<HTMLDivElement>(null);
  const controlClearance = useRef<HTMLDivElement>(null);
  const carouselOverlay = useRef<HTMLDivElement>(null);
  const noticeViewport = useRef<HTMLDivElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  const locateButton = useRef<HTMLButtonElement>(null);
  const restoreLocateFocus = useRef(false);
  const updateControls = useRef<(() => void) | null>(null);
  const clearSelection = useRef<((restoreFocus?: boolean) => void) | null>(
    null,
  );
  const restoreSelectionFocus = useRef<HTMLButtonElement | null>(null);
  const automaticLocation = useRef<{
    started: boolean;
    request?: Promise<LocationResult>;
  }>({ started: false });
  const locate = useRef<(() => void) | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    registerMapArticles?.(filteredArticles?.items ?? []);

    return () => registerMapArticles?.([]);
  }, [filteredArticles, registerMapArticles]);

  useEffect(() => {
    if (selectedArticles.length || !restoreSelectionFocus.current) return;
    const target = restoreSelectionFocus.current;

    restoreSelectionFocus.current = null;
    // 시트의 포커스 가드와 배경 inert가 해제된 commit 뒤에 복귀한다.
    if (target.isConnected) target.focus({ preventScroll: true });
  }, [selectedArticles]);

  useLayoutEffect(() => {
    if (!locating && !locationError && restoreLocateFocus.current) {
      restoreLocateFocus.current = false;
      locateButton.current?.focus({ preventScroll: true });
    }
  }, [locating, locationError]);

  useLayoutEffect(() => {
    const positionNotices = () => {
      if (!noticeViewport.current) return;
      const bottom = Math.max(
        (carouselOverlay.current?.getBoundingClientRect().height ?? 0) + 66,
        (controlClearance.current?.getBoundingClientRect().height ?? 0) + 8,
      );

      noticeViewport.current.style.bottom = `${bottom}px`;
    };

    positionNotices();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(positionNotices);

    if (carouselOverlay.current) observer?.observe(carouselOverlay.current);
    if (controlClearance.current) observer?.observe(controlClearance.current);
    window.addEventListener('resize', positionNotices);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', positionNotices);
    };
  }, [ready, articles, filteredArticles, selectedArticles]);

  useEffect(() => {
    const viewport = restoreMapViewport(clientId);
    let disposed = false;
    let loadFailed = false;
    let map: MapInstance | undefined;
    let marker: MarkerInstance | undefined;
    let selectedMarker: HTMLButtonElement | undefined;
    let selectedPoint: string | undefined;
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
    let automaticCancelled = false;
    let location: { latitude: number; longitude: number } | undefined;
    const showLocation = (recenter: boolean) => {
      const maps = (window as Window & { naver?: { maps: NaverMaps } }).naver
        ?.maps;

      if (!map || !maps || !location || disposed || loadFailed) return;
      const point = new maps.LatLng(location.latitude, location.longitude);

      marker?.setMap(null);
      marker = new maps.Marker({
        map,
        position: point,
        icon: {
          url: '/naver-map-location.svg',
          size: new maps.Size(24, 24),
          anchor: new maps.Point(12, 12),
        },
      });
      if (recenter) map.setCenter(point);
    };
    const receiveLocation = (
      request: Promise<LocationResult>,
      automatic: boolean,
    ) => {
      pending = true;
      setLocating(true);
      void request.then((result) => {
        if (disposed || loadFailed) return;
        pending = false;
        setLocating(false);

        if ('error' in result) {
          setLocationError(result.error);

          return;
        }

        if (automatic && automaticCancelled) return;
        restoreLocateFocus.current =
          retryButton.current !== null &&
          document.activeElement === retryButton.current;
        setLocationError('');
        location = result;
        showLocation(true);
      });
    };

    locate.current = () => {
      if (disposed || loadFailed || !map || pending) return;
      receiveLocation(requestLocation(), false);
    };

    if (!automaticLocation.current.started) {
      automaticLocation.current.started = true;

      if (!hasMapViewport(clientId)) {
        automaticLocation.current.request = requestLocation();
      }
    }

    if (automaticLocation.current.request) {
      receiveLocation(automaticLocation.current.request, true);
    }

    let observer: ResizeObserver | undefined;
    let refreshDisplay: (() => void) | undefined;
    const controlListeners: unknown[] = [];
    let removeControlListener: ((listener: unknown) => void) | undefined;
    let controlFrame: number | undefined;
    const controlTransforms = new Map<
      HTMLElement,
      { original: string; base: string }
    >();
    const clearControls = () => {
      updateControls.current = null;

      if (controlFrame !== undefined) {
        cancelAnimationFrame(controlFrame);
        controlFrame = undefined;
      }

      for (const listener of controlListeners.splice(0)) {
        removeControlListener?.(listener);
      }

      for (const [element, transform] of controlTransforms) {
        element.style.transform = transform.original;
      }

      controlTransforms.clear();
    };
    const positionControls = () => {
      if (disposed || loadFailed) return;
      const positions = (window as Window & { naver?: { maps: NaverMaps } })
        .naver?.maps.Position;

      if (!map?.controls || !positions) return;
      const clearance = Math.max(
        controlClearance.current?.clientHeight || 84,
        carouselOverlay.current?.clientHeight || 0,
      );

      for (const position of [
        positions.BOTTOM_LEFT,
        positions.BOTTOM_CENTER,
        positions.BOTTOM_RIGHT,
      ]) {
        if (position === undefined) continue;

        for (const element of map.controls[position]?.getArray() ?? []) {
          if (!(element instanceof HTMLElement)) continue;
          let transform = controlTransforms.get(element);

          if (!transform) {
            const computed = window.getComputedStyle(element).transform;

            transform = {
              original: element.style.transform,
              base: computed === 'none' ? '' : computed,
            };
            controlTransforms.set(element, transform);
          }

          // Keep the SDK's automatic content and updates; move only its public
          // containers, retaining their existing transform without accumulation.
          element.style.transform =
            `translateY(-${clearance}px) ${transform.base}`.trim();
        }
      }
    };
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
        positionControls();
        refreshDisplay?.();
      }
    };
    const sdkWindow = window as Window & { navermap_authFailure?: () => void };
    const previousAuthFailure = sdkWindow.navermap_authFailure;
    const initialize = () => {
      const maps = (window as Window & { naver?: { maps: NaverMaps } }).naver
        ?.maps;

      if (disposed || loadFailed || map || !canvas.current || !maps) return;
      map = new maps.Map(canvas.current, {
        center: new maps.LatLng(
          location?.latitude ?? viewport.latitude,
          location?.longitude ?? viewport.longitude,
        ),
        zoom: viewport.zoom,
      });

      showLocation(false);

      if (pending && automaticLocation.current.request && maps.Event) {
        controlListeners.push(
          maps.Event.addListener(map, 'dragstart', () => {
            automaticCancelled = true;
          }),
        );
      }

      // The SDK creates native control collections during map initialization.
      // Wait for init, then let its layout finish before positioning them.
      removeControlListener = (listener) => maps.Event.removeListener(listener);

      if (maps.Position) {
        const positions = maps.Position;
        const scheduleControls = () => {
          if (disposed || loadFailed || controlFrame !== undefined) return;
          controlFrame = requestAnimationFrame(() => {
            controlFrame = undefined;
            positionControls();
          });
        };

        const initializeControls = () => {
          if (disposed || loadFailed) return;

          for (const position of [
            positions.BOTTOM_LEFT,
            positions.BOTTOM_CENTER,
            positions.BOTTOM_RIGHT,
          ]) {
            const collection =
              position === undefined ? undefined : map?.controls?.[position];

            if (collection) {
              controlListeners.push(
                maps.Event.addListener(
                  collection,
                  'insert_at',
                  scheduleControls,
                ),
              );
            }
          }

          scheduleControls();
        };

        controlListeners.push(
          maps.Event.addListener(map, 'init', initializeControls),
        );
      }

      positionControls();
      updateControls.current = positionControls;

      removeArticleListener = (listener) => maps.Event.removeListener(listener);

      clearSelection.current = (restoreFocus = false) => {
        for (const entry of articleMarkers) entry.setSelected(false);
        restoreSelectionFocus.current = restoreFocus
          ? (selectedMarker ?? null)
          : null;
        selectedMarker = undefined;
        selectedPoint = undefined;
      };

      let currentItems: LocatedArticle[] = [];
      let displayGroups: ReturnType<typeof groupMapDisplayPoints> = new Map();

      updateArticles.current = (items) => {
        if (disposed || loadFailed || !map) return;
        currentItems = items;
        const groups = groupMapArticles(items);

        const projection = map.getProjection?.();
        const viewSize =
          canvas.current &&
          canvas.current.clientWidth > 0 &&
          canvas.current.clientHeight > 0
            ? {
                width: canvas.current.clientWidth,
                height: canvas.current.clientHeight,
              }
            : undefined;
        const center = map.getCenter?.();
        const centerOffset =
          projection && viewSize && center
            ? projection.fromCoordToOffset(center)
            : undefined;
        const camera =
          centerOffset &&
          Number.isFinite(centerOffset.x) &&
          Number.isFinite(centerOffset.y)
            ? viewSize
            : undefined;

        const nextGroups = groupMapDisplayPoints(
          groups,
          projection
            ? ({ latitude, longitude }) => {
                const point = projection.fromCoordToOffset(
                  new maps.LatLng(latitude, longitude),
                );

                // SDK pane의 이동 원점을 바깥 canvas의 화면 좌표로 정규화한다.
                return camera && centerOffset
                  ? {
                      x: point.x - centerOffset.x + camera.width / 2,
                      y: point.y - centerOffset.y + camera.height / 2,
                    }
                  : point;
              }
            : undefined,
          camera,
        );

        if (sameMapDisplayGroups(displayGroups, nextGroups)) return;
        const previousSelection = selectedPoint
          ? displayGroups.get(selectedPoint)
          : undefined;
        const nextSelection = selectedPoint
          ? nextGroups.get(selectedPoint)
          : undefined;
        const selectedIds = new Set(
          previousSelection?.items.map((item) => item.article_id),
        );
        const retainedSelection =
          nextSelection &&
          nextSelection.items.length === selectedIds.size &&
          nextSelection.items.every((item) => selectedIds.has(item.article_id))
            ? nextSelection
            : undefined;
        const restoreMarkerFocus = document.activeElement === selectedMarker;

        if (retainedSelection) {
          setSelectedArticles(retainedSelection.items);
        } else {
          clearSelection.current?.();
          setSelectedArticles([]);
        }

        displayGroups = nextGroups;
        clearArticles();

        for (const [
          point,
          { items: group, regionCount, diameter },
        ] of displayGroups) {
          const item = group[0];
          const title =
            group.length === 1
              ? articleText(item.article.title)
              : `${item.location.label} · 기사 ${group.length}건`;
          const positionLabel =
            item.location.precision === 'region'
              ? '지역 대표 위치'
              : item.location.precision === 'address'
                ? '기사에 언급된 주소'
                : '기사에 언급된 동네';
          const visual = createArticleMarker(
            group.length,
            `${positionLabel}: ${item.location.label} · ${title}${regionCount > 1 ? ' · 지역 묶음' : ''}`,
            diameter,
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
            if (disposed || loadFailed || displayGroups !== nextGroups) return;
            clearSelection.current?.();
            visual.setSelected(true);
            selectedMarker = visual.content;
            selectedPoint = point;
            setSelectedArticles(group);
          };
          const listener = maps.Event.addListener(
            articleMarker,
            'click',
            select,
          );

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

          if (retainedSelection && point === selectedPoint) {
            visual.setSelected(true);
            selectedMarker = visual.content;
            if (restoreMarkerFocus)
              visual.content.focus({ preventScroll: true });
          }
        }
      };

      refreshDisplay = () => {
        if (disposed || loadFailed) return;
        updateArticles.current?.(currentItems);
      };

      // Without projection support, coordinate-only groups cannot vary by zoom.
      if (map.getProjection) {
        for (const event of ['zoom_changed', 'idle']) {
          controlListeners.push(
            maps.Event.addListener(map, event, refreshDisplay),
          );
        }
      }

      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(resize);
        observer.observe(canvas.current);
        if (carouselOverlay.current) observer.observe(carouselOverlay.current);
        if (controlClearance.current)
          observer.observe(controlClearance.current);
      }

      window.addEventListener('resize', resize);

      clearTimeout(timeout);
      setReady(true);
    };

    const url = naverMapScriptUrl(clientId);

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
      const loadingScript = script;

      script.addEventListener(
        'load',
        () => {
          loadingScript.dataset.naverMapLoaded = 'true';
        },
        { once: true },
      );
    }

    const fail = () => {
      if (disposed || loadFailed) return;
      loadFailed = true;
      automaticLocation.current.request = undefined;
      clearTimeout(timeout);
      locate.current = null;
      updateArticles.current = null;
      clearSelection.current = null;
      pending = false;
      setLocating(false);
      setLocationError('');
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      clearControls();
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
    // StrictMode can reuse a pending script while an older SDK global remains.
    // Only a completed load on this script allows immediate SDK reuse.
    if (script.dataset.naverMapLoaded === 'true') queueMicrotask(initialize);

    return () => {
      disposed = true;
      locate.current = null;
      updateArticles.current = null;
      clearSelection.current = null;
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      clearControls();
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
  }, [clientId, attempt]);

  useEffect(() => {
    if (ready) updateArticles.current?.(filteredArticles?.items ?? []);
  }, [filteredArticles, ready]);

  // Reserve the visible panel height without changing the map viewport.
  useEffect(() => {
    updateControls.current?.();
  }, [
    selectedArticles,
    ready,
    selectionHeight,
    sheetRoute?.height,
    detailOpen,
  ]);

  function applyPeriod(value: MapPeriod) {
    clearSelection.current?.();
    setSelectedArticles([]);
    setPeriodNow(Date.now());
    setPeriod(value);
  }

  return (
    <>
      <SiteStructuredData />
      <section aria-label="주변 지도" className="relative">
        <div
          role="group"
          aria-label="기사 필터"
          className="absolute top-[calc(68px_+_env(safe-area-inset-top))] right-4 left-4 z-20 flex h-[30px] items-start gap-1.5"
        >
          <MapAllFilters value={period} onChange={applyPeriod} />
          <MapPeriodFilter value={period} onChange={applyPeriod} />
          <MapUnavailableFilter kind="category" />
        </div>
        <div ref={canvas} className="h-dvh overflow-hidden" />
        <div
          ref={controlClearance}
          aria-hidden="true"
          className="pointer-events-none invisible absolute bottom-0 w-0 min-h-[calc(84px_+_env(safe-area-inset-bottom))]"
          style={{
            height: detailOpen
              ? sheetRoute!.height + 8
              : selectedArticles.length > 0
                ? selectionHeight + 8
                : undefined,
          }}
        />
        <div
          ref={carouselOverlay}
          className="pointer-events-none absolute right-0 bottom-0 left-0 pb-[calc(86px_+_env(safe-area-inset-bottom))]"
        >
          <div className="pointer-events-auto relative">
            <button
              type="button"
              ref={locateButton}
              aria-label="내 위치"
              aria-busy={locating}
              disabled={!ready || locating}
              onClick={() => locate.current?.()}
              className="ui-control absolute right-4 -top-[58px] flex size-11 items-center justify-center rounded-full border-0 bg-white p-0 shadow-floating disabled:opacity-50"
            >
              {locating ? (
                <span className="size-5" role="status" aria-busy="true">
                  <LoadingSpinner />
                  <span className="sr-only">내 위치를 확인하는 중입니다.</span>
                </span>
              ) : (
                <Image
                  src="/naver-map-crosshair.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              )}
            </button>
            {ready && articles && articles.items.length > 0 && (
              <MapArticleCarousel articles={filteredArticles!} />
            )}
          </div>
        </div>
        <div
          ref={noticeViewport}
          className="pointer-events-none absolute top-[calc(112px_+_env(safe-area-inset-top))] right-4 bottom-[calc(152px_+_env(safe-area-inset-bottom))] left-4 flex min-h-0 flex-col"
        >
          {(locationError ||
            failed ||
            !ready ||
            (articles !== undefined && !articles?.items.length)) && (
            <div
              role="region"
              aria-label="지도 안내"
              tabIndex={0}
              className={`pointer-events-auto flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-y-contain rounded-2xl focus-visible:outline-2 focus-visible:outline-brand [&>*]:shrink-0 ${locationError ? '[&>*]:bg-white' : '[&>*]:bg-floating'}`}
            >
              {locationError && (
                <Notice
                  role={locating ? 'group' : 'status'}
                  title={locating ? '내 위치' : '위치를 한 번 더 확인할까요?'}
                  action={
                    <button
                      type="button"
                      ref={retryButton}
                      aria-label="위치 다시 시도"
                      aria-busy={locating}
                      aria-disabled={!ready || locating}
                      onClick={() => locate.current?.()}
                      className="ui-control flex min-h-11 items-center gap-2 rounded-lg border border-brand/30 px-4 py-2 text-sm font-semibold text-brand aria-disabled:opacity-50"
                    >
                      {locating && (
                        <span aria-hidden="true" className="size-4">
                          <LoadingSpinner />
                        </span>
                      )}
                      위치 다시 시도
                    </button>
                  }
                >
                  {!locating && locationError}
                </Notice>
              )}
              {ready && articles !== undefined && !articles?.items.length && (
                <Notice
                  title={
                    articles === null
                      ? '주변 소식을 다시 이어볼까요?'
                      : '다른 동네 소식도 살펴볼까요?'
                  }
                  role="status"
                  action={
                    articles === null ? (
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                      >
                        기사 위치 다시 불러오기
                      </button>
                    ) : (
                      <Link href="/incidents">전체 기사 목록 보기</Link>
                    )
                  }
                >
                  {articles === null ? (
                    <>
                      <p>
                        기사 위치를 불러오지 못했습니다. 지도는 계속 사용할 수
                        있습니다.
                      </p>
                      <p>
                        잠시 후 다시 불러와 주세요. 다시 불러오면 페이지가
                        새로고침됩니다.
                      </p>
                    </>
                  ) : (
                    '아직 위치가 확인된 기사가 없습니다.'
                  )}
                </Notice>
              )}
              {failed && (
                <Notice
                  role="alert"
                  title="지도를 다시 펼쳐볼까요?"
                  action={
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
                  }
                >
                  <p>지도를 불러오지 못했습니다. 다시 시도해 주세요.</p>
                  <p>연결을 확인한 뒤 다시 눌러주세요.</p>
                </Notice>
              )}
              {!ready && !failed && (
                <div
                  role="status"
                  aria-busy="true"
                  className="rounded-2xl bg-inherit p-4 shadow-floating"
                >
                  <span className="block size-5 text-muted">
                    <LoadingSpinner />
                  </span>
                  <span className="sr-only">지도를 불러오는 중입니다.</span>
                </div>
              )}
            </div>
          )}
        </div>
        {ready && selectedArticles.length > 0 && articles && (
          <MapArticleSheet
            active={!detailOpen}
            items={selectedArticles}
            apiOrigin={articles.apiOrigin}
            onHeightChange={setSelectionHeight}
            onClose={() => {
              clearSelection.current?.(true);
              setSelectedArticles([]);
            }}
          />
        )}
      </section>
    </>
  );
}
