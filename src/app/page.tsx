import type { Metadata } from 'next';

import { fetchMapArticles } from '@/features/map/api/fetch-map-articles';
import { MapHome } from '@/features/map/ui/map-home/map-home';
import { MapSetupNotice } from '@/features/map/ui/map-home/map-setup-notice';

import { pageMetadata, siteTitle, siteDescription } from './site-metadata';

export const metadata: Metadata = {
  ...pageMetadata(siteTitle, siteDescription, '/'),
  title: { absolute: siteTitle },
};

export default async function HomePage() {
  if (!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim()) {
    return <MapSetupNotice />;
  }

  return (
    <MapHome
      clientId={process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID.trim()}
      articles={await fetchMapArticles()}
    />
  );
}
