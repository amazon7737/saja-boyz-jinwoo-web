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
  type ReactNode,
  type MouseEvent,
} from 'react';

import { AppShell } from '@/components/layout/app-shell/app-shell';
import type { LocatedArticle } from '@/features/map/model/map-article.types';

import { ArticleSheetContext } from '../../model/article-sheet-context';

export { useArticleSheetRoute } from '../../model/article-sheet-context';

export function ArticleRouteHost({
  children,
  background,
}: {
  children?: ReactNode;
  background?: ReactNode;
}) {
  const pathname = usePathname();
  const backgroundSegments = useSelectedLayoutSegments('background');
  const articleSegments = useSelectedLayoutSegments();
  const router = useRouter();
  const active = articleSegments.includes('(.)incidents');
  const sourcePath =
    '/' +
    backgroundSegments.filter((segment) => !segment.startsWith('(')).join('/');
  const inline = active && sourcePath === '/incidents';
  const listScroll = useRef(0);
  const previousInline = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const previousActive = useRef(false);
  const [height, setMeasuredHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const setHeight = useCallback((height: number, expanded = false) => {
    setMeasuredHeight(height);
    setExpanded(expanded);
  }, []);
  const [mapArticles, registerMapArticles] = useState<LocatedArticle[]>([]);
  const openArticle = useCallback(
    (id: string) => {
      opener.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      router.push('/incidents/' + id, { scroll: false });
    },
    [router],
  );
  const close = useCallback(() => router.back(), [router]);
  const retry = useCallback(() => router.refresh(), [router]);

  useEffect(() => {
    if (previousActive.current && !active && opener.current?.isConnected) {
      opener.current.focus({ preventScroll: true });
    }

    previousActive.current = active;
  }, [active]);

  useLayoutEffect(() => {
    if (inline && !previousInline.current) window.scrollTo(0, 0);
    if (!inline && previousInline.current && pathname === '/incidents')
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
        opener.current = link;
        if (pathname === '/incidents') listScroll.current = window.scrollY;
      }
    },
    [active, pathname],
  );

  const value = useMemo(
    () => ({
      active,
      sourcePath,
      height,
      mapArticles,
      openArticle,
      close,
      setHeight,
      registerMapArticles,
      retry,
    }),
    [
      active,
      sourcePath,
      height,
      mapArticles,
      openArticle,
      close,
      retry,
      setHeight,
    ],
  );

  return (
    <ArticleSheetContext value={value}>
      <AppShell
        backgroundPath={active ? sourcePath : pathname}
        inert={active && !inline}
        hideHeader={active && sourcePath === '/' && expanded}
        onClickCapture={captureOpener}
      >
        <div
          hidden={inline}
          inert={inline || undefined}
          style={inline ? { display: 'none' } : undefined}
        >
          {background}
        </div>
        {inline && children}
      </AppShell>
      {!inline && children}
    </ArticleSheetContext>
  );
}
