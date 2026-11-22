import { fetchMapArticles } from '@/features/map/api/fetch-map-articles';
import { MapCacheBridge } from '@/features/map/ui/map-home/map-cache-bridge';
import { MapSetupNotice } from '@/features/map/ui/map-home/map-setup-notice';

export default async function HomePage() {
  if (!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim()) {
    return <MapSetupNotice />;
  }

  return (
    <MapCacheBridge
      clientId={process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID.trim()}
      articles={await fetchMapArticles()}
    />
  );
}
