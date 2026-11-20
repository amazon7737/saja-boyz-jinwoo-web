'use client';

import {
  usePathname,
  useRouter,
  useSelectedLayoutSegments,
} from 'next/navigation';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
  type ReactNode,
  type MouseEvent,
} from 'react';

import { AppShell } from '@/components/layout/app-shell/app-shell';
import type { LocatedArticle } from '@/features/map/model/map-article.types';
import {
  MapCacheContext,
  type CachedMap,
} from '@/features/map/ui/map-home/map-cache-context';
import { MapHomeLoading } from '@/features/map/ui/map-home/map-home-loading';

import { ArticleSheetContext } from '../../model/article-sheet-context';

export { useArticleSheetRoute } from '../../model/article-sheet-context';

const NO_MAP_ARTICLES: LocatedArticle[] = [];
const CachedMapHome = lazy(() =>
  import('@/features/map/ui/map-home/map-home').then(({ MapHome }) => ({
    default: MapHome,
  })),
);

export function ArticleRouteHost({
  children,
  background,
}: {
  children?: ReactNode;
  background?: ReactNode;
}) {
  const pathname = usePathname() ?? '/';
  const backgroundSegments = useSelectedLayoutSegments('background') ?? [];
  const articleSegments = useSelectedLayoutSegments() ?? [];
  const router = useRouter();
  const active = articleSegments.includes('(.)incidents');
  const [sourceQuery, setSourceQuery] = useState('');
  const sourceBase =
    '/' +
    backgroundSegments.filter((segment) => !segment.startsWith('(')).join('/');
  const sourcePath =
    (sourceBase === '/search' || sourceBase === '/incidents') && active
      ? sourceBase + sourceQuery
      : sourceBase;
  const inline = active;
  const listScroll = useRef(0);
  const previousInline = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const detailFocus = useRef<'back' | 'close' | null>(null);
  const previousActive = useRef(false);
  const [height, setMeasuredHeight] = useState(0);
  const setHeight = useCallback((height: number) => {
    setMeasuredHeight(height);
  }, []);
  const [mapArticles, registerMapArticles] = useState<LocatedArticle[]>([]);
  const [mapPreviewVisible, setMapPreviewVisible] = useState(false);
  const [cachedMap, cacheMap] = useState<CachedMap | null>(null);
  const mapCache = useMemo(
    () => ({ cacheMap, cached: cachedMap !== null }),
    [cachedMap],
  );
  const mapContext = pathname === '/' || (active && sourceBase === '/');
  const openArticle = useCallback(
    (id: string) => {
      setSourceQuery(
        pathname === '/search' || pathname === '/incidents'
          ? window.location.search
          : '',
      );
      opener.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      router.push('/incidents/' + id, { scroll: false });
    },
    [pathname, router],
  );
  const close = useCallback(() => router.back(), [router]);
  const retry = useCallback(() => router.refresh(), [router]);

  useEffect(() => {
    if (previousActive.current && !active) detailFocus.current = null;

    if (previousActive.current && !active && opener.current?.isConnected) {
      opener.current.focus({ preventScroll: true });
    }

    previousActive.current = active;
  }, [active]);

  useLayoutEffect(() => {
    if (inline && !previousInline.current) window.scrollTo(0, 0);
    if (!inline && previousInline.current && pathname !== '/')
      window.scrollTo(0, listScroll.current);
    previousInline.current = inline;
  }, [inline, pathname]);

  const captureOpener = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (
        active ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : null;

      if (
        link &&
        /^\/incidents\/[a-f0-9]{64}$/.test(link.getAttribute('href') ?? '')
      ) {
        setSourceQuery(
          pathname === '/search' || pathname === '/incidents'
            ? window.location.search
            : '',
        );
        opener.current = link;
        if (pathname !== '/') listScroll.current = window.scrollY;
      }
    },
    [active, pathname],
  );

  const value = useMemo(
    () => ({
      active,
      sourcePath,
      detailFocus,
      height,
      mapArticles: mapContext ? mapArticles : NO_MAP_ARTICLES,
      openArticle,
      close,
      setHeight,
      registerMapArticles,
      setMapPreviewVisible,
      retry,
    }),
    [
      active,
      sourcePath,
      height,
      mapArticles,
      mapContext,
      openArticle,
      close,
      retry,
      setHeight,
    ],
  );

  return (
    <ArticleSheetContext value={value}>
      <MapCacheContext value={mapCache}>
        <AppShell
          backgroundPath={pathname}
          onClickCapture={captureOpener}
          hideMapControls={mapContext && mapPreviewVisible}
        >
          {cachedMap && (
            <div
              hidden={!mapContext || inline}
              inert={!mapContext || inline || undefined}
            >
              <Suspense fallback={<MapHomeLoading />}>
                <CachedMapHome
                  clientId={cachedMap.clientId}
                  articles={cachedMap.articles}
                  active={mapContext}
                />
              </Suspense>
            </div>
          )}
          <div
            hidden={inline || (pathname === '/' && !!cachedMap)}
            inert={inline || (pathname === '/' && !!cachedMap) || undefined}
            style={
              inline || (pathname === '/' && !!cachedMap)
                ? { display: 'none' }
                : undefined
            }
          >
            {background}
          </div>
          {inline && children}
        </AppShell>
        {!inline && children}
      </MapCacheContext>
    </ArticleSheetContext>
  );
}
