'use client';

import { useLinkStatus } from 'next/link';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import ListLoading from './list-loading';

const locks = new WeakMap<
  HTMLElement,
  { count: number; inert: boolean; focus: HTMLElement | null }
>();

function lockMain(main: HTMLElement) {
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

  useEffect(() => {
    if (!pending) return;
    const main = document.getElementById('main-content');

    if (main) return lockMain(main);
  }, [pending]);
  if (!pending || typeof document === 'undefined') return null;
  if (!document.getElementById('main-content')) return null;

  return createPortal(
    <div
      data-list-navigation-pending=""
      className="fixed top-[calc(116px_+_env(safe-area-inset-top))] bottom-[calc(84px_+_env(safe-area-inset-bottom))] left-1/2 z-20 w-[min(calc(100%_-_32px),608px)] -translate-x-1/2 overflow-hidden bg-background"
    >
      <ListLoading />
    </div>,
    document.body,
  );
}
