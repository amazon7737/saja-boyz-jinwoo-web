import Link from 'next/link';

import { Notice } from '@/components/feedback/notice';

import { ArticleCard } from '../article-card/article-card';
import type { ArticleCollectionItem } from '../../model/article.types';

export function ArticleList({
  items,
  apiOrigin,
  now = null,
}: {
  items: readonly ArticleCollectionItem[];
  apiOrigin: string;
  now?: number | null;
}) {
  const seen = new Set<string>();
  const articles = items.filter(({ article_id }) => {
    if (seen.has(article_id)) return false;
    seen.add(article_id);

    return true;
  });

  return (
    <div className="flex flex-col gap-3 py-2">
      {articles.length === 0 && (
        <Notice
          title="아직 수집된 기사가 없어요"
          action={
            <>
              <Link href="/">지도</Link>
              <Link href="/search">검색</Link>
            </>
          }
        >
          지도나 검색에서 다른 소식도 살펴보세요.
        </Notice>
      )}
      {articles.map((item) => (
        <ArticleCard
          key={item.article_id}
          item={item}
          apiOrigin={apiOrigin}
          now={now}
        />
      ))}
    </div>
  );
}
