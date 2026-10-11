import { MapHome } from '@/features/map/ui/map-home/map-home';
import { MapSetupNotice } from '@/features/map/ui/map-home/map-setup-notice';

export default function HomePage() {
  if (!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim()) {
    return <MapSetupNotice />;
  }

  return (
    <MapHome clientId={process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID.trim()} />
  );
}
