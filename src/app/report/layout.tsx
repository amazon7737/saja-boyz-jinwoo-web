import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '제보하기',
  description: '주변의 사건 사고를 제보하는 화면입니다.',
  robots: { index: false, follow: true },
};

export default function ReportLayout({ children }: { children: ReactNode }) {
  return children;
}
