'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { FeatureErrorBoundary } from '../../errors/feature-error-boundary/feature-error-boundary';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const showHeader = pathname !== '/search';
  const shellClassName = isHome
    ? 'relative mx-auto min-h-dvh max-w-[640px] pb-[max(110px,calc(env(safe-area-inset-bottom)_+_90px))]'
    : 'mx-auto min-h-dvh max-w-[640px] px-4 pt-6 pb-[110px]';
  const headerClassName = `flex items-center justify-between rounded-2xl bg-floating p-4 shadow-floating${isHome ? ' absolute top-6 right-4 left-4 z-20 backdrop-blur-[20px]' : ''}`;

  return (
    <div className={shellClassName}>
      {showHeader && (
        <header className={headerClassName}>
          <Link
            href="/"
            className="text-[20px]/[normal] font-extrabold before:mr-2 before:inline-block before:size-2 before:rounded-full before:bg-brand before:content-['']"
          >
            흉흉
          </Link>
          <Link href="/search" className="text-[14px]/[normal] text-muted">
            사건 검색
          </Link>
        </header>
      )}
      <main id="main-content" className={isHome ? 'relative z-0' : undefined}>
        <FeatureErrorBoundary>{children}</FeatureErrorBoundary>
      </main>
      <nav
        className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] left-1/2 flex w-[min(calc(100%_-_32px),608px)] -translate-x-1/2 items-center justify-around rounded-pill border border-solid border-border bg-floating p-3 shadow-floating backdrop-blur-[20px]"
        aria-label="주 메뉴"
      >
        <Link href="/" className="px-4 py-3 text-[14px]/[normal] font-bold">
          지도
        </Link>
        <Link
          href="/report"
          className="rounded-3xl bg-brand px-4 py-3 text-[14px]/[normal] font-bold text-white"
        >
          제보하기
        </Link>
        <Link
          href="/incidents"
          className="px-4 py-3 text-[14px]/[normal] font-bold"
        >
          목록
        </Link>
      </nav>
    </div>
  );
}
