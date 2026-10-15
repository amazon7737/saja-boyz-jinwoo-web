import Image from 'next/image';
import Link from 'next/link';

export function BottomNavigation({ pathname }: { pathname: string }) {
  const isList = pathname === '/incidents';
  const mapCurrent =
    pathname === '/' ? 'page' : pathname === '/search' ? 'location' : undefined;
  const tabClassName =
    'ui-control flex min-w-0 flex-1 flex-col items-center justify-center gap-[2px] rounded-[20px] py-[6px] text-[10px]/[normal] font-bold';

  return (
    <nav
      aria-label="주 메뉴"
      className="fixed bottom-[calc(8px_+_env(safe-area-inset-bottom))] left-1/2 z-30 flex h-[68px] w-[min(calc(100%_-_32px),608px)] -translate-x-1/2 items-center rounded-[28px] border border-solid border-[#e8edf2] bg-floating px-3 py-[6px] shadow-[0_8px_16px_rgba(0,0,0,0.1)] backdrop-blur-[20px]"
    >
      <Link
        href="/"
        aria-current={mapCurrent}
        className={`${tabClassName} ${mapCurrent ? 'text-brand' : 'text-[#94a3b8]'}`}
      >
        {isList ? (
          <span aria-hidden="true" className="text-[18px]/[normal] font-normal">
            🗺️
          </span>
        ) : (
          <Image src="/navigation/map-pin.svg" alt="" width={22} height={22} />
        )}
        <span>지도</span>
      </Link>
      <Link
        href="/report"
        aria-label="제보하기"
        className="ui-control ui-primary flex size-[54px] shrink-0 items-center justify-center rounded-full bg-brand text-[22px]/[normal] text-white shadow-[0_6px_8px_rgba(232,26,43,0.35)]"
      >
        <span aria-hidden="true">📢</span>
      </Link>
      <Link
        href="/incidents"
        aria-current={isList ? 'page' : undefined}
        className={`${tabClassName} ${isList ? 'text-brand' : 'text-[#94a3b8]'}`}
      >
        <span aria-hidden="true" className="text-[18px]/[normal] font-normal">
          ≡
        </span>
        <span>목록</span>
      </Link>
    </nav>
  );
}
