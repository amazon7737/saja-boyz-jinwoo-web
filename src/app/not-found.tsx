import Link from 'next/link';

import { ListLink } from '@/components/layout/list-link/list-link';
import { Notice } from '@/components/feedback/notice';

export default function NotFound() {
  return (
    <div className="mt-6">
      <Notice
        titleAs="h1"
        title="페이지를 찾을 수 없어요"
        action={
          <>
            <Link href="/">지도 홈</Link>
            <Link href="/search">검색</Link>
            <ListLink>사건 목록</ListLink>
            <Link href="/report">제보</Link>
          </>
        }
      >
        주소를 확인하거나 지도로 돌아가 다른 소식을 살펴보세요.
      </Notice>
    </div>
  );
}
