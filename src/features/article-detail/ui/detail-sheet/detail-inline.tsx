'use client';

import { useRouter as useCompatRouter } from 'next/compat/router';
import Image from 'next/image';
import Link from 'next/link';
import { flushSync } from 'react-dom';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { ListNavigationPending } from '@/components/feedback/list-navigation-pending';

import { useArticleSheetRoute } from '../../model/article-sheet-context';
import {
  noPreviousRelatedArticle,
  previousRelatedArticle,
  subscribeRelatedArticleHistory,
} from '../../model/related-article-history';

export function DetailInline({
  titleId,
  children,
  footer,
  closeLabel = '닫기',
}: {
  titleId: string;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}) {
  const route = useArticleSheetRoute();
  const pagesRouter = useCompatRouter();
  const [legacyPending, setLegacyPending] = useState(false);
  const previousArticle = useSyncExternalStore(
    subscribeRelatedArticleHistory,
    previousRelatedArticle,
    noPreviousRelatedArticle,
  );

  useEffect(() => {
    if (!pagesRouter) return;
    const reset = () => setLegacyPending(false);
    const navigation = (window as Window & { navigation?: EventTarget })
      .navigation;
    let signal: AbortSignal | undefined;
    const onNavigate = (event: Event) => {
      signal?.removeEventListener('abort', reset);
      signal = (event as Event & { signal?: AbortSignal }).signal;
      signal?.addEventListener('abort', reset, { once: true });
    };

    pagesRouter.events.on('routeChangeError', reset);
    pagesRouter.events.on('routeChangeComplete', reset);
    window.addEventListener('pageshow', reset);
    navigation?.addEventListener('navigate', onNavigate);

    return () => {
      signal?.removeEventListener('abort', reset);
      pagesRouter.events.off('routeChangeError', reset);
      pagesRouter.events.off('routeChangeComplete', reset);
      window.removeEventListener('pageshow', reset);
      navigation?.removeEventListener('navigate', onNavigate);
    };
  }, [pagesRouter]);

  useEffect(() => {
    if (!legacyPending) return;
    const timeout = setTimeout(() => setLegacyPending(false), 30_000);

    return () => clearTimeout(timeout);
  }, [legacyPending]);
  const panel = useRef<HTMLElement>(null);

  const detailFocus = route?.detailFocus;

  useLayoutEffect(() => {
    const element = panel.current;
    const control = detailFocus?.current;
    const target = control
      ? element?.querySelector<HTMLElement>(
          `[data-article-control="${control}"]`,
        )
      : null;

    (target ?? element)?.focus({ preventScroll: true });

    return () => {
      if (!detailFocus) return;
      const focused = document.activeElement;
      const value =
        focused instanceof HTMLElement && element?.contains(focused)
          ? focused.dataset.articleControl
          : undefined;

      detailFocus.current =
        value === 'back' || value === 'close' ? value : null;
    };
  }, [detailFocus]);

  return (
    <section
      ref={panel}
      data-article-inline=""
      aria-labelledby={titleId}
      tabIndex={-1}
      className="flex min-h-dvh min-w-0 flex-col bg-surface outline-none [overflow-wrap:anywhere]"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault();
          route?.close();
        }
      }}
    >
      <nav
        aria-label="기사 상세 탐색"
        className="flex items-center justify-between border-0 border-b border-solid border-border px-4 py-3"
      >
        <Link
          data-article-control="back"
          href={
            previousArticle ?? (route?.active ? route.sourcePath : '/incidents')
          }
          scroll={false}
          aria-label={
            (route?.active && route.sourcePath !== '/incidents') ||
            previousArticle
              ? '이전 화면으로'
              : '목록으로'
          }
          className="ui-control inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-text"
          onClick={(event) => {
            if (
              route?.active &&
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              route.close();
            } else if (
              previousArticle &&
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey &&
              !event.defaultPrevented
            ) {
              event.preventDefault();
              window.history.back();
            } else if (
              pagesRouter &&
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey &&
              !event.defaultPrevented
            ) {
              flushSync(() => setLegacyPending(true));
            }
          }}
        >
          <span aria-hidden="true" className="text-xl">
            ←
          </span>{' '}
          사건 상세
          {!previousArticle &&
            (!route?.active || route.sourcePath === '/incidents') && (
              <ListNavigationPending pendingOverride={legacyPending} />
            )}
        </Link>
        <Link
          data-article-control="close"
          href="/"
          aria-label={closeLabel}
          className="ui-control grid size-11 place-items-center rounded-lg text-2xl text-text"
        >
          <Image
            src="/article-detail/header-close.svg"
            alt=""
            width={24}
            height={24}
          />
        </Link>
      </nav>
      <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      {footer && (
        <div className="px-4 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </section>
  );
}
