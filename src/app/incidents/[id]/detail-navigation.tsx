import Link from 'next/link';

export function DetailNavigation() {
  return (
    <nav
      aria-label="기사 상세 탐색"
      className="flex min-h-12 shrink-0 items-center justify-between border-0 border-b border-solid border-border -mx-4 px-4"
    >
      <Link
        href="/incidents"
        aria-label="목록으로"
        className="ui-control flex min-h-11 items-center gap-2 font-bold"
      >
        <span aria-hidden="true" className="text-2xl">
          ←
        </span>
        기사 상세
      </Link>
      <Link
        href="/"
        aria-label="닫기"
        className="ui-control grid size-11 place-items-center rounded-lg"
      >
        <span
          aria-hidden="true"
          className="block size-6 bg-[url('/article-detail-close.svg')] bg-center bg-no-repeat"
        />
      </Link>
    </nav>
  );
}
