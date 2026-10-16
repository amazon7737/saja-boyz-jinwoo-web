import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { pageMetadata } from '@/app/site-metadata';

export const metadata: Metadata = {
  ...pageMetadata(
    '제보하기',
    '주변의 사건 사고를 제보하는 화면입니다.',
    '/report',
  ),
  robots: { index: false, follow: true },
};

export default function ReportLayout({ children }: { children: ReactNode }) {
  return children;
}
