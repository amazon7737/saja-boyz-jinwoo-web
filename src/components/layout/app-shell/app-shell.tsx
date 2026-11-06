'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode, MouseEventHandler } from 'react';

import { FeatureErrorBoundary } from '../../errors/feature-error-boundary/feature-error-boundary';
import { ArticleFilters } from '../article-filters/article-filters';
import { BottomNavigation } from '../bottom-navigation/bottom-navigation';
import { SearchHeader } from '../search-header/search-header';

export function AppShell({
  children,
  backgroundPath,
  inert = false,
  hideHeader = false,
  onClickCapture,
}: {
  children: ReactNode;
  backgroundPath?: string;
  inert?: boolean;
  hideHeader?: boolean;
  onClickCapture?: MouseEventHandler<HTMLDivElement>;
}) {
  const currentPath = usePathname() ?? '/';
  const pathname = backgroundPath ?? currentPath;
  const isHome = pathname === '/';
  const isList = pathname === '/incidents';
  const isDedicatedScreen =
    pathname === '/report' || pathname.startsWith('/incidents/');
  const showHeader =
    !hideHeader && pathname !== '/search' && !isDedicatedScreen;
  const shellClassName = isDedicatedScreen
    ? `mx-auto min-h-dvh max-w-[640px] ${pathname.startsWith('/incidents/') ? 'bg-background' : 'bg-surface'} pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`
    : isHome
      ? 'relative mx-auto min-h-dvh max-w-[640px]'
      : `mx-auto min-h-dvh max-w-[640px] px-4 ${pathname === '/search' ? 'pb-[calc(20px_+_env(safe-area-inset-bottom))]' : 'pb-[110px]'} ${isList ? '[&_main_a]:scroll-mt-[calc(124px_+_env(safe-area-inset-top))] [&_main_a]:scroll-mb-[calc(84px_+_env(safe-area-inset-bottom))]' : showHeader ? 'pt-[calc(12px_+_env(safe-area-inset-top))]' : 'pt-[calc(20px_+_env(safe-area-inset-top))]'}`;

  return (
    <div
      onClickCapture={onClickCapture}
      data-article-background=""
      data-article-overlay={inert || undefined}
      className={shellClassName}
      inert={inert || undefined}
      aria-hidden={inert || undefined}
    >
      {isList ? (
        <div className="sticky top-0 z-20 -mx-4 flex flex-col bg-background/95 px-4 pt-[calc(12px_+_env(safe-area-inset-top))] backdrop-blur-[20px]">
          <SearchHeader isHome={false} />
          <ArticleFilters isHome={false} />
        </div>
      ) : (
        showHeader && <SearchHeader isHome={isHome} />
      )}
      <main id="main-content" className={isHome ? 'relative z-0' : undefined}>
        <FeatureErrorBoundary>{children}</FeatureErrorBoundary>
      </main>
      {!isDedicatedScreen && pathname !== '/search' && (
        <BottomNavigation pathname={pathname} />
      )}
    </div>
  );
}
