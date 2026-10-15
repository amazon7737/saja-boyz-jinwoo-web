import Link from 'next/link';

import { Brand } from '../brand/brand';

export function SearchHeader({ isHome }: { isHome: boolean }) {
  return (
    <header
      className={`flex h-[52px] items-center gap-2 rounded-2xl border border-solid border-white bg-floating px-4 shadow-floating backdrop-blur-[20px]${isHome ? ' absolute top-[calc(8px_+_env(safe-area-inset-top))] right-4 left-4 z-20' : ''}`}
    >
      <Brand />
      <span aria-hidden="true" className="h-[14px] w-px shrink-0 bg-border" />
      <Link
        href="/search"
        aria-label="기사 키워드 검색"
        className="flex min-w-0 flex-1 items-center gap-2 text-[13px]/[normal] text-muted"
      >
        <span className="min-w-0 flex-1 truncate">기사 키워드 검색…</span>
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[14px]/[normal] text-black"
        >
          🔍
        </span>
      </Link>
    </header>
  );
}
