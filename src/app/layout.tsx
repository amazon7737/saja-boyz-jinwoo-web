import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell/app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '흉흉 · 사건사고 지도',
    template: '%s · 흉흉',
  },
  description: '지도에서 사건사고를 살펴보고 진행 상황을 확인하는 서비스',
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
