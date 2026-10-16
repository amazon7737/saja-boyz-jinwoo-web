'use client';

import { useLinkStatus } from 'next/link';

import { LoadingSpinner } from '@/components/feedback/loading-spinner';

export function KeywordLinkStatus() {
  const { pending } = useLinkStatus();

  return (
    <span className="inline-flex size-3 shrink-0 items-center justify-center text-muted">
      {pending && (
        <span role="status" aria-busy="true" className="inline-flex size-3">
          <LoadingSpinner />
          <span className="sr-only">검색 결과를 불러오는 중이에요</span>
        </span>
      )}
    </span>
  );
}
