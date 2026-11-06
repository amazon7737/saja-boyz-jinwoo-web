'use client';

import Link from 'next/link';

import { ListLink } from '@/components/layout/list-link/list-link';
import { SiteStructuredData } from '@/components/layout/site-structured-data/site-structured-data';
import { Notice } from '@/components/feedback/notice';

export function MapSetupNotice() {
  return (
    <>
      <SiteStructuredData />
      <section
        aria-label="주변 지도"
        className="min-h-[320px] bg-background px-4 pt-26 pb-4"
      >
        <Notice
          titleAs="h1"
          role="alert"
          title="지도를 잠시 열 수 없어요"
          action={
            <>
              <button type="button" onClick={() => window.location.reload()}>
                다시 시도
              </button>
              <ListLink>기사 목록</ListLink>
              <Link href="/search">검색</Link>
            </>
          }
        >
          지도를 표시할 수 없습니다. 지도 설정은 관리자에게 문의해 주세요.
        </Notice>
      </section>
    </>
  );
}
