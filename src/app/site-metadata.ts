import type { Metadata } from 'next';

export const siteOrigin = 'https://hyunghyung.vercel.app';

export const siteName = '흉흉';

export const siteTitle = '흉흉 · 내 주변의 사건 사고';

export const siteDescription =
  '내 주변의 사건 사고 기사를 지도와 목록에서 살펴보고, 기사 요약과 원문을 확인하세요.';

export const siteImage = {
  url: '/og/site.png',
  width: 1200,
  height: 630,
  alt: siteTitle,
};

export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = `${siteOrigin}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName,
      locale: 'ko_KR',
      title,
      description,
      url,
      images: [siteImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [siteImage],
    },
  };
}
