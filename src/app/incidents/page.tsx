import Link from 'next/link';

import { PaginatedArticleList } from '@/features/article-list/ui/article-list/paginated-article-list';
import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

// Read runtime configuration on every request, including configuration errors.
export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  const result = await fetchArticleList();

  return (
    <section aria-label="사건 목록">
      <h1 className="sr-only">사건 목록</h1>
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
