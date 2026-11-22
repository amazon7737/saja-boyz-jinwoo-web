import Link from 'next/link';

import { ListLink } from '@/components/layout/list-link/list-link';
import { Notice } from '@/components/feedback/notice';
import { PaginatedArticleList } from '@/features/article-list/ui/article-list/paginated-article-list';
import { fetchArticleList } from '@/features/article-list/api/fetch-articles';
import { parseArticlePeriod } from '@/features/article-list/model/article-period';
import { parseArticleSort } from '@/features/article-list/model/article-sort';

// Read runtime configuration on every request, including configuration errors.
export const dynamic = 'force-dynamic';

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    period?: string | string[];
    sort?: string | string[];
  }>;
} = {}) {
  const params = await searchParams;
  const period = parseArticlePeriod(params?.period);
  const sort = parseArticleSort(params?.sort);
  const result = await fetchArticleList(undefined, 0, sort, undefined, period);
  const query = new URLSearchParams({
    ...(sort === 'recent' && { sort }),
    ...(period && { period }),
  }).toString();
  const listHref = query ? `/incidents?${query}` : '/incidents';

  return (
    <section aria-label="사건 목록">
      <h1 className="sr-only">사건 목록</h1>
      <p className="sr-only">
        {sort === 'recent' ? '최신순' : '최근 30일 인기순'}
      </p>
      <nav
        aria-label="더 살펴보기"
        className="flex min-h-9 items-center justify-end gap-4 text-[12px]/4 font-semibold text-muted"
      >
        <Link
          href="/archive"
          className="ui-link relative inline-flex min-h-9 items-center rounded-sm underline underline-offset-[3px] after:absolute after:-inset-y-1 after:inset-x-0 after:content-['']"
        >
          기사 아카이브
        </Link>
        <Link
          href="/about"
          className="ui-link relative inline-flex min-h-9 items-center rounded-sm underline underline-offset-[3px] after:absolute after:-inset-y-1 after:inset-x-0 after:content-['']"
        >
          서비스 안내
        </Link>
      </nav>
      {result ? (
        <PaginatedArticleList
          key={`${sort}-${period ?? 'all'}`}
          initialPage={result}
          period={period}
          sort={sort}
        />
      ) : (
        <Notice
          role="alert"
          title="주변 소식을 다시 이어볼까요?"
          action={<ListLink href={listHref}>다시 시도</ListLink>}
        >
          기사를 불러오지 못했어요
          <p>연결을 확인한 뒤 다시 눌러주세요.</p>
        </Notice>
      )}
    </section>
  );
}
