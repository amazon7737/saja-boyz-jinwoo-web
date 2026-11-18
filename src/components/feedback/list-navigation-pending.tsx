'use client';

import { useLinkStatus } from 'next/link';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { ArticleFilters } from '@/components/layout/article-filters/article-filters';
import { BottomNavigation } from '@/components/layout/bottom-navigation/bottom-navigation';
import { SearchHeader } from '@/components/layout/search-header/search-header';

import ListLoading from './list-loading';

const locks = new WeakMap<
  HTMLElement,
  { count: number; inert: boolean; focus: HTMLElement | null }
>();

function lockBackground(main: HTMLElement) {
  let lock = locks.get(main);

  if (!lock) {
    lock = {
      count: 0,
      inert: main.inert,
      focus:
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null,
    };
    locks.set(main, lock);
    main.inert = true;
  }

  lock.count++;

  return () => {
    if (--lock!.count > 0) return;
    main.inert = lock!.inert;
    if (
      !main.inert &&
      lock!.focus?.isConnected &&
      document.activeElement === document.body
    )
      lock!.focus.focus({ preventScroll: true });
    locks.delete(main);
  };
}

export function ListNavigationPending({
  pendingOverride = false,
}: {
  pendingOverride?: boolean;
}) {
  const { pending: linkPending } = useLinkStatus();
  const pending = linkPending || pendingOverride;
  const pendingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) return;
    const main = document.getElementById('main-content');

    if (!main) return;
    const unlockMain = lockBackground(main);
    const shell = main.closest<HTMLElement>('[data-article-background]');
    const unlockShell = shell ? lockBackground(shell) : undefined;

    pendingRef.current?.focus({ preventScroll: true });

    return () => {
      unlockShell?.();
      unlockMain();
    };
  }, [pending]);
  if (!pending || typeof document === 'undefined') return null;
  if (!document.getElementById('main-content')) return null;

  return createPortal(
    <div
      ref={pendingRef}
      tabIndex={-1}
      data-list-navigation-pending=""
      className="fixed inset-y-0 left-1/2 z-50 w-[min(100%,640px)] -translate-x-1/2 overflow-hidden bg-background px-4 pt-[calc(12px_+_env(safe-area-inset-top))] pb-[110px]"
    >
      <div inert>
        <SearchHeader isHome={false} />
        <ArticleFilters isHome={false} />
      </div>
      <ListLoading />
      <div inert>
        <BottomNavigation pathname="/incidents" />
      </div>
    </div>,
    document.body,
  );
}
