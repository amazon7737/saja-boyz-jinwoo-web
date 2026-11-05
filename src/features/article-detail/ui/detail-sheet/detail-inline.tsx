'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { useArticleSheetRoute } from '../../model/article-sheet-context';

export function DetailInline({
  titleId,
  children,
  footer,
}: {
  titleId: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const route = useArticleSheetRoute();
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
          href={route?.active ? route.sourcePath : '/incidents'}
          scroll={false}
          aria-label={
            route?.active && route.sourcePath !== '/incidents'
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
            }
          }}
        >
          <span aria-hidden="true" className="text-xl">
            ←
          </span>{' '}
          사건 상세
        </Link>
        <Link
          data-article-control="close"
          href="/"
          aria-label="닫기"
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
