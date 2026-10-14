import Image from 'next/image';

export function ArticleFilters({ isHome }: { isHome: boolean }) {
  const chipClassName = `flex shrink-0 items-center gap-1 rounded-[20px] border border-solid border-[rgba(200,210,220,0.6)] bg-floating px-3 py-0 text-[12px]/[normal] font-semibold text-text opacity-100 backdrop-blur-[8px] ${isHome ? 'h-8' : 'h-7'}`;

  return (
    <div
      role="group"
      aria-label="기사 필터"
      className={`flex items-start gap-1.5 ${isHome ? 'absolute top-[calc(68px_+_env(safe-area-inset-top))] right-4 left-4 z-20' : 'mt-3 mb-3'}`}
    >
      {isHome && (
        <button
          type="button"
          disabled
          aria-label="기사 필터 준비 중"
          title="기사 필터 준비 중"
          className={chipClassName}
        >
          <Image src="/filters/filter.svg" alt="" width={18} height={18} />
        </button>
      )}
      {['기간', '카테고리', '상태'].map((label) => (
        <button
          key={label}
          type="button"
          disabled
          title={`${label} 필터 준비 중`}
          className={chipClassName}
        >
          {label}
          <span
            aria-hidden="true"
            className="text-[8px] font-normal text-muted"
          >
            ▼
          </span>
        </button>
      ))}
    </div>
  );
}
