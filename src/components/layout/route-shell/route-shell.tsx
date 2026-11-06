'use client';

import { useSelectedLayoutSegments } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '../app-shell/app-shell';

export function RouteShell({ children }: { children: ReactNode }) {
  const segments = useSelectedLayoutSegments() ?? [];
  const isNotFound =
    segments[0] === '_not-found' || segments[0] === '/_not-found';

  return segments[0] === '(browse)' ? (
    children
  ) : (
    <AppShell backgroundPath={isNotFound ? '/__missing-article' : undefined}>
      {children}
    </AppShell>
  );
}
