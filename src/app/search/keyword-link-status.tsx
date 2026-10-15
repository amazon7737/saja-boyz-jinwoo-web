'use client';

import { useLinkStatus } from 'next/link';

export function KeywordLinkStatus() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span role="status" aria-busy="true" className="ml-2 text-muted">
      검색 결과를 불러오는 중이에요
    </span>
  );
}
