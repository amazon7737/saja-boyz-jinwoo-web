import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell/app-shell';

import {
  siteDescription,
  siteImage,
  siteName,
  siteOrigin,
  siteTitle,
} from './site-metadata';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: siteTitle,
    template: `%s · ${siteTitle}`,
  },
  description: siteDescription,
  openGraph: {
    type: 'website',
    siteName,
    locale: 'ko_KR',
    title: siteTitle,
    description: siteDescription,
    images: [siteImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [siteImage],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
