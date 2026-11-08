import Link from 'next/link';

import { Notice } from '@/components/feedback/notice';
import { loadSearchPage } from '@/features/search/api/load-search-page';
import { SearchResults } from '@/features/search/ui/search-results/search-results';
import { RecentSearches } from '@/features/search/ui/recent-searches/recent-searches';
import { KeywordLinkStatus } from '@/features/search/ui/keyword-link-status/keyword-link-status';
import { SearchForm } from '@/features/search/ui/search-form/search-form';
import { PopularArticles } from '@/features/search/ui/popular-articles/popular-articles';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const keyword = (Array.isArray(q) ? q[0] : q)?.trim() ?? '';
  const result = keyword ? await loadSearchPage(keyword, 0) : null;

  return (
    <SearchForm keyword={keyword}>
      {keyword ? (
        result ? (
          <SearchResults key={keyword} keyword={keyword} initialPage={result} />
        ) : (
          <Notice
            role="alert"
            title="검색을 다시 이어볼까요?"
            action={
              <Link
                href={`/search?q=${encodeURIComponent(keyword)}`}
                className="ui-control relative inline-flex min-h-8 items-center text-brand underline"
              >
                다시 시도
                <KeywordLinkStatus />
              </Link>
            }
          >
            <p className="m-0">검색 결과를 불러오지 못했어요</p>

            <p>검색어는 그대로 두었어요. 한 번 더 눌러주세요.</p>
          </Notice>
        )
      ) : null}
      <RecentSearches executedKeyword={keyword} />
      {!keyword && <PopularArticles />}
    </SearchForm>
  );
}
