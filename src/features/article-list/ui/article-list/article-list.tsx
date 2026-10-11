import { ArticleCard } from '../article-card/article-card';
import type { ArticleCollectionItem } from '../../model/article.types';

export function ArticleList({
  items,
  apiOrigin,
}: {
  items: readonly ArticleCollectionItem[];
  apiOrigin: string;
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
        <p className="text-muted leading-[1.7]" role="status">
          아직 수집된 기사가 없어요
        </p>
      )}
      {articles.map((item) => (
        <ArticleCard key={item.article_id} item={item} apiOrigin={apiOrigin} />
      ))}
    </div>
  );
}
