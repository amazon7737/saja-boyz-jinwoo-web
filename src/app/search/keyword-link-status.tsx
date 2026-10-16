'use client';

import { useLinkStatus } from 'next/link';

export function KeywordLinkStatus() {
  const { pending } = useLinkStatus();

  return (
    <span className="inline-flex size-3 shrink-0 items-center justify-center text-muted">
      {pending && (
        <span role="status" aria-busy="true" className="inline-flex size-3">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="size-3 motion-safe:animate-spin"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.25"
            />
            <path
              d="M12 3a9 9 0 0 1 9 9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">검색 결과를 불러오는 중이에요</span>
        </span>
      )}
    </span>
  );
}
