'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { IconText } from '@/components/ui/icon-text/icon-text';
import { parseArticlePeriod } from '@/features/article-list/model/article-period';
import { MapPeriodFilter } from '@/features/map/ui/map-period-filter/map-period-filter';

const periodValues = {
  all: undefined,
  day: '24h',
  week: '7d',
  month: '30d',
} as const;

export function ArticleFilters({ isHome }: { isHome: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = parseArticlePeriod(searchParams?.get('period'));
  const chipClassName = `flex shrink-0 items-center gap-1 rounded-[20px] border border-solid border-[rgba(200,210,220,0.6)] bg-floating px-3 py-0 text-[13px]/[normal] font-semibold text-text opacity-100 backdrop-blur-[8px] ${isHome ? 'h-8' : 'h-7'}`;

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
      {!isHome && (
        <MapPeriodFilter
          value={
            period === '24h'
              ? 'day'
              : period === '7d'
                ? 'week'
                : period === '30d'
                  ? 'month'
                  : 'all'
          }
          onChange={(value) => {
            const params = new URLSearchParams(searchParams?.toString());
            const selected = periodValues[value];

            if (selected) params.set('period', selected);
            else params.delete('period');
            const query = params.toString();

            router.push(query ? `/incidents?${query}` : '/incidents');
          }}
        />
      )}
      {(isHome ? ['기간', '카테고리'] : ['카테고리']).map((label) => (
        <button
          key={label}
          type="button"
          disabled
          title={`${label} 필터 준비 중`}
          className={chipClassName}
        >
          <IconText
            icon="chevron-down"
            size="indicator"
            spacing="compact"
            position="end"
            iconClassName="text-muted"
          >
            {label}
          </IconText>
        </button>
      ))}
    </div>
  );
}
