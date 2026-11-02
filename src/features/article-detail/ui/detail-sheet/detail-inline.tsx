'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';

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

  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      ref={panel}
      data-article-inline=""
      aria-labelledby={titleId}
      tabIndex={-1}
      className="flex min-w-0 flex-col gap-4 pb-5 outline-none [overflow-wrap:anywhere]"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault();
          route?.close();
        }
      }}
    >
      <nav aria-label="기사 상세 탐색" className="flex items-center">
        <Link
          href="/incidents"
          scroll={false}
          aria-label="목록으로"
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
          <span aria-hidden="true">←</span> 목록으로
        </Link>
      </nav>
      {children}
      {footer}
    </section>
  );
}
