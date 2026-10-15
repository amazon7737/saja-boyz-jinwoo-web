import { FoundationPanel } from '@/components/layout/foundation-panel/foundation-panel';

export default function NotFound() {
  return (
    <FoundationPanel
      title="페이지를 찾을 수 없어요"
      description="주소를 확인하거나 지도 홈으로 돌아가 주세요. 사건 데이터는 아직 연결되지 않았습니다."
    />
  );
}
