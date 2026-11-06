import { ListLink } from '@/components/layout/list-link/list-link';
import { Notice } from '@/components/feedback/notice';
import { PaginatedArticleList } from '@/features/article-list/ui/article-list/paginated-article-list';
import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

// Read runtime configuration on every request, including configuration errors.
export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  const result = await fetchArticleList(undefined, 0, 'popular');

  return (
    <section aria-label="사건 목록">
      <h1 className="sr-only">사건 목록</h1>
      <p className="sr-only">최근 30일 인기순</p>
      {result ? (
        <PaginatedArticleList initialPage={result} />
      ) : (
        <Notice
          role="alert"
          title="주변 소식을 다시 이어볼까요?"
          action={<ListLink>다시 시도</ListLink>}
        >
          기사를 불러오지 못했어요
          <p>연결을 확인한 뒤 다시 눌러주세요.</p>
        </Notice>
      )}
    </section>
  );
}
