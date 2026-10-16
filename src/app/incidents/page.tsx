import type { Metadata } from 'next';
import Link from 'next/link';

import { PaginatedArticleList } from '@/features/article-list/ui/article-list/paginated-article-list';
import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

import { pageMetadata } from '../site-metadata';

export const metadata: Metadata = {
  ...pageMetadata(
    '사건 사고 기사 목록',
    '수집된 사건 사고 기사의 요약과 원문을 목록에서 확인하세요.',
    '/incidents',
  ),
};

// Read runtime configuration on every request, including configuration errors.
export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  const result = await fetchArticleList();

  return (
    <section aria-label="사건 목록">
      <h1 className="sr-only">사건 목록</h1>
      <div className="flex flex-wrap gap-4 py-4 text-sm">
        <Link href="/archive" className="ui-link text-brand underline">
          기사 아카이브
        </Link>
        <Link href="/about" className="ui-link text-brand underline">
          서비스 안내
        </Link>
      </div>
      {result ? (
        <PaginatedArticleList initialPage={result} />
      ) : (
        <div role="alert">
          기사를 불러오지 못했어요 <Link href="/incidents">다시 시도</Link>
        </div>
      )}
    </section>
  );
}
